const db = require('../../server/database.cjs');

db.get("SELECT value FROM kv_store WHERE `key` = ?", ['categories'], (err, row) => {
    if (err || !row) {
        console.error("Could not find categories in kv_store");
        process.exit(1);
    }

    const categories = JSON.parse(row.value);
    console.log(`Found ${categories.length} categories to restore.`);

    let completed = 0;
    categories.forEach(cat => {
        const sql = `REPLACE INTO categories (id, name, \`order\`, active, image, description, showInHomepage, slug, seoTitle, seoDescription) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            cat.id,
            cat.name,
            cat.order || 0,
            (cat.active === true || cat.status === 'active') ? 1 : 0,
            cat.imageUrl || cat.image || null,
            cat.description || null,
            cat.showInHomepage ? 1 : 0,
            cat.slug || null,
            cat.seoTitle || null,
            cat.seoDescription || null
        ];

        db.run(sql, params, function (err) {
            if (err) console.error(`Error restoring ${cat.name}:`, err.message);
            else console.log(`Restored: ${cat.name}`);

            completed++;
            if (completed === categories.length) {
                console.log("🏁 Restoration complete.");
                process.exit();
            }
        });
    });
});
