
async function test() {
    try {
        console.log('Testing GET /api/kv/categories...');
        const res = await fetch('http://localhost:3001/api/kv/categories');
        const data = await res.json();
        console.log('GET Status:', res.status);
        console.log('GET Data Type:', typeof data);
        console.log('GET Data IsArray:', Array.isArray(data));
        console.log('GET Data Length:', Array.isArray(data) ? data.length : 'N/A');

        if (Array.isArray(data) && data.length > 0) {
            console.log('First Category:', data[0].name);

            // Modify one item
            data[0].active = !data[0].active;

            console.log('Testing POST /api/kv...');
            const res2 = await fetch('http://localhost:3001/api/kv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'categories', value: data })
            });
            console.log('POST Status:', res2.status);
            const txt = await res2.text();
            console.log('POST Response:', txt);
        } else {
            console.log('No categories found or data is not array.');

            // Initialize if empty
            const defaultCategories = [
                { id: 1, name: "Test Category", active: true, productsCount: 0, imageUrl: "", order: 1, showInHomepage: true }
            ];
            console.log('Initializing default categories...');
            const res3 = await fetch('http://localhost:3001/api/kv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'categories', value: defaultCategories })
            });
            console.log('Init POST Status:', res3.status);
            console.log('Init POST Response:', await res3.text());
        }
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

test();
