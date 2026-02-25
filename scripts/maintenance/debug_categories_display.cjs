const db = require('../../server/database.cjs');

console.log('=== Checking Product Categories in DB vs Display ===\n');

db.all(`
    SELECT p.id, p.name, p.category_id, c.id as cat_id, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.category_id IS NOT NULL
    ORDER BY p.id DESC
    LIMIT 15
`, [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Products with their categories:');
        console.table(rows);

        // Check if all are showing as ساعات
        const allWatches = rows.every(r => r.category_name === 'ساعات');
        if (allWatches) {
            console.log('\n❌ PROBLEM: All products show category as "ساعات"!');
        }
    }
    process.exit(0);
});
