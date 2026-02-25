const http = require('http');

// First, create a dummy product to delete
const db = require('../../server/database.cjs');

const productId = 'TEMP_DELETE_TEST_' + Date.now();

db.run("INSERT INTO products (id, name, price, status) VALUES (?, ?, ?, ?)", [productId, 'Test Delete', 10, 'active'], (err) => {
    if (err) {
        console.error('Insert failed:', err);
        process.exit(1);
    }
    console.log('Created test product:', productId);

    // Now try to delete it via API
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: `/api/products/${productId}`,
        method: 'DELETE'
    };

    const req = http.request(options, (res) => {
        console.log(`DELETE STATUS: ${res.statusCode}`);
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
            console.log('RESPONSE:', responseData);

            // Verify it's gone
            setTimeout(() => {
                db.get("SELECT * FROM products WHERE id = ?", [productId], (err2, row) => {
                    if (row) {
                        console.error('❌ FAILED! Product still exists:', row.id);
                    } else {
                        console.log('✅ SUCCESS! Product was deleted.');
                    }
                    process.exit(0);
                });
            }, 1000);
        });
    });

    req.on('error', (e) => {
        console.error('API Error:', e);
        process.exit(1);
    });
    req.end();
});
