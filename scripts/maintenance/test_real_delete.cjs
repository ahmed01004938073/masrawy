const http = require('http');
const db = require('../../server/database.cjs');

// Get a real product ID to test deletion
db.get("SELECT id FROM products LIMIT 1", [], (err, row) => {
    if (!row) {
        console.log('No products found to delete.');
        process.exit(0);
    }

    const id = row.id;
    console.log(`Testing DELETE for product ID: ${id}`);

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: `/api/products/${id}`,
        method: 'DELETE'
    };

    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log('RESPONSE:', body);
            process.exit(0);
        });
    });

    req.on('error', e => {
        console.error('ERROR:', e.message);
        process.exit(1);
    });
    req.end();
});
