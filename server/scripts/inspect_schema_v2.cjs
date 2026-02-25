const db = require('./database.cjs');

db.all("DESCRIBE products", [], (err, rows) => {
    if (err) {
        console.error("Error describing products:", err);
        return;
    }
    console.log("--- Products Table Columns ---");
    rows.forEach(row => console.log(`${row.Field} (${row.Type})`));

    db.all("DESCRIBE manufacturers", [], (err, mRows) => {
        if (err) {
            console.error("Error describing manufacturers:", err);
            return;
        }
        console.log("\n--- Manufacturers Table Columns ---");
        mRows.forEach(row => console.log(`${row.Field} (${row.Type})`));
        process.exit(0);
    });
});
