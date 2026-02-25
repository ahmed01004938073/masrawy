const mysql = require('mysql2/promise');

async function hardenDatabase() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'afleet_db'
    });

    try {
        console.log("🛠️ Starting Database Hardening...");

        // 1. First, fix all data so we can apply NOT NULL
        const marketerId = 'm1765731743456';

        console.log("🧹 Cleaning up 'null' strings and NULL values...");
        await connection.execute("UPDATE commissions SET marketerId = ? WHERE marketerId IS NULL OR marketerId = 'null' OR marketerId = ''", [marketerId]);
        await connection.execute("UPDATE withdrawals SET marketerId = ? WHERE marketerId IS NULL OR marketerId = 'null' OR marketerId = ''", [marketerId]);
        await connection.execute("UPDATE orders SET marketer_id = ? WHERE marketer_id IS NULL OR marketer_id = 'null' OR marketer_id = ''", [marketerId]);

        // 2. Apply NOT NULL constraints
        console.log("🔒 Enforcing NOT NULL constraints...");

        // Commissions table
        await connection.execute("ALTER TABLE commissions MODIFY marketerId VARCHAR(255) NOT NULL");

        // Withdrawals table
        await connection.execute("ALTER TABLE withdrawals MODIFY marketerId VARCHAR(255) NOT NULL");

        // Orders table
        await connection.execute("ALTER TABLE orders MODIFY marketer_id VARCHAR(255) NOT NULL");

        console.log("✅ NOT NULL constraints applied.");

        // 3. Recalculate stats one last time
        console.log(`📊 Recalculating stats for ${marketerId}...`);

        const [earnedRows] = await connection.execute("SELECT SUM(amount) as total FROM commissions WHERE marketerId = ? AND status IN ('pending', 'approved', 'paid')", [marketerId]);
        const [withdrawnRows] = await connection.execute("SELECT SUM(amount) as total FROM withdrawals WHERE marketerId = ? AND status = 'completed'", [marketerId]);
        const [countRows] = await connection.execute("SELECT COUNT(*) as total FROM commissions WHERE marketerId = ? AND status != 'cancelled'", [marketerId]);

        const totalEarned = Number(earnedRows[0]?.total || 0);
        const withdrawnAmount = Number(withdrawnRows[0]?.total || 0);
        const pending = totalEarned - withdrawnAmount;
        const totalCount = Number(countRows[0]?.total || 0);

        await connection.execute(`
            UPDATE marketers 
            SET totalCommission = ?, pendingCommission = ?, withdrawnCommission = ?, ordersCount = ?, status = 'active'
            WHERE id = ?
        `, [totalEarned, pending, withdrawnAmount, totalCount, marketerId]);

        console.log(`✅ Stats Restored: Earned: ${totalEarned}, Pending: ${pending}, Withdrawn: ${withdrawnAmount}`);
        console.log("🎉 Database hardened and data restored successfully.");

    } catch (error) {
        console.error("❌ Hardening failed:", error);
    } finally {
        await connection.end();
    }
}

hardenDatabase();
