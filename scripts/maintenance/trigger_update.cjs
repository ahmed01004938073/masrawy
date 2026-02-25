const http = require('http');

const payload = JSON.stringify({
    id: "1768229882141",
    name: "احمد احمد",
    description: "test update",
    price: 300,
    wholesalePrice: 200,
    quantity: 5,
    category: "1", // Valid Category ID
    manufacturerId: "m1765717886982",
    status: "active",
    images: [] // empty for now
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/products',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(payload);
req.end();
