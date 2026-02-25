const http = require('http');

const data = JSON.stringify({
    identifier: 'admin@afleet.com',
    password: 'admin123'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('📡 Sending login request to backend...\n');

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}\n`);

    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('📦 Raw Response Body:');
        console.log(body);
        console.log('\n📦 Parsed Response:');
        try {
            const parsed = JSON.parse(body);
            console.log(JSON.stringify(parsed, null, 2));
            console.log('\n✅ Has user:', !!parsed.user);
            console.log('✅ Has token:', !!parsed.token);
            if (parsed.user) {
                console.log('👤 User name:', parsed.user.name);
            }
            if (parsed.token) {
                console.log('🔑 Token preview:', parsed.token.substring(0, 20) + '...');
            }
        } catch (e) {
            console.error('❌ Failed to parse JSON:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Request failed: ${e.message}`);
});

req.write(data);
req.end();
