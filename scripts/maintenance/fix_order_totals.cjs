const db = require('../../server/database.cjs');

async function fixOrders() {
    try {
        const [rows] = await db.pool.query('SELECT id, orderNumber, items, shipping_cost, discount FROM orders');
        console.log(`Found ${rows.length} orders to check...`);

        for (const order of rows) {
            let items = [];
            try {
                items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
            } catch (e) {
                console.error(`Error parsing items for order ${order.orderNumber}`);
                continue;
            }

            const shipping = Number(order.shipping_cost) || 0;
            const discount = Number(order.discount) || 0;

            // Recalculate product subtotal
            const productSubtotal = items.reduce((sum, item) => {
                const price = Number(item.price) || 0;
                const qty = Number(item.quantity) || 0;
                return sum + (price * qty);
            }, 0);

            const correctTotal = productSubtotal + shipping - discount;

            console.log(`Order ${order.orderNumber}: Subtotal=${productSubtotal}, Shipping=${shipping}, Discount=${discount} => Total=${correctTotal}`);

            await db.pool.execute(
                'UPDATE orders SET totalAmount = ? WHERE id = ?',
                [correctTotal, order.id]
            );
        }

        console.log('✅ All totals recalculated and fixed.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixOrders();
