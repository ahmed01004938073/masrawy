const db = require('./database.cjs');

async function migrate() {
    try {
        console.log("Checking orders table for store_page column...");

        // Attempt to add the column
        // We use catch to handle "Duplicate column name" error gracefully
        const sql = "ALTER TABLE orders ADD COLUMN store_page VARCHAR(255) NULL AFTER marketer_name";

        await db.pool.execute(sql);
        console.log("✅ Column 'store_page' added successfully.");

    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("ℹ️ Column 'store_page' already exists. No changes needed.");
        } else {
            console.error("❌ Error adding column:", err.message);
        }
    } finally {
        process.exit();
    }
}

migrate();
