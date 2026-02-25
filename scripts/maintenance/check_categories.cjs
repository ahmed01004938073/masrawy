const db = require('../../server/database.cjs');

function checkCategories() {
    console.log('--- Checking Categories Table ---');
    db.all("SHOW COLUMNS FROM categories", [], (err, columns) => {
        if (err) { console.error(err); return; }
        columns.forEach(c => {
            if (['id', 'name'].includes(c.Field)) console.log(`${c.Field}: ${c.Type}`);
        });

        db.all("SELECT id, name FROM categories LIMIT 3", [], (err, rows) => {
            if (rows) console.log(rows);
            process.exit(0);
        });
    });
}

checkCategories();
