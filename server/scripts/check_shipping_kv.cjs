const db = require('./database.cjs');

async function checkKV() {
    const keys = ['available_governorates', 'cities_by_governorate'];
    for (const key of keys) {
        db.get("SELECT value FROM kv_store WHERE `key` = ?", [key], (err, row) => {
            if (err) {
                console.error(`Error fetching ${key}:`, err);
                return;
            }
            console.log(`--- ${key} ---`);
            if (row) {
                try {
                    const parsed = JSON.parse(row.value);
                    console.log(JSON.stringify(parsed, null, 2));
                } catch (e) {
                    console.log("Raw value:", row.value);
                }
            } else {
                console.log("Not found in database.");
            }
        });
    }
}

checkKV();
setTimeout(() => process.exit(0), 2000);
