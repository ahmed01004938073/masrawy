const db = require('../../server/database.cjs');

// Get a real product and update its category to 10 (للمحجبات)
db.get("SELECT * FROM products WHERE category_id IS NOT NULL LIMIT 1", [], (err, product) => {
    if (err || !product) {
        console.error('No product found:', err);
        process.exit(1);
    }

    console.log('Updating product:', product.id);
    console.log('Current category_id:', product.category_id);
    console.log('Changing to category_id: 10 (للمحجبات)\n');

    // Update directly in DB
    db.run("UPDATE products SET category_id = 10 WHERE id = ?", [product.id], (err2) => {
        if (err2) {
            console.error('Update failed:', err2);
        } else {
            console.log('✅ Direct UPDATE successful!');

            // Verify
            db.get(`
                SELECT p.id, p.name, p.category_id, c.name as category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE p.id = ?
            `, [product.id], (err3, updated) => {
                if (updated) {
                    console.log('\nVerification:');
                    console.table([updated]);

                    if (updated.category_id === 10 && updated.category_name === 'للمحجبات') {
                        console.log('\n✅ Category 10 (للمح جبات) saved and displays correctly!');
                    }
                }
                process.exit(0);
            });
        }
    });
});
