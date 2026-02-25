const db = require('../database.cjs');

/**
 * Sends a notification to a specific user.
 */
async function sendBackendNotification(userId, title, message, type = 'info', link = null, connection = null) {
    const dbInstance = connection || db;
    const notifId = `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    // Support both SQL 'notifications' table (id (UUID/String), user_id, title, message, type, link, read, created_at, updated_at)
    const sql = "INSERT INTO notifications (id, user_id, title, message, type, link, `read`, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const params = [notifId, userId, title, message, type, link, 0, now, now];

    try {
        if (connection && typeof connection.execute === 'function') {
            await connection.execute(sql, params);
        } else {
            await dbInstance.runAsync(sql, params);
        }
        console.log(`✅ Backend Notification: Sent to ${userId} - ${title}`);
    } catch (e) {
        console.error("❌ Failed to send backend notification:", e.message);
    }
}

/**
 * Broadcasts a notification to all marketers.
 */
async function broadcastBackendNotification(title, message, type = 'info', link = null, connection = null) {
    const dbInstance = connection || db;
    try {
        // Find all marketers
        const marketersSql = "SELECT id FROM users WHERE role = 'marketer' AND is_active = 1";
        let marketers = [];

        if (connection && typeof connection.execute === 'function') {
            const [rows] = await connection.execute(marketersSql);
            marketers = rows;
        } else {
            marketers = await dbInstance.allAsync(marketersSql);
        }

        for (const marketer of marketers) {
            await sendBackendNotification(marketer.id, title, message, type, link, connection);
        }
        console.log(`📢 Backend Broadcast: "${title}" sent to ${marketers.length} marketers`);
    } catch (e) {
        console.error("❌ Failed to broadcast backend notification:", e.message);
    }
}

module.exports = {
    sendBackendNotification,
    broadcastBackendNotification
};
