const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { body } = require('express-validator');

// SEP-10 Authentication
router.post('/challenge', [
  body('publicKey').isLength({ min: 56, max: 56 }).withMessage('Valid Stellar public key is required')
], authController.getChallenge);

router.post('/verify', [
  body('publicKey').isLength({ min: 56, max: 56 }).withMessage('Valid Stellar public key is required'),
  body('signature').notEmpty().withMessage('Signature is required')
], authController.verifyChallenge);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

module.exports = router;
