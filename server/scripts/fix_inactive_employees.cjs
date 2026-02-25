const db = require('./database.cjs');

db.all('SELECT id, name, email, role, isActive, active, lastActive FROM employees', [], (err, rows) => {
    if (err) {
        console.error('❌ Error:', err.message);
    } else {
        console.log('\n📊 EMPLOYEES TABLE:');
        console.table(rows);

        const inactive = rows.filter(r => r.isActive === 0 || r.active === 0);
        console.log(`\n⚠️  Inactive employees: ${inactive.length}/${rows.length}`);

        if (inactive.length > 0) {
            console.log('\n🔧 Fixing inactive employees...');
            const fix = db.prepare('UPDATE employees SET isActive = 1, active = 1 WHERE id = ?');
            inactive.forEach(emp => {
                fix.run(emp.id);
                console.log(`✅ Activated: ${emp.name} (${emp.id})`);
            });
            fix.finalize();
            console.log('\n✅ All employees activated!');
        }
    }
    process.exit();
});
