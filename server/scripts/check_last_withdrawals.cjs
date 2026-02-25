const db = require('./database.cjs');

console.log("=== آخر 3 طلبات سحب ===\n");

db.all("SELECT * FROM withdrawals ORDER BY createdAt DESC LIMIT 3", [], (err, rows) => {
    if (err) {
        console.error("خطأ:", err);
        process.exit(1);
    }

    if (rows.length === 0) {
        console.log("❌ لا توجد طلبات سحب");
        process.exit(0);
    }

    rows.forEach((w, i) => {
        console.log(`--- الطلب ${i + 1} ---`);
        console.log(`ID: ${w.id}`);
        console.log(`Marketer ID: ${w.marketerId} ${w.marketerId === null ? '❌ NULL!' : '✅'}`);
        console.log(`Amount: ${w.amount} ج.م`);
        console.log(`Status: ${w.status}`);
        console.log(`Created: ${w.createdAt}`);
        console.log(`Updated: ${w.updatedAt}`);
        console.log();
    });

    process.exit(0);
});
