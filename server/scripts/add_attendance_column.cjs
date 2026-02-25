const mysql = require('mysql2/promise');

async function addAttendanceColumn() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'afleet_db'
        });

        console.log('✅ Connected to MySQL');

        // Add firstLoginToday if it doesn't exist
        const [rows] = await connection.execute("SHOW COLUMNS FROM employees LIKE 'firstLoginToday'");

        if (rows.length === 0) {
            console.log('📝 Adding "firstLoginToday" column...');
            await connection.execute("ALTER TABLE employees ADD COLUMN firstLoginToday DATETIME NULL");
            console.log('✅ Column added successfully.');
        } else {
            console.log('ℹ️ Column "firstLoginToday" already exists.');
        }

        await connection.end();
    } catch (err) {
        console.error('❌ Database Error:', err.message);
    }
}

addAttendanceColumn();
