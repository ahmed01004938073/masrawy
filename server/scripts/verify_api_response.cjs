const http = require('http');

http.get('http://localhost:3001/api/products', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const products = JSON.parse(data);
            console.log('Total Products:', products.length);
            if (products.length > 0) {
                console.log('First Product Example:');
                const p = products[0];
                console.log({
                    id: p.id,
                    name: p.name,
                    manufacturerId: p.manufacturerId,
                    manufacturerName: p.manufacturerName
                });

                const withManufacturer = products.filter(p => p.manufacturerName);
                console.log('Products with manufacturer names:', withManufacturer.length);
            }
        } catch (e) {
            console.error('Failed to parse API response:', e.message);
            console.log('Raw response sample:', data.substring(0, 100));
        }
    });
}).on('error', (err) => {
    console.error('Error fetching API:', err.message);
});
