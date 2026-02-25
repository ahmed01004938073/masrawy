const db = require('../database.cjs');

async function migrateCategoryNamesToIds() {
    console.log('🚀 Starting Category Migration: Names -> IDs');

    try {
        // 1. Get all products
        const products = await db.allAsync("SELECT id, category_id FROM products");
        const categories = await db.allAsync("SELECT id, name FROM categories");

        const categoryMap = {}; // Name to ID mapping
        categories.forEach(c => {
            categoryMap[c.name] = c.id;
        });

        let updatedCount = 0;
        let skippedCount = 0;

        for (const product of products) {
            const currentCat = product.category_id;

            // Check if it's already an ID (numeric)
            if (!isNaN(Number(currentCat)) && currentCat !== null && currentCat !== "") {
                skippedCount++;
                continue;
            }

            // It's a name, find corresponding ID
            if (categoryMap[currentCat]) {
                const newId = categoryMap[currentCat];
                await db.runAsync("UPDATE products SET category_id = ? WHERE id = ?", [newId, product.id]);
                console.log(`✅ Updated Product ${product.id}: "${currentCat}" -> ID ${newId}`);
                updatedCount++;
            } else {
                console.log(`⚠️ Skipped Product ${product.id}: Category name "${currentCat}" not found in categories table.`);
                skippedCount++;
            }
        }

        console.log(`\n✨ Migration Completed!`);
        console.log(`📊 Total Processed: ${products.length}`);
        console.log(`✅ Updated: ${updatedCount}`);
        console.log(`⏭️ Skipped/Already IDs: ${skippedCount}`);

    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
    }
}

// Ensure the scripts directory exists before moving this
// For now, we can run it once manually if needed, or trigger it via an endpoint.
// migrateCategoryNamesToIds();

module.exports = migrateCategoryNamesToIds;
