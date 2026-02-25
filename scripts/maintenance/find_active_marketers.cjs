
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
});

connection.connect();

connection.query('SELECT DISTINCT marketerId FROM commissions WHERE marketerId IS NOT NULL', (err, cResults) => {
    console.log('--- Unique Marketer IDs in Commissions ---');
    console.table(cResults);

    connection.query('SELECT DISTINCT marketerId FROM withdrawals WHERE marketerId IS NOT NULL', (err, wResults) => {
        console.log('--- Unique Marketer IDs in Withdrawals ---');
        console.table(wResults);
        connection.end();
    });
});
