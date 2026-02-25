const db = require('./database.cjs');

const email = 'ahmed.adel01004938073@gmail.com';
const phone = '01127642349';

console.log("=== البحث عن بيانات المسوق ===\n");
console.log(`البريد: ${email}`);
console.log(`الهاتف: ${phone}\n`);

// 1. البحث عن المسوق
db.get("SELECT * FROM marketers WHERE email = ? OR phone = ?", [email, phone], (err, marketer) => {
    if (err) {
        console.error("خطأ:", err);
        process.exit(1);
    }

    if (!marketer) {
        console.log("❌ لم يتم العثور على المسوق في قاعدة البيانات!");

        // البحث بطريقة أخرى
        db.all("SELECT * FROM marketers", [], (err, all) => {
            if (!err) {
                console.log(`\n📋 إجمالي المسوقين في قاعدة البيانات: ${all.length}`);
                all.forEach(m => {
                    console.log(`  - ID: ${m.id}, الاسم: ${m.name}, البريد: ${m.email}, الهاتف: ${m.phone}`);
                });
            }
            process.exit(0);
        });
        return;
    }

    console.log("✅ تم العثور على المسوق:");
    console.log(`  - المعرف: ${marketer.id}`);
    console.log(`  - الاسم: ${marketer.name}`);
    console.log(`  - الحالة: ${marketer.status}`);
    console.log(`  - إجمالي العمولات: ${marketer.totalCommission} ج.م`);
    console.log(`  - العمولات المعلقة: ${marketer.pendingCommission} ج.م`);
    console.log(`  - العمولات المسحوبة: ${marketer.withdrawnCommission} ج.م`);

    const marketerId = marketer.id;

    // 2. فحص العمولات
    console.log("\n--- العمولات ---");
    db.all("SELECT * FROM commissions WHERE marketerId = ? ORDER BY createdAt DESC", [marketerId], (err, commissions) => {
        if (err) {
            console.error("خطأ في العمولات:", err);
        } else {
            console.log(`إجمالي العمولات: ${commissions.length}`);

            const pending = commissions.filter(c => c.status === 'pending');
            const processing = commissions.filter(c => c.status === 'processing');
            const paid = commissions.filter(c => c.status === 'paid');
            const cancelled = commissions.filter(c => c.status === 'cancelled');

            console.log(`  - قيد الانتظار (pending): ${pending.length} - مجموع: ${pending.reduce((sum, c) => sum + c.amount, 0)} ج.م`);
            console.log(`  - قيد التنفيذ (processing): ${processing.length} - مجموع: ${processing.reduce((sum, c) => sum + c.amount, 0)} ج.م`);
            console.log(`  - مدفوعة (paid): ${paid.length} - مجموع: ${paid.reduce((sum, c) => sum + c.amount, 0)} ج.م`);
            console.log(`  - ملغاة (cancelled): ${cancelled.length} - مجموع: ${cancelled.reduce((sum, c) => sum + c.amount, 0)} ج.م`);

            if (commissions.length > 0) {
                console.log("\n  آخر 5 عمولات:");
                commissions.slice(0, 5).forEach(c => {
                    console.log(`    • رقم الطلب: ${c.orderNumber}, المبلغ: ${c.amount} ج.م, الحالة: ${c.status}, التاريخ: ${c.createdAt}`);
                });
            }
        }

        // 3. فحص طلبات السحب
        console.log("\n--- طلبات السحب ---");
        db.all("SELECT * FROM withdrawals WHERE marketerId = ? ORDER BY createdAt DESC", [marketerId], (err, withdrawals) => {
            if (err) {
                console.error("خطأ في طلبات السحب:", err);
            } else {
                console.log(`إجمالي طلبات السحب: ${withdrawals.length}`);

                if (withdrawals.length > 0) {
                    const pending = withdrawals.filter(w => w.status === 'pending');
                    const completed = withdrawals.filter(w => w.status === 'completed');
                    const rejected = withdrawals.filter(w => w.status === 'rejected');

                    console.log(`  - قيد المراجعة: ${pending.length}`);
                    console.log(`  - مكتملة: ${completed.length} - مجموع: ${completed.reduce((sum, w) => sum + w.amount, 0)} ج.م`);
                    console.log(`  - مرفوضة: ${rejected.length}`);

                    console.log("\n  جميع طلبات السحب:");
                    withdrawals.forEach(w => {
                        console.log(`    • ID: ${w.id}, المبلغ: ${w.amount} ج.م, الحالة: ${w.status}, التاريخ: ${w.createdAt}`);
                    });
                }
            }

            // 4. حساب الرصيد المتوقع من العمولات والسحوبات
            console.log("\n--- التحليل ---");
            db.get(`
                SELECT 
                    (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE marketerId = ? AND status IN ('pending', 'approved', 'paid')) as totalEarned,
                    (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE marketerId = ? AND status = 'processing') as processing,
                    (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE marketerId = ? AND status = 'completed') as withdrawn
            `, [marketerId, marketerId, marketerId], (err, stats) => {
                if (!err && stats) {
                    const available = stats.totalEarned - stats.withdrawn;
                    console.log(`إجمالي العمولات المستحقة: ${stats.totalEarned} ج.م`);
                    console.log(`قيد التنفيذ: ${stats.processing} ج.م`);
                    console.log(`المسحوب: ${stats.withdrawn} ج.م`);
                    console.log(`الرصيد المتاح: ${available} ج.م`);
                }
                process.exit(0);
            });
        });
    });
});
