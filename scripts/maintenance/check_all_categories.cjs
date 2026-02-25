const db = require('../../server/database.cjs');

console.log('=== Checking Categories Table ===');
db.all("SELECT * FROM categories", [], (err, cats) => {
    if (err) console.error(err);
    else {
        console.log('Categories in DB:');
        console.table(cats);
    }

    console.log('\n=== Checking Products with Category ===');
    db.all(`
        SELECT p.id, p.name, p.category_id, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LIMIT 10
    `, [], (err2, prods) => {
        if (err2) console.error(err2);
        else {
            console.log('Products with Categories:');
            console.table(prods);
        }
        process.exit(0);
    });
});
