const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');

const sqliteDbPath = path.resolve(__dirname, 'server', 'database.sqlite');

const mysqlConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
};

async function verify() {
    console.log('🔍 Starting Detailed Verification...');

    // 1. Connect to SQLite
    const sqliteDb = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) console.error('❌ SQLite Connection Error:', err.message);
    });

    // 2. Connect to MySQL
    let mysqlConn;
    try {
        mysqlConn = await mysql.createPool(mysqlConfig);
    } catch (err) {
        console.error('❌ MySQL Connection Error:', err.message);
        return;
    }

    // 3. Get All SQLite Tables
    const sqliteTables = await new Promise((resolve) => {
        sqliteDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'", (err, rows) => {
            resolve(rows.map(r => r.name));
        });
    });

    console.log(`\n📂 Found ${sqliteTables.length} tables in SQLite:`, sqliteTables.join(', '));
    console.log('---------------------------------------------------');
    console.log(String('Table Name').padEnd(20) + String('SQLite Rows').padEnd(15) + String('MySQL Rows').padEnd(15) + 'Status');
    console.log('---------------------------------------------------');

    let allGood = true;

    for (const table of sqliteTables) {
        // Count SQLite
        const sqliteCount = await new Promise((resolve) => {
            sqliteDb.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => resolve(row ? row.count : 0));
        });

        // Count MySQL
        let mysqlCount = 'N/A';
        try {
            const [rows] = await mysqlConn.query(`SELECT COUNT(*) as count FROM ${table}`);
            mysqlCount = rows[0].count;
        } catch (e) {
            mysqlCount = 'MISSING'; // Table doesn't exist in MySQL
        }

        const status = (sqliteCount === mysqlCount) ? '✅ OK' : '❌ MISMATCH';
        if (sqliteCount !== mysqlCount) allGood = false;

        console.log(
            String(table).padEnd(20) +
            String(sqliteCount).padEnd(15) +
            String(mysqlCount).padEnd(15) +
            status
        );
    }

    console.log('---------------------------------------------------');
    if (allGood) {
        console.log('✨ SUCCESS: All tables and data match exactly.');
    } else {
        console.log('⚠️ WARNING: Some data looks missing or mismatched.');
        console.log('   Note: "MISSING" means the table was not created in MySQL.');
    }

    sqliteDb.close();
    await mysqlConn.end();
}

verify();
