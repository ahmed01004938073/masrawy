const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking database...\n');

db.get("SELECT value FROM kv_store WHERE key = 'employees'", (err, row) => {
    if (err) {
        console.error('❌ Error:', err);
        db.close();
        return;
    }

    if (!row) {
        console.log('❌ No employees found in database!');
        console.log('📝 Inserting default employees...');

        const defaultEmployees = [
            {
                id: "emp-1",
                name: "أحمد محمد",
                email: "admin@afleet.com",
                password: "admin123",
                phone: "01012345678",
                role: "admin",
                accessibleSections: ["dashboard", "orders", "products", "marketers", "shipping", "warehouse", "reports", "settings", "employees"],
                isActive: true,
                createdAt: new Date().toISOString()
            }
        ];

        db.run("INSERT INTO kv_store (key, value) VALUES ('employees', ?)", [JSON.stringify(defaultEmployees)], (err) => {
            if (err) {
                console.error('❌ Error inserting:', err);
            } else {
                console.log('✅ Default employees inserted successfully!');
            }
            db.close();
        });
    } else {
        console.log('✅ Employees found in database!');
        const employees = JSON.parse(row.value);
        console.log(`📊 Total employees: ${employees.length}\n`);
        employees.forEach(emp => {
            console.log(`- ${emp.name} (${emp.email}) - Role: ${emp.role}`);
        });
        db.close();
    }
});
