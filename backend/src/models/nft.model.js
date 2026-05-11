const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class NFTModel {
  /**
   * Create a new NFT record
   * @param {Object} nftData - NFT data
   * @returns {Promise<Object>} Created NFT
   */
  static async create(nftData) {
    try {
      return await prisma.nFT.create({
        data: {
          assetCode: nftData.assetCode,
          issuerPublicKey: nftData.issuerPublicKey,
          currentOwner: nftData.currentOwner,
          ipfsHash: nftData.ipfsHash,
          transactionHash: nftData.transactionHash,
          commodityId: nftData.commodityId,
        },
        include: {
          commodity: {
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
          }
        }
      });
    } catch (error) {
      console.error('Error creating NFT:', error);
      throw new Error(`Failed to create NFT: ${error.message}`);
    }
  }

  /**
   * Find NFT by asset code
   * @param {string} assetCode - Asset code
   * @returns {Promise<Object|null>} NFT or null
   */
  static async findByAssetCode(assetCode) {
    try {
      return await prisma.nFT.findUnique({
        where: { assetCode },
        include: {
          commodity: {
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
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });
    } catch (error) {
      console.error('Error finding NFT:', error);
      throw new Error(`Failed to find NFT: ${error.message}`);
    }
  }

  /**
   * Find NFTs by owner
   * @param {string} ownerAddress - Owner's Stellar public key
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of NFTs
   */
  static async findByOwner(ownerAddress, options = {}) {
    try {
      const { page = 1, limit = 10, includeBurned = false } = options;
      const skip = (page - 1) * limit;

      const where = {
        currentOwner: ownerAddress,
        ...(includeBurned ? {} : { isBurned: false })
      };

      return await prisma.nFT.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          commodity: {
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
          }
        }
      });
    } catch (error) {
      console.error('Error finding NFTs by owner:', error);
      throw new Error(`Failed to find NFTs: ${error.message}`);
    }
  }

  /**
   * Update NFT ownership
   * @param {string} assetCode - Asset code
   * @param {string} newOwner - New owner's public key
   * @param {string} transactionHash - Transaction hash
   * @returns {Promise<Object>} Updated NFT
   */
  static async updateOwnership(assetCode, newOwner, transactionHash) {
    try {
      return await prisma.nFT.update({
        where: { assetCode },
        data: {
          currentOwner: newOwner,
          updatedAt: new Date()
        },
        include: {
          commodity: {
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
          }
        }
      });
    } catch (error) {
      console.error('Error updating NFT ownership:', error);
      throw new Error(`Failed to update NFT ownership: ${error.message}`);
    }
  }

  /**
   * Burn NFT
   * @param {string} assetCode - Asset code
   * @param {string} transactionHash - Burn transaction hash
   * @returns {Promise<Object>} Updated NFT
   */
  static async burn(assetCode, transactionHash) {
    try {
      return await prisma.nFT.update({
        where: { assetCode },
        data: {
          isBurned: true,
          burnedAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          commodity: {
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
          }
        }
      });
    } catch (error) {
      console.error('Error burning NFT:', error);
      throw new Error(`Failed to burn NFT: ${error.message}`);
    }
  }

  /**
   * Create NFT transaction record
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  static async createTransaction(transactionData) {
    try {
      return await prisma.nFTTransaction.create({
        data: {
          nftId: transactionData.nftId,
          fromAddress: transactionData.fromAddress,
          toAddress: transactionData.toAddress,
          transactionType: transactionData.transactionType,
          transactionHash: transactionData.transactionHash,
          stellarMemo: transactionData.stellarMemo,
          userId: transactionData.userId,
        },
        include: {
          nft: {
            include: {
              commodity: true
            }
          },
          user: {
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
      console.error('Error creating NFT transaction:', error);
      throw new Error(`Failed to create NFT transaction: ${error.message}`);
    }
  }

  /**
   * Get NFT statistics
   * @param {string} ownerAddress - Optional owner address for filtering
   * @returns {Promise<Object>} Statistics
   */
  static async getStatistics(ownerAddress = null) {
    try {
      const where = ownerAddress ? { currentOwner: ownerAddress } : {};

      const [
        total,
        active,
        burned,
        mintedThisMonth,
        transferredThisMonth
      ] = await Promise.all([
        prisma.nFT.count({ where }),
        prisma.nFT.count({ where: { ...where, isBurned: false } }),
        prisma.nFT.count({ where: { ...where, isBurned: true } }),
        prisma.nFT.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        prisma.nFTTransaction.count({
          where: {
            transactionType: 'TRANSFERRED',
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      ]);

      return {
        total,
        active,
        burned,
        mintedThisMonth,
        transferredThisMonth
      };
    } catch (error) {
      console.error('Error getting NFT statistics:', error);
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Get transaction history for an NFT
   * @param {string} assetCode - Asset code
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Transaction history
   */
  static async getTransactionHistory(assetCode, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const nft = await prisma.nFT.findUnique({
        where: { assetCode },
        select: { id: true }
      });

      if (!nft) {
        throw new Error('NFT not found');
      }

      return await prisma.nFTTransaction.findMany({
        where: { nftId: nft.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
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
      console.error('Error getting transaction history:', error);
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  /**
   * Delete NFT record
   * @param {string} assetCode - Asset code
   * @returns {Promise<Object>} Deleted NFT
   */
  static async delete(assetCode) {
    try {
      return await prisma.nFT.delete({
        where: { assetCode }
      });
    } catch (error) {
      console.error('Error deleting NFT:', error);
      throw new Error(`Failed to delete NFT: ${error.message}`);
    }
  }
}

module.exports = NFTModel;
