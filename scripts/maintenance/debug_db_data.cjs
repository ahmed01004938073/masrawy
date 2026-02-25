const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Dumping kv_store keys and value types...");
    db.each("SELECT key, value FROM kv_store", (err, row) => {
        if (err) console.error(err);
        else {
            try {
                JSON.parse(row.value);
                console.log(`✅ Key: ${row.key} - Valid JSON`);
            } catch (e) {
                console.error(`❌ Key: ${row.key} - INVALID JSON: ${row.value}`);
            }
        }
    });

    console.log("Checking products JSON columns...");
    db.each("SELECT id, name, images, colors, sizes FROM products LIMIT 5", (err, row) => {
        if (err) console.error(err);
        else {
            ['images', 'colors', 'sizes'].forEach(col => {
                try {
                    if (row[col]) JSON.parse(row[col]);
                } catch (e) {
                    console.error(`❌ Product ${row.id} - Col ${col} INVALID: ${row[col]}`);
                }
            });
        }
    });
});
