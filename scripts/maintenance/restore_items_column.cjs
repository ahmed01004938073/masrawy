const db = require('../../server/database.cjs');

async function migrate() {
    console.log('--- Migrating `items` column to `orders` table ---');

    try {
        // 1. Add column if not exists
        console.log('1. Adding `items` column...');
        await db.promise().execute("ALTER TABLE orders ADD COLUMN items JSON");
        console.log('   Column added (or error if exists potentially handled by not failing catch block if valid SQL).');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('   Column `items` already exists.');
        } else {
            // It might be that JSON type alias needs standard TEXT/LONGTEXT in some versions, but MySQL 5.7+ supports JSON.
            // If fails, try TEXT.
            console.error('   Failed to add JSON column:', e.message);
            try {
                console.log('   Trying TEXT type...');
                await db.promise().execute("ALTER TABLE orders ADD COLUMN items LONGTEXT");
                console.log('   Column added as LONGTEXT.');
            } catch (e2) {
                if (e2.code !== 'ER_DUP_FIELDNAME') {
                    console.error('   Critical Error adding column:', e2);
                    process.exit(1);
                }
            }
        }
    }

    try {
        // 2. Fetch raw items from order_items
        console.log('2. Fetching items from `order_items`...');
        const [rows] = await db.promise().query("SELECT * FROM order_items");

        if (rows.length === 0) {
            console.log('   No items found in order_items to migrate.');
            process.exit(0);
        }

        // 3. Group by order_id
        console.log(`   Found ${rows.length} items. Grouping...`);
        const ordersMap = {};

        rows.forEach(row => {
            const orderId = row.order_id;
            if (!ordersMap[orderId]) ordersMap[orderId] = [];

            // Map row to Item object expected by frontend
            // Parse variant_info if string
            let variant = {};
            try {
                variant = typeof row.variant_info === 'string' ? JSON.parse(row.variant_info || '{}') : row.variant_info;
            } catch (e) { }

            ordersMap[orderId].push({
                id: row.id, // or product_id?
                productId: row.product_id,
                productName: row.product_name || 'Product ' + row.product_id, // Might need product name lookup if missing
                quantity: row.quantity,
                price: parseFloat(row.price),
                total: parseFloat(row.price) * row.quantity,
                color: variant.color,
                size: variant.size,
                image: row.image_url // if exists
            });
        });

        // 4. Update orders
        console.log(`3. Updating ${Object.keys(ordersMap).length} orders...`);
        const connection = await db.getConnection();
        await connection.beginTransaction();

        for (const [orderId, items] of Object.entries(ordersMap)) {
            // Check if order exists first to avoidFK errors? Or just update.
            // Using direct update
            await connection.execute("UPDATE orders SET items = ? WHERE id = ?", [JSON.stringify(items), orderId]);
        }

        await connection.commit();
        console.log('   Migration Complete. Data restored.');

    } catch (e) {
        console.error('Migration Failed:', e);
    } finally {
        process.exit(0);
    }
}

migrate();
