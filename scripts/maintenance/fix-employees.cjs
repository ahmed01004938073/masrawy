const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Updating employees data...\n');

const correctEmployees = [
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
    },
    {
        id: "emp-2",
        name: "محمد علي",
        email: "sales@afleet.com",
        password: "sales123",
        phone: "01112345678",
        role: "sales",
        accessibleSections: ["dashboard", "orders", "products", "marketers"],
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        id: "emp-3",
        name: "سارة أحمد",
        email: "warehouse@afleet.com",
        password: "warehouse123",
        phone: "01212345678",
        role: "warehouse",
        accessibleSections: ["dashboard", "warehouse", "products"],
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        id: "emp-4",
        name: "خالد محمود",
        email: "shipping@afleet.com",
        password: "shipping123",
        phone: "01312345678",
        role: "shipping",
        accessibleSections: ["dashboard", "shipping", "orders"],
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        id: "emp-5",
        name: "فاطمة علي",
        email: "delivery@afleet.com",
        password: "delivery123",
        phone: "01412345678",
        role: "delivery",
        accessibleSections: ["dashboard", "shipping"],
        isActive: true,
        createdAt: new Date().toISOString()
    }
];

db.run("UPDATE kv_store SET value = ? WHERE key = 'employees'", [JSON.stringify(correctEmployees)], (err) => {
    if (err) {
        console.error('❌ Error updating:', err);
    } else {
        console.log('✅ Employees updated successfully!\n');
        console.log('📊 Updated employees:');
        correctEmployees.forEach(emp => {
            console.log(`- ${emp.name} (${emp.email}) - Password: ${emp.password}`);
        });
    }
    db.close();
});
