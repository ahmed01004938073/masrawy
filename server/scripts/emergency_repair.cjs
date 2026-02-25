const mysql = require('mysql2/promise');
// require('dotenv').config();

async function fixAllData() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'afleet_db'
    });

    try {
        console.log("🚀 Starting Global Data Repair...");

        // 1. Fix commissions with NULL marketerId by matching with orders table
        console.log("🔍 Fixing orphan commissions...");
        const [orphans] = await connection.execute("SELECT id, orderNumber FROM commissions WHERE marketerId IS NULL OR marketerId = 'null'");
        console.log(`Found ${orphans.length} orphan commissions.`);

        for (const orphan of orphans) {
            const [orders] = await connection.execute("SELECT marketer_id FROM orders WHERE orderNumber = ? OR id = ?", [orphan.orderNumber, orphan.orderNumber]);
            if (orders.length > 0 && orders[0].marketer_id) {
                await connection.execute("UPDATE commissions SET marketerId = ? WHERE id = ?", [orders[0].marketer_id, orphan.id]);
                console.log(`✅ Linked commission ${orphan.id} to marketer ${orders[0].marketer_id}`);
            } else {
                // If we can't find the marketer from order, default to the known marketer if applicable
                // For this project and current issue, we assume they belong to m1765731743456
                await connection.execute("UPDATE commissions SET marketerId = 'm1765731743456' WHERE id = ?", [orphan.id]);
                console.log(`⚠️ Defaulted commission ${orphan.id} to m1765731743456`);
            }
        }

        // 2. Fix withdrawals with NULL marketerId
        console.log("🔍 Fixing orphan withdrawals...");
        await connection.execute("UPDATE withdrawals SET marketerId = 'm1765731743456' WHERE marketerId IS NULL OR marketerId = 'null'");
        console.log("✅ Linked all orphan withdrawals to m1765731743456");

        // 3. Recalculate stats for m1765731743456
        const marketerId = 'm1765731743456';
        console.log(`📊 Recalculating stats for ${marketerId}...`);

        const [[earned]] = await connection.execute("SELECT SUM(amount) as total FROM commissions WHERE marketerId = ? AND status IN ('pending', 'approved', 'paid')", [marketerId]);
        const [[withdrawn]] = await connection.execute("SELECT SUM(amount) as total FROM withdrawals WHERE marketerId = ? AND status = 'completed'", [marketerId]);
        const [[count]] = await connection.execute("SELECT COUNT(*) as total FROM commissions WHERE marketerId = ? AND status != 'cancelled'", [marketerId]);

        const totalEarned = Number(earned?.total || 0);
        const withdrawnAmount = Number(withdrawn?.total || 0);
        const pending = totalEarned - withdrawnAmount;
        const totalCount = Number(count?.total || 0);

        await connection.execute(`
            UPDATE marketers 
            SET totalCommission = ?, pendingCommission = ?, withdrawnCommission = ?, ordersCount = ?, status = 'active'
            WHERE id = ?
        `, [totalEarned, pending, withdrawnAmount, totalCount, marketerId]);

        console.log(`✅ Stats Restored: Earned: ${totalEarned}, Pending: ${pending}, Withdrawn: ${withdrawnAmount}`);
        console.log("🎉 Repair Complete!");

    } catch (error) {
        console.error("❌ Repair failed:", error);
    } finally {
        await connection.end();
    }
}

fixAllData();
