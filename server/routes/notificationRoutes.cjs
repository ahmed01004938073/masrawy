const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController.cjs');
const { verifyToken } = require('../middleware/authMiddleware.cjs');

router.use(verifyToken);

router.get('/', ctrl.getNotifications);
router.post('/:id/read', ctrl.markAsRead);
router.delete('/:id', ctrl.deleteNotification);
router.delete('/clear-all', ctrl.clearAll);

module.exports = router;
