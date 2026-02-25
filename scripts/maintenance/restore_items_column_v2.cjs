const db = require('../../server/database.cjs');

// Helper to promisify query/execute on a connection or db object
function query(conn, sql, params = []) {
    return new Promise((resolve, reject) => {
        // If it's our db wrapper
        if (conn.all) {
            conn.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }
        // If it's a raw mysql connection
        else if (conn.execute) {
            conn.execute(sql, params, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        }
        // Fallback
        else {
            reject(new Error('Unknown connection type'));
        }
    });
}

async function migrate() {
    console.log('--- Migrating `items` column to `orders` table (V2) ---');

    // 1. Add column
    try {
        console.log('1. Adding `items` column...');
        // We can use the db wrapper for simple queries
        await query(db, "ALTER TABLE orders ADD COLUMN items JSON");
        console.log('   Column added.');
    } catch (e) {
        if (e && e.code === 'ER_DUP_FIELDNAME') {
            console.log('   Column `items` already exists.');
        } else {
            console.error('   Error adding JSON column:', e.message);
            try {
                await query(db, "ALTER TABLE orders ADD COLUMN items LONGTEXT");
                console.log('   Column added as LONGTEXT.');
            } catch (e2) {
                if (e2 && e2.code !== 'ER_DUP_FIELDNAME') {
                    console.error('   Critical Error adding column:', e2);
                    process.exit(1);
                }
            }
        }
    }

    // 2. Fetch items
    let rows = [];
    try {
        console.log('2. Fetching items from `order_items`...');
        rows = await query(db, "SELECT * FROM order_items");
    } catch (e) {
        console.error('Failed to fetch items:', e);
        process.exit(1);
    }

    if (!rows || rows.length === 0) {
        console.log('   No items found in order_items to migrate.');
        process.exit(0);
    }

    // 3. Group
    console.log(`   Found ${rows.length} items. Grouping...`);
    const ordersMap = {};
    rows.forEach(row => {
        const orderId = row.order_id;
        if (!ordersMap[orderId]) ordersMap[orderId] = [];

        let variant = {};
        try {
            variant = typeof row.variant_info === 'string' ? JSON.parse(row.variant_info || '{}') : row.variant_info;
        } catch (e) { }

        ordersMap[orderId].push({
            id: row.id,
            productId: row.product_id,
            productName: row.product_name || 'Product ' + row.product_id,
            quantity: row.quantity,
            price: parseFloat(row.price),
            total: parseFloat(row.price) * row.quantity,
            color: variant?.color || row.color,
            size: variant?.size || row.size,
            image: row.image_url
        });
    });

    // 4. Update
    console.log(`3. Updating ${Object.keys(ordersMap).length} orders...`);
    let connection;
    try {
        connection = await db.getConnection();

        // Promisify connection methods
        const exec = (sql, params) => new Promise((resolve, reject) => {
            connection.execute(sql, params, (err, res) => err ? reject(err) : resolve(res));
        });
        const beginTransaction = () => new Promise((resolve, reject) => {
            connection.beginTransaction(err => err ? reject(err) : resolve());
        });
        const commit = () => new Promise((resolve, reject) => {
            connection.commit(err => err ? reject(err) : resolve());
        });
        const rollback = () => new Promise((resolve, reject) => {
            connection.rollback(() => resolve()); // Always resolve rollback
        });

        await beginTransaction();

        for (const [orderId, items] of Object.entries(ordersMap)) {
            await exec("UPDATE orders SET items = ? WHERE id = ?", [JSON.stringify(items), orderId]);
        }

        await commit();
        console.log('   Migration Complete. Data restored.');

    } catch (e) {
        console.error('Update Failed:', e);
        if (connection) {
            connection.rollback(() => { });
        }
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}

migrate();
