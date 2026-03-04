const mysql = require('mysql2');

const os = require('os');
const cpuCount = os.cpus().length;

// Connection Config
console.log(`DB Environment Diagnostic:`);
const mysqlEnvKeys = Object.keys(process.env).filter(key => key.includes('MYSQL'));
console.log(`- Found ${mysqlEnvKeys.length} MYSQL keys: ${mysqlEnvKeys.join(', ')}`);

const dbConfig = {
    host: process.env.MYSQL_ADDON_HOST || '127.0.0.1',
    user: process.env.MYSQL_ADDON_USER || 'root',
    password: process.env.MYSQL_ADDON_PASSWORD || '',
    database: process.env.MYSQL_ADDON_DB || 'afleet_db',
    port: process.env.MYSQL_ADDON_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 30, // Optimized for masrawy deployment
    queueLimit: 150,
    connectTimeout: 15000,
    acquireTimeout: 15000,
    timeout: 45000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

console.log(`📡 DB_ATTEMPT: host=${dbConfig.host}, port=${dbConfig.port}, user=${dbConfig.user}, db=${dbConfig.database}`);
if (dbConfig.host === '127.0.0.1') {
    console.warn("❌ CRITICAL: MYSQL_ADDON_HOST is missing! The application is NOT receiving Clever Cloud variables.");
}

const pool = mysql.createPool(dbConfig).promise();

const sanitizeParams = (params) => {
    if (!params || !Array.isArray(params)) return params || [];
    return params.map(p => p === undefined ? null : p);
};

// Adapter to mimic SQLite3 API using Promise pool
const db = {
    // Mimic db.run(sql, params, callback)
    run: function (sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        let finalParams = sanitizeParams(params);

        pool.execute(sql, finalParams)
            .then(([result]) => {
                if (callback) {
                    callback.call({ lastID: result.insertId, changes: result.affectedRows }, null);
                }
            })
            .catch(err => {
                if (callback) callback(err);
            });
        return this;
    },

    // Mimic db.get(sql, params, callback) -> Returns SINGLE row
    get: function (sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        let finalParams = sanitizeParams(params);

        pool.execute(sql, finalParams)
            .then(([rows]) => {
                if (callback) callback(null, rows[0]);
            })
            .catch(err => {
                if (callback) callback(err, null);
            });
        return this;
    },

    // Mimic db.all(sql, params, callback) -> Returns ALL rows
    all: function (sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        let finalParams = sanitizeParams(params);

        pool.execute(sql, finalParams)
            .then(([rows]) => {
                if (callback) callback(null, rows);
            })
            .catch(err => {
                if (callback) callback(err, null);
            });
        return this;
    },

    // --- NEW: Promise-based methods for async/await ---
    runAsync: async function (sql, params = []) {
        const finalParams = sanitizeParams(params);
        const [result] = await pool.execute(sql, finalParams);
        return { lastID: result.insertId, changes: result.affectedRows };
    },

    getAsync: async function (sql, params = []) {
        const finalParams = sanitizeParams(params);
        const [rows] = await pool.execute(sql, finalParams);
        return rows[0];
    },

    allAsync: async function (sql, params = []) {
        const finalParams = sanitizeParams(params);
        const [rows] = await pool.execute(sql, finalParams);
        return rows;
    },

    // Mimic db.serialize(callback)
    serialize: function (callback) {
        if (callback) callback();
        return this;
    },

    // Helper to close pool
    close: function () {
        pool.end();
    },

    // New: Expose raw connection for transactions (Promise-based)
    getConnection: async function () {
        return await pool.getConnection();
    },

    // Low level access
    pool: pool
};

// Initialize Schema
function initializeSchema() {
    console.log("✅ Promise-based MySQL Adapter Loaded. Connected to 'afleet_db'.");
}

initializeSchema();

module.exports = db;
