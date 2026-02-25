const db = require('../../server/database.cjs');

async function debug() {
    const [rows] = await db.pool.query("SELECT orderNumber, items FROM orders WHERE orderNumber = 'ORD-1769647091147'");
    console.log(rows[0].items);
    process.exit(0);
}
debug();
