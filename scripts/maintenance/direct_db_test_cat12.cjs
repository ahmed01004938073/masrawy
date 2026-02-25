const db = require('../../server/database.cjs');

// Check if category_id column accepts value 12
db.run(`
    INSERT INTO products 
    (id, name, price, wholesalePrice, quantity, category_id, status, date) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE category_id = ?
`,
    ['TEST_CAT_12', 'Test', 100, 80, 5, 12, 'active', new Date().toISOString(), 12],
    (err) => {
        if (err) {
            console.error('❌ Direct DB Insert Failed:', err.message);
        } else {
            console.log('✅ Direct DB Insert SUCCESS - Category 12 accepted!');

            // Verify
            db.get('SELECT id, name, category_id FROM products WHERE id = ?', ['TEST_CAT_12'], (err2, row) => {
                if (row) {
                    console.log('Verification:', row);
                }
                process.exit(0);
            });
        }
    });
