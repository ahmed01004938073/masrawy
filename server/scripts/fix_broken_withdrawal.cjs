const db = require('./database.cjs');

console.log("Deleting withdrawal records with null marketerId...");

db.run("DELETE FROM withdrawals WHERE marketerId IS NULL", [], function (err) {
    if (err) {
        console.error("Error:", err);
    } else {
        console.log(`✅ Deleted ${this.changes} invalid withdrawal record(s)`);
    }

    // Verify
    db.all("SELECT COUNT(*) as count FROM withdrawals WHERE marketerId IS NULL", [], (err, rows) => {
        if (err) console.error(err);
        else console.log("Remaining null records:", rows[0].count);
        process.exit(0);
    });
});
