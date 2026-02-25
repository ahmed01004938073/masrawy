const db = require('../../server/database.cjs');

db.get("SELECT value FROM kv WHERE key = 'productSizes'", [], (err, row) => {
    if (err) {
        console.error(err);
    } else if (row) {
        const sizes = JSON.parse(row.value);
        console.log('Product Sizes by Category:');
        console.log(JSON.stringify(sizes, null, 2));

        console.log('\n=== Checking للنساء ===');
        if (sizes['للنساء']) {
            console.log('✅ للنساء has sizes:', sizes['للنساء']);
        } else {
            console.log('❌ للنساء NOT FOUND in productSizes!');
        }
    } else {
        console.log('No productSizes found');
    }
    process.exit(0);
});
