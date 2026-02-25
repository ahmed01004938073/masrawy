const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function backupDatabase() {
    const config = {
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'afleet_db'
    };

    const connection = await mysql.createConnection(config);
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup_${config.database}_${timestamp}.json`);

    try {
        const [tables] = await connection.execute('SHOW TABLES');
        const dbName = 'Tables_in_' + config.database;
        const backupData = {};

        for (const tableRow of tables) {
            const tableName = tableRow[dbName];
            console.log(`Backing up table: ${tableName}...`);
            const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);
            backupData[tableName] = rows;
        }

        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        console.log(`Backup completed successfully! File: ${backupFile}`);
    } catch (error) {
        console.error('Error during backup:', error);
    } finally {
        await connection.end();
    }
}

backupDatabase();
