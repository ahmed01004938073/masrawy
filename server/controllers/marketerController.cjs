const db = require('../database.cjs');

// Helpers for promisified DB
const dbGet = (sql, params) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});
const dbAll = (sql, params) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});
const dbRun = (sql, params) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) { err ? reject(err) : resolve(this); });
});

// Helper to sync stats (Internal)
const syncMarketerStats = async (id) => {
    if (!id || id === 'null' || id === 'undefined') return;
    const marketerId = id.toString().trim();
    try {
        const earnedRow = await dbGet("SELECT SUM(amount) as total FROM commissions WHERE TRIM(marketerId) = ? AND status IN ('pending', 'approved', 'paid')", [marketerId]);
        const withdrawnRow = await dbGet("SELECT SUM(amount) as total FROM withdrawals WHERE TRIM(marketerId) = ? AND status = 'completed'", [marketerId]);
        const pendingWithdrawalsRow = await dbGet("SELECT SUM(amount) as total FROM withdrawals WHERE TRIM(marketerId) = ? AND status LIKE 'pending%'", [marketerId]);
        const ordersCountRow = await dbGet("SELECT COUNT(*) as count FROM commissions WHERE TRIM(marketerId) = ? AND status != 'cancelled'", [marketerId]);

        const totalCommission = Number(earnedRow?.total || 0);
        const withdrawnCommission = Number(withdrawnRow?.total || 0);
        const pendingWithdrawals = Number(pendingWithdrawalsRow?.total || 0);
        const ordersCount = Number(ordersCountRow?.count || 0);
        const availableBalance = totalCommission - withdrawnCommission - pendingWithdrawals;
        const now = new Date().toISOString();

        await dbRun(`
            UPDATE marketers 
            SET totalCommission = ?, pendingCommission = ?, withdrawnCommission = ?, ordersCount = ?, updatedAt = ?
            WHERE id = ?
        `, [totalCommission, availableBalance, withdrawnCommission, ordersCount, now, marketerId]);
    } catch (err) {
        console.error("❌ Failed to sync stats for:", marketerId, err.message);
    }
};

// Helper to get available balance
const getAvailableBalance = async (marketerId) => {
    const earnedRow = await dbGet("SELECT SUM(amount) as total FROM commissions WHERE marketerId = ? AND status IN ('pending', 'approved', 'paid')", [marketerId]);
    const withdrawnRow = await dbGet("SELECT SUM(amount) as total FROM withdrawals WHERE marketerId = ? AND status = 'completed'", [marketerId]);
    const pendingWithdrawalsRow = await dbGet("SELECT SUM(amount) as total FROM withdrawals WHERE marketerId = ? AND status = 'pending'", [marketerId]);

    const totalEarned = Number(earnedRow?.total || 0);
    const withdrawnAmount = Number(withdrawnRow?.total || 0);
    const pendingWithdrawals = Number(pendingWithdrawalsRow?.total || 0);

    return totalEarned - withdrawnAmount - pendingWithdrawals;
};

// --- Marketers ---
const getMarketers = async (req, res) => {
    const { page, limit, search } = req.query;
    try {
        if (page && limit) {
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const limitVal = parseInt(limit);
            let whereClause = "WHERE 1=1";
            const params = [];

            if (search) {
                whereClause += " AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)";
                const s = `%${search}%`;
                params.push(s, s, s);
            }

            const countRow = await dbGet(`SELECT COUNT(*) as count FROM marketers ${whereClause}`, params);
            const rows = await dbAll(`SELECT * FROM marketers ${whereClause} ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?`, [...params, limitVal, offset]);

            const formattedRows = rows.map(m => ({
                ...m,
                pages: (() => {
                    try {
                        return typeof m.pages === 'string' ? JSON.parse(m.pages || '[]') : (m.pages || []);
                    } catch (e) {
                        return [];
                    }
                })()
            }));

            return res.json({
                data: formattedRows,
                total: countRow.count,
                page: parseInt(page),
                totalPages: Math.ceil(countRow.count / limitVal)
            });
        }

        const rows = await dbAll("SELECT * FROM marketers ORDER BY createdAt DESC, id DESC", []);
        const formattedRows = rows.map(m => ({
            ...m,
            pages: (() => {
                try {
                    return typeof m.pages === 'string' ? JSON.parse(m.pages || '[]') : (m.pages || []);
                } catch (e) {
                    return [];
                }
            })()
        }));
        res.json(formattedRows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const saveMarketer = async (req, res) => {
    const m = req.body;
    // Ensure pages is stored as string
    const pagesStr = Array.isArray(m.pages) ? JSON.stringify(m.pages) : (m.pages || '[]');

    // Use INSERT ... ON DUPLICATE KEY UPDATE to avoid deleting records (and breaking FKs) like REPLACE INTO does
    const sql = `INSERT INTO marketers (id, name, phone, email, status, totalCommission, pendingCommission, withdrawnCommission, ordersCount, commissionRate, pages, password, city, alternativePhone, createdAt, updatedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 name = VALUES(name),
                 phone = VALUES(phone),
                 email = VALUES(email),
                 status = VALUES(status),
                 totalCommission = VALUES(totalCommission),
                 pendingCommission = VALUES(pendingCommission),
                 withdrawnCommission = VALUES(withdrawnCommission),
                 ordersCount = VALUES(ordersCount),
                 commissionRate = VALUES(commissionRate),
                 pages = VALUES(pages),
                 password = VALUES(password),
                 city = VALUES(city),
                 alternativePhone = VALUES(alternativePhone),
                 updatedAt = VALUES(updatedAt)`;

    // Handle optional commissionRate
    const commRate = (m.commissionRate === undefined || m.commissionRate === null) ? 10 : m.commissionRate;

    const params = [
        m.id, m.name, m.phone, m.email, m.status,
        m.totalCommission || 0, m.pendingCommission || 0, m.withdrawnCommission || 0, m.ordersCount || 0,
        commRate, pagesStr, m.password || null, m.city || null, m.alternativePhone || null,
        m.createdAt, m.updatedAt
    ];
    try {
        await dbRun(sql, params);
        res.json({ message: "Marketer saved", id: m.id });
    } catch (err) {
        console.error("❌ Save marketer error:", err.message);
        res.status(400).json({ error: err.message });
    }
};

const deleteMarketer = async (req, res) => {
    try {
        await dbRun("DELETE FROM marketers WHERE id = ?", [req.params.id]);
        res.json({ message: "Marketer deleted" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const updateProfile = async (req, res) => {
    const { id } = req.user;
    const updates = req.body;
    console.log(`[DEBUG] updateProfile called for ID: ${id}`, updates);

    // Security: Only allow updating specific fields
    const { name, phone, email, city, alternativePhone, pages, password } = updates;

    try {
        // Get existing marketer to preserve other fields
        const m = await dbGet("SELECT * FROM marketers WHERE id = ?", [id]);
        if (!m) {
            console.error(`[DEBUG] Marketer not found: ${id}`);
            return res.status(404).json({ error: "المسوق غير موجود" });
        }

        const pagesStr = Array.isArray(pages) ? JSON.stringify(pages) : (pages || m.pages || '[]');
        const now = new Date().toISOString();

        console.log(`[DEBUG] Updating marketer ${id} with pages: ${pagesStr}`);

        const sql = `UPDATE marketers SET 
                    name = ?, phone = ?, email = ?, city = ?, 
                    alternativePhone = ?, pages = ?, updatedAt = ?
                    ${password ? ', password = ?' : ''}
                    WHERE id = ?`;

        const params = [
            name || m.name,
            phone || m.phone,
            email || m.email,
            city || m.city,
            alternativePhone || m.alternativePhone,
            pagesStr,
            now
        ];

        if (password) params.push(password);
        params.push(id);

        await dbRun(sql, params);
        console.log(`[DEBUG] Database updated successfully for ${id}`);

        // Return updated user
        const updatedUser = await dbGet("SELECT * FROM marketers WHERE id = ?", [id]);
        res.json({
            ...updatedUser,
            pages: JSON.parse(updatedUser.pages || '[]')
        });
    } catch (err) {
        console.error("❌ [DEBUG] Update profile error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// --- Commissions ---
const getCommissions = async (req, res) => {
    const { marketerId, page, limit } = req.query;
    let whereClause = "WHERE 1=1";
    const params = [];
    if (marketerId) {
        whereClause += " AND marketerId = ?";
        params.push(marketerId);
    }

    try {
        if (page && limit) {
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const limitVal = parseInt(limit);

            const countRow = await dbGet(`SELECT COUNT(*) as count FROM commissions ${whereClause}`, params);
            const rows = await dbAll(`SELECT * FROM commissions ${whereClause} ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?`, [...params, limitVal, offset]);

            return res.json({
                data: rows,
                total: countRow.count,
                page: parseInt(page),
                totalPages: Math.ceil(countRow.count / limitVal)
            });
        }

        let sql = "SELECT * FROM commissions " + whereClause + " ORDER BY createdAt DESC, id DESC";
        const rows = await dbAll(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const saveCommission = async (req, res) => {
    const c = req.body;
    const mid = String(c.marketerId || '').trim();
    if (!mid || mid === 'null' || mid === 'undefined' || mid === '[object Object]') {
        console.error("❌ saveCommission BLOCKED: Invalid marketerId", c);
        return res.status(400).json({ error: "معرف المسوق غير صالح أو مفقود" });
    }
    const sql = `REPLACE INTO commissions (id, marketerId, orderId, orderNumber, amount, status, createdAt, updatedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [c.id, mid, c.orderId, c.orderNumber, c.amount, c.status, c.createdAt, c.updatedAt];
    try {
        await dbRun(sql, params);
        // Auto-recalculate stats in background
        await syncMarketerStats(mid);
        res.json({ message: "Commission saved", id: c.id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// --- Withdrawals ---
const getWithdrawals = async (req, res) => {
    const { marketerId, page, limit } = req.query;
    let whereClause = "WHERE 1=1";
    const params = [];
    if (marketerId) {
        whereClause += " AND marketerId = ?";
        params.push(marketerId);
    }

    try {
        if (page && limit) {
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const limitVal = parseInt(limit);

            const countRow = await dbGet(`SELECT COUNT(*) as count FROM withdrawals ${whereClause}`, params);
            const rows = await dbAll(`SELECT * FROM withdrawals ${whereClause} ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?`, [...params, limitVal, offset]);

            return res.json({
                data: rows,
                total: countRow.count,
                page: parseInt(page),
                totalPages: Math.ceil(countRow.count / limitVal)
            });
        }

        let sql = "SELECT * FROM withdrawals " + whereClause + " ORDER BY createdAt DESC, id DESC";
        const rows = await dbAll(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const saveWithdrawal = async (req, res) => {
    const w = req.body;
    const mid = String(w.marketerId || '').trim();
    if (!mid || mid === 'null' || mid === 'undefined' || mid === '[object Object]') {
        console.error("❌ saveWithdrawal BLOCKED: Invalid marketerId", w);
        return res.status(400).json({ error: "معرف المسوق غير صالح أو مفقود" });
    }

    let conn;
    try {
        // Get a dedicated connection for the transaction
        conn = await db.getConnection();
        await conn.beginTransaction();

        // 1. Check Balance (Exclusive Lock using FOR UPDATE to prevent race conditions)
        // We query the raw sums, similar to getAvailableBalance but efficiently in the transaction flow
        const [earnedRows] = await conn.execute("SELECT SUM(amount) as total FROM commissions WHERE marketerId = ? AND status IN ('pending', 'approved', 'paid')", [mid]);
        const [withdrawnRows] = await conn.execute("SELECT SUM(amount) as total FROM withdrawals WHERE marketerId = ? AND status = 'completed'", [mid]);
        const [pendingRows] = await conn.execute("SELECT SUM(amount) as total FROM withdrawals WHERE marketerId = ? AND status LIKE 'pending%' FOR UPDATE", [mid]); // Lock withdrawals mainly

        const totalEarned = Number(earnedRows[0]?.total || 0);
        const withdrawnAmount = Number(withdrawnRows[0]?.total || 0);
        const pendingWithdrawals = Number(pendingRows[0]?.total || 0);

        // This is the true current available balance in DB
        const available = totalEarned - withdrawnAmount - pendingWithdrawals;

        const requestedAmount = Number(w.amount);

        // Check against existing record to see if it's an update or new
        const [existingRows] = await conn.execute("SELECT amount, status FROM withdrawals WHERE id = ?", [w.id]);

        if (existingRows.length === 0) {
            // New Request
            if (requestedAmount > available) {
                await conn.rollback();
                console.error(`❌ saveWithdrawal REJECTED: Insufficient balance for ${mid}. Available: ${available}, Requested: ${requestedAmount}`);
                return res.status(400).json({ error: `الرصيد غير كافٍ. المتاح حالياً: ${available} ج.م` });
            }
        } else {
            // Update Existing
            const existing = existingRows[0];
            // Recover the "held" amount for this specific withdrawal from the "pending" sum to get "available BEFORE this withdrawal"
            // If it was pending, it contributed to pendingWithdrawals. We add it back to available to see if the NEW amount fits.

            let effectiveAvailable = available;
            if (existing.status === 'pending' || existing.status.startsWith('pending')) {
                effectiveAvailable += Number(existing.amount);
            }

            // Validation logic
            if (existing.status !== 'pending' && !existing.status.startsWith('pending') && Number(existing.amount) !== requestedAmount) {
                await conn.rollback();
                return res.status(400).json({ error: "لا يمكن تعديل مبلغ طلب تم معالجته بالفعل" });
            }

            if (Number(existing.amount) !== requestedAmount && (existing.status === 'pending' || existing.status.startsWith('pending'))) {
                if (requestedAmount > effectiveAvailable) {
                    await conn.rollback();
                    console.error(`❌ saveWithdrawal REJECTED: Insufficient balance (update) for ${mid}. Available: ${effectiveAvailable}, Requested: ${requestedAmount}`);
                    return res.status(400).json({ error: `الرصيد غير كافٍ. المتاح حالياً: ${effectiveAvailable} ج.م` });
                }
            }
        }

        // 2. Perform Insert/Update
        const sql = `REPLACE INTO withdrawals (id, marketerId, amount, method, status, notes, createdAt, updatedAt) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [w.id, mid, w.amount, w.method, w.status, w.notes, w.createdAt, w.updatedAt];

        await conn.execute(sql, params);

        await conn.commit();

        // Auto-recalculate stats in background (after commit)
        // We use the helper (which uses a new pool connection) but that's fine as stats are eventual consistent
        syncMarketerStats(mid).catch(console.error);

        res.json({ message: "Withdrawal saved", id: w.id });

    } catch (err) {
        if (conn) await conn.rollback();
        console.error("❌ Transaction Error in saveWithdrawal:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// --- Statistics Aggregation ---
const getMarketerStats = async (req, res) => {
    const { marketerId: id } = req.query;
    if (!id) return res.status(400).json({ error: "marketerId required" });
    const marketerId = id.toString().trim();

    try {
        // Use COALESCE to ensure 0 instead of null from MySQL SUM
        const earnedRow = await dbGet(`
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM commissions 
            WHERE TRIM(marketerId) = ? AND status IN ('pending', 'approved', 'paid')
        `, [marketerId]);

        const processingRow = await dbGet(`
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM commissions 
            WHERE TRIM(marketerId) = ? AND status = 'processing'
        `, [marketerId]);

        const withdrawnRow = await dbGet(`
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM withdrawals 
            WHERE TRIM(marketerId) = ? AND status = 'completed'
        `, [marketerId]);

        const reservedRow = await dbGet(`
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM withdrawals 
            WHERE TRIM(marketerId) = ? AND (status = 'pending' OR status LIKE 'pending%')
        `, [marketerId]);

        const totalEarned = Number(earnedRow?.total || 0);
        const processing = Number(processingRow?.total || 0);
        const withdrawn = Number(withdrawnRow?.total || 0);
        const reserved = Number(reservedRow?.total || 0);
        const available = totalEarned - withdrawn - reserved;

        res.json({
            totalEarned,
            processing,
            withdrawn,
            reserved,
            available
        });
    } catch (err) {
        console.error("❌ Stats query error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

const updateMarketerStatsInternal = async (req, res) => {
    const { marketerId } = req.params;
    if (!marketerId || marketerId === 'null' || marketerId === 'undefined') {
        console.error("❌ updateMarketerStatsInternal called with invalid marketerId:", marketerId);
        return res.status(400).json({ error: "معرف المسوق غير صالح" });
    }
    try {
        await syncMarketerStats(marketerId);
        res.json({ message: "Stats updated success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- Carts ---
const getCart = async (req, res) => {
    try {
        const row = await dbGet("SELECT items FROM carts WHERE userId = ?", [req.params.userId]);
        res.json(row ? JSON.parse(row.items) : []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const saveCart = async (req, res) => {
    const { userId, items } = req.body;
    const sql = `REPLACE INTO carts (userId, items, updatedAt) VALUES (?, ?, ?)`;
    try {
        await dbRun(sql, [userId, JSON.stringify(items), new Date().toISOString()]);
        res.json({ message: "Cart saved" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// --- Saved Wallets ---
const getSavedWallets = async (req, res) => {
    const { marketerId } = req.params;
    try {
        const rows = await dbAll("SELECT * FROM marketer_wallets WHERE marketerId = ?", [marketerId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const saveWallet = async (req, res) => {
    const { marketerId, provider, number } = req.body;
    console.log("Saving wallet:", { marketerId, provider, number });
    if (!marketerId || !provider || !number) {
        return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }
    const sql = `REPLACE INTO marketer_wallets (marketerId, provider, number) VALUES (?, ?, ?)`;
    try {
        await dbRun(sql, [marketerId, provider, number]);
        console.log("Wallet saved successfully");
        res.json({ message: "Wallet saved" });
    } catch (err) {
        console.error("Error saving wallet:", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getMarketers, saveMarketer, deleteMarketer,
    getCommissions, saveCommission,
    getWithdrawals, saveWithdrawal,
    getCart, saveCart,
    getMarketerStats,
    updateMarketerStatsInternal,
    syncMarketerStats, // Added
    getSavedWallets,
    saveWallet,
    updateProfile
};
