
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
});

connection.connect();

const marketerId = 'm1765731743456';

function inspect() {
    connection.query('SELECT status, COUNT(*) as count, SUM(amount) as total FROM commissions WHERE marketerId = ? GROUP BY status', [marketerId], (err, cResults) => {
        console.log('\n--- Commissions Summary (m1765731743456) ---');
        console.table(cResults);

        connection.query('SELECT status, COUNT(*) as count, SUM(amount) as total FROM withdrawals WHERE marketerId = ? GROUP BY status', [marketerId], (err, wResults) => {
            console.log('\n--- Withdrawals Summary (m1765731743456) ---');
            console.table(wResults);

            connection.query(`
                SELECT c.id, c.orderId, c.amount, c.status, o.status as orderStatus, o.orderNumber
                FROM commissions c
                LEFT JOIN orders o ON c.orderId = o.id
                WHERE c.marketerId = ?
                ORDER BY c.createdAt DESC
                LIMIT 50
            `, [marketerId], (err, detailResults) => {
                console.log('\n--- Commission Details (Last 50) ---');
                console.table(detailResults);
                connection.end();
            });
        });
    });
}

inspect();
