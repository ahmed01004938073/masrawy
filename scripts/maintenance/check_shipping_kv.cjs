
const API_URL = 'http://localhost:3001/api';

async function checkShippingConfig() {
    try {
        console.log('Fetching shipping areas...');
        const res = await fetch(`${API_URL}/kv/shipping_areas`);
        if (res.status === 404) {
            console.log('Shipping areas KV not found (404). Using defaults?');
            return;
        }
        const areas = await res.json();

        console.log('Shipping Areas Configured:', Array.isArray(areas) ? areas.length : 'Not an array');

        if (Array.isArray(areas)) {
            const minya = areas.find(a => a.governorate === 'المنيا');
            if (minya) {
                console.log('Found Minya configuration:', JSON.stringify(minya, null, 2));
            } else {
                console.log('Minya NOT found in configuration.');
            }
        }

    } catch (error) {
        console.error('Error fetching shipping config:', error);
    }
}

checkShippingConfig();
