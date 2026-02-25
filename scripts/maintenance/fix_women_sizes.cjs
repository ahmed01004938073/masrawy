const db = require('../../server/database.cjs');

db.get("SELECT value FROM kv WHERE `key` = 'productSizes'", [], (err, row) => {
    if (err) {
        console.error(err);
    } else if (row) {
        const sizes = JSON.parse(row.value);
        console.log('Current Product Sizes:');
        console.log(JSON.stringify(sizes, null, 2));

        console.log('\n=== Checking للنساء ===');
        if (sizes['للنساء']) {
            console.log('✅ للنساء has sizes:', sizes['للنساء']);
        } else {
            console.log('❌ للنساء NOT FOUND - Adding it now...');

            // Add standard women's sizes
            sizes['للنساء'] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];

            const newValue = JSON.stringify(sizes);
            db.run("UPDATE kv SET value = ? WHERE `key` = 'productSizes'", [newValue], (err2) => {
                if (err2) {
                    console.error('Update failed:', err2);
                } else {
                    console.log('✅ Successfully added للنساء to productSizes!');
                    console.log('New sizes for للنساء:', sizes['للنساء']);
                }
                process.exit(0);
            });
            return;
        }
    } else {
        console.log('❌ No productSizes found in kv table');
    }
    process.exit(0);
});
