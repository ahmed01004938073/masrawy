const mysql = require('mysql2/promise');

async function dumpSchema() {
    const config = {
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'afleet_db'
    };

    const connection = await mysql.createConnection(config);

    try {
        const [tables] = await connection.execute('SHOW TABLES');
        const dbName = 'Tables_in_' + config.database;

        console.log('# Database Schema Dump');
        console.log(`Date: ${new Date().toISOString()}\n`);

        for (const tableRow of tables) {
            const tableName = tableRow[dbName];
            console.log(`## Table: ${tableName}`);

            const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
            console.log('| Field | Type | Null | Key | Default | Extra |');
            console.log('|-------|------|------|-----|---------|-------|');
            columns.forEach(col => {
                console.log(`| ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default} | ${col.Extra} |`);
            });
            console.log('\n');

            const [createTable] = await connection.execute(`SHOW CREATE TABLE ${tableName}`);
            console.log('```sql');
            console.log(createTable[0]['Create Table']);
            console.log('```');
            console.log('\n---\n');
        }
    } catch (error) {
        console.error('Error dumping schema:', error);
    } finally {
        await connection.end();
    }
}

dumpSchema();
