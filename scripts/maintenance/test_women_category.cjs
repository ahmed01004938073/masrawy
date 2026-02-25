const http = require('http');

const data = JSON.stringify({
    id: '9999999999999',
    name: 'اختبار فئة للنساء',
    price: 100,
    wholesalePrice: 80,
    commission: 15,
    category: '12',  // للنساء
    category_id: '12',
    categoryId: '12',
    stock: 5,
    quantity: 5,
    description: 'test',
    images: ['test.jpg'],
    colors: ['أحمر'],
    sizes: ['M'],
    detailedVariants: [{ color: 'أحمر', size: 'M', quantity: 5 }],
    status: 'active'
});

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
    });
});

req.on('error', (error) => {
    console.error('ERROR:', error);
});

req.write(data);
req.end();
