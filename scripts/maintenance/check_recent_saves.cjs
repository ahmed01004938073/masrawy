const db = require('../../server/database.cjs');

console.log('=== Checking Recently Saved Products ===\n');

db.all(`
    SELECT p.id, p.name, p.category_id, c.name as category_name, p.date
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    ORDER BY p.date DESC
    LIMIT 5
`, [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Last 5 products saved:');
        console.table(rows);

        // Check for category 8 and 10
        const cat8 = rows.filter(r => r.category_id === '8');
        const cat10 = rows.filter(r => r.category_id === '10');
        const cat12 = rows.filter(r => r.category_id === '12');

        console.log(`\nProducts with category 8 (ساعات): ${cat8.length}`);
        console.log(`Products with category 10 (للمحجبات): ${cat10.length}`);
        console.log(`Products with category 12 (للنساء): ${cat12.length}`);
    }
    process.exit(0);
});
