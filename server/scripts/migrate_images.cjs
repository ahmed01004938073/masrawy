const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
});

connection.connect();

const queries = [
    "ALTER TABLE categories MODIFY COLUMN image LONGTEXT",
    "ALTER TABLE products MODIFY COLUMN image_url LONGTEXT",
    "ALTER TABLE kv_store MODIFY COLUMN value LONGTEXT"
];

const runQueries = async () => {
    for (const sql of queries) {
        try {
            await new Promise((resolve, reject) => {
                connection.query(sql, (err) => {
                    if (err) {
                        console.error(`❌ Error executing: ${sql}\n`, err.message);
                        // Don't reject, just continue to next
                        resolve();
                    } else {
                        console.log(`✅ Executed: ${sql}`);
                        resolve();
                    }
                });
            });
        } catch (e) {
            console.error(e);
        }
    }
    console.log("🏁 Migration finished.");
    connection.end();
};

runQueries();
