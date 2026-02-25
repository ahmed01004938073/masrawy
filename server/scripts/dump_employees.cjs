const mysql = require('mysql2/promise');

async function dump() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'afleet_db'
    });

    const [employees] = await connection.query('DESCRIBE employees');
    console.log("TABLE: employees");
    console.table(employees);

    const [create] = await connection.query('SHOW CREATE TABLE employees');
    console.log(create[0]['Create Table']);

    await connection.end();
}

dump().catch(console.error);
