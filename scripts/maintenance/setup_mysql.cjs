const mysql = require('mysql2/promise');

async function setupDatabase() {
    console.log('🔄 Connecting to MySQL...');

    try {
        // Connect to MySQL Server (no database selected yet)
        let connection = await mysql.createConnection({
            host: '127.0.0.1', // Use IP to avoid localhost delay
            user: 'root',      // Default XAMPP user
            password: '',      // Default XAMPP password is empty
        });

        console.log('✅ Connected to MySQL Server successfully.');

        // Create Database
        await connection.query(`CREATE DATABASE IF NOT EXISTS afleet_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log('✅ Database "afleet_db" created or already exists.');

        await connection.end();

        // Re-connect to the specific database to verify
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'afleet_db'
        });

        console.log('✅ Connection to "afleet_db" verified.');
        await connection.end();
        return true;

    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.log('👉 Tip: Make sure XAMPP MySQL is running (Click Start).');
        }
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('👉 Tip: Check if your root password is not empty (Default is empty).');
        }
        return false;
    }
}

setupDatabase();
