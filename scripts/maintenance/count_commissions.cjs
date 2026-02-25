
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
});

connection.connect();

connection.query('SELECT status, COUNT(*) as count, SUM(amount) as total FROM commissions GROUP BY status', (err, results) => {
    if (err) {
        console.error(err);
    } else {
        console.table(results);
    }
    connection.end();
});
