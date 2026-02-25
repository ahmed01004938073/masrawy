
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
});

connection.connect();

const marketerId = 'm1765731743456';

function inspectActiveOrders() {
    // Check both marketerId and marketer_id just in case, but marketer_id is standard in orders table
    const query = `
        SELECT 
            o.orderNumber, o.status as orderStatus, o.commission as orderCommValue,
            c.status as commStatus, c.amount as commAmount
        FROM orders o
        LEFT JOIN commissions c ON o.orderNumber = c.orderNumber
        WHERE (o.marketer_id = ? OR o.marketerId = ?) 
          AND o.status NOT IN ('delivered', 'cancelled', 'returned', 'delivery_rejected')
    `;

    connection.query(query, [marketerId, marketerId], (err, results) => {
        if (err) {
            console.error('SQL Error:', err.sqlMessage);
            // Fallback: Check order table schema if it fails again
            connection.query('DESCRIBE orders', (err2, schema) => {
                console.log('\n--- Orders Table Schema ---');
                console.table(schema);
                connection.end();
            });
        } else {
            console.log(`\n--- Active Orders & Commissions for Marketer ${marketerId} ---`);
            console.table(results);

            const totalProcessing = results.reduce((sum, r) => sum + Number(r.commAmount || 0), 0);
            console.log(`\nTotal Expected Commission from these orders: ${totalProcessing} EGP`);
            connection.end();
        }
    });
}

inspectActiveOrders();
