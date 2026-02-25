const db = require('../../server/database.cjs');

db.get("SELECT value FROM kv_store WHERE key = 'site_settings'", (err, row) => {
    if (err) { console.error(err); }
    else if (row) {
        const s = JSON.parse(row.value);
        console.log("displayName:", s.displayName);
        console.log("storeNameImage length:", s.storeNameImage ? s.storeNameImage.length : 0);
        console.log("loginPageImage length:", s.loginPageImage ? s.loginPageImage.length : 0);
        console.log("logo length:", s.logo ? s.logo.length : 0);
    } else {
        console.log("No settings found.");
    }
});
