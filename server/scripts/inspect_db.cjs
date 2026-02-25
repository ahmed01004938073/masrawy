const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
});

connection.connect();

const tables = ['categories', 'products', 'orders'];

function describeNext(index) {
    if (index >= tables.length) {
        connection.end();
        return;
    }
    const table = tables[index];
    connection.query(`DESCRIBE ${table}`, (err, results) => {
        console.log(`\n--- Table: ${table} ---`);
        if (err) {
            console.error(err);
        } else {
            console.table(results);
        }
        describeNext(index + 1);
    });
}

describeNext(0);
