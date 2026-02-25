const path = require('path');
const fs = require('fs');

console.log('Current CWD:', process.cwd());
console.log('Controller __dirname (simulated):', path.join(process.cwd(), 'server', 'controllers'));
const logPath = path.join(process.cwd(), 'server', 'controllers', '../../server.log');
console.log('Resolved Log Path:', logPath);

try {
    fs.appendFileSync(logPath, 'TEST LOG ENTRY\n');
    console.log('Successfully wrote to log file.');
} catch (e) {
    console.error('Failed to write log:', e);
}
