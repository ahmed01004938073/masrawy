const db = require('../../server/database.cjs');

console.log('=== Checking MySQL Products (Legacy Columns) ===\n');

// Check products structure
// Note: We use db.all which is provided by our MySQL adapter to mimic sqlite3's API
db.all(`
    SELECT id, name, category_id 
    FROM products 
    WHERE category_id IS NOT NULL
    LIMIT 10
`, [], (err, rows) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log('Products with Category IDs (MySQL):');
        console.table(rows);

        console.log('\n=== Analysis ===');
        rows.forEach((r, i) => {
            console.log(`Product ${i + 1}:`);
            console.log(`  category_id: "${r.category_id}" (Type: ${typeof r.category_id})`);
        });

        console.log('\n✅ Note: Legacy columns "category" and "categoryId" do not exist in MySQL schema (Cleaned).');
    }

    // close() is a helper in our adapter to close the pool
    if (db.close) {
        db.close();
    } else {
        process.exit(0);
    }
});
