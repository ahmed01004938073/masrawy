const db = require('./database.cjs');

db.all("SELECT * FROM employees", [], (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    const now = new Date();
    const employees = rows.map(emp => {
        let isOnline = false;
        let lastActive = null;

        if (emp.lastActive) {
            let lastActive;
            if (emp.lastActive instanceof Date) {
                lastActive = emp.lastActive;
            } else {
                const dateStr = emp.lastActive.endsWith('Z') ? emp.lastActive : emp.lastActive + 'Z';
                lastActive = new Date(dateStr);
            }
            const diffMs = now.getTime() - lastActive.getTime();
            isOnline = diffMs >= 0 && diffMs < 3 * 60 * 1000;
        }

        return {
            id: emp.id,
            name: emp.name,
            role: emp.role,
            isOnline: isOnline,
            firstLoginToday: emp.firstLoginToday,
            lastActive: emp.lastActive
        };
    });

    console.log(JSON.stringify(employees, null, 2));
    process.exit();
});
