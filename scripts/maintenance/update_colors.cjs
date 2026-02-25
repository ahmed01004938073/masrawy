const mysql = require('mysql2/promise');

const mysqlConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'afleet_db'
};

async function updateSettings() {
    const conn = await mysql.createConnection(mysqlConfig);

    // 1. Get current settings
    const [rows] = await conn.query("SELECT value FROM kv_store WHERE `key` = 'site_settings'");
    if (rows.length > 0) {
        let settings = JSON.parse(rows[0].value);
        console.log("Old Primary Color:", settings.primaryColor);

        // 2. Update Colors to Green
        settings.primaryColor = '#16a34a';   // green-600
        settings.secondaryColor = '#166534'; // green-800
        settings.accentColor = '#f59e0b';    // amber-500

        // 3. Save back
        await conn.query("UPDATE kv_store SET value = ? WHERE `key` = 'site_settings'", [JSON.stringify(settings)]);
        console.log("✅ Updated Site Settings to GREEN colors.");
    } else {
        console.log("❌ No site_settings found to update.");
    }

    await conn.end();
}

updateSettings();
