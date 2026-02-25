const db = require('../database.cjs');

const getFavorites = (req, res) => {
    const sql = "SELECT productId FROM favorites WHERE userId = ?";
    db.all(sql, [req.params.userId], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows.map(r => r.productId));
    });
};

const toggleFavorite = (req, res) => {
    const { userId, productId } = req.body;
    db.get("SELECT * FROM favorites WHERE userId = ? AND productId = ?", [userId, productId], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });

        if (row) {
            db.run("DELETE FROM favorites WHERE userId = ? AND productId = ?", [userId, productId], (err) => {
                if (err) return res.status(400).json({ error: err.message });
                res.json({ message: "Removed from favorites", status: "removed" });
            });
        } else {
            db.run("INSERT INTO favorites (userId, productId, createdAt) VALUES (?, ?, ?)", [userId, productId, new Date().toISOString()], (err) => {
                if (err) return res.status(400).json({ error: err.message });
                res.json({ message: "Added to favorites", status: "added" });
            });
        }
    });
};

const syncFavorites = (req, res) => {
    const { userId, productIds } = req.body;
    if (!userId || !Array.isArray(productIds)) return res.status(400).json({ error: "Invalid data" });

    // 1. Clear existing favorites
    db.run("DELETE FROM favorites WHERE userId = ?", [userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        if (productIds.length === 0) {
            return res.json({ message: "Favorites cleared" });
        }

        // 2. Insert new favorites
        let completed = 0;
        let hasError = false;
        const now = new Date().toISOString();

        productIds.forEach(id => {
            db.run("INSERT INTO favorites (userId, productId, createdAt) VALUES (?, ?, ?)", [userId, id.toString(), now], (err) => {
                if (hasError) return;
                if (err) {
                    hasError = true;
                    return res.status(500).json({ error: err.message });
                }
                completed++;
                if (completed === productIds.length) {
                    res.json({ message: "Favorites synced" });
                }
            });
        });
    });
};

module.exports = {
    getFavorites,
    toggleFavorite,
    syncFavorites
};
