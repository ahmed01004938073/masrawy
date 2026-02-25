const mysql = require('mysql2');

// Connection Config
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Adapter to mimic SQLite3 API
const db = {
    // Mimic db.run(sql, params, callback)
    run: function (sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        // Fix: MySQL driver doesn't support named parameters like $id or :id inherently 
        // but this project uses ? so it should be fine.

        pool.execute(sql, params || [], function (err, result) {
            if (callback) {
                // Determine context for 'this' in callback
                const context = {};
                if (result) {
                    context.lastID = result.insertId;
                    context.changes = result.affectedRows;
                }
                callback.call(context, err);
            }
        });
        return this;
    },

    // Mimic db.get(sql, params, callback) -> Returns SINGLE row
    get: function (sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        pool.execute(sql, params || [], function (err, rows) {
            if (err) {
                if (callback) callback(err, null);
                return;
            }
            // Return first row or undefined
            const row = (rows && rows.length > 0) ? rows[0] : undefined;
            if (callback) callback(null, row);
        });
        return this;
    },

    // Mimic db.all(sql, params, callback) -> Returns ALL rows
    all: function (sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        pool.execute(sql, params || [], function (err, rows) {
            if (callback) callback(err, rows);
        });
        return this;
    },

    // Mimic db.serialize(callback)
    serialize: function (callback) {
        if (callback) callback();
        return this;
    },

    // Helper to close pool (not in sqlite3 standard but good to have)
    close: function () {
        pool.end();
    }
};

// Initialize Schema (Optional: Can remain empty if migration handled it)
function initializeSchema() {
    console.log("✅ MySQL Adapter Loaded. Connected to 'afleet_db'.");
    // We skip CREATE TABLE here because migration script handled it.
    // Future schema updates should be done via migration scripts.
}

initializeSchema();

module.exports = db;
