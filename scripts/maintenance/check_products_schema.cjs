const db = require('../../server/database.cjs');

function checkProducts() {
    console.log('--- Checking Products Table ---');
    db.all("SHOW COLUMNS FROM products", [], (err, columns) => {
        if (err) {
            console.error('Schema Error:', err);
            return;
        }
        console.log('Columns:', columns.map(c => c.Field).join(', '));

        // Check first product to see raw data for ambiguous fields
        db.all("SELECT * FROM products LIMIT 1", [], (err, rows) => {
            if (rows && rows.length > 0) {
                const p = rows[0];
                console.log('Sample Product Keys:', Object.keys(p).join(', '));
                console.log('  id:', p.id);
                console.log('  name:', p.name);
                console.log('  costPrice/wholesalePrice:', p.costPrice, p.wholesalePrice, p.cost_price);
                console.log('  category/categoryId:', p.category, p.categoryId, p.category_id);
                console.log('  image/thumbnail:', p.image, p.thumbnail, p.imageUrl);
                console.log('  status/active:', p.status, p.active, p.isActive);
            } else {
                console.log('No products found.');
            }
            process.exit(0);
        });
    });
}

checkProducts();
