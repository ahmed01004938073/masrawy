const db = require('../../server/database.cjs');

db.get("SELECT value FROM kv_store WHERE `key` = 'categories'", [], (err, row) => {
    if (err) {
        console.error(err);
    } else if (row) {
        console.log('KV Categories found.');
        const cats = JSON.parse(row.value);
        console.log('Count:', cats.length);
        console.log('IDs:', cats.map(c => c.id).join(', '));
    } else {
        console.log('KV Categories NOT FOUND');
    }

    // Sync logic
    console.log('\n--- Syncing categories table to kv_store ---');
    db.all("SELECT * FROM categories", [], (err2, rows) => {
        if (err2) {
            console.error(err2);
            process.exit(1);
        }

        const mapped = rows.map(r => ({
            ...r,
            id: Number(r.id),
            active: r.active === 1 || r.active === true,
            status: r.status || (r.active ? 'active' : 'inactive')
        }));

        db.run("REPLACE INTO kv_store (`key`, value) VALUES (?, ?)", ['categories', JSON.stringify(mapped)], function (err3) {
            if (err3) {
                console.error('Sync failed:', err3);
            } else {
                console.log('✅ Sync Successful! All MySQL categories are now in KV Store.');
            }
            process.exit(0);
        });
    });
});
