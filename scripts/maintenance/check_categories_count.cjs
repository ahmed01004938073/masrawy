const db = require('../../server/database.cjs');

db.all("SELECT count(*) as count FROM categories", [], (err, rows) => {
    if (err) console.error(err);
    else console.log("Categories in SQL DB:", rows[0].count);

    // Also check if '1' exists
    db.all("SELECT * FROM categories WHERE id = 1", [], (err, rows) => {
        if (err) console.error(err);
        else console.log("Category ID 1:", rows);
        process.exit(0);
    });
});
