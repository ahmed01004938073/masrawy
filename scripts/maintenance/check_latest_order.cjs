
const API_URL = 'http://localhost:3001/api';

async function checkLatestOrder() {
    try {
        const res = await fetch(`${API_URL}/orders?limit=1`);
        const data = await res.json();

        let order;
        if (data.data && Array.isArray(data.data)) {
            order = data.data[0];
        } else if (Array.isArray(data)) {
            order = data[0];
        }

        if (order) {
            console.log('--- LATEST ORDER ---');
            console.log(`ID: ${order.id}`);
            console.log(`Order Number: ${order.orderNumber}`);
            console.log(`Customer: ${order.customerName}`);
            console.log(`Marketer: ${order.marketerName} (ID: ${order.marketerId})`);
            console.log(`Shipping Fee: ${order.shippingFee} (Cost: ${order.shipping_cost})`);
            console.log(`Total Amount: ${order.totalAmount}`);
            console.log(`Notes: ${order.notes}`);
            console.log(`Created At: ${order.createdAt}`);
            console.log('--------------------');
        } else {
            console.log('No orders found.');
        }

    } catch (error) {
        console.error('Error fetching latest order:', error);
    }
}

checkLatestOrder();
