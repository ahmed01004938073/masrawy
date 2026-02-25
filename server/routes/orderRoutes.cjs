const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController.cjs');

const { verifyToken, requirePermission } = require('../middleware/authMiddleware.cjs');

// Public/Store Routes
router.get('/', orderController.getOrders); // Needs to be public for Marketers/Store to fetch their orders (logic inside controller handles filtering)
router.get('/stats', orderController.getOrderStats);
router.get('/search', orderController.searchOrders);
router.get('/reports/financial', orderController.getFinancialReport);
// Protected Dashboard Routes (Update/Delete)
// Note: create-with-stock is now protected as Marketers have valid tokens
router.post('/create-with-stock', verifyToken, orderController.createOrderWithStock);
router.post('/:id/confirm-payment', verifyToken, orderController.confirmPayment);
router.post('/', verifyToken, requirePermission('orders'), orderController.saveOrder); // Updates are Dashboard only
router.delete('/:id', verifyToken, requirePermission('orders'), orderController.deleteOrder); // Deletion is Dashboard only

module.exports = router;
