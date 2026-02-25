const http = require('http');

const data = JSON.stringify({
    id: '1767579839656',
    name: 'بنطلون - تحديث',
    price: 150,
    wholesalePrice: 100,
    commission: 20,
    category: '3',  // إكسسوارات
    category_id: '3',
    categoryId: '3',
    stock: 10,
    quantity: 10,
    description: 'اختبار حفظ الفئة',
    images: [],
    colors: [],
    sizes: [],
    detailedVariants: []
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
