const { validationResult } = require('express-validator');
const stellarService = require('../services/stellar.service');
const ipfsService = require('../services/ipfs.service');
const NFTModel = require('../models/nft.model');
const CommodityModel = require('../models/commodity.model');

class NFTController {
  /**
   * Mint a new commodity NFT
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async mintNFT(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { assetCode, commodityDetails, custodian, receiverPublicKey } = req.body;

      // Check if NFT with this asset code already exists
      const existingNFT = await NFTModel.findByAssetCode(assetCode);
      if (existingNFT) {
        return res.status(409).json({
          success: false,
          error: 'NFT with this asset code already exists'
        });
      }

      // Find the commodity
      const commodity = await CommodityModel.findByBatchId(commodityDetails.batchId);
      if (!commodity) {
        return res.status(404).json({
          success: false,
          error: 'Commodity not found'
        });
      }

      // Create metadata
      const metadata = ipfsService.createCommodityMetadata(
        commodityDetails,
        custodian,
        {
          inspector: commodityDetails.inspector || 'Pending',
          date: commodityDetails.inspectionDate,
          reportHash: commodityDetails.reportHash
        },
        commodityDetails.imageHash
      );

      // Validate metadata
      if (!ipfsService.validateMetadata(metadata)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid metadata structure'
        });
      }

      // Upload metadata to IPFS
      const ipfsHash = await ipfsService.uploadMetadata(metadata);

      // Mint NFT on Stellar
      const stellarResult = await stellarService.mintCommodityNFT(
        assetCode,
        ipfsHash,
        receiverPublicKey
      );

      // Create NFT record in database
      const nftRecord = await NFTModel.create({
        assetCode,
        issuerPublicKey: stellarResult.issuer,
        currentOwner: receiverPublicKey,
        ipfsHash,
        transactionHash: stellarResult.transactionHash,
        commodityId: commodity.id
      });

      // Create mint transaction record
      await NFTModel.createTransaction({
        nftId: nftRecord.id,
        fromAddress: stellarResult.issuer,
        toAddress: receiverPublicKey,
        transactionType: 'MINTED',
        transactionHash: stellarResult.transactionHash,
        userId: commodity.producerId
      });

      // Update commodity with NFT information
      await CommodityModel.updateWithNFT(commodityDetails.batchId, {
        ipfsHash
      });

      res.status(201).json({
        success: true,
        data: {
          transactionHash: stellarResult.transactionHash,
          assetCode,
          issuer: stellarResult.issuer,
          ipfsHash,
          receiver: receiverPublicKey,
          nftId: nftRecord.id,
          metadata
        }
      });
    } catch (error) {
      console.error('Error minting NFT:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Transfer NFT ownership
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async transferOwnership(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { assetCode, issuer, fromSecret, toPublicKey } = req.body;

      // Find NFT
      const nft = await NFTModel.findByAssetCode(assetCode);
      if (!nft) {
        return res.status(404).json({
          success: false,
          error: 'NFT not found'
        });
      }

      if (nft.isBurned) {
        return res.status(400).json({
          success: false,
          error: 'Cannot transfer burned NFT'
        });
      }

      // Verify current ownership
      const StellarSdk = require('@stellar/stellar-sdk');
      const fromKeypair = StellarSdk.Keypair.fromSecret(fromSecret);
      if (nft.currentOwner !== fromKeypair.publicKey()) {
        return res.status(403).json({
          success: false,
          error: 'Not the current owner of this NFT'
        });
      }

      // Transfer on Stellar
      const stellarResult = await stellarService.transferNFT(
        assetCode,
        issuer,
        fromSecret,
        toPublicKey
      );

      // Update NFT ownership in database
      const updatedNFT = await NFTModel.updateOwnership(
        assetCode,
        toPublicKey,
        stellarResult.transactionHash
      );

      // Create transfer transaction record
      await NFTModel.createTransaction({
        nftId: nft.id,
        fromAddress: fromKeypair.publicKey(),
        toAddress: toPublicKey,
        transactionType: 'TRANSFERRED',
        transactionHash: stellarResult.transactionHash,
        userId: req.user?.id || null
      });

      // Update commodity status
      await CommodityModel.updateStatus(nft.commodity.batchId, 'TRANSFERRED');

      res.json({
        success: true,
        data: {
          transactionHash: stellarResult.transactionHash,
          assetCode,
          from: fromKeypair.publicKey(),
          to: toPublicKey,
          newOwner: toPublicKey
        }
      });
    } catch (error) {
      console.error('Error transferring NFT:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Verify NFT ownership
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifyOwnership(req, res) {
    try {
      const { assetCode, issuer } = req.params;

      // Verify on-chain ownership
      const stellarVerification = await stellarService.verifyNFTOwnership(assetCode, issuer);

      if (!stellarVerification.success) {
        return res.status(404).json({
          success: false,
          error: stellarVerification.error
        });
      }

      // Get database record
      const nft = await NFTModel.findByAssetCode(assetCode);
      if (!nft) {
        return res.status(404).json({
          success: false,
          error: 'NFT not found in database'
        });
      }

      // Get metadata from IPFS
      let metadata = null;
      if (stellarVerification.metadata) {
        try {
          metadata = await ipfsService.getMetadata(stellarVerification.metadata);
        } catch (error) {
          console.warn('Could not fetch metadata from IPFS:', error.message);
        }
      }

      res.json({
        success: true,
        data: {
          owner: stellarVerification.owner,
          balance: stellarVerification.balance,
          metadata,
          ipfsHash: stellarVerification.metadata,
          assetCode,
          issuer: stellarVerification.issuer,
          lastModified: stellarVerification.lastModified,
          isBurned: nft.isBurned,
          burnedAt: nft.burnedAt,
          commodity: nft.commodity
        }
      });
    } catch (error) {
      console.error('Error verifying NFT ownership:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Burn/Redeem NFT
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async burnNFT(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { assetCode, issuer, ownerSecret } = req.body;

      // Find NFT
      const nft = await NFTModel.findByAssetCode(assetCode);
      if (!nft) {
        return res.status(404).json({
          success: false,
          error: 'NFT not found'
        });
      }

      if (nft.isBurned) {
        return res.status(400).json({
          success: false,
          error: 'NFT is already burned'
        });
      }

      // Verify ownership
      const StellarSdk = require('@stellar/stellar-sdk');
      const ownerKeypair = StellarSdk.Keypair.fromSecret(ownerSecret);
      if (nft.currentOwner !== ownerKeypair.publicKey()) {
        return res.status(403).json({
          success: false,
          error: 'Not the current owner of this NFT'
        });
      }

      // Burn NFT on Stellar
      const stellarResult = await stellarService.burnNFT(
        assetCode,
        issuer,
        ownerSecret
      );

      // Update NFT in database
      const updatedNFT = await NFTModel.burn(
        assetCode,
        stellarResult.transactionHash
      );

      // Create burn transaction record
      await NFTModel.createTransaction({
        nftId: nft.id,
        fromAddress: ownerKeypair.publicKey(),
        toAddress: issuer,
        transactionType: 'BURNED',
        transactionHash: stellarResult.transactionHash,
        userId: req.user?.id || null
      });

      // Update commodity status
      await CommodityModel.updateStatus(nft.commodity.batchId, 'REDEEMED');

      res.json({
        success: true,
        data: {
          transactionHash: stellarResult.transactionHash,
          assetCode,
          status: 'redeemed',
          redeemedBy: ownerKeypair.publicKey(),
          burnedAt: updatedNFT.burnedAt
        }
      });
    } catch (error) {
      console.error('Error burning NFT:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get NFTs owned by an address
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getOwnedNFTs(req, res) {
    try {
      const { ownerAddress } = req.params;
      const { page = 1, limit = 10, includeBurned = false } = req.query;

      const nfts = await NFTModel.findByOwner(ownerAddress, {
        page: parseInt(page),
        limit: parseInt(limit),
        includeBurned: includeBurned === 'true'
      });

      const statistics = await NFTModel.getStatistics(ownerAddress);

      res.json({
        success: true,
        data: {
          nfts,
          statistics,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting owned NFTs:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get NFT transaction history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTransactionHistory(req, res) {
    try {
      const { assetCode } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const transactions = await NFTModel.getTransactionHistory(assetCode, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting transaction history:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new NFTController();
