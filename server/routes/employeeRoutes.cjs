const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController.cjs');

const { verifyToken, requirePermission } = require('../middleware/authMiddleware.cjs');

// All Employee routes require authentication
router.use(verifyToken);

// Viewing/Managing employees requires specific permission
router.get('/', requirePermission('employees'), employeeController.getEmployees);
router.post('/', requirePermission('employees'), employeeController.saveEmployee);
router.delete('/:id', requirePermission('employees'), employeeController.deleteEmployee);

// Heartbeat is for any logged-in employee to update their status
router.post('/heartbeat', employeeController.updateActivity);

module.exports = router;
