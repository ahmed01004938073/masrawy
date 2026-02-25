
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
}).promise();

async function repair() {
    try {
        console.log('🔄 Starting data repair...');

        // 1. Repair Commissions
        console.log('🔗 Re-linking commissions to marketers via orders table...');
        const [commRes] = await connection.execute(`
            UPDATE commissions c
            JOIN orders o ON c.orderId = o.id
            SET c.marketerId = o.marketer_id
            WHERE c.marketerId IS NULL AND o.marketer_id IS NOT NULL
        `);
        console.log(`✅ Fixed ${commRes.affectedRows} commissions.`);

        // 2. Repair Withdrawals (Harder, but let's try to find common wallet numbers)
        // Ahmed Adel: 01004938073
        // Sample withdrawal note: 01127642349
        // Maybe we can list unique notes and find marketers with matching phones?

        // For now, let's just see how many withdrawals are null
        const [withRows] = await connection.execute('SELECT COUNT(*) as count FROM withdrawals WHERE marketerId IS NULL');
        console.log(`⚠️ There are still ${withRows[0].count} withdrawals with NULL marketerId.`);

        // 3. Force Recalculate Stats for all marketers
        const [marketers] = await connection.execute('SELECT id FROM marketers');
        console.log(`📊 Force-recalculating stats for ${marketers.length} marketers...`);

        // We'll use a simplified version of updateMarketerStats logic here in SQL
        for (const m of marketers) {
            const mId = m.id;

            // Total Commission (pending, approved, paid)
            const [cData] = await connection.execute(`
                SELECT SUM(amount) as total FROM commissions 
                WHERE marketerId = ? AND status NOT IN ('cancelled', 'processing')
            `, [mId]);
            const totalCommission = Number(cData[0].total || 0);

            // Withdrawn Commission (completed)
            const [wData] = await connection.execute(`
                SELECT SUM(amount) as total FROM withdrawals 
                WHERE marketerId = ? AND status = 'completed'
            `, [mId]);
            const withdrawnCommission = Number(wData[0].total || 0);

            // Orders count
            const [oData] = await connection.execute(`
                SELECT COUNT(*) as count FROM orders WHERE marketer_id = ?
            `, [mId]);
            const ordersCount = oData[0].count;

            const pendingCommission = totalCommission - withdrawnCommission;

            await connection.execute(`
                UPDATE marketers 
                SET totalCommission = ?, pendingCommission = ?, withdrawnCommission = ?, ordersCount = ?, updatedAt = NOW()
                WHERE id = ?
            `, [totalCommission, pendingCommission, withdrawnCommission, ordersCount, mId]);

            console.log(`✅ Updated stats for ${mId}: Total=${totalCommission}, Pending=${pendingCommission}`);
        }

        console.log('🎉 Repair complete.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Repair failed:', err);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

repair();
