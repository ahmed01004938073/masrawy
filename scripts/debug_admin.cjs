const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../server/database.sqlite');
console.log('Checking database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect:', err);
        return;
    }

    // Check specific admin user
    const sql = "SELECT id, name, email, password, role FROM employees WHERE email LIKE 'admin%'";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Query error:', err);
            return;
        }
        if (rows.length === 0) {
            console.log('No admin user found!');
        } else {
            rows.forEach(row => {
                console.log('--- User Found ---');
                console.log(`Email: '${row.email}'`);
                console.log(`Password: '${row.password}'`); // Quotes to see whitespace
                console.log(`Name: '${row.name}'`);
            });
        }
    });
});
