const db = require('./database.cjs');

db.get("SELECT marketerId FROM withdrawals WHERE marketerId IS NOT NULL LIMIT 1", [], (err, row) => {
    if (err) console.error(err);
    else console.log("Valid Marketer ID:", row ? row.marketerId : "None");
});
