const db = require('./database.cjs');

db.get("SELECT * FROM withdrawals ORDER BY createdAt DESC LIMIT 1", [], (err, row) => {
    if (err) {
        console.error("Error:", err);
    } else if (row) {
        console.log("LATEST WITHDRAWAL:");
        console.log(JSON.stringify(row, null, 2));
        console.log("Date Object:", row.createdAt);
        try {
            // row.createdAt might be a Date object depending on driver settings
            const str = row.createdAt.toString();
            console.log("Date as string:", str);
        } catch (e) { console.log("error stringifying", e); }
    } else {
        console.log("No withdrawals found.");
    }
});
