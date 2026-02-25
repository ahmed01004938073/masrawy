// Native fetch used


async function testOrderCreation() {
    console.log("🚀 Testing Order Creation with Page Name...");

    const uniqueId = Date.now().toString();
    const testOrder = {
        id: "test-" + uniqueId,
        orderNumber: "TEST-" + uniqueId,
        customerName: "Test Customer",
        customerPhone: "01000000000",
        shippingFee: 50,
        totalAmount: 150,
        items: [],
        page: "Test Page Name X", // <--- THE TARGET FIELD
        marketerId: "test-marketer-id",
        status: "pending",
        section: "orders"
    };

    try {
        console.log("📤 Sending order payload:", JSON.stringify(testOrder, null, 2));

        // 1. Create Order
        const createRes = await fetch('http://localhost:3001/api/orders/create-with-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testOrder)
        });

        const createData = await createRes.json();
        console.log("📥 Create Response:", createData);

        if (!createRes.ok) throw new Error("Creation failed");

        // 2. Fetch Order Details to verify 'page' field
        console.log("🔍 Fetching order details...");
        const getRes = await fetch('http://localhost:3001/api/orders');
        const orders = await getRes.json();

        const myOrder = orders.find(o => o.id === testOrder.id);

        if (myOrder) {
            console.log("✅ Order Found!");
            console.log("📄 Page Name in Response:", myOrder.page);

            if (myOrder.page === "Test Page Name X") {
                console.log("🎉 SUCCESS: Page name saved and retrieved correctly!");
            } else {
                console.error("❌ FAILURE: Page name mismatch. Got:", myOrder.page);
            }
        } else {
            console.error("❌ FAILURE: Order not found in list.");
        }

    } catch (err) {
        console.error("❌ ERROR:", err);
    }
}

testOrderCreation();
