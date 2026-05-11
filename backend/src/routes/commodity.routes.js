const express = require('express');
const router = express.Router();
const commodityController = require('../controllers/commodity.controller');
const { body } = require('express-validator');

// Register commodity batch
router.post('/register', [
  body('batchId').notEmpty().withMessage('Batch ID is required'),
  body('type').notEmpty().withMessage('Commodity type is required'),
  body('weight').notEmpty().withMessage('Weight is required'),
  body('origin').notEmpty().withMessage('Origin is required'),
  body('producerId').notEmpty().withMessage('Producer ID is required')
], commodityController.registerCommodity);

// Get commodity details
router.get('/:batchId', commodityController.getCommodity);

// List commodities by producer
router.get('/producer/:producerId', commodityController.getCommoditiesByProducer);

// Update commodity status
router.patch('/:batchId/status', [
  body('status').isIn(['registered', 'verified', 'stored', 'transferred', 'redeemed']).withMessage('Invalid status')
], commodityController.updateCommodityStatus);

module.exports = router;
