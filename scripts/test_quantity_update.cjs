const http = require('http');

// Test 1: Get current product
console.log('📥 Step 1: Fetching product...');
http.get('http://localhost:3001/api/products', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const products = JSON.parse(data);
        if (products.length === 0) {
            console.log('❌ No products found!');
            return;
        }

        const testProduct = products[0];
        console.log('\n✅ Found product:', testProduct.name);
        console.log('📊 Current quantity:', testProduct.quantity);
        console.log('📦 Current detailedVariants:', JSON.stringify(testProduct.detailedVariants, null, 2));

        // Test 2: Update the product with reduced quantity
        const newQuantity = Math.max(0, testProduct.quantity - 5);
        console.log(`\n📤 Step 2: Updating quantity ${testProduct.quantity} → ${newQuantity}`);

        const updateData = JSON.stringify({
            ...testProduct,
            quantity: newQuantity
        });

        const updateOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/products',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': updateData.length
            }
        };

        const updateReq = http.request(updateOptions, (updateRes) => {
            let updateBody = '';
            updateRes.on('data', chunk => updateBody += chunk);
            updateRes.on('end', () => {
                console.log('📨 Update response:', updateRes.statusCode, updateBody);

                // Test 3: Fetch again to verify
                console.log('\n🔍 Step 3: Verifying update...');
                setTimeout(() => {
                    http.get('http://localhost:3001/api/products', (res2) => {
                        let data2 = '';
                        res2.on('data', chunk => data2 += chunk);
                        res2.on('end', () => {
                            const products2 = JSON.parse(data2);
                            const updatedProduct = products2.find(p => p.id === testProduct.id);

                            console.log('\n📊 After update:');
                            console.log('  Quantity:', updatedProduct.quantity);
                            console.log('  Expected:', newQuantity);

                            if (updatedProduct.quantity === newQuantity) {
                                console.log('\n✅ SUCCESS: Quantity updated correctly!');
                            } else {
                                console.log('\n❌ FAIL: Quantity did NOT update!');
                                console.log('   Got:', updatedProduct.quantity);
                                console.log('   Expected:', newQuantity);
                            }
                        });
                    });
                }, 500);
            });
        });

        updateReq.write(updateData);
        updateReq.end();
    });
});
