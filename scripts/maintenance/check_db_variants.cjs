const db = require('../../server/database.cjs');

function checkProduct() {
    console.log('--- Checking Product Variants & Category ---');
    // Select relevant columns to diagnose storage format
    const sql = "SELECT id, name, category_id, manufacturerId, images, colors, sizes, detailedVariants FROM products ORDER BY date DESC LIMIT 1";

    db.all(sql, [], (err, rows) => {
        if (err) { console.error(err); return; }
        if (rows.length === 0) { console.log('No products found'); return; }

        const p = rows[0];
        console.log('Product ID:', p.id);
        console.log('Name:', p.name);
        console.log('Category ID:', p.category_id);
        console.log('Manufacturer ID:', p.manufacturerId);
        console.log('--- Raw Data ---');
        console.log('Colors (Type: ' + typeof p.colors + '):', p.colors);
        console.log('Sizes (Type: ' + typeof p.sizes + '):', p.sizes);
        console.log('DetailedVariants (Type: ' + typeof p.detailedVariants + '):', p.detailedVariants);

        process.exit(0);
    });
}

checkProduct();
