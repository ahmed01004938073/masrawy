const db = require('../database.cjs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const logDebug = (msg) => {
    console.log(`[EmployeeController] ${msg}`);
};

const getEmployees = (req, res) => {
    // Calculate seconds since last activity and last real action directly in SQL using Local Time (NOW)
    const sql = `
        SELECT *, 
        ABS(TIMESTAMPDIFF(SECOND, NOW(), lastActive)) as secondsSinceActive,
        ABS(TIMESTAMPDIFF(SECOND, NOW(), IFNULL(lastActionTime, lastActive))) as secondsSinceRealAction
        FROM employees
    `;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });

        const employees = rows.map(emp => {
            // Online: Heartbeat within 3 mins (180s)
            const isOnline = emp.lastActive ? (emp.secondsSinceActive < 180) : false;
            // Active Worker: Real action within 5 mins (300s)
            const isActiveWorker = isOnline && emp.lastActionTime && (emp.secondsSinceRealAction < 300);

            let permissions = [];
            if (emp.permissions && typeof emp.permissions === 'string') {
                try { permissions = JSON.parse(emp.permissions); } catch (e) { permissions = []; }
            }

            let accessibleSections = [];
            if (emp.accessibleSections && typeof emp.accessibleSections === 'string') {
                try { accessibleSections = JSON.parse(emp.accessibleSections); } catch (e) { accessibleSections = []; }
            }

            return {
                ...emp,
                permissions,
                accessibleSections,
                isOnline,
                isActiveWorker
            };
        });

        res.json(employees);
    });
};

const saveEmployee = async (req, res) => {
    try {
        const { id, ...emp } = req.body;
        logDebug(`saveEmployee called. ID: ${id}, Data keys: ${Object.keys(emp).join(', ')}`);

        if (!id) {
            return res.status(400).json({ error: "Missing employee ID" });
        }

        const existing = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM employees WHERE id = ?", [id], (err, row) => {
                if (err) reject(err); else resolve(row);
            });
        });

        if (existing) {
            const updates = [];
            const params = [];

            const addField = (field, value) => {
                if (value !== undefined) {
                    updates.push(`${field} = ?`);
                    params.push(value === undefined ? null : value);
                }
            };

            addField('name', emp.name);
            addField('email', emp.email);
            addField('phone', emp.phone);

            const role = emp.role ? emp.role.toLowerCase() : undefined;
            if (role) addField('role', role);

            if (emp.password && emp.password.trim().length > 0) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(emp.password, salt);
                addField('password', hashedPassword);
            }

            if (emp.permissions !== undefined) {
                addField('permissions', JSON.stringify(emp.permissions || []));
            }
            if (emp.accessibleSections !== undefined) {
                addField('accessibleSections', JSON.stringify(emp.accessibleSections || []));
            }

            const isActiveVal = (emp.status === 'active' || emp.isActive === true || emp.isActive === 1) ? 1 : 0;
            addField('isActive', isActiveVal);
            addField('active', isActiveVal);

            addField('updatedAt', new Date().toISOString());

            if (updates.length > 0) {
                const sql = `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`;
                params.push(id);
                console.log("🚀 Executing UPDATE SQL:", sql);
                await new Promise((resolve, reject) => {
                    db.run(sql, params, (err) => {
                        if (err) reject(err); else resolve();
                    });
                });
            }
            console.log("✅ Employee updated successfully");
            return res.json({ message: "Employee updated", id });

        } else {
            if (!emp.name || !emp.email || !emp.password || !emp.role) {
                return res.status(400).json({ error: "Name, email, password, and role are required for new employees" });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(emp.password, salt);

            const isActiveVal = (emp.status === 'active' || emp.isActive === true || emp.isActive === 1) ? 1 : 0;

            const role = emp.role.toLowerCase();

            const permissions = emp.permissions || [];
            const accessibleSections = emp.accessibleSections || permissions.map(p => p.section) || [];

            const sql = `INSERT INTO employees (
                id, name, email, password, phone, role, accessibleSections, permissions, isActive, active, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = [
                id, emp.name, emp.email, hashedPassword, emp.phone || null, role,
                JSON.stringify(accessibleSections),
                JSON.stringify(permissions),
                isActiveVal,
                isActiveVal,
                emp.createdAt || new Date().toISOString(),
                new Date().toISOString()
            ];

            logDebug(`🚀 Executing INSERT SQL with params: ${JSON.stringify(params)}`);
            await new Promise((resolve, reject) => {
                db.run(sql, params, (err) => {
                    if (err) reject(err); else resolve();
                });
            });
            logDebug("✅ Employee created successfully");
            return res.json({ message: "Employee created", id });
        }
    } catch (error) {
        logDebug(`🔥 DATABASE/SYSTEM ERROR in saveEmployee: ${error.message}`);
        return res.status(500).json({ error: "خطأ في معالجة طلب الحفظ: " + error.message });
    }
};

const deleteEmployee = (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing employee ID" });

    db.get("SELECT email, role FROM employees WHERE id = ?", [id], (err, emp) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!emp) return res.status(404).json({ error: "Employee not found" });

        if (emp.role === 'admin' && emp.email === 'admin@afleet.com') {
            return res.status(403).json({ error: "لا يمكن حذف مدير النظام الرئيسي" });
        }

        const sql = "DELETE FROM employees WHERE id = ?";
        db.run(sql, [id], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ success: true, message: "Employee deleted" });
        });
    });
};

const updateActivity = (req, res) => {
    const { id, page, actionType } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Missing employee ID" });
    }

    // Always update lastActive (heartbeat)
    let sql = "UPDATE employees SET lastActive = NOW()";
    let params = [];

    if (page) {
        sql += ", lastPage = ?";
        params.push(page);
    }

    if (actionType) {
        // If a real action is performed, update lastActionType and lastActionTime
        sql += ", lastActionType = ?, lastActionTime = NOW()";
        params.push(actionType);
    }

    sql += " WHERE id = ?";
    params.push(id);

    db.run(sql, params, function (err) {
        if (err) {
            console.error(`❌ Activity Update Error for ${id}:`, err.message);
            return res.status(400).json({ error: err.message });
        }
        res.json({ success: true });
    });
};

module.exports = {
    getEmployees,
    saveEmployee,
    deleteEmployee,
    updateActivity
};
