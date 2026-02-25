const db = require('../../server/database.cjs');

async function checkDB() {
    console.log('--- Checking DB Raw Data (MySQL) ---');

    try {
        // Schema check
        const [columns] = await db.promise().query("SHOW COLUMNS FROM orders");
        console.log('Columns:', columns.map(c => c.Field).join(', '));

        // Raw items check
        const [orders] = await db.promise().query("SELECT id, items FROM orders ORDER BY createdAt DESC LIMIT 3");

        if (orders.length === 0) {
            console.log('No orders in DB.');
            return;
        }

        orders.forEach(o => {
            console.log(`Order ${o.id}:`);
            console.log('  Items Type:', typeof o.items);
            // If it's an object (JSON type in MySQL), stringify it to see content
            if (typeof o.items === 'object') {
                console.log('  Items Value (JSON):', JSON.stringify(o.items));
            } else {
                console.log('  Items Value:', o.items);
            }
        });

    } catch (e) {
        console.error('DB Error:', e);
    } finally {
        // db.end(); // Don't end if using pool from module logic, but here likely safe to exit process
        process.exit(0);
    }
}

checkDB();
