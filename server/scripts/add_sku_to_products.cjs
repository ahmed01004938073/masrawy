const mysql = require('mysql2/promise');

// Create database connection pool
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db',
    waitForConnections: true,
    connectionLimit: 10
});

// Generate SKU (4 letters + 4 numbers)
function generateSKU() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetters = Array.from({ length: 4 }, () =>
        letters.charAt(Math.floor(Math.random() * letters.length))
    ).join('');
    const randomNumbers = Math.floor(1000 + Math.random() * 9000);
    return `${randomLetters}${randomNumbers}`;
}

async function addSkuToExistingProducts() {
    try {
        console.log('🔍 جاري البحث عن المنتجات بدون كود...');

        // Get all products without SKU
        const [products] = await pool.execute(
            'SELECT id, name FROM products WHERE sku IS NULL OR sku = ""'
        );

        if (products.length === 0) {
            console.log('✅ كل المنتجات لديها كود بالفعل!');
            await pool.end();
            process.exit(0);
        }

        console.log(`📦 تم العثور على ${products.length} منتج بدون كود`);
        console.log('⚙️  جاري توليد الأكواد...\n');

        let updated = 0;

        for (const product of products) {
            const sku = generateSKU();

            await pool.execute(
                'UPDATE products SET sku = ? WHERE id = ?',
                [sku, product.id]
            );

            console.log(`✓ ${product.name}: ${sku}`);
            updated++;
        }

        console.log(`\n🎉 تم! تحديث ${updated} منتج بنجاح`);
        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ خطأ:', error.message);
        process.exit(1);
    }
}

addSkuToExistingProducts();
