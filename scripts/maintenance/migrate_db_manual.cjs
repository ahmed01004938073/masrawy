const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Running manual migration...");

db.serialize(() => {
    db.all("PRAGMA table_info(products)", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        const columns = rows.map(r => r.name);

        if (!columns.includes('wholesalePrice')) {
            console.log("Adding wholesalePrice column...");
            db.run("ALTER TABLE products ADD COLUMN wholesalePrice REAL", (err) => {
                if (err) console.error("Migration failed:", err);
                else console.log("Success: wholesalePrice added.");
            });
        } else {
            console.log("wholesalePrice already exists.");
        }

        if (!columns.includes('manufacturerId')) {
            console.log("Adding manufacturerId column...");
            db.run("ALTER TABLE products ADD COLUMN manufacturerId TEXT", (err) => {
                if (err) console.error("Migration failed:", err);
                else console.log("Success: manufacturerId added.");
            });
        } else {
            console.log("manufacturerId already exists.");
        }
    });
});
