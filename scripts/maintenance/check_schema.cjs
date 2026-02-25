
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
});

connection.connect();

const tables = ['commissions', 'withdrawals'];

function describe(index) {
    if (index >= tables.length) {
        connection.end();
        return;
    }
    const table = tables[index];
    connection.query(`DESC ${table}`, (err, results) => {
        console.log(`\n--- Schema: ${table} ---`);
        console.table(results);

        connection.query(`SELECT * FROM ${table} LIMIT 5`, (err, rows) => {
            console.log(`\n--- Sample Rows: ${table} ---`);
            console.table(rows);
            describe(index + 1);
        });
    });
}

describe(0);
