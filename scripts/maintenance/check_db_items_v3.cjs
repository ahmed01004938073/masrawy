const db = require('../../server/database.cjs');

function checkDB() {
    console.log('--- Checking DB Raw Data (MySQL Callback) ---');

    // Schema check
    db.all("SHOW COLUMNS FROM orders", [], (err, columns) => {
        if (err) {
            console.error('Schema Error:', err);
            return;
        }
        console.log('Columns:', columns.map(c => c.Field).join(', '));

        // Raw items check
        db.all("SELECT id, items FROM orders ORDER BY createdAt DESC LIMIT 3", [], (err, orders) => {
            if (err) {
                console.error('Query Error:', err);
                return;
            }

            if (!orders || orders.length === 0) {
                console.log('No orders in DB.');
            } else {
                orders.forEach(o => {
                    console.log(`Order ${o.id}:`);
                    console.log('  Items Type:', typeof o.items);
                    if (typeof o.items === 'object') {
                        console.log('  Items Value (JSON):', JSON.stringify(o.items));
                    } else {
                        console.log('  Items Value:', o.items);
                    }
                });
            }

            // Exit
            process.exit(0);
        });
    });
}

checkDB();
