const mysql = require('mysql2/promise');
const fs = require('fs');

async function debugIds() {
    const logFile = 'c:/Users/ahmed/Desktop/dashmkhzny23amzoon/afleet/afleet-85-main/server/id_debug.log';
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    fs.writeFileSync(logFile, '--- ID DEBUG START ---\n');

    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'afleet_db'
        });

        log('Connection successful.');

        const [marketers] = await connection.execute('SELECT id, name FROM marketers');
        log('Marketers count: ' + marketers.length);
        marketers.forEach(m => log(`- ID: [${m.id}] Name: [${m.name}]`));

        const [commissions] = await connection.execute('SELECT DISTINCT marketerId FROM commissions');
        log('Distinct MarketerIDs in commissions: ' + commissions.length);
        commissions.forEach(c => log(`- Commission ID: [${c.marketerId}]`));

        const [withdrawals] = await connection.execute('SELECT DISTINCT marketerId FROM withdrawals');
        log('Distinct MarketerIDs in withdrawals: ' + withdrawals.length);
        withdrawals.forEach(w => log(`- Withdrawal ID: [${w.marketerId}]`));

        // Check for m1... specifically
        const target = 'm1765731743456';
        log(`\nChecking specific target: [${target}]`);
        const [targetM] = await connection.execute('SELECT * FROM marketers WHERE id = ?', [target]);
        log('Found in marketers: ' + (targetM.length > 0 ? 'YES' : 'NO'));

        const [targetC] = await connection.execute('SELECT COUNT(*) as count FROM commissions WHERE marketerId = ?', [target]);
        log('Found in commissions (count): ' + targetC[0].count);

        // Check for nulls/strings 'null'
        const [nullC] = await connection.execute("SELECT COUNT(*) as count FROM commissions WHERE marketerId IS NULL OR marketerId = 'null'");
        log('NULL/string-null commissions count: ' + nullC[0].count);

        await connection.end();
        log('--- ID DEBUG END ---');

    } catch (error) {
        log('ERROR: ' + error.message);
    }
}

debugIds();
