const API_URL = 'http://localhost:3001/api';

async function testPersistence() {
    try {
        console.log('🔄 Fetching orders...');
        const res = await fetch(`${API_URL}/orders`);
        const orders = await res.json();

        if (orders.length === 0) {
            console.log('⚠️ No orders found to test.');
            return;
        }

        const targetOrder = orders[0];
        console.log(`📝 Testing with Order #${targetOrder.orderNumber} (${targetOrder.id})`);

        const shippingCompanyId = "SC-TEST-" + Date.now();
        console.log(`👉 Setting shippingCompany to: ${shippingCompanyId}`);

        const updatedOrder = {
            ...targetOrder,
            shippingCompany: shippingCompanyId,
            trackingNumber: "TRK123456",
            shippingDate: new Date().toISOString()
        };

        console.log('🔄 Sending update...');

        const updateRes = await fetch(`${API_URL}/orders`, {
            method: 'POST', // or PUT, depending on route
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedOrder)
        });

        console.log('✅ Update sent. Status:', updateRes.status);

        console.log('🔄 Fetching orders again to verify...');
        const res2 = await fetch(`${API_URL}/orders`);
        const orders2 = await res2.json();

        const verifiedOrder = orders2.find(o => o.id === targetOrder.id);

        if (verifiedOrder) {
            console.log('🔎 Verification Result:');
            console.log(`   - Expected Company: ${shippingCompanyId}`);
            console.log(`   - Actual Company:   ${verifiedOrder.shippingCompany}`);

            if (verifiedOrder.shippingCompany === shippingCompanyId) {
                console.log('✅ SUCCESS: Data persisted correctly.');
            } else {
                console.log('❌ FAILURE: Data did NOT persist.');
            }
        } else {
            console.log('❌ Error: Order not found after update.');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testPersistence();
