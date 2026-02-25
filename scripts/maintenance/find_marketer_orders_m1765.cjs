
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
});

connection.connect();

const marketerId = 'm1765731743456';

connection.query('SELECT id, orderNumber, customerName, totalAmount, status, section, commission FROM orders WHERE marketer_id = ?', [marketerId], (err, results) => {
    if (err) {
        console.error(err);
    } else {
        console.table(results);
    }
    connection.end();
});
