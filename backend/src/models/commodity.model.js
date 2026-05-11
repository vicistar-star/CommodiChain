const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class CommodityModel {
  /**
   * Create a new commodity record
   * @param {Object} commodityData - Commodity data
   * @returns {Promise<Object>} Created commodity
   */
  static async create(commodityData) {
    try {
      return await prisma.commodity.create({
        data: {
          batchId: commodityData.batchId,
          type: commodityData.type,
          weight: commodityData.weight,
          purity: commodityData.purity,
          origin: commodityData.origin,
          productionDate: commodityData.productionDate ? new Date(commodityData.productionDate) : null,
          producerId: commodityData.producerId,
          custodianId: commodityData.custodianId,
          inspectorId: commodityData.inspectorId,
          inspectionDate: commodityData.inspectionDate ? new Date(commodityData.inspectionDate) : null,
          reportHash: commodityData.reportHash,
          imageHash: commodityData.imageHash,
          metadataIpfsHash: commodityData.metadataIpfsHash,
        },
        include: {
          producer: {
            select: {
              id: true,
              stellarPublicKey: true,
              name: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating commodity:', error);
      throw new Error(`Failed to create commodity: ${error.message}`);
    }
  }

  /**
   * Find commodity by batch ID
   * @param {string} batchId - Batch ID
   * @returns {Promise<Object|null>} Commodity or null
   */
  static async findByBatchId(batchId) {
    try {
      return await prisma.commodity.findUnique({
        where: { batchId },
        include: {
          producer: {
            select: {
              id: true,
              stellarPublicKey: true,
              name: true,
              email: true
            }
          },
          nft: true
        }
      });
    } catch (error) {
      console.error('Error finding commodity:', error);
      throw new Error(`Failed to find commodity: ${error.message}`);
    }
  }

  /**
   * Find commodities by producer
   * @param {string} producerId - Producer user ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of commodities
   */
  static async findByProducer(producerId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const skip = (page - 1) * limit;

      const where = {
        producerId,
        ...(status && { status })
      };

      return await prisma.commodity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          nft: true
        }
      });
    } catch (error) {
      console.error('Error finding commodities by producer:', error);
      throw new Error(`Failed to find commodities: ${error.message}`);
    }
  }

  /**
   * Update commodity status
   * @param {string} batchId - Batch ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated commodity
   */
  static async updateStatus(batchId, status) {
    try {
      return await prisma.commodity.update({
        where: { batchId },
        data: { 
          status,
          updatedAt: new Date()
        },
        include: {
          producer: {
            select: {
              id: true,
              stellarPublicKey: true,
              name: true,
              email: true
            }
          },
          nft: true
        }
      });
    } catch (error) {
      console.error('Error updating commodity status:', error);
      throw new Error(`Failed to update commodity status: ${error.message}`);
    }
  }

  /**
   * Update commodity with NFT information
   * @param {string} batchId - Batch ID
   * @param {Object} nftData - NFT data
   * @returns {Promise<Object>} Updated commodity
   */
  static async updateWithNFT(batchId, nftData) {
    try {
      return await prisma.commodity.update({
        where: { batchId },
        data: {
          metadataIpfsHash: nftData.ipfsHash,
          status: 'VERIFIED',
          updatedAt: new Date()
        },
        include: {
          producer: {
            select: {
              id: true,
              stellarPublicKey: true,
              name: true,
              email: true
            }
          },
          nft: true
        }
      });
    } catch (error) {
      console.error('Error updating commodity with NFT:', error);
      throw new Error(`Failed to update commodity with NFT: ${error.message}`);
    }
  }

  /**
   * Get commodity statistics
   * @param {string} producerId - Optional producer ID for filtering
   * @returns {Promise<Object>} Statistics
   */
  static async getStatistics(producerId = null) {
    try {
      const where = producerId ? { producerId } : {};

      const [
        total,
        registered,
        verified,
        stored,
        transferred,
        redeemed
      ] = await Promise.all([
        prisma.commodity.count({ where }),
        prisma.commodity.count({ where: { ...where, status: 'REGISTERED' } }),
        prisma.commodity.count({ where: { ...where, status: 'VERIFIED' } }),
        prisma.commodity.count({ where: { ...where, status: 'STORED' } }),
        prisma.commodity.count({ where: { ...where, status: 'TRANSFERRED' } }),
        prisma.commodity.count({ where: { ...where, status: 'REDEEMED' } })
      ]);

      return {
        total,
        byStatus: {
          registered,
          verified,
          stored,
          transferred,
          redeemed
        }
      };
    } catch (error) {
      console.error('Error getting commodity statistics:', error);
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Delete commodity (soft delete by marking as inactive)
   * @param {string} batchId - Batch ID
   * @returns {Promise<Object>} Deleted commodity
   */
  static async delete(batchId) {
    try {
      return await prisma.commodity.delete({
        where: { batchId }
      });
    } catch (error) {
      console.error('Error deleting commodity:', error);
      throw new Error(`Failed to delete commodity: ${error.message}`);
    }
  }
}

module.exports = CommodityModel;
