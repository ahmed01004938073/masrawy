const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController.cjs');

const { verifyToken, requirePermission } = require('../middleware/authMiddleware.cjs');

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected: Edit/Delete Categories requires 'products' permission (as it's part of product management)
router.post('/', verifyToken, requirePermission('products'), categoryController.saveCategory);
router.delete('/:id', verifyToken, requirePermission('products'), categoryController.deleteCategory);

router.post('/toggle-active', verifyToken, requirePermission('products'), categoryController.toggleCategoryActive);

module.exports = router;
