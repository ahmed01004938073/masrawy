const db = require('../../server/database.cjs');

console.log("Checking site_settings in kv_store...");
db.get("SELECT value FROM kv_store WHERE key = 'site_settings'", (err, row) => {
    if (err) {
        console.error("Error:", err);
    } else {
        if (row) {
            console.log("Settings found:");
            console.log(JSON.stringify(JSON.parse(row.value), null, 2));
        } else {
            console.log("No custom settings found in database (key 'site_settings' exists but is empty/null, or row missing).");
        }
    }
});
