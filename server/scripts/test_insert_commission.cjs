const db = require('./database.cjs');

const testCommission = {
    id: `c_test_${Date.now()}`,
    marketerId: 'm1765731743456',
    orderId: 'o_test_123',
    orderNumber: 'TEST-001',
    amount: 999,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

console.log("=== Test: إضافة عمولة تجريبية ===\n");
console.log("البيانات المرسلة:");
console.log(JSON.stringify(testCommission, null, 2));
console.log("\n---\n");

const sql = `INSERT INTO commissions (id, marketerId, orderId, orderNumber, amount, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

const params = [
    testCommission.id,
    testCommission.marketerId,
    testCommission.orderId,
    testCommission.orderNumber,
    testCommission.amount,
    testCommission.status,
    testCommission.createdAt,
    testCommission.updatedAt
];

console.log("SQL:", sql);
console.log("\nParams:", params);
console.log("\n---\n");

db.run(sql, params, function (err) {
    if (err) {
        console.error("❌ خطأ:", err);
        process.exit(1);
    }

    console.log("✅ تم الإضافة\n");

    // التحقق من البيانات المحفوظة
    db.get("SELECT * FROM commissions WHERE id = ?", [testCommission.id], (err, row) => {
        if (err) {
            console.error("❌ خطأ في القراءة:", err);
            process.exit(1);
        }

        console.log("البيانات المحفوظة في قاعدة البيانات:");
        console.log(JSON.stringify(row, null, 2));

        if (row.marketerId === testCommission.marketerId) {
            console.log("\n✅ marketerId محفوظ صح!");
        } else {
            console.log(`\n❌ marketerId غلط! المتوقع: ${testCommission.marketerId}, الفعلي: ${row.marketerId}`);
        }

        process.exit(0);
    });
});
