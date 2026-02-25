const mysql = require('mysql2/promise');

async function checkLastOrder() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Assuming default, change if needed
            database: 'afleet_db'
        });

        console.log('✅ Connected to MySQL');

        const [rows] = await connection.execute(
            'SELECT id, orderNumber, customerName, marketerId, createdAt FROM orders ORDER BY createdAt DESC LIMIT 1'
        );

        if (rows.length > 0) {
            console.log('📦 Last Order Found:');
            console.table(rows);

            const lastOrderDate = new Date(rows[0].createdAt);
            const now = new Date();
            const diffMinutes = (now - lastOrderDate) / (1000 * 60);

            console.log(`🕒 Placed ${diffMinutes.toFixed(2)} minutes ago`);
        } else {
            console.log('❌ No orders found in database.');
        }

        await connection.end();
    } catch (err) {
        console.error('❌ Database Error:', err.message);
    }
}

checkLastOrder();
