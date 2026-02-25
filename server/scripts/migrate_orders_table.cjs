const db = require('./database.cjs');

async function migrate() {
    try {
        const pool = db.pool;
        console.log('🔄 Checking database columns...');

        // Check for columns
        const [columns] = await pool.execute("SHOW COLUMNS FROM orders");
        const columnNames = columns.map(c => c.Field);

        console.log('Existing columns:', columnNames);

        const newColumns = [
            'shippingCompany',
            'trackingNumber',
            'shippingDate'
        ];

        for (const col of newColumns) {
            if (!columnNames.includes(col)) {
                console.log(`➕ Adding column: ${col}`);
                // Safely add column - assuming TEXT type for simplicity and flexibility
                await pool.execute(`ALTER TABLE orders ADD COLUMN ${col} TEXT`);
                console.log(`✅ Added ${col}`);
            } else {
                console.log(`ℹ️ Column ${col} already exists`);
            }
        }

        console.log('✅ Migration complete');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
