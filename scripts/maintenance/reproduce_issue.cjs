const http = require('http');

function postRequest(path, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

function getRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

function deleteRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'DELETE'
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function runTest() {
    console.log("Starting test...");

    const testProduct = {
        id: "test-" + Date.now(),
        name: "Test Product Drive Link",
        description: "Test Description",
        price: 100,
        minSellingPrice: 0,
        wholesalePrice: 0,
        quantity: 10,
        category: "Test",
        images: [],
        colors: [],
        sizes: [],
        detailedVariants: [],
        driveLink: "https://drive.google.com/test-link",
        date: new Date().toISOString(),
        isArchived: 0
    };

    console.log("1. Creating product with driveLink:", testProduct.driveLink);
    try {
        const createRes = await postRequest('/api/products', testProduct);
        console.log("Create response:", createRes);

        console.log("2. Fetching products to verify persistence...");
        const products = await getRequest('/api/products');

        const foundProduct = products.find(p => p.id === testProduct.id);

        if (foundProduct) {
            console.log("Found product:", foundProduct.name);
            console.log("Drive Link in DB:", foundProduct.driveLink);

            if (foundProduct.driveLink === testProduct.driveLink) {
                console.log("✅ SUCCESS: Drive link persisted correctly.");
            } else {
                console.error("❌ FAILURE: Drive link mismatch!");
                console.error("Expected:", testProduct.driveLink);
                console.error("Actual:", foundProduct.driveLink);
            }

            console.log("3. Cleaning up...");
            await deleteRequest(`/api/products/${testProduct.id}`);
            console.log("Cleanup done.");

        } else {
            console.error("❌ FAILURE: Product not found after creation.");
        }

    } catch (error) {
        console.error("❌ ERROR during test:", error);
    }
}

runTest();
