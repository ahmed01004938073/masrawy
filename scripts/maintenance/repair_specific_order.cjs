const db = require('../../server/database.cjs');

const ORDER_NUMBER = 'ORD-1769646007836';

console.log(`=== Repairing Stock for Order ${ORDER_NUMBER} ===\n`);

// 1. Find the order
db.get("SELECT * FROM orders WHERE orderNumber = ?", [ORDER_NUMBER], (err, order) => {
    if (err) {
        console.error('❌ Error finding order:', err);
        process.exit(1);
    }
    if (!order) {
        console.error('❌ Order not found!');
        process.exit(1);
    }

    console.log(`✅ Found Order: ${order.orderNumber} (Status: ${order.status})`);

    // 2. Parse items
    let items = [];
    try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    } catch (e) {
        console.error('❌ Failed to parse items JSON');
        process.exit(1);
    }

    console.log(`   Items to restore: ${items.length}`);

    // 3. Restore Stock for each item
    // We can't use the frontend's increaseStock service here effectively because we are in Node.
    // We will use direct SQL updates, mirroring the backend logic we tested earlier.

    const restoreItem = (index) => {
        if (index >= items.length) {
            console.log('\n🎉 All items processed. Stock restored.');
            if (db.close) db.close();
            else process.exit(0);
            return;
        }

        const item = items[index];
        const quantityToRestore = item.quantity;
        const productId = item.productId || item.id;

        console.log(`\n--- Processing Item ${index + 1}: ${item.productName || item.name} (ID: ${productId}) ---`);
        console.log(`    Quantity to restore: ${quantityToRestore}`);

        // Get current product state
        db.get("SELECT * FROM products WHERE id = ?", [productId], (err2, product) => {
            if (err2 || !product) {
                console.error(`    ❌ Product not found: ${productId}`);
                restoreItem(index + 1);
                return;
            }

            console.log(`    Current Stock: ${product.quantity}, Archived: ${product.isArchived}`);

            const newStock = product.quantity + quantityToRestore;
            // Un-archive if stock becomes > 0
            const newIsArchived = newStock > 0 ? 0 : product.isArchived;
            const newStatus = (product.status === 'archived' && newStock > 0) ? 'active' : product.status;

            console.log(`    👉 New Stock: ${newStock}, New Archived: ${newIsArchived}, New Status: ${newStatus}`);

            db.run("UPDATE products SET quantity = ?, isArchived = ?, status = ? WHERE id = ?",
                [newStock, newIsArchived, newStatus, productId],
                (err3) => {
                    if (err3) console.error('    ❌ Update failed:', err3);
                    else console.log('    ✅ Database updated successfully.');

                    restoreItem(index + 1);
                }
            );
        });
    };

    restoreItem(0);
});
