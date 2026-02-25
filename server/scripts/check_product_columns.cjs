const db = require('./database.cjs');

async function checkColumns() {
    try {
        console.log("Checking products table columns...");
        // This query works for MySQL/MariaDB
        const [rows] = await db.pool.execute("SHOW COLUMNS FROM products");
        console.log("Columns:", rows.map(r => r.Field));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkColumns();
