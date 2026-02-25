const db = require('../../server/database.cjs');

console.log('\n=== Checking Products with Category AFTER Fix ===');
db.all(`
    SELECT p.id, p.name, p.category_id, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.category_id IS NOT NULL
    ORDER BY p.id DESC
    LIMIT 20
`, [], (err, prods) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Products with Categories:');
        console.table(prods);
        console.log(`\nTotal products WITH category: ${prods.length}`);
    }
    process.exit(0);
});
