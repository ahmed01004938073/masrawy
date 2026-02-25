const db = require('../../server/database.cjs');

async function checkDB() {
    console.log('--- Checking DB Raw Data ---');

    // Check table info
    db.all("PRAGMA table_info(orders)", [], (err, rows) => {
        if (err) {
            console.error('Failed to get schema:', err);
            return;
        }
        console.log('Columns:', rows.map(r => r.name).join(', '));

        // Check raw items
        db.all("SELECT id, items FROM orders LIMIT 3", [], (err, orders) => {
            if (err) {
                console.error('Failed to get orders:', err);
                return;
            }
            if (orders.length === 0) {
                console.log('No orders in DB.');
                return;
            }
            orders.forEach(o => {
                console.log(`Order ${o.id}:`);
                console.log('  Items Type:', typeof o.items);
                console.log('  Items Value:', o.items);
                try {
                    const parsed = JSON.parse(o.items);
                    console.log('  Parsed Length:', parsed.length);
                } catch (e) {
                    console.log('  Parse Error:', e.message);
                }
            });
        });
    });
}

checkDB();
