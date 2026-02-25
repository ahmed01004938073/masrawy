
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
});

connection.connect();

connection.query('SELECT id, name, email, pendingCommission, totalCommission FROM marketers', (err, results) => {
    if (err) {
        console.error(err);
    } else {
        console.table(results);
    }
    connection.end();
});
