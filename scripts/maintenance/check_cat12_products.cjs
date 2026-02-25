const db = require('../../server/database.cjs');

// Check if user actually tried to save with category 12
db.all(`
    SELECT id, name, category_id, date 
    FROM products 
    WHERE category_id = 12 
    OR name LIKE '%نساء%' 
    OR name LIKE '%اختبار%'
    ORDER BY date DESC 
    LIMIT 5
`, [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Products with category 12 or test names:');
        console.table(rows);
        console.log(`\nTotal: ${rows.length}`);
    }
    process.exit(0);
});
