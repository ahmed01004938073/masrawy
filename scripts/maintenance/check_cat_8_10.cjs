const db = require('../../server/database.cjs');

console.log('=== Checking Categories Table ===\n');
db.all("SELECT id, name FROM categories WHERE id IN (8, 10) ORDER BY id", [], (err, cats) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Categories 8 and 10:');
        console.table(cats);
    }
    process.exit(0);
});
