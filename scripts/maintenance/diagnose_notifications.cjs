
const db = require('../../server/database.cjs');

async function testNotifications() {
    console.log("Starting Notification Diagnostic Test...");

    const userId = "test_user_" + Date.now();
    const testNotif = {
        id: "test_id_" + Date.now(),
        userId: userId,
        title: "Test Notification",
        message: "This is a diagnostic test message",
        type: "success",
        timestamp: new Date().toISOString(),
        read: false
    };

    const key = `notifications_${userId}`;
    const value = [testNotif];

    console.log(`Step 1: Saving notification for key: ${key}`);

    try {
        await new Promise((resolve, reject) => {
            db.run("REPLACE INTO kv_store (\`key\`, value) VALUES (?, ?)", [key, JSON.stringify(value)], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log("✅ Notification saved successfully.");

        console.log(`Step 2: Retrieving notification for key: ${key}`);
        const row = await new Promise((resolve, reject) => {
            db.get("SELECT value FROM kv_store WHERE \`key\` = ?", [key], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (row) {
            console.log("✅ Notification retrieved successfully.");
            console.log("Retrieved Data:", row.value);
            const parsed = JSON.parse(row.value);
            if (parsed[0].title === testNotif.title) {
                console.log("✅ Data integrity check passed.");
            } else {
                console.error("❌ Data integrity check failed.");
            }
        } else {
            console.error("❌ Notification not found in database.");
        }

        // Cleanup
        console.log("Step 3: Cleaning up test data...");
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM kv_store WHERE \`key\` = ?", [key], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log("✅ Cleanup complete.");

    } catch (error) {
        console.error("❌ Test failed with error:", error);
    }

    process.exit(0);
}

testNotifications();
