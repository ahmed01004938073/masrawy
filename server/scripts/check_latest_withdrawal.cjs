const db = require('./database.cjs');

console.log("=== فحص آخر طلب سحب ===\n");

db.get("SELECT * FROM withdrawals ORDER BY createdAt DESC LIMIT 1", [], (err, row) => {
    if (err) {
        console.error("خطأ:", err);
        process.exit(1);
    }

    if (!row) {
        console.log("❌ لا توجد طلبات سحب");
        process.exit(0);
    }

    console.log("📝 آخر طلب سحب:");
    console.log(JSON.stringify(row, null, 2));

    console.log("\n--- التحليل ---");

    if (row.marketerId === null || row.marketerId === undefined) {
        console.log("❌ المشكلة: marketerId = null");
        console.log("   السبب: user.id كان فاضي وقت تسجيل الطلب");
    } else {
        console.log(`✅ marketerId موجود: ${row.marketerId}`);

        // التحقق من وجود المسوق
        db.get("SELECT * FROM marketers WHERE id = ?", [row.marketerId], (err, marketer) => {
            if (err) {
                console.error("خطأ:", err);
            } else if (!marketer) {
                console.log(`❌ المسوق ${row.marketerId} غير موجود في جدول marketers`);
            } else {
                console.log(`✅ المسوق موجود: ${marketer.name}`);
            }
            process.exit(0);
        });
        return;
    }

    process.exit(0);
});
