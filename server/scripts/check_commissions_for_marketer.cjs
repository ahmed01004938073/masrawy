const db = require('./database.cjs');

const marketerId = 'm1765731743456';

console.log("=== فحص العمولات للمسوق ===\n");
console.log(`Marketer ID: ${marketerId}\n`);

db.all("SELECT * FROM commissions WHERE marketerId = ? ORDER BY createdAt DESC", [marketerId], (err, rows) => {
    if (err) {
        console.error("خطأ:", err);
        process.exit(1);
    }

    console.log(`✅ عدد العمولات: ${rows.length}\n`);

    if (rows.length > 0) {
        rows.forEach((c, i) => {
            console.log(`--- عمولة ${i + 1} ---`);
            console.log(`ID: ${c.id}`);
            console.log(`Amount: ${c.amount} ج.م`);
            console.log(`Status: ${c.status}`);
            console.log(`Order: ${c.orderNumber}`);
            console.log(`Created: ${c.createdAt}`);
            console.log();
        });
    } else {
        console.log("❌ لا توجد عمولات لهذا المسوق!");

        // Check if there are any commissions at all
        db.get("SELECT COUNT(*) as count FROM commissions", [], (err, row) => {
            if (!err) {
                console.log(`\nإجمالي العمولات في قاعدة البيانات: ${row.count}`);
            }
            process.exit(0);
        });
        return;
    }

    process.exit(0);
});
