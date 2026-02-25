const mysql = require('mysql2/promise');

async function hardenDatabaseFinal() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'afleet_db'
    });

    try {
        console.log("🛠️ Starting Final Database Hardening...");

        // 1. Fix data first
        const marketerId = 'm1765731743456';
        await connection.execute("UPDATE commissions SET marketerId = ? WHERE marketerId IS NULL OR marketerId = 'null' OR marketerId = ''", [marketerId]);
        await connection.execute("UPDATE withdrawals SET marketerId = ? WHERE marketerId IS NULL OR marketerId = 'null' OR marketerId = ''", [marketerId]);
        await connection.execute("UPDATE orders SET marketer_id = ? WHERE marketer_id IS NULL OR marketer_id = 'null' OR marketer_id = ''", [marketerId]);

        // 2. Drop problematic Foreign Keys
        console.log("🔗 Dropping old FKs...");
        try { await connection.execute("ALTER TABLE commissions DROP FOREIGN KEY commissions_ibfk_1"); } catch (e) { console.log("Note: commissions_ibfk_1 already dropped or not found"); }
        try { await connection.execute("ALTER TABLE withdrawals DROP FOREIGN KEY withdrawals_ibfk_1"); } catch (e) { console.log("Note: withdrawals_ibfk_1 already dropped or not found"); }

        // 3. Enforce NOT NULL
        console.log("🔒 Enforcing NOT NULL...");
        await connection.execute("ALTER TABLE commissions MODIFY marketerId VARCHAR(255) NOT NULL");
        await connection.execute("ALTER TABLE withdrawals MODIFY marketerId VARCHAR(255) NOT NULL");
        await connection.execute("ALTER TABLE orders MODIFY marketer_id VARCHAR(255) NOT NULL");

        // 4. Re-add FKs with RESTRICT (Security)
        console.log("🛡️ Re-adding FKs with ON DELETE RESTRICT...");
        await connection.execute("ALTER TABLE commissions ADD CONSTRAINT fk_commissions_marketer FOREIGN KEY (marketerId) REFERENCES marketers(id) ON DELETE RESTRICT");
        await connection.execute("ALTER TABLE withdrawals ADD CONSTRAINT fk_withdrawals_marketer FOREIGN KEY (marketerId) REFERENCES marketers(id) ON DELETE RESTRICT");

        // 5. Cleanup stats
        console.log(`📊 Final stats sync for ${marketerId}...`);
        const [earnedRows] = await connection.execute("SELECT SUM(amount) as total FROM commissions WHERE marketerId = ? AND status IN ('pending', 'approved', 'paid')", [marketerId]);
        const [withdrawnRows] = await connection.execute("SELECT SUM(amount) as total FROM withdrawals WHERE marketerId = ? AND status = 'completed'", [marketerId]);
        const totalEarned = Number(earnedRows[0]?.total || 0);
        const withdrawnAmount = Number(withdrawnRows[0]?.total || 0);

        await connection.execute(`
            UPDATE marketers 
            SET totalCommission = ?, pendingCommission = ?, withdrawnCommission = ?, status = 'active'
            WHERE id = ?
        `, [totalEarned, totalEarned - withdrawnAmount, withdrawnAmount, marketerId]);

        console.log("🎉 SUCCESS: Database is now bulletproof.");

    } catch (error) {
        console.error("❌ Hardening failed:", error);
    } finally {
        await connection.end();
    }
}

hardenDatabaseFinal();
