const db = require('./database.cjs');

db.get("SELECT value FROM kv WHERE `key` = 'site_settings'", [], (err, row) => {
    if (err) {
        console.error("Error reading site_settings:", err);
        process.exit(1);
    }
    if (!row) {
        console.log("No custom site_settings found. Using defaults.");
        console.log("Default Admin Password: ahmed3990");
        console.log("Default Archive Password: ahmed3990");
    } else {
        try {
            const settings = JSON.parse(row.value);
            console.log("Current Admin Master Password:", settings.adminMasterPassword || "ahmed3990 (default)");
            console.log("Current Archive Master Password:", settings.archiveMasterPassword || "ahmed3990 (default)");
        } catch (e) {
            console.error("Error parsing site_settings value:", e);
        }
    }
    db.close();
});
