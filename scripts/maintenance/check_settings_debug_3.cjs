const db = require('../../server/database.cjs');

db.get("SELECT value FROM kv_store WHERE key = 'site_settings'", (err, row) => {
    if (err) { console.error(err); }
    else if (row) {
        const s = JSON.parse(row.value);
        console.log("displayName:", s.displayName);
        if (s.loginPageImage) {
            console.log("loginPageImage start:", s.loginPageImage.substring(0, 50));
        } else {
            console.log("loginPageImage is missing/empty");
        }
    }
});
