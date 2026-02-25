const db = require('../../server/database.cjs');

function checkTables() {
    console.log('--- Checking Tables ---');
    db.all("SHOW TABLES", [], (err, tables) => {
        if (err) {
            console.error(err);
            return;
        }
        const userTables = tables.map(t => Object.values(t)[0]);
        console.log('Tables:', userTables.join(', '));

        if (userTables.includes('order_items')) {
            console.log('Found order_items table. Checking content...');
            db.all("SELECT * FROM order_items LIMIT 3", [], (err, rows) => {
                if (err) console.error(err);
                else {
                    console.log(`Found ${rows ? rows.length : 0} rows in order_items.`);
                    if (rows && rows.length > 0) console.log(rows[0]);
                }
                process.exit(0);
            });
        } else {
            console.log('order_items table NOT found.');
            process.exit(0);
        }
    });
}

checkTables();
