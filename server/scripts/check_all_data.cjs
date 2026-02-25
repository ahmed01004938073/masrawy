const db = require('./database.cjs');

console.log("=== Checking Database Status ===\n");

// 1. Check all withdrawals
db.all("SELECT * FROM withdrawals ORDER BY createdAt DESC LIMIT 10", [], (err, rows) => {
    if (err) {
        console.error("Error fetching withdrawals:", err);
    } else {
        console.log(`📝 Total Withdrawals (last 10): ${rows.length}`);
        rows.forEach(w => {
            console.log(`  - ID: ${w.id}, MarketerId: ${w.marketerId}, Amount: ${w.amount}, Status: ${w.status}`);
        });
    }

    // 2. Check all marketers
    db.all("SELECT * FROM marketers", [], (err, rows) => {
        if (err) {
            console.error("Error fetching marketers:", err);
        } else {
            console.log(`\n👥 Total Marketers: ${rows.length}`);
            rows.forEach(m => {
                console.log(`  - ID: ${m.id}, Name: ${m.name}, Pending: ${m.pendingCommission}, Withdrawn: ${m.withdrawnCommission}`);
            });
        }

        // 3. Check commissions
        db.all("SELECT marketerId, COUNT(*) as count, SUM(amount) as total FROM commissions WHERE status IN ('pending', 'approved', 'paid') GROUP BY marketerId", [], (err, rows) => {
            if (err) {
                console.error("Error fetching commissions:", err);
            } else {
                console.log(`\n💰 Commissions Summary:`);
                rows.forEach(c => {
                    console.log(`  - MarketerId: ${c.marketerId}, Count: ${c.count}, Total: ${c.total}`);
                });
            }

            process.exit(0);
        });
    });
});
