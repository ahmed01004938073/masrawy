const db = require('./database.cjs');

const marketerId = 'm1765731743456';
const marketerName = 'احمد عادل';

console.log("=== استرجاع بيانات المسوق ===\n");
console.log(`المسوق: ${marketerName} (${marketerId})`);
console.log(`\nالبيانات المطلوب استرجاعها:`);
console.log(`  - إجمالي العمولات: 700 ج.م`);
console.log(`  - العمولات المعلقة: 600 ج.م`);
console.log(`  - العمولات المسحوبة: 100 ج.م`);
console.log(`\n---\n`);

// خطة الاسترجاع:
// 1. إنشاء 6 سجلات عمولة (pending) × 100 ج.م = 600 ج.م
// 2. إنشاء 1 سجل عمولة (paid) × 100 ج.م = 100 ج.م
// 3. إنشاء 1 سجل سحب (completed) × 100 ج.م = 100 ج.م

const commissions = [
    { amount: 100, status: 'pending', orderNumber: 'ORD-001' },
    { amount: 100, status: 'pending', orderNumber: 'ORD-002' },
    { amount: 100, status: 'pending', orderNumber: 'ORD-003' },
    { amount: 100, status: 'pending', orderNumber: 'ORD-004' },
    { amount: 100, status: 'pending', orderNumber: 'ORD-005' },
    { amount: 100, status: 'pending', orderNumber: 'ORD-006' },
    { amount: 100, status: 'paid', orderNumber: 'ORD-007' }
];

const withdrawal = {
    amount: 100,
    status: 'completed',
    method: 'wallet',
    notes: '01004938073 (استرجاع بيانات)'
};

// إضافة العمولات
let addedCommissions = 0;
function addCommissions(index = 0) {
    if (index >= commissions.length) {
        console.log(`\n✅ تم إضافة ${addedCommissions} سجل عمولة`);
        addWithdrawal();
        return;
    }

    const c = commissions[index];
    const now = new Date().toISOString();
    const id = `c${Date.now()}_${index}`;
    const orderId = `o${Date.now()}_${index}`;

    const sql = `INSERT INTO commissions (id, marketerId, orderId, orderNumber, amount, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [id, marketerId, orderId, c.orderNumber, c.amount, c.status, now, now], function (err) {
        if (err) {
            console.error(`❌ خطأ في إضافة عمولة ${index + 1}:`, err.message);
        } else {
            addedCommissions++;
            console.log(`  ✓ عمولة ${index + 1}: ${c.amount} ج.م (${c.status})`);
        }
        addCommissions(index + 1);
    });
}

// إضافة طلب السحب
function addWithdrawal() {
    const now = new Date().toISOString();
    const id = `w${Date.now()}_restored`;

    const sql = `INSERT INTO withdrawals (id, marketerId, amount, method, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [id, marketerId, withdrawal.amount, withdrawal.method, withdrawal.status, withdrawal.notes, now, now], function (err) {
        if (err) {
            console.error(`❌ خطأ في إضافة طلب السحب:`, err.message);
        } else {
            console.log(`\n✅ تم إضافة طلب سحب: ${withdrawal.amount} ج.م (${withdrawal.status})`);
        }

        // التحقق من النتائج
        verifyResults();
    });
}

// التحقق
function verifyResults() {
    console.log(`\n--- التحقق من النتائج ---`);

    db.get(`
        SELECT 
            (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE marketerId = ? AND status IN ('pending', 'approved', 'paid')) as totalEarned,
            (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE marketerId = ? AND status = 'processing') as processing,
            (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE marketerId = ? AND status = 'completed') as withdrawn
    `, [marketerId, marketerId, marketerId], (err, stats) => {
        if (err) {
            console.error("خطأ:", err);
        } else {
            const available = stats.totalEarned - stats.withdrawn;
            console.log(`\nالرصيد الحالي:`);
            console.log(`  إجمالي العمولات: ${stats.totalEarned} ج.م`);
            console.log(`  قيد التنفيذ: ${stats.processing} ج.م`);
            console.log(`  المسحوب: ${stats.withdrawn} ج.م`);
            console.log(`  المتاح للسحب: ${available} ج.م`);

            if (stats.totalEarned === 700 && available === 600) {
                console.log(`\n✅ تم الاسترجاع بنجاح!`);
            } else {
                console.log(`\n⚠️ هناك اختلاف في الأرقام`);
            }
        }

        process.exit(0);
    });
}

// بدء العملية
console.log("جاري إضافة العمولات...\n");
addCommissions();
