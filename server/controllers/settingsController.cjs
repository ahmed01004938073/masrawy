const db = require('../database.cjs');

const getSetting = (req, res) => {
    const key = req.params.key;

    // Special case for categories: always fetch from the categories table to ensure sync
    if (key === 'categories') {
        const sql = "SELECT * FROM categories ORDER BY `order` ASC";
        db.all(sql, [], (err, rows) => {
            if (err) return res.status(400).json({ error: err.message });
            // Map table columns to the format the frontend expects if necessary
            const categories = rows.map(row => ({
                ...row,
                id: Number(row.id), // Ensure ID is a number
                imageUrl: row.image || row.imageUrl || null, // Map image to imageUrl
                active: row.active === 1 || row.active === true,
                status: (row.active === 1 || row.active === 'active') ? 'active' : 'inactive'
            }));
            res.json(categories);
        });
        return;
    }

    const sql = "SELECT value FROM kv_store WHERE `key` = ?";
    db.get(sql, [key], (err, row) => {
        if (err) {
            console.error(`[GET SETTING ERROR] Key=${key}:`, err.message);
            return res.status(400).json({ error: "Database error", details: err.message });
        }

        if (!row) return res.json(null);

        try {
            res.json(JSON.parse(row.value));
        } catch (parseErr) {
            console.error(`[GET SETTING PARSE ERROR] Key=${key}:`, parseErr.message, "Value:", row.value);
            res.status(400).json({ error: "Invalid JSON format in database", key });
        }
    });
};

const saveSetting = (req, res) => {
    const { key, value } = req.body;
    const fs = require('fs');
    const log = (msg) => { try { fs.appendFileSync('server_debug.log', `[${new Date().toISOString()}] [saveSetting] ${msg}\n`); } catch (e) { console.error(e); } };
    log(`HIT Key=${key}`);

    const user = req.user;

    // RBAC: Only admin can save global settings. 
    // Marketers can only save their own notifications.
    if (user && user.role !== 'admin') {
        const isNotificationKey = key && key.startsWith('notifications_');
        const isOwnNotification = key === `notifications_${user.id}`;

        if (!isNotificationKey || !isOwnNotification) {
            return res.status(403).json({ error: "Access denied. You can only manage your own notifications." });
        }
    }

    const sql = "INSERT INTO kv_store (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)";
    // MySQL uses ON DUPLICATE KEY UPDATE instead of OR REPLACE (SQLite)
    // Actually, let's use REPLACE INTO which works in both but is specific.
    // Or stick to standard INSERT ... ON DUPLICATE

    // SQLite: INSERT OR REPLACE INTO ...
    // MySQL: INSERT ... ON DUPLICATE KEY UPDATE ... 
    // OR: REPLACE INTO ... (MySQL supports REPLACE INTO)

    const replaceSql = "REPLACE INTO kv_store (`key`, value) VALUES (?, ?)";

    db.run(replaceSql, [key, JSON.stringify(value)], function (err) {
        if (err) {
            const fs = require('fs');
            try { fs.appendFileSync('server_debug.log', `[${new Date().toISOString()}] [saveSetting] ERROR: ${err.message}\n`); } catch (e) { }
            return res.status(400).json({ error: err.message });
        }

        // Special case: if saving categories, sync to the categories table too
        if (key === 'categories' && Array.isArray(value)) {
            console.log('Syncing saved categories to SQL table...');
            value.forEach(cat => {
                const sqlTable = `REPLACE INTO categories (id, name, \`order\`, active, image, description, showInHomepage) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
                db.run(sqlTable, [
                    cat.id,
                    cat.name,
                    cat.order || 0,
                    (cat.active === true || cat.status === 'active' || cat.status === 'نشط') ? 1 : 0,
                    cat.imageUrl || cat.image || null,
                    cat.description || null,
                    cat.showInHomepage ? 1 : 0
                ]);
            });
        }

        // Special case: if saving manufacturers, sync to the manufacturers table
        if (key === 'manufacturers' && Array.isArray(value)) {
            console.log('Syncing saved manufacturers to SQL table...');
            value.forEach(m => {
                const sqlTable = `REPLACE INTO manufacturers (id, name, address, phone, createdAt) 
                                 VALUES (?, ?, ?, ?, ?)`;
                db.run(sqlTable, [
                    m.id,
                    m.name,
                    m.address || null,
                    m.phone || null,
                    m.createdAt || new Date().toISOString()
                ]);
            });
        }

        res.json({ message: "Saved" });
    });
};

module.exports = {
    getSetting,
    saveSetting,
    getAuditLogs: (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const countSql = "SELECT COUNT(*) as total FROM audit_logs";
        const dataSql = "SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT ? OFFSET ?";

        db.get(countSql, [], (err, countRow) => {
            if (err) return res.status(500).json({ error: err.message });

            db.all(dataSql, [limit, offset], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });

                res.json({
                    data: rows.map(row => ({
                        ...row,
                        details: JSON.parse(row.details || '{}')
                    })),
                    total: countRow.total,
                    page,
                    totalPages: Math.ceil(countRow.total / limit)
                });
            });
        });
    },

    createBackup: async (req, res) => {
        // Requires Admin
        try {
            const fs = require('fs');
            const path = require('path');

            // Simple backup: We already have a backup script structure, let's reuse logic inline or call it.
            // Inline is safer for response handling.

            // Note: DB is imported as 'db' which is the adapter. We need raw mysql connection for bulk dump?
            // Or just use db.all() for each table. The adapter supports promises manually or we use callbacks.
            // Let's use the adapter's pool if accessible or just query table by table with db.all

            // List of tables to backup
            const tablesToBackup = [
                'users', 'products', 'categories', 'orders', 'order_items',
                'marketers', 'commissions', 'withdrawals', 'shipping_companies',
                'shipping_zones', 'site_settings', 'kv_store', 'employees'
            ];

            const backupData = {};
            let completed = 0;

            if (tablesToBackup.length === 0) return res.json({});

            tablesToBackup.forEach(table => {
                db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
                    if (!err) {
                        backupData[table] = rows;
                    }
                    completed++;
                    if (completed === tablesToBackup.length) {
                        // Send as download
                        const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(backupData, null, 2));
                    }
                });
            });

        } catch (error) {
            console.error("Backup failed", error);
            res.status(500).json({ error: "Backup failed" });
        }
    }
};
