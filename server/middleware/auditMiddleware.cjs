const db = require('../database.cjs');

/**
 * Logs an action to the audit_logs table.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} userType - 'employee', 'marketer', or 'admin'.
 * @param {string} action - Short description of the action (e.g., 'LOGIN', 'UPDATE_ORDER').
 * @param {object} details - Additional details in JSON format.
 * @param {string} ip - IP address of the user.
 */
const logAction = (userId, userType, action, details, ip) => {
    try {
        const sql = `INSERT INTO audit_logs (userId, userType, action, details, ip) VALUES (?, ?, ?, ?, ?)`;
        const detailsJson = JSON.stringify(details || {});

        db.run(sql, [userId, userType, action, detailsJson, ip], (err) => {
            if (err) {
                console.error("Failed to write audit log:", err);
            }
        });
    } catch (e) {
        console.error("Error logging action:", e);
    }
};

/**
 * Middleware to automatically log requests if attached to a route.
 * Use carefully as it might log too much. Better to use logAction explicitly in controllers.
 */
const auditMiddleware = (actionName) => {
    return (req, res, next) => {
        // We can hook into res.on('finish') to log after success, 
        // but for simplicity we log that an attempt was made, or we just rely on explicit controller calls.
        // This middleware is just a placeholder if we want auto-logging later.
        next();
    };
};

module.exports = { logAction, auditMiddleware };
