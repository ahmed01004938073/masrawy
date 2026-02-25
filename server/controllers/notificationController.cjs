const db = require('../database.cjs');

const getNotifications = async (req, res) => {
    const userId = req.user.id;
    const sql = "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50";

    try {
        const rows = await db.allAsync(sql, [userId]);
        res.json(rows.map(row => ({
            ...row,
            read: row.read === 1 || row.read === true
        })));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const markAsRead = async (req, res) => {
    const id = req.params.id;
    const sql = "UPDATE notifications SET `read` = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?";

    try {
        await db.runAsync(sql, [id]);
        res.json({ message: "Notification marked as read" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const deleteNotification = async (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM notifications WHERE id = ?";

    try {
        await db.runAsync(sql, [id]);
        res.json({ message: "Notification deleted" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const clearAll = async (req, res) => {
    const userId = req.user.id;
    const sql = "DELETE FROM notifications WHERE user_id = ?";

    try {
        await db.runAsync(sql, [userId]);
        res.json({ message: "All notifications cleared" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    deleteNotification,
    clearAll
};
