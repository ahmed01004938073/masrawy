const db = require('../../server/database.cjs');

console.log('--- Checking Test Products ---');
const ids = ['1768229882141', '1768229882142'];
db.all(`SELECT id, name, category_id, manufacturerId, colors, sizes FROM products WHERE id IN (?, ?)`, ids, (err, rows) => {
    if (err) console.error(err);
    else console.table(rows);
    process.exit(0);
});
