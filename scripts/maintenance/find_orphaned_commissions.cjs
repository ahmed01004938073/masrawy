
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
});

connection.connect();

const marketerId = 'm1765731743456';

connection.query(`
    SELECT c.id, c.marketerId as commissionMarketerId, o.marketer_id as orderMarketerId, c.orderId, c.amount, c.status as commissionStatus, o.status as orderStatus
    FROM commissions c
    JOIN orders o ON c.orderId = o.id
    WHERE o.marketer_id = ?
`, [marketerId], (err, results) => {
    if (err) {
        console.error(err);
    } else {
        console.table(results);
    }
    connection.end();
});
