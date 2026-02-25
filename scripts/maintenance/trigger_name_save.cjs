const payload = {
    id: "1768229882142",
    name: "منتج تجربة الاسم",
    description: "test update name resolution",
    price: 350,
    wholesalePrice: 250,
    quantity: 10,
    category: "للرجال", // Sending NAME
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
