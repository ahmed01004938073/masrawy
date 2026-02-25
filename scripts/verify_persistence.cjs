const http = require('http');

console.log('🔍 Test: Does backend ACTUALLY save quantity updates?\n');

//Step 1: Get current quantity
http.get('http://localhost:3001/api/products', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const products = JSON.parse(data);
        const testProduct = products[0];

        const originalQty = testProduct.quantity;
        const newQty = originalQty - 7;  // Reduce by 7

        console.log(`📊 BEFORE: Quantity = ${originalQty}`);
        console.log(`🎯 Target: Quantity = ${newQty}\n`);

        // Step 2: Update
        const updateData = JSON.stringify({
            id: testProduct.id,
            name: testProduct.name,
            description: testProduct.description || '',
            price: testProduct.price,
            minSellingPrice: testProduct.minSellingPrice,
            quantity: newQty,  // NEW QUANTITY
            category: testProduct.category,
            images: testProduct.images,
            colors: testProduct.colors,
            sizes: testProduct.sizes,
            detailedVariants: testProduct.detailedVariants,
            date: testProduct.date,
            isArchived: testProduct.isArchived || 0
        });

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

        console.log('📤 Sending update...');
        const updateReq = http.request(updateOptions, (updateRes) => {
            let updateBody = '';
            updateRes.on('data', chunk => updateBody += chunk);
            updateRes.on('end', () => {
                console.log(`✓ Update response: ${updateRes.statusCode}\n`);

                // Step 3: Wait a bit then fetch again
                setTimeout(() => {
                    console.log('🔍 Fetching again to verify...');
                    http.get('http://localhost:3001/api/products', (res2) => {
                        let data2 = '';
                        res2.on('data', chunk => data2 += chunk);
                        res2.on('end', () => {
                            const products2 = JSON.parse(data2);
                            const finalProduct = products2.find(p => p.id === testProduct.id);

                            console.log(`\n📊 AFTER: Quantity = ${finalProduct.quantity}`);
                            console.log(`🎯 Expected: ${newQty}`);

                            if (finalProduct.quantity === newQty) {
                                console.log('\n✅ ✅ ✅ SUCCESS! Quantity WAS saved to database!');
                            } else if (finalProduct.quantity === originalQty) {
                                console.log('\n❌ ❌ ❌ PROBLEM: Quantity did NOT change!');
                                console.log('   Backend accepted request but did not save to database!');
                            } else {
                                console.log(`\n⚠️ WEIRD: Quantity changed to unexpected value ${finalProduct.quantity}`);
                            }
                        });
                    });
                }, 1000); // Wait 1 second
            });
        });

        updateReq.write(updateData);
        updateReq.end();
    });
});
