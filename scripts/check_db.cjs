const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../server/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
        return;
    }
    console.log('Connected to database');

    db.all("SELECT id, name, email, role, isActive FROM employees", [], (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Employees found:', rows.length);
        console.log(JSON.stringify(rows, null, 2));
    });
});
