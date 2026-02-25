const db = require('./database.cjs');

async function debug() {
    db.all('SELECT id, name, manufacturerId FROM products LIMIT 10', [], (err, rows) => {
        if (err) console.error(err);
        console.log('Products:', JSON.stringify(rows, null, 2));

        db.get('SELECT value FROM kv_store WHERE `key` = "manufacturers"', [], (err2, row) => {
            if (err2) console.error(err2);
            console.log('KV Manufacturers Raw:', row ? row.value : 'Not found');
            if (row) {
                try {
                    console.log('Parsed Manufacturers:', JSON.stringify(JSON.parse(row.value), null, 2));
                } catch (e) {
                    console.error('JSON Parse Error');
                }
            }
            process.exit(0);
        });
    });
}

debug();
