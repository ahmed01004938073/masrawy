const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/marketerController.cjs');
const { verifyToken } = require('../middleware/authMiddleware.cjs');

// Marketers
// Public Registration
router.post('/register', ctrl.saveMarketer); // Reusing save logic but exposed securely for new signups

// All other routes require authentication (Marketer or Employee)
router.use(verifyToken);

const { requirePermission } = require('../middleware/authMiddleware.cjs');

// Management Routes (Admin/Employee only)
router.get('/', requirePermission('marketers'), ctrl.getMarketers); // List all
router.post('/', requirePermission('marketers'), ctrl.saveMarketer); // Edit/Add by Admin
router.delete('/:id', requirePermission('marketers'), ctrl.deleteMarketer); // Delete

// Marketer Personal Data & Operations (Accessible by Marketer for themselves, or Admin)
// Note: Controllers should ideally validate that a Marketer is accessing ONLY their own data.
// For now, having a valid Token is the baseline.

// Commissions
router.get('/commissions', ctrl.getCommissions);
router.post('/commissions', ctrl.saveCommission);

// Withdrawals
router.get('/withdrawals', ctrl.getWithdrawals);
router.post('/withdrawals', ctrl.saveWithdrawal);

// Carts
router.get('/cart/:userId', ctrl.getCart);
router.post('/cart', ctrl.saveCart);

// Statistics
router.get('/stats', ctrl.getMarketerStats);
router.post('/stats/:marketerId/update', ctrl.updateMarketerStatsInternal);

// Profile Update (Self)
router.post('/profile', ctrl.updateProfile);

// Saved Wallets
router.get('/wallets/:marketerId', ctrl.getSavedWallets);
router.post('/wallets', ctrl.saveWallet);

module.exports = router;
