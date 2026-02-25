const db = require('../../server/database.cjs');

// Helper to promisify query/execute
function query(conn, sql, params = []) {
    return new Promise((resolve, reject) => {
        if (conn.all) {
            conn.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        } else if (conn.execute) {
            conn.execute(sql, params, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        } else {
            reject(new Error('Unknown connection type'));
        }
    });
}

async function fixCategoryIds() {
    console.log('--- Fixing Category IDs (Name -> ID) ---');

    try {
        // 1. Get all categories map
        const categories = await query(db, "SELECT id, name FROM categories");
        const categoryMap = {};
        categories.forEach(c => {
            categoryMap[c.name.trim()] = c.id;
        });
        console.log('Loaded Categories:', Object.keys(categoryMap).length);

        // 2. Get all products with text in category_id
        // We look for rows where category_id is NOT numeric roughly, or just check all
        const products = await query(db, "SELECT id, category_id FROM products");

        const updates = [];

        products.forEach(p => {
            if (!p.category_id) return;

            const catIdStr = String(p.category_id).trim();
            // If it's already a number (and exists in map values? or just looks like ID)
            // But strict check: if it is a NAME in our map, we replace it.

            if (categoryMap[catIdStr]) {
                // It matches a name! Replace with ID.
                updates.push({
                    pid: p.id,
                    newId: categoryMap[catIdStr],
                    oldVal: catIdStr
                });
            }
        });

        if (updates.length === 0) {
            console.log('No products found with Category Names in ID column.');
        } else {
            console.log(`Found ${updates.length} products to fix.`);
            const connection = await db.getConnection();

            const exec = (sql, params) => new Promise((resolve, reject) => {
                connection.execute(sql, params, (err, res) => err ? reject(err) : resolve(res));
            });

            for (const u of updates) {
                console.log(`Updating Product ${u.pid}: "${u.oldVal}" -> ${u.newId}`);
                await exec("UPDATE products SET category_id = ? WHERE id = ?", [u.newId, u.pid]);
            }
            connection.release();
            console.log('Updates complete.');
        }

    } catch (e) {
        console.error('Fix Failed:', e);
    } finally {
        process.exit(0);
    }
}

fixCategoryIds();
