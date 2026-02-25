const db = require('../database.cjs');

/**
 * Ensures the site_visits table exists.
 */
const ensureVisitsTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS site_visits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sessionId VARCHAR(255),
            ip VARCHAR(45),
            userAgent TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    return new Promise((resolve, reject) => {
        db.run(sql, [], (err) => {
            if (err) {
                console.error("Error creating site_visits table:", err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

const recordVisit = async (req, res) => {
    try {
        await ensureVisitsTable();
        const { sessionId } = req.body;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const sql = "INSERT INTO site_visits (sessionId, ip, userAgent) VALUES (?, ?, ?)";
        db.run(sql, [sessionId, ip, userAgent], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ success: true, visitId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getVisitStats = async (req, res) => {
    try {
        await ensureVisitsTable();

        // Stats queries: unique sessionId per day, week, month
        const queries = {
            today: "SELECT COUNT(DISTINCT sessionId) as count FROM site_visits WHERE DATE(createdAt) = CURDATE()",
            yesterday: "SELECT COUNT(DISTINCT sessionId) as count FROM site_visits WHERE DATE(createdAt) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)",
            thisWeek: "SELECT COUNT(DISTINCT sessionId) as count FROM site_visits WHERE YEARWEEK(createdAt, 1) = YEARWEEK(CURDATE(), 1)",
            thisMonth: "SELECT COUNT(DISTINCT sessionId) as count FROM site_visits WHERE MONTH(createdAt) = MONTH(CURDATE()) AND YEAR(createdAt) = YEAR(CURDATE())",
            total: "SELECT COUNT(DISTINCT sessionId) as count FROM site_visits"
        };

        const results = {};
        const keys = Object.keys(queries);

        for (const key of keys) {
            results[key] = await new Promise((resolve, reject) => {
                db.get(queries[key], [], (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? row.count : 0);
                });
            });
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    recordVisit,
    getVisitStats
};
