const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.cjs');

router.post('/login', authController.login);
router.post('/session/validate', authController.validateSession);
router.post('/logout', authController.logout);

// Marketer Login
router.post('/marketer/login', authController.marketerLogin);

// Forgot Password (Public)
router.post('/forgot-password/verify', authController.forgotPasswordVerify);
router.post('/forgot-password/reset', authController.resetPassword);

module.exports = router;
