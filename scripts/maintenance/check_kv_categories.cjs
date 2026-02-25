const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/kv/categories',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log("KV Categories Response:");
        try {
            const json = JSON.parse(data);
            // Log first 2 categories
            console.log(json.slice(0, 2));
            // Log value types
            if (json.length > 0) {
                console.log("ID Type:", typeof json[0].id);
                console.log("Name Type:", typeof json[0].name);
            } else {
                console.log("No categories found in KV.");
            }
        } catch (e) { console.log(data); }
    });
});
req.on('error', (e) => console.error(e));
req.end();
