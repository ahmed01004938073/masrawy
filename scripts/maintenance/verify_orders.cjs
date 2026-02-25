const http = require('http');

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:3001${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.error('Failed to parse JSON for ' + path, data.substring(0, 100));
                    resolve(null);
                }
            });
        }).on('error', reject);
    });
}

async function verify() {
    console.log('--- Verifying Orders Items ---');
    const orders = await get('/api/orders');
    if (orders && Array.isArray(orders) && orders.length > 0) {
        console.log(`Found ${orders.length} orders.`);
        const first = orders[0];
        console.log('First Order ID:', first.id);
        console.log('Items Type:', typeof first.items);
        console.log('Items IsArray:', Array.isArray(first.items));
        console.log('Items Length:', first.items ? first.items.length : 'N/A');
        if (first.items && first.items.length > 0) {
            console.log('Sample Item:', first.items[0]);
        } else {
            console.log('⚠️ First order has NO items.');
            // Check if any order has items
            const orderWithItems = orders.find(o => o.items && o.items.length > 0);
            if (orderWithItems) {
                console.log('Found an order with items:', orderWithItems.id);
                console.log('Items:', orderWithItems.items);
            } else {
                console.error('❌ NO orders have items!');
            }
        }
    } else {
        console.log('⚠️ No orders found or response is not array.');
        console.log('Response:', orders);
    }
}

verify();
