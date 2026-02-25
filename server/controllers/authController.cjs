const db = require('../database.cjs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const login = (req, res) => {
    const { identifier, password } = req.body;
    handleLogin(res, 'employee', identifier, password);
};

const marketerLogin = (req, res) => {
    const { email, password } = req.body;
    handleLogin(res, 'marketer', email, password);
};

const handleLogin = async (res, userType, identifier, password) => {
    const table = userType === 'employee' ? 'employees' : 'marketers';
    const idField = userType === 'employee' ? 'email = ? OR name = ?' : 'email = ?';
    const params = userType === 'employee' ? [identifier, identifier] : [identifier];

    const sql = `SELECT * FROM ${table} WHERE ${idField}`;

    try {
        const row = await db.getAsync(sql, params);

        if (!row) {
            return res.status(401).json({ error: "بيانات غير صحيحة" });
        }

        // Check active status
        const isActive = userType === 'employee' ? (row.isActive === 1) : (row.status === 'active');
        if (!isActive) {
            return res.status(403).json({ error: "الحساب غير نشط" });
        }

        let passwordIsValid = false;
        let needsRehash = false;

        if (row.password && row.password.startsWith('$2')) {
            passwordIsValid = await bcrypt.compare(password, row.password);
        } else {
            if (row.password === password) {
                passwordIsValid = true;
                needsRehash = true;
            }
        }

        if (!passwordIsValid) {
            return res.status(401).json({ error: "بيانات غير صحيحة" });
        }

        // Upgrade hash if needed
        if (needsRehash) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await db.runAsync(`UPDATE ${table} SET password = ? WHERE id = ?`, [hashedPassword, row.id]);
        }

        // Generate Session
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        // Store userType in session
        const insertSessionSql = "INSERT INTO sessions (token, userId, userType, role, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?)";
        const role = row.role || (userType === 'marketer' ? 'marketer' : 'user');

        await db.runAsync(insertSessionSql, [token, row.id, userType, role, new Date().toISOString(), expiresAt]);

        // Update attendance (firstLoginToday) and lastLogin
        if (userType === 'employee') {
            const now = new Date();
            // Use local date for comparison (YYYY-MM-DD)
            const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

            let lastFirstLogin = null;
            if (row.firstLoginToday) {
                const d = row.firstLoginToday instanceof Date ? row.firstLoginToday : new Date(row.firstLoginToday);
                lastFirstLogin = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            }

            console.log(`[AUTH ATTENDANCE] User: ${row.id}, Today: ${today}, Last: ${lastFirstLogin}`);

            if (today !== lastFirstLogin) {
                console.log(`📌 Attendance: Recording first login of the day for ${row.id}`);
                await db.runAsync("UPDATE employees SET lastLogin = NOW(), firstLoginToday = NOW() WHERE id = ?", [row.id]);
            } else {
                console.log(`ℹ️ Attendance already recorded for today for ${row.id}`);
                await db.runAsync("UPDATE employees SET lastLogin = NOW() WHERE id = ?", [row.id]);
            }
        }

        // Prepare Response User Object
        let userObj = { ...row };

        // Parse JSON fields safely
        if (userObj.accessibleSections && typeof userObj.accessibleSections === 'string') {
            try { userObj.accessibleSections = JSON.parse(userObj.accessibleSections); } catch (e) { userObj.accessibleSections = []; }
        }
        if (userObj.permissions && typeof userObj.permissions === 'string') {
            try { userObj.permissions = JSON.parse(userObj.permissions); } catch (e) { userObj.permissions = undefined; }
        }
        if (userObj.pages && typeof userObj.pages === 'string') {
            try { userObj.pages = JSON.parse(userObj.pages); } catch (e) { userObj.pages = []; }
        }

        delete userObj.password;

        // Standardize generic fields
        userObj.userType = userType;

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify({ user: userObj, token }));

    } catch (error) {
        console.error('Login Process Error:', error);
        res.status(500).json({ error: "حدث خطأ أثناء تسجيل الدخول" });
    }
};

const validateSession = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ error: "No token" });

    try {
        // First get the session to know the userType
        const session = await db.getAsync("SELECT * FROM sessions WHERE token = ?", [token]);
        if (!session) return res.status(401).json({ error: "Invalid session" });

        if (new Date(session.expiresAt) < new Date()) {
            await db.runAsync("DELETE FROM sessions WHERE token = ?", [token]);
            return res.status(401).json({ error: "Session expired" });
        }

        const userType = session.userType || 'employee'; // Default to employee for backward compatibility
        const table = userType === 'employee' ? 'employees' : 'marketers';

        const sql = `SELECT * FROM ${table} WHERE id = ?`;
        const userRow = await db.getAsync(sql, [session.userId]);

        if (!userRow) {
            return res.status(401).json({ error: "User not found" });
        }

        const user = { ...userRow };

        // Parse JSONs
        if (user.accessibleSections && typeof user.accessibleSections === 'string') {
            try { user.accessibleSections = JSON.parse(user.accessibleSections); } catch (e) { user.accessibleSections = []; }
        }
        if (user.permissions && typeof user.permissions === 'string') {
            try { user.permissions = JSON.parse(user.permissions); } catch (e) { user.permissions = undefined; }
        }
        if (user.pages && typeof user.pages === 'string') {
            try { user.pages = JSON.parse(user.pages); } catch (e) { user.pages = []; }
        }

        delete user.password;
        user.userType = userType;
        user.role = session.role; // Helper from session

        res.json({ user });
    } catch (err) {
        console.error('Session Validation Error:', err);
        res.status(401).json({ error: "Invalid or expired session" });
    }
};

const logout = async (req, res) => {
    const { token } = req.body;
    try {
        await db.runAsync("DELETE FROM sessions WHERE token = ?", [token]);
        res.json({ message: "Logged out" });
    } catch (err) {
        res.status(200).json({ message: "Logged out" });
    }
};

const forgotPasswordVerify = async (req, res) => {
    const { email, phone, userType = 'marketer' } = req.body;

    try {
        if (userType === 'employee') {
            if (!email) return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
            const sql = "SELECT id, email FROM employees WHERE email = ? AND isActive = 1";
            const row = await db.getAsync(sql, [email]);
            if (!row) return res.status(404).json({ error: "لا يوجد حساب موظف نشط بهذا البريد" });
            res.json({ success: true, message: "تم التحقق من البيانات" });
        } else {
            if (!email || !phone) return res.status(400).json({ error: "البريد الإلكتروني ورقم الهاتف مطلوبان" });
            const sql = "SELECT id, email, phone FROM marketers WHERE email = ? AND phone = ? AND status = 'active'";
            const row = await db.getAsync(sql, [email, phone]);
            if (!row) return res.status(404).json({ error: "لا يوجد حساب مندوب نشط بهذه البيانات" });
            res.json({ success: true, message: "تم التحقق من البيانات" });
        }
    } catch (err) {
        res.status(500).json({ error: "خطأ في قاعدة البيانات" });
    }
};

const resetPassword = async (req, res) => {
    const { email, phone, newPassword, userType = 'marketer' } = req.body;

    if (userType === 'employee') {
        if (!email || !newPassword) return res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور الجديدة مطلوبان" });
    } else {
        if (!email || !phone || !newPassword) return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        let sql, params;

        if (userType === 'employee') {
            sql = "UPDATE employees SET password = ? WHERE email = ? AND isActive = 1";
            params = [hashedPassword, email];
        } else {
            sql = "UPDATE marketers SET password = ? WHERE email = ? AND phone = ? AND status = 'active'";
            params = [hashedPassword, email, phone];
        }

        const result = await db.runAsync(sql, params);
        if (result.changes === 0) return res.status(404).json({ error: "لم يتم العثور على الحساب لتحديثه" });

        res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: "حدث خطأ أثناء تشفير كلمة المرور" });
    }
};

module.exports = {
    login,
    marketerLogin,
    validateSession,
    logout,
    forgotPasswordVerify,
    resetPassword
};
