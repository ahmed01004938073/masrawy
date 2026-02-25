const db = require('../../server/database.cjs');

console.log('--- Checking Products Category IDs ---');
db.all("SELECT id, name, category_id FROM products LIMIT 20", [], (err, rows) => {
    if (err) console.error(err);
    else {
        console.table(rows);
        const nonNumeric = rows.filter(r => isNaN(parseFloat(r.category_id)));
        if (nonNumeric.length > 0) {
            console.log('Use of Non-Numeric Category IDs detected:', nonNumeric.length);
            console.log(nonNumeric);
        } else {
            console.log('All checked category_ids appear numeric.');
        }
    }
    process.exit(0);
});
