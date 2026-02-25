const db = require('../../server/database.cjs');

const queries = [
    "ALTER TABLE products ADD COLUMN colors TEXT",
    "ALTER TABLE products ADD COLUMN sizes TEXT",
    "ALTER TABLE products ADD COLUMN detailedVariants LONGTEXT"
];

function runMigration(index) {
    if (index >= queries.length) {
        console.log("✅ All columns added successfully.");
        process.exit(0);
    }

    db.run(queries[index], [], (err) => {
        if (err) {
            if (err.message.includes("Duplicate column name")) {
                console.log(`⚠️ Column already exists (skipped): ${queries[index]}`);
            } else {
                console.error(`❌ Error executing: ${queries[index]}`, err);
            }
        } else {
            console.log(`✅ Executed: ${queries[index]}`);
        }
        runMigration(index + 1);
    });
}

console.log("🚀 Starting Migration: Adding variants columns to products...");
runMigration(0);
