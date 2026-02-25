const db = require('../../server/database.cjs');

async function robustFix() {
    try {
        const [rows] = await db.pool.query('SELECT id, orderNumber, items, shipping_cost, discount FROM orders');
        console.log(`Checking ${rows.length} orders...`);

        for (const row of rows) {
            let items = [];
            try {
                const rawItems = row.items;
                items = typeof rawItems === 'string' ? JSON.parse(rawItems || '[]') : (rawItems || []);
            } catch (e) {
                console.error(`Failed to parse items for ${row.orderNumber}`);
                continue;
            }

            if (!Array.isArray(items) || items.length === 0) {
                console.log(`Skipping ${row.orderNumber} - no items`);
                continue;
            }

            const shipping = Number(row.shipping_cost) || 0;
            const discount = Number(row.discount) || 0;

            const productSubtotal = items.reduce((sum, item) => {
                // Check multiple possible price fields
                const price = Number(item.price) || Number(item.sellPrice) || 0;
                const qty = Number(item.quantity) || 1;
                return sum + (price * qty);
            }, 0);

            const correctTotal = productSubtotal + shipping - discount;

            if (correctTotal > 0) {
                console.log(`Fixing ${row.orderNumber}: Current Total=${row.totalAmount} -> Correct Total=${correctTotal}`);
                await db.pool.execute(
                    'UPDATE orders SET totalAmount = ? WHERE id = ?',
                    [correctTotal, row.id]
                );
            }
        }
        console.log('✅ Done.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
robustFix();
