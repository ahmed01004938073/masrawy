const db = require('../../server/database.cjs');

function checkProduct() {
    console.log('--- Checking Product "احمد احمد" ---');
    db.all("SELECT id, name, category_id, manufacturerId FROM products WHERE name LIKE ?", ['%احمد احمد%'], (err, rows) => {
        if (err) { console.error(err); return; }
        console.log(rows);
        process.exit(0);
    });
}

checkProduct();
