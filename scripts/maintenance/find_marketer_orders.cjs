
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
});

connection.connect();

connection.query('SELECT id, marketerId, marketer_id, customerName, totalAmount, status FROM orders WHERE marketerId IS NOT NULL OR marketer_id IS NOT NULL', (err, results) => {
    if (err) {
        console.error(err);
    } else {
        console.table(results);
    }
    connection.end();
});
