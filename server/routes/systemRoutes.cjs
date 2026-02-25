const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/db-stats', (req, res) => {
    try {
        const serverDir = path.join(__dirname, '..');
        console.log('--- DB Stats Scan ---');
        console.log('Path:', serverDir);
        const files = fs.readdirSync(serverDir);
        console.log('Files found:', files.length);

        const sqliteFiles = files.filter(file => file.endsWith('.sqlite'));
        const dbDetails = sqliteFiles.map(file => {
            const filePath = path.join(serverDir, file);
            const stats = fs.statSync(filePath);
            return { name: file, size: stats.size };
        });

        // Query MySQL for its size
        const mysqlSizeSql = `
            SELECT SUM(data_length + index_length) as size 
            FROM information_schema.TABLES 
            WHERE table_schema = 'afleet_db'
        `;

        const db = require('../database.cjs');
        db.get(mysqlSizeSql, [], (err, row) => {
            const mysqlSize = row ? Number(row.size) : 0;
            const totalSize = dbDetails.reduce((acc, d) => acc + d.size, 0) + mysqlSize;

            if (mysqlSize > 0) {
                dbDetails.push({ name: 'MySQL (afleet_db)', size: mysqlSize });
            }

            const quota = 1000 * 1024 * 1024; // Increase quota to 1GB for MySQL

            res.json({
                totalSize,
                quota,
                databases: dbDetails,
                percentage: Math.min(100, (totalSize / quota) * 100)
            });
        });
    } catch (error) {
        console.error('Error fetching DB stats:', error);
        res.status(500).json({ error: 'Failed to fetch database statistics' });
    }
});

module.exports = router;
