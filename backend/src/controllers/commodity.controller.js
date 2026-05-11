const { validationResult } = require('express-validator');
const CommodityModel = require('../models/commodity.model');

class CommodityController {
  /**
   * Register a new commodity batch
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async registerCommodity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        batchId,
        type,
        weight,
        purity,
        origin,
        productionDate,
        producerId,
        custodianId,
        inspectorId,
        inspectionDate,
        reportHash,
        imageHash
      } = req.body;

      // Check if commodity with this batch ID already exists
      const existingCommodity = await CommodityModel.findByBatchId(batchId);
      if (existingCommodity) {
        return res.status(409).json({
          success: false,
          error: 'Commodity with this batch ID already exists'
        });
      }

      // Create commodity record
      const commodity = await CommodityModel.create({
        batchId,
        type,
        weight,
        purity,
        origin,
        productionDate,
        producerId,
        custodianId,
        inspectorId,
        inspectionDate,
        reportHash,
        imageHash
      });

      res.status(201).json({
        success: true,
        data: commodity
      });
    } catch (error) {
      console.error('Error registering commodity:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get commodity details by batch ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCommodity(req, res) {
    try {
      const { batchId } = req.params;

      const commodity = await CommodityModel.findByBatchId(batchId);
      if (!commodity) {
        return res.status(404).json({
          success: false,
          error: 'Commodity not found'
        });
      }

      res.json({
        success: true,
        data: commodity
      });
    } catch (error) {
      console.error('Error getting commodity:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get commodities by producer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCommoditiesByProducer(req, res) {
    try {
      const { producerId } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      const commodities = await CommodityModel.findByProducer(producerId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });

      const statistics = await CommodityModel.getStatistics(producerId);

      res.json({
        success: true,
        data: {
          commodities,
          statistics,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting commodities by producer:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update commodity status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateCommodityStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { batchId } = req.params;
      const { status } = req.body;

      // Check if commodity exists
      const existingCommodity = await CommodityModel.findByBatchId(batchId);
      if (!existingCommodity) {
        return res.status(404).json({
          success: false,
          error: 'Commodity not found'
        });
      }

      // Update status
      const updatedCommodity = await CommodityModel.updateStatus(batchId, status);

      res.json({
        success: true,
        data: updatedCommodity
      });
    } catch (error) {
      console.error('Error updating commodity status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get commodity statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCommodityStatistics(req, res) {
    try {
      const { producerId } = req.query;

      const statistics = await CommodityModel.getStatistics(producerId);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error getting commodity statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete commodity record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteCommodity(req, res) {
    try {
      const { batchId } = req.params;

      // Check if commodity exists
      const existingCommodity = await CommodityModel.findByBatchId(batchId);
      if (!existingCommodity) {
        return res.status(404).json({
          success: false,
          error: 'Commodity not found'
        });
      }

      // Check if commodity has associated NFT
      if (existingCommodity.nft) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete commodity with associated NFT'
        });
      }

      // Delete commodity
      await CommodityModel.delete(batchId);

      res.json({
        success: true,
        message: 'Commodity deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting commodity:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all commodities with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllCommodities(req, res) {
    try {
      const { page = 1, limit = 10, status, type, origin } = req.query;

      // This would need to be implemented in the model
      // For now, return a simplified response
      const statistics = await CommodityModel.getStatistics();

      res.json({
        success: true,
        data: {
          commodities: [], // Would be populated by model method
          statistics,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit)
          },
          filters: {
            status,
            type,
            origin
          }
        }
      });
    } catch (error) {
      console.error('Error getting all commodities:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CommodityController();
