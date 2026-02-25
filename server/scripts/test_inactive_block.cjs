const db = require('./database.cjs');

// Test: Deactivate employee emp-2, then check if they can still access
console.log('🧪 Testing inactive employee blocking...\n');

// Step 1: Deactivate emp-2
db.run('UPDATE employees SET isActive = 0, active = 0 WHERE id = ?', ['emp-2'], function (err) {
    if (err) {
        console.error('❌ Error deactivating:', err.message);
        process.exit(1);
    }

    console.log('✅ Step 1: Deactivated emp-2');

    // Step 2: Check status
    db.get('SELECT id, name, isActive, active FROM employees WHERE id = ?', ['emp-2'], (err, row) => {
        if (err) {
            console.error('❌ Error:', err.message);
            process.exit(1);
        }

        console.log('📊 Step 2: Current status:');
        console.table([row]);

        console.log('\n✅ Test complete!');
        console.log('📝 Next: Try accessing the system as emp-2 (should be blocked)');
        console.log('💡 To reactivate: UPDATE employees SET isActive = 1, active = 1 WHERE id = "emp-2"');

        process.exit(0);
    });
});
