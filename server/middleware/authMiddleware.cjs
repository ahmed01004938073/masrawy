const db = require('../database.cjs');

// Middleware to verify session token
const verifyToken = (req, res, next) => {
    // 1. Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    const fs = require('fs');
    const log = (msg) => { try { fs.appendFileSync('server_auth_debug.log', `[${new Date().toISOString()}] [AUTH] ${msg}\n`); } catch (e) { console.error(e); } };

    if (!token) {
        log(`No token provided. Header: ${authHeader}`);
        console.log('[AUTH ERROR] No token provided in header:', authHeader);
        return res.status(401).json({ error: "Access denied. No token provided." });
    }



    // 2. Check token in sessions table
    const sessionSql = "SELECT * FROM sessions WHERE token = ?";

    db.get(sessionSql, [token], (err, session) => {
        if (err) return res.status(500).json({ error: "Database error during authentication." });
        if (!session) {
            log(`Session not found for token: ${token.substring(0, 10)}...`);
            console.log('[AUTH ERROR] Session not found for token:', token.substring(0, 10) + '...');
            return res.status(401).json({ error: "Invalid or expired session." });
        }



        // 3. Check expiry
        if (new Date(session.expiresAt) < new Date()) {
            log(`Session expired for UserID: ${session.userId}`);
            console.log('[AUTH ERROR] Session expired for user:', session.userId);
            db.run("DELETE FROM sessions WHERE token = ?", [token]);
            return res.status(401).json({ error: "Session expired." });
        }



        const userType = session.userType || 'employee';
        const table = userType === 'employee' ? 'employees' : 'marketers';

        console.log(`[AUTH DEBUG] UserID: ${session.userId}, UserType: ${userType}, Table: ${table}`);

        // 4. Get User Data
        const userSql = `SELECT * FROM ${table} WHERE id = ?`;
        db.get(userSql, [session.userId], (err, row) => {
            if (err || !row) {
                console.error(`[AUTH ERROR] User not found: ${session.userId} in ${table}`);
                return res.status(401).json({ error: "User not found." });
            }

            console.log(`[AUTH DEBUG] DB Status: ${row.isActive || row.status}`);

            // Check if employee is active
            if (userType === 'employee') {
                if (!row.isActive && row.isActive !== 1) {
                    console.log(`[AUTH DENIED] Employee ${session.userId} is INACTIVE`);
                    return res.status(403).json({ error: "الحساب غير نشط. يرجى التواصل مع الإدارة." });
                }
            } else if (userType === 'marketer') {
                if (row.status !== 'active') {
                    console.log(`[AUTH DENIED] Marketer ${session.userId} is INACTIVE (status: ${row.status})`);
                    return res.status(403).json({ error: "الحساب غير نشط. يرجى التواصل مع الإدارة." });
                }
            }

            // Handle permissions
            let permissions = [];
            let accessibleSections = [];

            if (userType === 'employee') {
                permissions = row.permissions ? JSON.parse(row.permissions) : [];
                accessibleSections = row.accessibleSections ? JSON.parse(row.accessibleSections) : [];
            } else {
                // Marketers don't have Admin permissions, but we can assign default role
                // row.role is likely undefined for marketers in DB schema, so we stick to session role or 'marketer'
            }

            req.user = {
                id: row.userId || row.id,
                role: session.role || row.role || (userType === 'marketer' ? 'marketer' : 'user'),
                userType: userType,
                permissions,
                accessibleSections,
                // Pass some useful info
                name: row.name,
                email: row.email
            };

            next();
        });
    });
};

// Middleware to require 'admin' role
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admin role required." });
    }
    next();
};

// Middleware to require specific permission (Section Access)
const requirePermission = (section) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: "Not authenticated." });
        }

        // Admin has full access
        if (user.role === 'admin') {
            return next();
        }

        // Check if user has access to this section

        // 1. Check permissions array (modern way)
        // permissions: [{ section: 'products', ... }]
        if (user.permissions && user.permissions.some(p => p.section === section)) {
            return next();
        }

        // 2. Check accessibleSections array (legacy/simple way)
        // accessibleSections: ['products', 'orders']
        if (user.accessibleSections && user.accessibleSections.includes(section)) {
            return next();
        }

        return res.status(403).json({ error: `Access denied. You do not have permission to access '${section}'.` });
    };
};

module.exports = {
    verifyToken,
    requireAdmin,
    requirePermission
};
