const http = require('http');

// Test saving with category "للمحجبات" (ID 10)
const data = JSON.stringify({
    id: 'TEST_MOHAJABAT_' + Date.now(),
    name: 'اختبار فئة للمحجبات',
    price: 100,
    wholesalePrice: 80,
    commission: 15,
    category: '10',  // للمحجبات
    category_id: '10',
    categoryId: '10',
    stock: 5,
    quantity: 5,
    description: 'test',
    images: ['test.jpg'],
    colors: ['أحمر'],
    sizes: ['M'],
    detailedVariants: [{ color: 'أحمر', size: 'M', quantity: 5 }],
    status: 'active',
    manufacturerId: '1'
});

console.log(`Sending category: 10 (للمحجبات)\n`);

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/products',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('RESPONSE:', responseData);

        // Now check what was saved
        setTimeout(() => {
            const db = require('../../server/database.cjs');
            db.get(`
        SELECT p.id, p.name, p.category_id, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.name LIKE '%محجبات%'
        ORDER BY p.date DESC LIMIT 1
      `, [], (err, row) => {
                if (err) console.error(err);
                else {
                    console.log('\n=== What was actually saved: ===');
                    console.table([row]);

                    if (row && row.category_id === '10') {
                        console.log('✅ Category 10 saved correctly!');
                    } else {
                        console.log(`❌ WRONG! Expected category_id=10, got: ${row?.category_id}`);
                    }
                }
                process.exit(0);
            });
        }, 1000);
    });
});

req.on('error', (error) => {
    console.error('ERROR:', error);
    process.exit(1);
});

req.write(data);
req.end();
