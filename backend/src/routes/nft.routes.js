const express = require('express');
const router = express.Router();
const nftController = require('../controllers/nft.controller');
const { body } = require('express-validator');

// Mint NFT
router.post('/mint', [
  body('assetCode').notEmpty().withMessage('Asset code is required'),
  body('commodityDetails').notEmpty().withMessage('Commodity details are required'),
  body('custodian').notEmpty().withMessage('Custodian information is required'),
  body('receiverPublicKey').isLength({ min: 56, max: 56 }).withMessage('Valid Stellar public key is required')
], nftController.mintNFT);

// Transfer Ownership
router.post('/transfer', [
  body('assetCode').notEmpty().withMessage('Asset code is required'),
  body('issuer').notEmpty().withMessage('Issuer is required'),
  body('fromSecret').notEmpty().withMessage('From secret key is required'),
  body('toPublicKey').isLength({ min: 56, max: 56 }).withMessage('Valid Stellar public key is required')
], nftController.transferOwnership);

// Verify Ownership
router.get('/verify/:assetCode/:issuer', nftController.verifyOwnership);

// Burn/Redeem NFT
router.post('/burn', [
  body('assetCode').notEmpty().withMessage('Asset code is required'),
  body('issuer').notEmpty().withMessage('Issuer is required'),
  body('ownerSecret').notEmpty().withMessage('Owner secret key is required')
], nftController.burnNFT);

module.exports = router;
