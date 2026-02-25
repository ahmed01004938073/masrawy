const http = require('http');

console.log('📥 Fetching product...');
http.get('http://localhost:3001/api/products', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const products = JSON.parse(data);
        const testProduct = products[0];

        console.log('✅ Product:', testProduct.name);
        console.log('📊 Current quantity:', testProduct.quantity);

        // Send minimal update with only required fields
        const updateData = JSON.stringify({
            id: testProduct.id,
            name: testProduct.name,
            description: testProduct.description || '',
            price: testProduct.price,
            minSellingPrice: testProduct.minSellingPrice,
            quantity: testProduct.quantity - 5,  // Reduce by 5
            category: testProduct.category,
            images: testProduct.images,
            colors: testProduct.colors,
            sizes: testProduct.sizes,
            detailedVariants: testProduct.detailedVariants,
            date: testProduct.date,
            isArchived: testProduct.isArchived || 0
        });

        console.log('\n📤 Sending update...');

        const updateOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/products',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(updateData)
            }
        };

        const updateReq = http.request(updateOptions, (updateRes) => {
            let updateBody = '';
            updateRes.on('data', chunk => updateBody += chunk);
            updateRes.on('end', () => {
                console.log('\n📨 Response Status:', updateRes.statusCode);
                console.log('📨 Response Body:', updateBody);

                if (updateRes.statusCode === 200) {
                    console.log('\n✅ Update successful!');
                } else {
                    console.log('\n❌ Update failed!');
                    try {
                        const error = JSON.parse(updateBody);
                        console.log('Error details:', error);
                    } catch (e) {
                        console.log('Raw error:', updateBody);
                    }
                }
            });
        });

        updateReq.on('error', (e) => {
            console.error('❌ Request error:', e.message);
        });

        updateReq.write(updateData);
        updateReq.end();
    });
});
