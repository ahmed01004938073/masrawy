const db = require('./database.cjs');

console.log("Checking recent withdrawals...");

db.all("SELECT * FROM withdrawals ORDER BY createdAt DESC LIMIT 5", [], (err, rows) => {
    if (err) {
        console.error("Error fetching withdrawals:", err);
    } else {
        console.log("Found", rows.length, "withdrawals.");
        rows.forEach(w => {
            console.log("--- Withdrawal ID:", w.id, "---");
            console.log("Amount:", w.amount);
            console.log("Status:", w.status);
            console.log("CreatedAt:", w.createdAt, "(Type:", typeof w.createdAt, ")");
            console.log("UpdatedAt:", w.updatedAt);

            // Check validity
            try {
                const d = new Date(w.createdAt);
                console.log("Parsed Date:", d.toString());
                if (isNaN(d.getTime())) console.error("⚠️ INVALID DATE detected!");
            } catch (e) {
                console.error("⚠️ Date parsing error:", e.message);
            }
        });
    }
    // Close connection (optional, depending on pool)
    setTimeout(() => process.exit(0), 1000);
});
