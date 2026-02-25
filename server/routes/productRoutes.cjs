const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController.cjs');

const { verifyToken, requirePermission } = require('../middleware/authMiddleware.cjs');

// Public route (Store needs to read products)
router.get('/', productController.getProducts);

// Protected routes (Only employees with 'products' permission can edit)
router.post('/', verifyToken, requirePermission('products'), productController.saveProduct);
router.delete('/:id', verifyToken, requirePermission('products'), productController.deleteProduct);

module.exports = router;
