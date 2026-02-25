const db = require('../../server/database.cjs');

async function checkOrders() {
    try {
        const [rows] = await db.pool.query('SELECT id, orderNumber, totalAmount, shipping_cost FROM orders');
        const affected = rows.filter(r => {
            // If total is suspiciously large (e.g. 1400100)
            return r.totalAmount > 10000;
        });
        console.table(affected);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOrders();
