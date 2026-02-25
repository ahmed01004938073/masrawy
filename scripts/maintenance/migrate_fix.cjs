const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('Connected to database.');
});

db.serialize(() => {
    const columnName = 'driveLink';
    const tableName = 'products';

    console.log(`Checking if column '${columnName}' exists in '${tableName}'...`);

    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
        if (err) {
            console.error('Error getting table info:', err.message);
            return;
        }

        const columns = rows.map(r => r.name);
        if (columns.includes(columnName)) {
            console.log(`Column '${columnName}' already exists.`);
        } else {
            console.log(`Column '${columnName}' is missing. Adding it now...`);
            db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} TEXT`, (err) => {
                if (err) {
                    console.error('Migration failed:', err.message);
                } else {
                    console.log(`✅ Success: Column '${columnName}' added to '${tableName}'.`);
                }
            });
        }
    });
});

// Close database after a short delay to ensure operations complete
setTimeout(() => {
    db.close((err) => {
        if (err) console.error(err.message);
        else console.log('Database connection closed.');
    });
}, 1000);
