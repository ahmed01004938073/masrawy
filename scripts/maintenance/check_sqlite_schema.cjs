const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

console.log('=== Checking SQLite Products Schema ===\n');

db.all("PRAGMA table_info(products)", [], (err, columns) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Products Table Columns:');
        console.table(columns);
    }

    console.log('\n=== Sample Products ===\n');
    db.all("SELECT * FROM products LIMIT 3", [], (err2, rows) => {
        if (err2) {
            console.error(err2);
        } else {
            rows.forEach((row, i) => {
                console.log(`\nProduct ${i + 1}:`);
                console.log(JSON.stringify(row, null, 2));
            });
        }
        db.close();
        process.exit(0);
    });
});
