const http = require('http');

const API_URL = 'http://localhost:3001/api';

function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = http.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        json: () => Promise.resolve(JSON.parse(data))
                    });
                } catch (e) {
                    // If JSON parsing fails, return an empty object for json()
                    resolve({ status: res.statusCode, json: () => Promise.resolve({}) });
                }
            });
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function testToggle() {
    const productId = '1767507476986';

    console.log('--- FETCHING PRODUCT ---');
    let res = await request(`${API_URL}/products`);
    let products = await res.json();
    let product = products.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found!');
        return;
    }
    console.log('Original Product SKU:', product.sku);
    console.log('Original isHidden:', product.isHidden);

    console.log('\n--- TOGGLING VISIBILITY (HIDE) ---');
    // Simulate frontend logic
    const oldProduct = product;
    const updatedProduct = { ...oldProduct, isHidden: !oldProduct.isHidden };

    // updateProduct logic in frontend
    const payload = {
        ...updatedProduct,
        // sku: removed to test server-side protection
        isArchived: updatedProduct.isHidden ? 1 : 0,
        quantity: updatedProduct.stock || updatedProduct.quantity,
    };
    delete payload.sku;

    delete (payload).stock;
    delete (payload).isHidden;
    delete (payload).variants;

    console.log('Payload SKU being sent:', payload.sku);

    const saveRes = await request(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    console.log('Save Status:', saveRes.status);
    const saveData = await saveRes.json();
    console.log('Save Response:', saveData);

    console.log('\n--- FETCHING PRODUCT AGAIN ---');
    res = await request(`${API_URL}/products`);
    products = await res.json();
    product = products.find(p => p.id === productId);
    console.log('New Product SKU:', product.sku);
    console.log('New isHidden:', product.isHidden);
}

testToggle();
