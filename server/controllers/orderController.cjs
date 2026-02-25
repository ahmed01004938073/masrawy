const db = require('../database.cjs');
const { syncMarketerStats } = require('./marketerController.cjs');

/**
 * Restores stock for all items in an order.
 */
async function restoreOrderStock(order, connection) {
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    for (const item of items) {
        await restoreSingleItemStock(item, item.quantity, connection);
    }
}

/**
 * Restores stock for specific items (e.g. for partially delivered orders).
 */
async function restoreOrderItemsStock(order, connection) {
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    for (const item of items) {
        if (item.delivered === false || item.status === 'cancelled') {
            await restoreSingleItemStock(item, item.quantity, connection);
        }
    }
}

/**
 * Helper to restore stock for a single item variant.
 */
async function restoreSingleItemStock(item, quantity, connection) {
    const productId = item.productId || item.id || item.product_id;
    const qty = parseInt(quantity, 10) || 0;
    if (!productId || qty <= 0) return;

    // 1. Get current product data
    const [rows] = await connection.execute("SELECT quantity, detailedVariants FROM products WHERE id = ?", [productId]);
    if (!rows || rows.length === 0) return;

    const currentQty = rows[0].quantity;
    let detailedVariants = [];
    try {
        detailedVariants = JSON.parse(rows[0].detailedVariants || '[]');
    } catch (e) {
        detailedVariants = [];
    }

    // 2. Update total quantity
    const newTotalQty = currentQty + qty;

    // 3. Update variant quantity if applicable
    if (item.color && item.size && Array.isArray(detailedVariants) && detailedVariants.length > 0) {
        detailedVariants = detailedVariants.map(v => {
            const vColor = (v.color || "").trim().toLowerCase();
            const vSize = (v.size || "").trim().toLowerCase();
            const tColor = (item.color || "").trim().toLowerCase();
            const tSize = (item.size || "").trim().toLowerCase();

            if (vColor === tColor && vSize === tSize) {
                return { ...v, quantity: (parseInt(v.quantity, 10) || 0) + qty };
            }
            return v;
        });
    }

    // 4. Update the product record: Set back to active/unarchived since we have stock now
    await connection.execute(
        "UPDATE products SET quantity = ?, detailedVariants = ?, status = 'active', isArchived = 0 WHERE id = ?",
        [newTotalQty, JSON.stringify(detailedVariants), productId]
    );
    console.log(`✅ Backend Stock Restored: Product ${productId} (+${qty})`);
}

/**
 * Sends a notification to the marketer when order status changes.
 */
async function sendOrderStatusNotification(order, newStatus, connection) {
    const marketerId = (order.marketerId || order.marketer_id || '').toString().trim();
    if (!marketerId || marketerId === 'null' || marketerId === '') return;

    let title = "تحديث حالة الطلب";
    let message = `تم تحديث حالة طلبك رقم ${order.orderNumber || order.id}`;
    let type = 'info';

    switch (newStatus) {
        case 'pending':
        case 'suspended':
            title = "قيد الانتظار ⏳";
            message = `طلبك رقم #${order.orderNumber || order.id} قيد المراجعة حالياً`;
            type = 'info';
            break;
        case 'cancelled':
        case 'delivery_rejected':
            title = "تم إلغاء الطلب ❌";
            message = `للأسف تم إلغاء طلبك رقم #${order.orderNumber || order.id}`;
            type = 'error';
            break;
        case 'confirmed':
        case 'processing':
            title = "جاري تجهيز الطلب 📦";
            message = `يتم الآن تجهيز طلبك رقم #${order.orderNumber || order.id} في المخزن`;
            type = 'info';
            break;
        case 'shipped':
            title = "جاري التسليم للمندوب 🚚";
            message = `تم تسليم طلبك رقم #${order.orderNumber || order.id} للمندوب وفي طريقه لشركة الشحن`;
            type = 'info';
            break;
        case 'in_delivery':
            title = "جاري توصيل الطلب 🛵";
            message = `طلبك رقم #${order.orderNumber || order.id} خرج الآن للتوصيل مع المندوب`;
            type = 'info';
            break;
        case 'delivered':
            title = "تم تسليم الطلب بنجاح ✅";
            message = `مبروك! تم تسليم طلبك رقم #${order.orderNumber || order.id} بنجاح وتم إضافة العمولة لمحفظتك`;
            type = 'success';
            break;
        case 'partially_delivered':
            title = "تسليم جزئي 🧪";
            message = `تم تسليم أجزاء من طلبك رقم #${order.orderNumber || order.id} وتم إضافة العمولة للمنتجات المستلمة`;
            type = 'warning';
            break;
    }

    try {
        const notifId = `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const now = new Date().toISOString();
        const sql = `INSERT INTO notifications (id, user_id, title, message, type, link, \`read\`, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await connection.execute(sql, [notifId, marketerId, title, message, type, '/orders', 0, now, now]);
        console.log(`✅ Backend Notification: Sent to ${marketerId} for ${newStatus}`);
    } catch (e) {
        console.error("❌ Failed to send backend notification:", e.message);
    }
}

/**
 * ensures a commission record exists or is updated for an order.
 * This is the centralized logic for commissions.
 */
async function ensureOrderCommission(order, items, connection, forceStatus = null) {
    const marketerId = (order.marketerId || order.marketer_id || '').toString().trim();
    if (!marketerId || marketerId === 'null' || marketerId === 'undefined' || marketerId === '') {
        return; // No marketer, no commission
    }

    // Calculate total commission if not explicitly provided
    let totalCommission = Number(order.commission);
    if (isNaN(totalCommission) || totalCommission < 0) {
        totalCommission = 0;
        for (const item of items) {
            let itemComm = Number(item.commission);
            if (isNaN(itemComm) || itemComm < 0) {
                // Fallback to 10% if not found
                itemComm = Math.round((Number(item.price) || 0) * 0.1);
            }
            totalCommission += itemComm * (Number(item.quantity) || 1);
        }
    }

    // If commission is 0 but it's a delivered order, we should still try to calculate it or just accept it's 0.
    // For now, allow 0 if that's what's calculated.

    const now = new Date().toISOString();
    let status = forceStatus;

    if (!status) {
        if (order.status === 'delivered' || order.status === 'partially_delivered') {
            status = 'pending'; // 'pending' means earned/available in this system
        } else if (order.status === 'cancelled' || order.status === 'returned' || order.status === 'delivery_rejected') {
            status = 'cancelled';
        } else {
            // Not a delivery or cancellation - skip commission processing if it's just a warehouse update
            return null;
        }
    }

    // Check for existing commission
    const [existing] = await connection.execute(
        "SELECT id FROM commissions WHERE orderId = ? AND marketerId = ?",
        [order.id, marketerId]
    );

    if (existing && existing.length > 0) {
        // Update existing record
        await connection.execute(
            "UPDATE commissions SET amount = ?, status = ?, updatedAt = ?, orderNumber = ? WHERE id = ?",
            [totalCommission, status, now, order.orderNumber, existing[0].id]
        );
    } else if (status === 'pending') {
        // ONLY INSERT NEW if it's a delivery
        const commId = `comm_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await connection.execute(
            "INSERT INTO commissions (id, marketerId, orderId, orderNumber, amount, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [commId, marketerId, order.id, order.orderNumber, totalCommission, status, now, now]
        );
    }

    return marketerId;
}

const getOrders = (req, res) => {
    const { page, limit, search, marketerId, status, section, sections, shippingCompany } = req.query;

    if (page && limit) {
        // PAGINATION MODE
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitVal = parseInt(limit);

        let countSql = "SELECT COUNT(*) as count FROM orders WHERE 1=1";
        let mainSql = "SELECT orders.*, marketers.phone as marketerPhone FROM orders LEFT JOIN marketers ON orders.marketer_id = marketers.id WHERE 1=1";
        const params = [];

        if (marketerId) {
            countSql += " AND orders.marketer_id = ?";
            mainSql += " AND orders.marketer_id = ?";
            params.push(marketerId);
        }

        if (status) {
            countSql += " AND orders.status = ?";
            mainSql += " AND orders.status = ?";
            params.push(status);
        }

        if (shippingCompany && shippingCompany !== 'all') {
            countSql += " AND orders.shippingCompany = ?";
            mainSql += " AND orders.shippingCompany = ?";
            params.push(shippingCompany);
        }

        if (section) {
            countSql += " AND orders.section = ?";
            mainSql += " AND orders.section = ?";
            params.push(section);
        }

        if (sections) {
            const sectionsArray = sections.split(',').map(s => s.trim());
            const placeholders = sectionsArray.map(() => '?').join(',');
            countSql += ` AND orders.section IN (${placeholders})`;
            mainSql += ` AND orders.section IN (${placeholders})`;
            params.push(...sectionsArray);
        }

        // Advanced Search
        if (search) {
            countSql += " AND (orders.orderNumber LIKE ? OR orders.customerName LIKE ? OR orders.customerPhone LIKE ?)";
            mainSql += " AND (orders.orderNumber LIKE ? OR orders.customerName LIKE ? OR orders.customerPhone LIKE ?)";
            const s = `%${search}%`;
            params.push(s, s, s);
        }

        mainSql += " ORDER BY orders.updated_at DESC, orders.id DESC LIMIT ? OFFSET ?";

        db.get(countSql, params, (err, countRow) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            const total = countRow.count;
            const mainParams = [...params, limitVal, offset];

            db.all(mainSql, mainParams, (err, rows) => {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }

                const orders = rows.map(o => ({
                    ...o,
                    page: o.store_page || o.page,
                    shippingFee: o.shipping_cost || 0,
                    items: (() => { try { return typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || []); } catch (e) { return []; } })()
                }));

                res.json({
                    data: orders,
                    total: total,
                    page: parseInt(page),
                    totalPages: Math.ceil(total / limitVal)
                });
            });
        });

    } else {
        // LEGACY MODE (Get All)
        let sql = "SELECT orders.*, marketers.phone as marketerPhone FROM orders LEFT JOIN marketers ON orders.marketer_id = marketers.id";
        const params = [];
        if (marketerId) {
            sql += " WHERE marketer_id = ?";
            params.push(marketerId);
        }
        sql += " ORDER BY createdAt DESC, id DESC";
        db.all(sql, params, (err, rows) => {
            if (err) return res.status(400).json({ error: err.message });
            const orders = rows.map(o => ({
                ...o,
                page: o.store_page || o.page,
                shippingFee: o.shipping_cost || 0,
                items: (() => { try { return typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || []); } catch (e) { return []; } })()
            }));
            res.json(orders);
        });
    }
};

const createOrderWithStock = async (req, res) => {
    const fs = require('fs');
    fs.appendFileSync('debug_logs.txt', `[${new Date().toISOString()}] createOrderWithStock HIT\n`);
    const order = req.body;
    // ... rest of function
    const items = order.items || [];
    let connection;

    try {
        // 1. Get dedicated connection for transaction
        connection = await db.getConnection();
        // ...


        // 2. Start Transaction
        await connection.beginTransaction();

        console.log('📝 Inserting order row:', order.id);

        // 3. Insert Order
        const orderSql = `INSERT INTO orders (
            id, orderNumber, customerName, customerPhone, customerPhone2, customer_email, 
            customerAddress, shipping_city, shipping_state, marketer_id, marketer_name, 
            commission, subtotal, totalAmount, status, section, createdAt, updated_at,
            city, province, items, shipping_cost, discount, notes, payment_method, payment_status,
            store_page, payment_screenshot
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        // Default values for missing fields
        const orderId = order.id || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const orderNumber = order.orderNumber || order.order_number || `ON-${Math.floor(100000 + Math.random() * 900000)}`;
        const initialSection = 'payment_confirmation';
        const itemsToInsert = order.cartItems || order.items || [];
        const safeCreateDate = order.createdAt ? new Date(order.createdAt) : new Date();

        const orderParams = [
            orderId,
            orderNumber,
            order.customerName || order.customer || "",
            order.customerPhone || order.phone || "",
            order.customerPhone2 || order.alternativePhone || "",
            order.customerEmail || null,
            order.customerAddress || order.address || "",
            order.city || null,
            order.province || null,
            order.marketerId || order.marketer_id || null,
            order.marketerName || order.marketer_name || "",
            order.commission || 0,
            order.subtotal || order.totalAmount || order.price || 0,
            order.totalAmount || order.price || 0,
            order.status || 'pending',
            initialSection,
            safeCreateDate,
            order.city || null,
            order.province || null,
            JSON.stringify(itemsToInsert),
            order.shippingFee || 0,
            order.discount || 0,
            order.notes || order.customerNotes || null,
            order.paymentMethod || 'cash',
            order.paymentStatus || 'unpaid',
            order.page || order.selectedPage || order.storePage || null,
            order.paymentScreenshot || order.payment_screenshot || null
        ];

        await connection.execute(orderSql, orderParams);

        // 4. Update Stock and Insert Order Items
        for (const item of items) {
            const productId = item.productId || item.id;

            // 4b. Update Stock logic
            const [productRows] = await connection.execute("SELECT * FROM products WHERE id = ?", [productId]);
            const product = productRows[0];

            if (!product) {
                console.warn(`⚠️ Warning: Product ${productId} not found during stock update.`);
                continue;
            }

            // 4a. Insert into order_items table
            const itemCommission = Number(item.commission) || (product ? Number(product.commission) : 0);
            const itemSql = `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, commission, color, size, sku) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            await connection.execute(itemSql, [
                order.id,
                productId,
                item.name || "Unknown Product",
                Number(item.quantity) || 1,
                Number(item.price) || 0,
                itemCommission,
                item.color || null,
                item.size || null,
                item.sku || null
            ]);

            const currentQuantity = product.quantity || 0;
            const detailedVariants = typeof product.detailedVariants === 'string' ? JSON.parse(product.detailedVariants || '[]') : (product.detailedVariants || []);
            const newTotalQuantity = Math.max(0, currentQuantity - (Number(item.quantity) || 0));

            let updatedVariants = detailedVariants;
            if (item.color && item.size && detailedVariants.length > 0) {
                updatedVariants = detailedVariants.map(variant => {
                    const vColor = (variant.color || "").trim().toLowerCase();
                    const vSize = (variant.size || "").trim().toLowerCase();
                    const iColor = (item.color || "").trim().toLowerCase();
                    const iSize = (item.size || "").trim().toLowerCase();

                    if (vColor === iColor && vSize === iSize) {
                        return { ...variant, quantity: Math.max(0, variant.quantity - (Number(item.quantity) || 0)) };
                    }
                    return variant;
                });
            }

            const updateSql = `UPDATE products SET quantity = ?, detailedVariants = ?, isArchived = ?, status = ? WHERE id = ? `;
            const finalIsArchived = newTotalQuantity <= 0 ? 1 : (product.isArchived || 0);
            const finalStatus = newTotalQuantity <= 0 ? 'archived' : (product.status || 'active');

            await connection.execute(updateSql, [
                newTotalQuantity,
                JSON.stringify(updatedVariants),
                finalIsArchived,
                finalStatus,
                productId
            ]);
        }

        // 5. Commit Transaction
        await connection.commit();
        res.json({ message: "Order created and stock deducted successfully", id: orderId });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("❌ Transaction Error in createOrderWithStock:", err);
        res.status(500).json({
            error: "Order creation failed on server",
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    } finally {
        if (connection) connection.release();
    }
};

const saveOrder = async (req, res) => {
    const fs = require('fs');
    const log = (msg) => { try { fs.appendFileSync('server_debug.log', `[${new Date().toISOString()}] [saveOrder] ${msg}\n`); } catch (e) { console.error(e); } };
    log('HIT');
    const order = req.body;
    const items = order.items || [];
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // --- NEW: Global Logic Centralization (Phase 1: Section & Stock) ---
        // 1. Fetch old status to prevent double-restoration
        const [oldOrderRows] = await connection.execute("SELECT status, section FROM orders WHERE id = ?", [order.id]);
        const oldStatus = oldOrderRows[0]?.status;

        // 2. Auto-assign section based on status
        const sectionMap = {
            'confirmed': 'warehouse',
            'processing': 'warehouse',
            'shipped': 'shipping',
            'in_delivery': 'delivery',
            'delivered': 'collection',
            'partially_delivered': 'collection',
            'delivery_rejected': 'collection',
            'returned': 'archive',
            'cancelled': 'archive',
            'pending': 'orders',
            'suspended': 'orders'
        };
        const determinedSection = sectionMap[order.status];
        if (determinedSection && order.section !== 'archive') {
            order.section = determinedSection;
        }

        // 3. Stock Restoration Logic
        const terminalFailureStatuses = ['cancelled', 'returned', 'delivery_rejected'];
        if (terminalFailureStatuses.includes(order.status) && !terminalFailureStatuses.includes(oldStatus)) {
            await restoreOrderStock(order, connection);
        } else if (order.status === 'partially_delivered' && oldStatus !== 'partially_delivered') {
            await restoreOrderItemsStock(order, connection);
        }

        // 4. Notification Logic
        if (order.status !== oldStatus) {
            await sendOrderStatusNotification(order, order.status, connection);
        }
        // --------------------------------------------------------------------

        const sql = `INSERT INTO orders (
            id, orderNumber, customerName, customerPhone, customerPhone2, customerAddress,
            province, city, items, status, section, totalAmount,
            commission, createdAt, marketer_id, marketer_name,
            cancellation_reason, shipping_cost, discount, notes, payment_method, payment_status,
            shippingCompany, trackingNumber, shippingDate, store_page
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            customerName = VALUES(customerName),
            customerPhone = VALUES(customerPhone),
            customerPhone2 = VALUES(customerPhone2),
            customerAddress = VALUES(customerAddress),
            province = VALUES(province),
            city = VALUES(city),
            items = VALUES(items),
            status = VALUES(status),
            section = VALUES(section),
            totalAmount = VALUES(totalAmount),
            commission = VALUES(commission),
            cancellation_reason = VALUES(cancellation_reason),
            shipping_cost = VALUES(shipping_cost),
            discount = VALUES(discount),
            notes = VALUES(notes),
            payment_method = VALUES(payment_method),
            payment_status = VALUES(payment_status),
            shippingCompany = VALUES(shippingCompany),
            trackingNumber = VALUES(trackingNumber),
            shippingDate = VALUES(shippingDate),
            store_page = VALUES(store_page),
            updated_at = CURRENT_TIMESTAMP`;

        const params = [
            order.id, order.orderNumber, order.customerName, order.customerPhone || order.phone || "", order.customerPhone2 || order.alternativePhone || "", order.customerAddress,
            order.province, order.city, JSON.stringify(order.items), order.status, order.section || 'payment_confirmation', order.totalAmount,
            order.commission, order.createdAt ? new Date(order.createdAt) : new Date(),
            order.marketerId || order.marketer_id || null, order.marketerName || order.marketer_name || "",
            order.cancellationReason || order.cancellation_reason || null,
            order.shippingFee || 0, order.discount || 0,
            order.notes || order.customerNotes || null,
            order.paymentMethod || 'cash',
            order.paymentStatus || 'unpaid',
            order.shippingCompany || null,
            order.trackingNumber || null,
            order.shippingDate || null,
            order.storePage || order.store_page || null
        ];

        await connection.execute(sql, params);

        // --- NEW: Update sales_count if status is delivered or partially_delivered ---
        if (order.status === 'delivered') {
            for (const item of items) {
                const productId = item.productId || item.id || item.product_id;
                const qty = parseInt(item.quantity, 10) || 0;
                if (productId && qty > 0) {
                    await connection.execute(
                        "UPDATE products SET sales_count = sales_count + ? WHERE id = ?",
                        [qty, productId]
                    );
                }
            }
        }
        // ------------------------------------------------------

        // --- NEW: Centralized Commission Logic (Strict: Delivery/Terminal Only) ---
        let syncedMarketerId = null;
        const mId = (order.marketerId || order.marketer_id || '').toString().trim();
        const triggerStatuses = ['delivered', 'partially_delivered', 'cancelled', 'returned', 'delivery_rejected'];

        if (mId && mId !== 'null' && triggerStatuses.includes(order.status)) {
            syncedMarketerId = await ensureOrderCommission(order, items, connection);
        }
        // ------------------------------------------

        await connection.commit();

        if (syncedMarketerId) {
            syncMarketerStats(syncedMarketerId).catch(err => console.error("Stats sync failed:", err));
        }

        res.json({ message: "Order saved and logic synced", id: order.id, order: order });
    } catch (err) {
        if (connection) await connection.rollback();
        const fs = require('fs');
        try { fs.appendFileSync('server_debug.log', `[${new Date().toISOString()}] [saveOrder] ERROR: ${err.message}\nStack: ${err.stack}\n`); } catch (e) { console.error(e); }
        console.error("❌ saveOrder Transaction Error:", err.message);

        res.status(400).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

const getFinancialReport = (req, res) => {
    const { year, month, dateRange, marketerId } = req.query;

    let sql = `
        SELECT 
            oi.product_name, oi.quantity, oi.price, oi.commission as itemCommission,
            p.wholesalePrice,
            o.id as orderId, o.orderNumber, o.status, o.createdAt, o.marketer_name
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.status IN ('delivered', 'partially_delivered')
    `;
    const params = [];

    if (marketerId && marketerId !== 'all') {
        sql += " AND o.marketer_id = ?";
        params.push(marketerId);
    }

    if (dateRange === 'month' && year && month) {
        sql += " AND YEAR(o.createdAt) = ? AND MONTH(o.createdAt) = ?";
        params.push(year.toString(), (parseInt(month) + 1).toString());
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });

        let totalSales = 0;
        let totalCost = 0;
        let totalCommission = 0;
        const reportItems = [];

        rows.forEach(row => {
            const revenue = row.price * row.quantity;
            const cost = (row.wholesalePrice || 0) * row.quantity;
            const comm = row.itemCommission * row.quantity;

            totalSales += revenue;
            totalCost += cost;
            totalCommission += comm;

            reportItems.push({
                orderId: row.orderId,
                orderNumber: row.orderNumber,
                productName: row.product_name,
                quantity: row.quantity,
                wholesalePrice: row.wholesalePrice || 0,
                sellingPrice: row.price,
                commission: comm,
                totalRevenue: revenue,
                netProfit: revenue - cost - comm,
                status: row.status,
                date: row.createdAt,
                marketerName: row.marketer_name
            });
        });

        res.json({
            items: reportItems,
            summary: {
                totalSales,
                totalCost,
                totalCommission,
                netProfit: totalSales - totalCost - totalCommission
            }
        });
    });
};

const searchOrders = (req, res) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Search query is required' });
    }

    const query = q.trim();
    const searchPattern = `% ${query}% `;

    const sql = `
        SELECT orders.*, marketers.phone as marketerPhone FROM orders
        LEFT JOIN marketers ON orders.marketer_id = marketers.id
        WHERE orderNumber LIKE ?
    OR customerName LIKE ?
        OR customerPhone LIKE ?
            OR customerPhone2 LIKE ?
                LIMIT 50
                    `;

    db.all(sql, [searchPattern, searchPattern, searchPattern, searchPattern], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });

        const orders = rows.map(o => ({
            ...o,
            items: JSON.parse(o.items || '[]')
        }));

        res.json(orders);
    });
};

const getOrderStats = (req, res) => {
    const { marketerId } = req.query;
    let sectionSql = "SELECT section, COUNT(*) as count FROM orders";
    let summarySql = "SELECT SUM(totalAmount) as totalSales, SUM(commission) as totalCommission, COUNT(*) as totalOrders FROM orders";
    const params = [];

    if (marketerId) {
        sectionSql += " WHERE marketer_id = ?";
        summarySql += " WHERE marketer_id = ?";
        params.push(marketerId);
    }

    sectionSql += " GROUP BY section";

    db.all(sectionSql, params, (err, sectionRows) => {
        if (err) return res.status(400).json({ error: err.message });

        db.get(summarySql, params, (err, summaryRow) => {
            if (err) return res.status(400).json({ error: err.message });

            const sections = {
                payment_confirmation: 0, orders: 0, warehouse: 0, shipping: 0, delivery: 0, collection: 0, archive: 0
            };
            sectionRows.forEach(row => {
                const s = row.section || "orders";
                if (sections[s] !== undefined) sections[s] = row.count;
            });

            res.json({
                sections,
                summary: {
                    totalSales: summaryRow.totalSales || 0,
                    totalCommission: summaryRow.totalCommission || 0,
                    totalOrders: summaryRow.totalOrders || 0
                }
            });
        });
    });
};

const deleteOrder = (req, res) => {
    const sql = "DELETE FROM orders WHERE id = ?";
    db.run(sql, [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Order deleted" });
    });
};

const confirmPayment = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Update order with paid amount and move to 'orders' section
        const sql = `UPDATE orders SET 
            paid_amount = ?, 
            section = 'orders',
            status = 'pending',
            updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`;

        await connection.execute(sql, [amount || 0, id]);

        // 2. Fetch order to send notification
        const [orderRows] = await connection.execute("SELECT * FROM orders WHERE id = ?", [id]);
        if (orderRows && orderRows.length > 0) {
            await sendOrderStatusNotification(orderRows[0], 'pending', connection);
        }

        await connection.commit();
        res.json({ message: "تم تأكيد الدفع ونقل الطلب للمخزن بنجاح", id, paidAmount: amount });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("❌ confirmPayment Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getOrders,
    getOrderStats,
    getFinancialReport,
    searchOrders,
    createOrderWithStock,
    confirmPayment,
    saveOrder,
    deleteOrder
};
