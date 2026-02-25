// server/routes/shippingRoutes.cjs
'use strict';

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware.cjs');
const ctrl = require('../controllers/shippingController.cjs');

// Public endpoint — store needs to fetch fees without login
router.get('/fee', ctrl.getShippingFee);

// Protected endpoints — admin only
router.use(verifyToken);

// Shipping Areas (zones)
router.get('/areas', ctrl.getShippingAreas);
router.post('/areas', ctrl.addShippingArea);
router.put('/areas/:id', ctrl.updateShippingArea);
router.delete('/areas/:id', ctrl.deleteShippingArea);

// Shipping Companies
router.get('/companies', ctrl.getShippingCompanies);
router.post('/companies', ctrl.addShippingCompany);
router.put('/companies/:id', ctrl.updateShippingCompany);
router.delete('/companies/:id', ctrl.deleteShippingCompany);

module.exports = router;
