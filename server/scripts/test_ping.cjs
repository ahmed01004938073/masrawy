
const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:3001/ping');
        console.log('Backend Ping Result:', res.data);
    } catch (e) {
        console.error('Backend Ping Failed:', e.message);
    }
}
test();
