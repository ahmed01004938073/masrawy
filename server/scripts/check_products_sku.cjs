const mysql = require('mysql2/promise');

async function main() {
    const pool = mysql.createPool({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'afleet_db'
    });

    try {
        const [rows] = await pool.execute('SELECT id, name, sku, quantity, isArchived FROM products');
        console.table(rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
