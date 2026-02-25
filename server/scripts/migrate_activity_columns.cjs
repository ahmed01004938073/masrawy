const db = require('./database.cjs');

async function migrate() {
    console.log("🔍 Checking employees table structure...");

    try {
        const [columns] = await db.pool.execute("SHOW COLUMNS FROM employees");
        const columnNames = columns.map(c => c.Field);
        console.log("📌 Current columns:", columnNames.join(', '));

        const requiredColumns = [
            { name: 'lastPage', type: 'TEXT' },
            { name: 'lastActionType', type: 'VARCHAR(255)' },
            { name: 'lastActionTime', type: 'DATETIME' }
        ];

        for (const col of requiredColumns) {
            if (!columnNames.includes(col.name)) {
                console.log(`➕ Adding column ${col.name}...`);
                await db.pool.execute(`ALTER TABLE employees ADD COLUMN ${col.name} ${col.type}`);
                console.log(`✅ Column ${col.name} added.`);
            } else {
                console.log(`✔ Column ${col.name} already exists.`);
            }
        }

        console.log("🚀 Migration complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
}

migrate();
