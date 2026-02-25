const db = require('../../server/database.cjs');

function checkSchemaTypes() {
    console.log('--- Checking Schema Types ---');
    db.all("SHOW COLUMNS FROM products", [], (err, columns) => {
        if (err) { console.error(err); return; }
        // Log column Name AND Type
        columns.forEach(c => {
            if (['category_id', 'status', 'image_url'].includes(c.Field)) {
                console.log(`${c.Field}: ${c.Type}`);
            }
        });
        process.exit(0);
    });
}

checkSchemaTypes();
