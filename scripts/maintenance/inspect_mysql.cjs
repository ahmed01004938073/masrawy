
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
});

connection.connect();

const marketerId = 'm1';

function inspect() {
    // 1. Marketer Profile
    connection.query('SELECT * FROM marketers WHERE id = ?', [marketerId], (err, mResults) => {
        console.log('--- Marketer Profile (m1) ---');
        console.table(mResults);

        // 2. Commissions Summary
        connection.query('SELECT status, COUNT(*) as count, SUM(amount) as total FROM commissions WHERE marketerId = ? GROUP BY status', [marketerId], (err, cResults) => {
            console.log('\n--- Commissions Summary (m1) ---');
            console.table(cResults);

            // 3. Withdrawals Summary
            connection.query('SELECT status, COUNT(*) as count, SUM(amount) as total FROM withdrawals WHERE marketerId = ? GROUP BY status', [marketerId], (err, wResults) => {
                console.log('\n--- Withdrawals Summary (m1) ---');
                console.table(wResults);

                // 4. Detailed Commissions for pending/delivered
                connection.query(`
                    SELECT c.id, c.orderId, c.amount, c.status, o.status as orderStatus
                    FROM commissions c
                    LEFT JOIN orders o ON c.orderId = o.id
                    WHERE c.marketerId = ? AND c.status != 'cancelled'
                    ORDER BY c.createdAt DESC
                    LIMIT 20
                `, [marketerId], (err, detailResults) => {
                    console.log('\n--- Commission Details (Last 20) ---');
                    console.table(detailResults);
                    connection.end();
                });
            });
        });
    });
}

inspect();
