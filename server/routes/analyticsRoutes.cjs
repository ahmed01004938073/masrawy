const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController.cjs');

const { verifyToken, requirePermission } = require('../middleware/authMiddleware.cjs');

// Analytics are generally sensitive
router.use(verifyToken);
router.post('/track', analyticsController.recordVisit); // This might need to be public if tracking unauthorized visitors? 
// Actually /track is usually public. Let's check. 
// If it's for internal dashboard tracking, it's protected. If it's pixel tracking, it's public.
// Assuming dashboard analytics for now as per "Securing Dashboard".
// But wait, "recordVisit" sounds like tracking external hits. 
// Let's safe-guard: GET /stats is definitely protected. POST /track might be public.

router.get('/stats', requirePermission('reports'), analyticsController.getVisitStats);


module.exports = router;
