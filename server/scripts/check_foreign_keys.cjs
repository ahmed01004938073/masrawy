const db = require('./database.cjs');

console.log("=== فحص Foreign Key Constraints ===\n");

// Check foreign key settings
db.all(`
    SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME,
        DELETE_RULE,
        UPDATE_RULE
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'afleet_db'
    AND REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY TABLE_NAME
`, [], (err, rows) => {
    if (err) {
        console.error("خطأ:", err);
        process.exit(1);
    }

    if (rows.length === 0) {
        console.log("❌ لا توجد Foreign Keys");
    } else {
        console.log("✅ Foreign Keys:\n");
        rows.forEach(fk => {
            console.log(`${fk.TABLE_NAME}.${fk.COLUMN_NAME}`);
            console.log(`  → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
            console.log(`  DELETE: ${fk.DELETE_RULE || 'N/A'}`);
            console.log(`  UPDATE: ${fk.UPDATE_RULE || 'N/A'}`);
            console.log();
        });
    }

    process.exit(0);
});
