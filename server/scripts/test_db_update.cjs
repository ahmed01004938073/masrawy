
const db = require('./database.cjs');

async function testUpdate() {
    try {
        // Find a marketer
        const m = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM marketers LIMIT 1", [], (err, row) => err ? reject(err) : resolve(row));
        });

        if (!m) {
            console.log("No marketer found to test.");
            return;
        }

        console.log(`Testing with marketer: ${m.name} (ID: ${m.id})`);
        console.log(`Current pages: ${m.pages}`);

        const newPages = ["Test Page " + Date.now()];
        const now = new Date().toISOString();

        // Simulate updateProfile logic
        const sql = "UPDATE marketers SET pages = ?, updatedAt = ? WHERE id = ?";
        await new Promise((resolve, reject) => {
            db.run(sql, [JSON.stringify(newPages), now, m.id], function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        console.log("Update executed successfully.");

        const updatedM = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM marketers WHERE id = ?", [m.id], (err, row) => err ? reject(err) : resolve(row));
        });

        console.log(`Updated pages: ${updatedM.pages}`);
        if (updatedM.pages.includes(newPages[0])) {
            console.log("✅ SUCCESS: Database updated correctly.");
        } else {
            console.log("❌ FAILURE: Database did not update correctly.");
        }

    } catch (err) {
        console.error("❌ Test error:", err.message);
    } finally {
        process.exit();
    }
}

testUpdate();
