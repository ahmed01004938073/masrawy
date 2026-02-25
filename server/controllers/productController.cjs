const db = require('../database.cjs');
const fs = require('fs');
const path = require('path');
const { getCache, setCache, deleteCache } = require('../cacheUtility.cjs');
const { broadcastBackendNotification } = require('../utils/backendNotifications.cjs');

/**
 * Calculates star rating based on sales count.
 */
function calculateProductRating(salesCount) {
    if (salesCount > 15) return 5;
    if (salesCount >= 10) return 4;
    if (salesCount >= 5) return 3;
    if (salesCount >= 2) return 2;
    return 0;
}

const logToFile = (msg) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${msg}`);
};

const getProducts = async (req, res) => {
    logToFile(`🔍 getProducts called. Query: ${JSON.stringify(req.query)}`);
    const { page, limit, search, category, status } = req.query;

    try {
        if (page && limit) {
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const limitVal = parseInt(limit);
            let whereClause = "WHERE 1=1";
            const params = [];

            if (search) {
                whereClause += " AND (p.name LIKE ? OR p.sku LIKE ? OR p.id LIKE ?)";
                const s = `%${search}%`;
                params.push(s, s, s);
            }

            if (category && category !== "الكل") {
                whereClause += " AND (c.name = ? OR p.category_id = ? OR p.category_id IN (SELECT name FROM categories WHERE id = ?) OR p.category_id IN (SELECT id FROM categories WHERE name = ?))";
                params.push(category, category, category, category);
            }

            if (status === "hidden") {
                whereClause += " AND (p.isArchived = 1 OR p.status = 'archived')";
            } else if (status === "low-stock") {
                whereClause += " AND p.quantity < 20";
            }

            const joins = `
                LEFT JOIN categories c ON (p.category_id = c.id OR p.category_id = c.name)
                LEFT JOIN manufacturers m ON p.manufacturerId = m.id
            `;

            const countSql = `SELECT COUNT(*) as count FROM products p ${joins} ${whereClause}`;
            const mainSql = `
                SELECT p.*, c.name as category_name, m.name as manufacturer_name
                FROM products p 
                ${joins}
                ${whereClause}
                ORDER BY p.date DESC
                LIMIT ? OFFSET ?
            `;

            const countRow = await db.getAsync(countSql, params);
            const total = countRow ? countRow.count : 0;
            const mainParams = [...params, limitVal, offset];

            const rows = await db.allAsync(mainSql, mainParams);

            const products = rows.map(p => ({
                ...p,
                category: p.category_name || "غير مصنف",
                thumbnail: p.image_url,
                manufacturerName: p.manufacturer_name || p.manufacturerId || "",
                images: JSON.parse(p.images || '[]'),
                colors: JSON.parse(p.colors || '[]'),
                sizes: JSON.parse(p.sizes || '[]'),
                detailedVariants: JSON.parse(p.detailedVariants || '[]'),
                isArchived: p.isArchived === 1,
                isHidden: p.isArchived === 1 || p.status === 'archived',
                sales_count: p.sales_count || 0,
                rating: calculateProductRating(p.sales_count || 0),
                stock: p.quantity || 0
            }));

            // Fetch global stats (all products)
            const statsSql = `
                SELECT 
                    COUNT(*) as totalProducts,
                    SUM(quantity) as totalStock,
                    SUM(CASE WHEN quantity < 20 THEN 1 ELSE 0 END) as lowStockCount,
                    SUM(CASE WHEN isArchived = 1 OR status = 'archived' THEN 1 ELSE 0 END) as hiddenCount
                FROM products
            `;

            const stats = await db.getAsync(statsSql, []);

            res.json({
                data: products,
                total: total,
                page: parseInt(page),
                limit: limitVal,
                totalPages: Math.ceil(total / limitVal),
                stats: stats || { totalProducts: total, totalStock: 0, lowStockCount: 0, hiddenCount: 0 }
            });

            return;
        }

        // LEGACY MODE (Return All)
        const joins = `
            LEFT JOIN categories c ON (p.category_id = c.id OR p.category_id = c.name)
            LEFT JOIN manufacturers m ON (p.manufacturerId = m.id OR p.manufacturerId = m.name)
        `;
        const sql = `
            SELECT p.*, c.name as category_name, m.name as manufacturer_name
            FROM products p 
            ${joins}
            ORDER BY p.date DESC
        `;
        const cacheKey = `products_list`;
        const cachedData = getCache(cacheKey);

        if (cachedData) {
            console.log('🚀 Serving products from Node-Cache');
            return res.json(cachedData);
        }

        const rows = await db.allAsync(sql, []);
        const products = rows.map(p => ({
            ...p,
            category: p.category_name || "غير مصنف",
            thumbnail: p.image_url,
            manufacturerName: p.manufacturer_name || p.manufacturerId || "",
            images: JSON.parse(p.images || '[]'),
            colors: JSON.parse(p.colors || '[]'),
            sizes: JSON.parse(p.sizes || '[]'),
            detailedVariants: JSON.parse(p.detailedVariants || '[]'),
            isArchived: p.isArchived === 1,
            isHidden: p.isArchived === 1 || p.status === 'archived',
            sales_count: p.sales_count || 0,
            rating: calculateProductRating(p.sales_count || 0)
        }));

        setCache(cacheKey, products, 300); // Cache for 5 minutes
        res.json(products);

    } catch (err) {
        console.error("❌ SQL Error in getProducts:", err.message);
        res.status(400).json({ error: err.message });
    }
};

const getProductById = async (req, res) => {
    const joins = `
        LEFT JOIN categories c ON (p.category_id = c.id OR p.category_id = c.name)
        LEFT JOIN manufacturers m ON (p.manufacturerId = m.id OR p.manufacturerId = m.name)
    `;
    const sql = `
        SELECT p.*, c.name as category_name, m.name as manufacturer_name
        FROM products p 
        ${joins}
        WHERE p.id = ?
    `;
    try {
        const row = await db.getAsync(sql, [req.params.id]);
        if (!row) return res.status(404).json({ error: "Product not found" });

        res.json({
            ...row,
            category: row.category_name || "غير مصنف",
            thumbnail: row.image_url,
            manufacturerName: row.manufacturer_name || row.manufacturerId || "",
            images: JSON.parse(row.images || '[]'),
            colors: JSON.parse(row.colors || '[]'),
            sizes: JSON.parse(row.sizes || '[]'),
            detailedVariants: JSON.parse(row.detailedVariants || '[]'),
            isArchived: row.isArchived === 1,
            isHidden: row.isArchived === 1 || row.status === 'archived',
            sales_count: row.sales_count || 0,
            rating: calculateProductRating(row.sales_count || 0)
        });
    } catch (err) {
        console.error("❌ SQL Error in getProductById:", err.message);
        res.status(400).json({ error: err.message });
    }
};
const saveProduct = async (req, res) => {
    logToFile(`📥 saveProduct called. Body keys: ${Object.keys(req.body).join(', ')}`);
    const { id, name, description, price, minSellingPrice, wholesalePrice, quantity, thumbnail, images, colors, sizes, detailedVariants, driveLink, date, manufacturerId, isArchived, sku } = req.body;
    logToFile(`📦 ID: ${id}, SKU: ${sku}, Qty: ${quantity}, Stock: ${req.body.stock}`);

    try {
        const categoryInput = req.body.category_id || req.body.categoryId || req.body.category;
        let finalCategoryId = null;

        if (categoryInput) {
            const numericId = Number(categoryInput);
            if (!isNaN(numericId) && numericId > 0) {
                // It is already an ID
                finalCategoryId = numericId;
            } else {
                // It is a name, find the ID
                const row = await db.getAsync("SELECT id FROM categories WHERE name = ?", [categoryInput]);
                if (row) {
                    finalCategoryId = row.id;
                } else {
                    // Fallback: If category name not found, keep the input (it might be a legacy name or a new name not yet created)
                    finalCategoryId = categoryInput;
                }
            }
        }

        const sql = `INSERT INTO products (id, name, description, price, wholesalePrice, quantity, image_url, images, isArchived, driveLink, date, manufacturerId, status, category_id, colors, sizes, detailedVariants, sku) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     name = VALUES(name),
                     description = VALUES(description),
                     price = VALUES(price),
                     wholesalePrice = VALUES(wholesalePrice),
                     quantity = VALUES(quantity),
                     image_url = VALUES(image_url),
                     images = VALUES(images),
                     isArchived = VALUES(isArchived),
                     driveLink = VALUES(driveLink),
                     date = VALUES(date),
                     manufacturerId = VALUES(manufacturerId),
                     status = VALUES(status),
                     category_id = VALUES(category_id),
                     colors = VALUES(colors),
                     sizes = VALUES(sizes),
                     detailedVariants = VALUES(detailedVariants),
                     sku = COALESCE(NULLIF(VALUES(sku), ''), sku)`;

        const currentProduct = await db.getAsync("SELECT quantity, isArchived, name FROM products WHERE id = ?", [id]);
        const isNew = !currentProduct;

        let finalQuantity = Number(quantity || 0);
        let finalIsArchived = (req.body.isArchived === 1 || req.body.isArchived === true) ? 1 : 0;

        // AUTO-ARCHIVE logic: If quantity is 0, force archive
        if (finalQuantity === 0) {
            finalIsArchived = 1;
        }

        let finalStatus = req.body.status || (finalIsArchived ? 'archived' : 'active');

        if (finalIsArchived === 1) {
            finalStatus = 'archived';
        } else if (finalStatus === 'archived') {
            finalStatus = 'active';
        }

        const params = [
            id || null,
            name || "",
            description || null,
            Number(price) || 0,
            Number(wholesalePrice || minSellingPrice || 0),
            finalQuantity,
            thumbnail || null, // Strictly use thumbnail (Main Image)
            JSON.stringify(images || []),
            finalIsArchived,
            driveLink || null,
            date || new Date().toISOString(),
            manufacturerId || null,
            finalStatus,
            finalCategoryId || null,
            JSON.stringify(colors || []),
            JSON.stringify(sizes || []),
            JSON.stringify(detailedVariants || []),
            sku || null
        ].map(val => (val === undefined || val === "") ? null : val);

        // Required string fields
        if (params[1] === null) params[1] = ""; // name
        if (params[7] === null) params[7] = "[]"; // images
        if (params[14] === null) params[14] = "[]"; // colors
        if (params[15] === null) params[15] = "[]"; // sizes
        if (params[16] === null) params[16] = "[]"; // detailedVariants

        logToFile(`🚀 Executing SQL: ${sql.substring(0, 100)}...`);

        const currentRecord = await db.getAsync("SELECT sku FROM products WHERE id = ?", [params[0]]);
        if (currentRecord && currentRecord.sku && (!params[17] || params[17] === "")) {
            logToFile(`⚠️ WIPE PROTECTION: Product ${params[0]} has SKU ${currentRecord.sku}, but incoming SKU is empty. Preserving old SKU.`);
        }

        const result = await db.runAsync(sql, params);
        logToFile(`✅ Product ${params[0]} saved successfully. Changes: ${result.changes}`);

        // --- BACKEND NOTIFICATIONS ---
        if (isNew) {
            await broadcastBackendNotification(
                "🆕 تم إضافة منتج جديد",
                `تم توفير منتج جديد: "${name}". تصفحه الآن!`,
                "info",
                `/product/${id}`
            );
        } else if (currentProduct.quantity > 0 && finalQuantity === 0) {
            await broadcastBackendNotification(
                "⚠️ نفاذ الكمية",
                `نفذت كمية المنتج: "${name}". سيتم تجديدها قريباً.`,
                "warning",
                `/product/${id}`
            );
        }

        deleteCache(`products_list`);
        res.json({ message: "تم حفظ المنتج بنجاح", id: id });

    } catch (err) {
        logToFile(`❌ Error saving product: ${err.message}`);
        deleteCache(`products_list`);
        res.status(400).json({ error: err.message });
    }
};

const deleteProduct = async (req, res) => {
    const id = req.params.id;
    try {
        await db.runAsync("DELETE FROM products WHERE id = ?", [id]);
        deleteCache(`products_list`); // Invalidate products cache
        res.json({ message: "Product deleted" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    saveProduct,
    deleteProduct
};
