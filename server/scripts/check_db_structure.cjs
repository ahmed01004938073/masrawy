const db = require('./database.cjs');

console.log("=== فحص هيكل قاعدة البيانات ===\n");

// 1. قائمة الجداول
db.all("SHOW TABLES", [], (err, tables) => {
    if (err) {
        console.error("خطأ:", err);
        process.exit(1);
    }

    console.log("📋 الجداول الموجودة:");
    tables.forEach(t => {
        const tableName = Object.values(t)[0];
        console.log(`  - ${tableName}`);
    });

    // 2. فحص جدول commissions
    console.log("\n--- هيكل جدول commissions ---");
    db.all("DESCRIBE commissions", [], (err, cols) => {
        if (err) {
            console.log("❌ جدول commissions غير موجود");
        } else {
            console.log("✅ جدول commissions موجود:");
            cols.forEach(c => {
                console.log(`  ${c.Field} | ${c.Type} | ${c.Null} | ${c.Key} | ${c.Default}`);
            });
        }

        // 3. فحص جدول withdrawals
        console.log("\n--- هيكل جدول withdrawals ---");
        db.all("DESCRIBE withdrawals", [], (err, cols) => {
            if (err) {
                console.log("❌ جدول withdrawals غير موجود");
            } else {
                console.log("✅ جدول withdrawals موجود:");
                cols.forEach(c => {
                    console.log(`  ${c.Field} | ${c.Type} | ${c.Null} | ${c.Key} | ${c.Default}`);
                });
            }

            // 4. فحص الـ Foreign Keys
            console.log("\n--- العلاقات (Foreign Keys) ---");
            db.all(`
                SELECT 
                    TABLE_NAME,
                    COLUMN_NAME,
                    CONSTRAINT_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = 'afleet_db'
                AND REFERENCED_TABLE_NAME IS NOT NULL
                ORDER BY TABLE_NAME
            `, [], (err, fks) => {
                if (err) {
                    console.log("لا يمكن فحص Foreign Keys");
                } else if (fks.length === 0) {
                    console.log("❌ لا توجد Foreign Keys محددة");
                } else {
                    console.log("✅ Foreign Keys موجودة:");
                    fks.forEach(fk => {
                        console.log(`  ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
                    });
                }

                // 5. عد السجلات
                console.log("\n--- عدد السجلات ---");
                db.get("SELECT COUNT(*) as count FROM marketers", [], (err, r1) => {
                    console.log(`المسوقين: ${r1?.count || 0}`);

                    db.get("SELECT COUNT(*) as count FROM commissions", [], (err, r2) => {
                        console.log(`العمولات: ${r2?.count || 0}`);

                        db.get("SELECT COUNT(*) as count FROM withdrawals", [], (err, r3) => {
                            console.log(`طلبات السحب: ${r3?.count || 0}`);
                            process.exit(0);
                        });
                    });
                });
            });
        });
    });
});
