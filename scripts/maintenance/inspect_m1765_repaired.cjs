
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
            connection.end();
        });
    });
}

inspect();
