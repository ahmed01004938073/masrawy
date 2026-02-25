const db = require('./database.cjs');

const createTableSql = `
CREATE TABLE IF NOT EXISTS manufacturers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    createdAt DATETIME
)`;

async function migrate() {
    console.log("🚀 Starting migration...");

    // 1. Create Table
    db.run(createTableSql, [], (err) => {
        if (err) {
            console.error("❌ Error creating table:", err);
            process.exit(1);
        }
        console.log("✅ Manufacturers table ensured.");

        // 2. Fetch from KV
        db.get("SELECT value FROM kv_store WHERE `key` = 'manufacturers'", [], (err2, row) => {
            if (err2 || !row) {
                console.log("ℹ️ No manufacturers in KV store to migrate.");
                process.exit(0);
            }

            const manufacturers = JSON.parse(row.value);
            console.log(`📦 Found ${manufacturers.length} manufacturers to sync.`);

            let completed = 0;
            if (manufacturers.length === 0) process.exit(0);

            manufacturers.forEach(m => {
                const insertSql = `REPLACE INTO manufacturers (id, name, address, phone, createdAt) VALUES (?, ?, ?, ?, ?)`;
                db.run(insertSql, [m.id, m.name, m.address || null, m.phone || null, m.createdAt || new Date().toISOString()], (err3) => {
                    if (err3) console.error(`❌ Error syncing manufacturer ${m.id}:`, err3);
                    completed++;
                    if (completed === manufacturers.length) {
                        console.log("✨ Migration complete!");
                        process.exit(0);
                    }
                });
            });
        });
    });
}

migrate();
