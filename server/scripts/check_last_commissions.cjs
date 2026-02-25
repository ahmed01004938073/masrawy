const db = require('./database.cjs');

console.log("=== آخر 15 عمولة في قاعدة البيانات ===\n");

db.all("SELECT * FROM commissions ORDER BY createdAt DESC LIMIT 15", [], (err, rows) => {
    if (err) {
        console.error("خطأ:", err);
        process.exit(1);
    }

    console.log(`إجمالي: ${rows.length} عمولة\n`);

    rows.forEach((c, i) => {
        console.log(`--- ${i + 1}. ${c.id} ---`);
        console.log(`Marketer ID: ${c.marketerId || 'NULL ❌'}`);
        console.log(`Amount: ${c.amount} ج.م`);
        console.log(`Status: ${c.status}`);
        console.log(`Order: ${c.orderNumber}`);
        console.log(`Created: ${c.createdAt}`);
        console.log();
    });

    process.exit(0);
});
