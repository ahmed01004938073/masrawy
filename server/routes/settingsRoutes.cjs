const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController.cjs');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware.cjs');

router.get('/:key', settingsController.getSetting);
// Protect the save route
// Protect the save route
router.post('/', verifyToken, settingsController.saveSetting);

// Backup & Audit
router.get('/data/audit-logs', verifyToken, requireAdmin, settingsController.getAuditLogs);
router.get('/data/backup', verifyToken, requireAdmin, settingsController.createBackup);

module.exports = router;
