const db = require('../../server/database.cjs');

async function inspect() {
    try {
        console.log('🔄 Fetching one order...');
        const [rows] = await db.pool.execute("SELECT * FROM orders LIMIT 1");

        if (rows.length > 0) {
            const order = rows[0];
            console.log('🔑 Keys found in DB row:');
            console.log(Object.keys(order));

            console.log('shippingCompany value:', order.shippingCompany);
            console.log('shippingcompany value:', order.shippingcompany);
            console.log('SHIPPINGCOMPANY value:', order.SHIPPINGCOMPANY);
        } else {
            console.log('⚠️ No orders found.');
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

inspect();
