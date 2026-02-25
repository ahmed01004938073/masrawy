const db = require('../../server/database.cjs');

async function fixTotals() {
    try {
        const [rows] = await db.pool.query('SELECT id, orderNumber, totalAmount, shipping_cost FROM orders');
        for (const row of rows) {
            const totalStr = String(row.totalAmount || "0");
            const shipping = Number(row.shipping_cost) || 0;

            // Handle the concatenation case like "1400100.00"
            // If the total is suspiciously large and contains the shipping string
            if (totalStr.length > 5 && totalStr.includes(String(shipping))) {
                // If it looks like [subtotal][shipping], e.g., "1400100.00"
                // Extract the part before the shipping
                const shippingStr = String(Math.floor(shipping));
                if (totalStr.includes(shippingStr)) {
                    const subtotalStr = totalStr.split(shippingStr)[0];
                    const subtotal = Number(subtotalStr) || 0;
                    const correctTotal = subtotal + shipping;

                    console.log(`Fixing ${row.orderNumber}: ${totalStr} -> ${correctTotal} (Sub:${subtotal} + Ship:${shipping})`);

                    await db.pool.execute(
                        'UPDATE orders SET totalAmount = ? WHERE id = ?',
                        [correctTotal, row.id]
                    );
                }
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fixTotals();
