const db = require('../database.cjs');

// Helper to execute queries safely
const query = async (sql, params = []) => {
    try {
        const [rows] = await db.pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error("Database Query Error:", error.message, "\nSQL:", sql);
        throw error;
    }
};

const getCategories = async (req, res) => {
    const { page, limit } = req.query;

    try {
        // Try to get products count if possible, but don't fail hard if column doesn't exist
        // We'll use a simpler query first without the products count if we're unsure, 
        // OR we just use tye robust query and catch errors specifically.

        let selectSql = `
            SELECT c.*,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.name) as productsCount
            FROM categories c 
            ORDER BY c.\`order\` ASC
        `;

        // mapCategoryRow will handle the productsCount from the query
        const mapCategoryRowSimple = (row) => mapCategoryRow(row);

        // If pagination is requested
        if (page && limit) {
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const limitVal = parseInt(limit);

            const [countRows] = await db.pool.execute("SELECT COUNT(*) as count FROM categories");
            const total = countRows[0].count;

            // Fix for limit/offset in mysql2 execute: sometimes it prefers direct values in string interpolation or numbers
            // But let's stick to params. Note: LIMIT ? OFFSET ? Params must be numbers.
            const [pagedRows] = await db.pool.query(selectSql + " LIMIT ? OFFSET ?", [limitVal, offset]);

            const categories = pagedRows.map(mapCategoryRowSimple);

            return res.json({
                data: categories,
                total: total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limitVal)
            });
        }

        // No pagination
        const [rows] = await db.pool.query(selectSql);
        const categories = rows.map(mapCategoryRowSimple);
        res.json(categories);

    } catch (err) {
        // Fallback if products count fails (e.g. column missing)
        console.error("Error in getCategories:", err.message);

        try {
            // Fallback: Just get categories
            const [rows] = await db.pool.query("SELECT * FROM categories ORDER BY `order` ASC");
            const categories = rows.map(row => ({ ...mapCategoryRow(row), productsCount: 0 }));
            res.json(page && limit ? { data: categories, total: categories.length, page: 1, totalPages: 1 } : categories);
        } catch (fallbackErr) {
            res.status(400).json({ error: fallbackErr.message });
        }
    }
};

const getCategoryById = async (req, res) => {
    try {
        const [rows] = await db.pool.execute("SELECT * FROM categories WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: "Category not found" });

        res.json(mapCategoryRow(rows[0]));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const saveCategory = async (req, res) => {
    const { id, name, order, active, status, imageUrl, image, description, showInHomepage, slug, seoTitle, seoDescription } = req.body;

    // DEBUG: Log incoming data
    console.log('📥 saveCategory received:', {
        id, name, active, status,
        'active===true': active === true,
        'status==="active"': status === 'active',
        'typeof active': typeof active,
        'typeof status': typeof status
    });

    // Determine active status - robust check for various input formats
    const finalActive = (active === true || active == 1 || active === '1' || status === 'active') ? 1 : 0;
    const finalImage = imageUrl || image || null;
    const finalOrder = order || 0;
    const finalShowInHomepage = showInHomepage ? 1 : 0;

    console.log('✅ Computed finalActive:', finalActive);

    try {
        // Use REPLACE INTO or INSERT ... ON DUPLICATE KEY UPDATE
        // REPLACE INTO deletes and inserts, which might change ID if not careful, but if ID is provided it keeps it (mostly).
        // Better to use INSERT ... ON DUPLICATE KEY UPDATE to preserve ID if it exists and update fields.

        if (id) {
            // Update existing
            const updateSql = `
                UPDATE categories 
                SET name=?, \`order\`=?, active=?, image=?, description=?, showInHomepage=?, slug=?, seoTitle=?, seoDescription=?
                WHERE id=?
             `;
            await db.pool.execute(updateSql, [
                name, finalOrder, finalActive, finalImage, description || null, finalShowInHomepage,
                slug || null, seoTitle || null, seoDescription || null,
                id
            ]);
            res.json({ message: "Category updated successfully", id });
        } else {
            // Insert new
            const insertSql = `
                INSERT INTO categories (name, \`order\`, active, image, description, showInHomepage, slug, seoTitle, seoDescription)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             `;
            const [result] = await db.pool.execute(insertSql, [
                name, finalOrder, finalActive, finalImage, description || null, finalShowInHomepage,
                slug || null, seoTitle || null, seoDescription || null
            ]);
            res.json({ message: "Category added successfully", id: result.insertId });
        }

    } catch (err) {
        console.error("Save Category Error:", err);
        res.status(400).json({ error: err.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        await db.pool.execute("DELETE FROM categories WHERE id = ?", [req.params.id]);
        res.json({ message: "Category deleted successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const toggleCategoryActive = async (req, res) => {
    const { id, active } = req.body;
    const finalActive = active ? 1 : 0;

    console.log(`🔄 Toggling category ${id} to active=${finalActive}`);

    try {
        const [result] = await db.pool.execute(
            "UPDATE categories SET active = ? WHERE id = ?",
            [finalActive, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.json({ success: true, message: `Category ${active ? 'activated' : 'deactivated'} successfully` });
    } catch (err) {
        console.error("Toggle Active Error:", err);
        res.status(400).json({ error: err.message });
    }
};

// Helper mapper
function mapCategoryRow(row) {
    // Robust check for active status
    const rawActive = row.active;
    const isActive = rawActive == 1 || rawActive === true || rawActive === '1' || (Buffer.isBuffer(rawActive) && rawActive[0] === 1);

    // Log for debugging if not clearly 1
    if (!isActive && rawActive != 0) {
        console.log(`🔍 mapCategoryRow - Category ${row.id} (${row.name}) has raw active:`, rawActive, 'Type:', typeof rawActive);
    }

    return {
        ...row,
        id: Number(row.id),
        imageUrl: row.image || row.imageUrl || null,
        active: !!isActive,
        status: isActive ? 'active' : 'inactive',
        productsCount: row.productsCount || 0
    };
}

module.exports = {
    getCategories,
    getCategoryById,
    saveCategory,
    deleteCategory,
    toggleCategoryActive
};
