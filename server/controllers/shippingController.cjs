// server/controllers/shippingController.cjs
'use strict';

const db = require('../database.cjs');

// ===============================
// SHIPPING COMPANIES
// ===============================

const getShippingCompanies = async (req, res) => {
    try {
        const rows = await db.allAsync(
            `SELECT id, name, phone, email, address, 
              COALESCE(website, '') AS website, 
              COALESCE(whatsapp, '') AS whatsapp,
              shipping_fee, balance, is_active AS isActive,
              created_at, updated_at
       FROM shipping_companies ORDER BY created_at DESC`
        );
        // Format ids as strings for frontend compatibility
        res.json(rows.map(r => ({ ...r, id: String(r.id) })));
    } catch (err) {
        console.error('getShippingCompanies error:', err);
        res.status(500).json({ error: err.message });
    }
};

const addShippingCompany = async (req, res) => {
    try {
        const { name, phone, email, address, website, whatsapp, shipping_fee, balance, isActive } = req.body;
        if (!name) return res.status(400).json({ error: 'name is required' });

        const result = await db.runAsync(
            `INSERT INTO shipping_companies (name, phone, email, address, website, whatsapp, shipping_fee, balance, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, phone || null, email || null, address || null, website || null, whatsapp || null, shipping_fee || 0, balance || 0, isActive !== false ? 1 : 0]
        );
        const newCompany = await db.getAsync(
            `SELECT * FROM shipping_companies WHERE id = ?`, [result.lastID]
        );
        res.status(201).json({ ...newCompany, id: String(newCompany.id) });
    } catch (err) {
        console.error('addShippingCompany error:', err);
        res.status(500).json({ error: err.message });
    }
};

const updateShippingCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address, website, whatsapp, shipping_fee, balance, isActive } = req.body;

        await db.runAsync(
            `UPDATE shipping_companies 
       SET name = COALESCE(?, name),
           phone = ?,
           email = ?,
           address = ?,
           website = ?,
           whatsapp = ?,
           shipping_fee = COALESCE(?, shipping_fee),
           balance = COALESCE(?, balance),
           is_active = COALESCE(?, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [name, phone || null, email || null, address || null, website || null, whatsapp || null,
                shipping_fee !== undefined ? shipping_fee : null,
                balance !== undefined ? balance : null,
                isActive !== undefined ? (isActive ? 1 : 0) : null, id]
        );
        const updated = await db.getAsync(`SELECT * FROM shipping_companies WHERE id = ?`, [id]);
        if (!updated) return res.status(404).json({ error: 'Company not found' });
        res.json({ ...updated, id: String(updated.id) });
    } catch (err) {
        console.error('updateShippingCompany error:', err);
        res.status(500).json({ error: err.message });
    }
};

const deleteShippingCompany = async (req, res) => {
    try {
        const { id } = req.params;
        await db.runAsync(`DELETE FROM shipping_companies WHERE id = ?`, [id]);
        res.json({ message: 'Shipping company deleted' });
    } catch (err) {
        console.error('deleteShippingCompany error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// SHIPPING AREAS (shipping_zones table)
// shipping_zones has: id, province_name_ar, shipping_fee, + we add cities JSON
// ===============================

const getShippingAreas = async (req, res) => {
    try {
        const rows = await db.allAsync(
            `SELECT id, province_name_ar AS governorate, shipping_fee AS price, 
              COALESCE(cities_json, '[]') AS cities_json,
              created_at, updated_at
       FROM shipping_zones ORDER BY id ASC`
        );
        const areas = rows.map(r => {
            let cities = [];
            try { cities = JSON.parse(r.cities_json || '[]'); } catch (e) { }
            return {
                id: String(r.id),
                governorate: r.governorate,
                price: Number(r.price),
                cities,
                createdAt: r.created_at,
                updatedAt: r.updated_at
            };
        });
        res.json(areas);
    } catch (err) {
        console.error('getShippingAreas error:', err);
        res.status(500).json({ error: err.message });
    }
};

const addShippingArea = async (req, res) => {
    try {
        const { governorate, cities, price } = req.body;
        if (!governorate) return res.status(400).json({ error: 'governorate is required' });

        const result = await db.runAsync(
            `INSERT INTO shipping_zones (province_name_ar, shipping_fee, cities_json) VALUES (?, ?, ?)`,
            [governorate, price || 0, JSON.stringify(cities || [])]
        );
        const newArea = {
            id: String(result.lastID),
            governorate,
            price: Number(price || 0),
            cities: cities || [],
            createdAt: new Date().toISOString()
        };
        res.status(201).json(newArea);
    } catch (err) {
        console.error('addShippingArea error:', err);
        res.status(500).json({ error: err.message });
    }
};

const updateShippingArea = async (req, res) => {
    try {
        const { id } = req.params;
        const { governorate, cities, price } = req.body;

        await db.runAsync(
            `UPDATE shipping_zones 
       SET province_name_ar = COALESCE(?, province_name_ar),
           shipping_fee = COALESCE(?, shipping_fee),
           cities_json = COALESCE(?, cities_json),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [governorate || null, price !== undefined ? price : null, cities ? JSON.stringify(cities) : null, id]
        );
        const updated = await db.getAsync(`SELECT * FROM shipping_zones WHERE id = ?`, [id]);
        if (!updated) return res.status(404).json({ error: 'Shipping area not found' });

        let parsedCities = [];
        try { parsedCities = JSON.parse(updated.cities_json || '[]'); } catch (e) { }

        res.json({
            id: String(updated.id),
            governorate: updated.province_name_ar,
            price: Number(updated.shipping_fee),
            cities: parsedCities,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at
        });
    } catch (err) {
        console.error('updateShippingArea error:', err);
        res.status(500).json({ error: err.message });
    }
};

const deleteShippingArea = async (req, res) => {
    try {
        const { id } = req.params;
        await db.runAsync(`DELETE FROM shipping_zones WHERE id = ?`, [id]);
        res.json({ message: 'Shipping area deleted' });
    } catch (err) {
        console.error('deleteShippingArea error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// SHIPPING FEE LOOKUP
// ===============================

const getShippingFee = async (req, res) => {
    try {
        const { governorate, city } = req.query;

        const rows = await db.allAsync(`SELECT * FROM shipping_zones`);
        let area = null;

        // Exact match: governorate + city
        if (city) {
            area = rows.find(r => {
                if (r.province_name_ar !== governorate) return false;
                try {
                    const cities = JSON.parse(r.cities_json || '[]');
                    return cities.includes(city);
                } catch { return false; }
            });
        }

        // Fallback: governorate only
        if (!area) {
            area = rows.find(r => r.province_name_ar === governorate);
        }

        const fee = area ? Number(area.shipping_fee) : 50;
        res.json({ fee, governorate, city: city || null });
    } catch (err) {
        console.error('getShippingFee error:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getShippingCompanies,
    addShippingCompany,
    updateShippingCompany,
    deleteShippingCompany,
    getShippingAreas,
    addShippingArea,
    updateShippingArea,
    deleteShippingArea,
    getShippingFee
};
