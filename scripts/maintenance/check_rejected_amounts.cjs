// Node 18+ has global fetch

const API_URL = 'http://localhost:3001/api';

async function checkRejectedOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`);
        const orders = await response.json();

        const rejectedOrders = orders.filter(o => o.status === 'delivery_rejected');

        console.log(`Found ${rejectedOrders.length} rejected orders.`);

        rejectedOrders.forEach(o => {
            const shipFee = o.shipping_cost || o.shippingFee || 0;
            console.log(`Order #${o.orderNumber}: totalAmount=${o.totalAmount}, shippingFee=${shipFee}, status=${o.status}`);
            const items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
            const itemsSum = items.reduce((s, i) => s + (i.total || 0), 0);
            console.log(`  Items Sum: ${itemsSum}, Expected Total: ${itemsSum + Number(shipFee)}`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

checkRejectedOrders();
