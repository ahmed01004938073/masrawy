const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Fixing Test Order...");

// Search for the test order by orderNumber (randomly made, but likely the only one without a section or customer name Test Client)
// In previous step, the order number was logged: #290188
// But I can search by customerName = 'Test Client'

db.serialize(() => {
    db.all("SELECT * FROM orders WHERE customerName = 'Test Client'", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        if (rows.length === 0) {
            console.log("No Test Client order found.");
            return;
        }

        const order = rows[0];
        console.log(`Found Test Order: #${order.orderNumber}, Status: ${order.status}, Section: ${order.section}`);

        // Update section to 'archive' because it is delivered
        // Or if user wants to see it in 'orders' (New), I should change status to 'pending' and section to 'orders'.
        // But the goal was to test REPORTS which need DELIVERED.
        // So I will keep it 'delivered' and set section to 'archive'.
        // This means the user should look in "Archive" or "Reports".
        // The user complained "Not appearing in Orders dashboard".

        const newSection = 'archive'; // Delivered orders belong in archive usually

        db.run("UPDATE orders SET section = ? WHERE id = ?", [newSection, order.id], (err) => {
            if (err) console.error("Update failed:", err);
            else console.log(`✅ Updated Order #${order.orderNumber} section to '${newSection}'. It should now appear in the Archive page.`);
        });
    });
});
