const db = require('../../server/database.cjs');

console.log('=== Checking "للنساء" Category ===');
db.get("SELECT * FROM categories WHERE name = 'للنساء'", [], (err, cat) => {
    if (err) {
        console.error('Error:', err);
    } else if (cat) {
        console.log('Category found:');
        console.table([cat]);
        console.log('\nCategory ID:', cat.id, '(Type:', typeof cat.id, ')');
    } else {
        console.log('❌ Category "للنساء" NOT FOUND in database!');
    }
    process.exit(0);
});
