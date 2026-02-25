const payload = {
    id: "1768229882141",
    name: "احمد احمد",
    description: "test update fetch",
    price: 300,
    wholesalePrice: 200,
    quantity: 5,
    category: "1", // Valid Category ID
    manufacturerId: "m1765717886982",
    status: "active",
    images: []
};

async function run() {
    try {
        const res = await fetch('http://localhost:3001/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('STATUS:', res.status);
        const text = await res.text();
        console.log('BODY:', text);
    } catch (e) {
        console.error(e);
    }
}

run();
