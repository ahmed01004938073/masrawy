const mysql = require('mysql2/promise');

const config = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
};

async function upgrade() {
    console.log('🚀 Starting Database Upgrade to New Design...');
    let conn;
    try {
        conn = await mysql.createConnection(config);

        // Disable Foreign Key Checks
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');

        // 1. PRODUCTS TABLE UPGRADE
        console.log('📦 Upgrading products table...');

        // Backup old table if exists
        await conn.query('CREATE TABLE IF NOT EXISTS products_old AS SELECT * FROM products');

        // Create new structure
        await conn.query('DROP TABLE IF EXISTS products');
        await conn.query(`
            CREATE TABLE products (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                name_ar VARCHAR(255),
                description TEXT,
                description_ar TEXT,
                price DECIMAL(10,2) NOT NULL,
                wholesalePrice DECIMAL(10,2),
                discount_price DECIMAL(10,2),
                commission DECIMAL(10,2) DEFAULT 0.00,
                quantity INTEGER DEFAULT 0,
                low_stock_threshold INTEGER DEFAULT 10,
                sku VARCHAR(100) UNIQUE,
                barcode VARCHAR(100),
                category_id VARCHAR(36),
                manufacturer VARCHAR(255),
                image_url TEXT,
                images JSON,
                slug VARCHAR(255) UNIQUE,
                meta_title VARCHAR(255),
                meta_description TEXT,
                isArchived BOOLEAN DEFAULT false,
                is_featured BOOLEAN DEFAULT false,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Compatibility fields
                driveLink TEXT,
                date DATETIME,
                manufacturerId VARCHAR(255)
            )
        `);

        // Migrate data from backup to new
        const [oldProducts] = await conn.query('SELECT * FROM products_old');
        for (const p of oldProducts) {
            await conn.execute(`
                INSERT INTO products (
                    id, name, description, price, wholesalePrice, commission, quantity, 
                    images, isArchived, driveLink, date, manufacturerId
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                p.id, p.name, p.description, p.price, p.wholesalePrice || p.cost_price || 0, p.commission || 0, p.quantity || p.stock || 0,
                p.images || '[]', (p.isArchived !== undefined ? p.isArchived : (p.is_active === 0 ? 1 : 0)),
                p.driveLink || "", p.date || new Date(), p.manufacturerId || null
            ]);
        }
        console.log(`✅ Migrated ${oldProducts.length} products.`);

        // 2. ORDERS TABLE UPGRADE
        console.log('🛒 Upgrading orders table...');
        await conn.query('CREATE TABLE IF NOT EXISTS orders_old AS SELECT * FROM orders');
        await conn.query('DROP TABLE IF EXISTS orders');
        await conn.query(`
            CREATE TABLE orders (
                id VARCHAR(36) PRIMARY KEY,
                orderNumber VARCHAR(50) UNIQUE NOT NULL,
                customer_id VARCHAR(36),
                customerName VARCHAR(255) NOT NULL,
                customerPhone VARCHAR(20) NOT NULL,
                customer_email VARCHAR(255),
                customerAddress TEXT NOT NULL,
                shipping_city VARCHAR(100),
                shipping_state VARCHAR(100),
                marketer_id VARCHAR(36),
                marketer_name VARCHAR(255),
                commission DECIMAL(10,2) DEFAULT 0.00,
                subtotal DECIMAL(10,2) NOT NULL,
                shipping_cost DECIMAL(10,2) DEFAULT 0.00,
                discount DECIMAL(10,2) DEFAULT 0.00,
                totalAmount DECIMAL(10,2) NOT NULL,
                payment_status VARCHAR(50) DEFAULT 'pending',
                payment_method VARCHAR(50),
                paid_amount DECIMAL(10,2) DEFAULT 0.00,
                status VARCHAR(50) DEFAULT 'pending',
                section VARCHAR(50) DEFAULT 'orders',
                delivery_date DATE,
                delivered_at TIMESTAMP NULL,
                notes TEXT,
                admin_notes TEXT,
                cancellation_reason TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Extra Compatibility
                city VARCHAR(100),
                province VARCHAR(100)
            )
        `);

        const [oldOrders] = await conn.query('SELECT * FROM orders_old');
        for (const o of oldOrders) {
            await conn.execute(`
                INSERT INTO orders (
                    id, orderNumber, customerName, customerPhone, customerAddress, 
                    shipping_city, shipping_state, marketer_id, marketer_name, commission, 
                    subtotal, totalAmount, status, section, createdAt, updated_at,
                    city, province
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                o.id, o.orderNumber || o.order_number, o.customerName || o.customer_name, o.customerPhone || o.customer_phone, o.customerAddress || o.shipping_address || "",
                o.city || o.shipping_city || "", o.province || o.shipping_state || "", o.marketerId || o.marketer_id || null, o.marketerName || o.marketer_name || "", o.commission || 0,
                o.totalAmount || o.subtotal || 0, o.totalAmount || o.total || 0, o.status, o.section, o.createdAt || o.created_at || new Date(), o.updatedAt || o.updated_at || new Date(),
                o.city, o.province
            ]);
        }
        console.log(`✅ Migrated ${oldOrders.length} orders.`);

        // 3. OTHER TABLES (K-V Store, Sessions, etc.)
        console.log('🛠️ Ensuring other tables exist...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS site_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                \`key\` VARCHAR(100) UNIQUE NOT NULL,
                value JSON NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Re-enable Foreign Key Checks
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('\n🎉 DATABASE UPGRADE COMPLETED SUCCESSFULLY!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Upgrade Failed:', err.message);
        process.exit(1);
    }
}

upgrade();
