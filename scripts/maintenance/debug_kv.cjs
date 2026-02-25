const mysql = require('mysql2/promise');

const mysqlConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
};

async function checkKV() {
    const conn = await mysql.createConnection(mysqlConfig);
    const [rows] = await conn.query("SELECT `key` FROM kv_store");
    console.log("KV Store Keys:", rows.map(r => r.key));

    const [catRow] = await conn.query("SELECT value FROM kv_store WHERE `key` = 'categories'");
    if (catRow.length > 0) {
        console.log("Length of categories value:", catRow[0].value.length);
        console.log("First 100 chars:", catRow[0].value.substring(0, 100));
    } else {
        console.log("❌ 'categories' key NOT FOUND in kv_store");
    }
    await conn.end();
}

checkKV();
