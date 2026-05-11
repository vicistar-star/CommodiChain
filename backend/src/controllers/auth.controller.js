const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const stellarService = require('../services/stellar.service');

const prisma = new PrismaClient();

class AuthController {
  constructor() {
    // Generate server keypair for SEP-10 challenges
    this.serverKeypair = require('@stellar/stellar-sdk').Keypair.random();
  }

  /**
   * Generate SEP-10 challenge transaction
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getChallenge(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { publicKey } = req.body;

      // Create challenge transaction
      const challengeXdr = await stellarService.createChallenge(
        publicKey,
        this.serverKeypair
      );

      res.json({
        success: true,
        data: {
          challenge: challengeXdr,
          serverPublicKey: this.serverKeypair.publicKey(),
          network: process.env.STELLAR_NETWORK || 'testnet'
        }
      });
    } catch (error) {
      console.error('Error creating challenge:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Verify SEP-10 challenge and issue JWT
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifyChallenge(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { publicKey, signature } = req.body;

      // Verify the challenge signature
      const isValid = await stellarService.verifyChallenge(signature, publicKey);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid signature'
        });
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { stellarPublicKey: publicKey }
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            stellarPublicKey: publicKey,
            role: 'USER'
          }
        });
      }

      // Clean up old sessions for this user
      await prisma.authSession.deleteMany({
        where: {
          userId: user.id,
          expiresAt: {
            lt: new Date()
          }
        }
      });

      // Create auth session
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const session = await prisma.authSession.create({
        data: {
          userId: user.id,
          challengeXdr: signature,
          token: this.generateJWT(user),
          expiresAt
        },
        include: {
          user: {
            select: {
              id: true,
              stellarPublicKey: true,
              email: true,
              name: true,
              role: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: {
          token: session.token,
          user: session.user,
          expiresAt: session.expiresAt
        }
      });
    } catch (error) {
      console.error('Error verifying challenge:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Refresh JWT token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No token provided'
        });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the session
      const session = await prisma.authSession.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              id: true,
              stellarPublicKey: true,
              email: true,
              name: true,
              role: true
            }
          }
        }
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      // Generate new token and update session
      const newToken = this.generateJWT(session.user);
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.authSession.update({
        where: { id: session.id },
        data: {
          token: newToken,
          expiresAt: newExpiresAt
        }
      });

      res.json({
        success: true,
        data: {
          token: newToken,
          user: session.user,
          expiresAt: newExpiresAt
        }
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  }

  /**
   * Logout user (invalidate session)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No token provided'
        });
      }

      const token = authHeader.substring(7);

      // Invalidate the session
      await prisma.authSession.updateMany({
        where: { token },
        data: {
          isActive: false
        }
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProfile(req, res) {
    try {
      // User should be attached by auth middleware
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          stellarPublicKey: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateProfile(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const { name, email } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(name && { name }),
          ...(email && { email })
        },
        select: {
          id: true,
          stellarPublicKey: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateJWT(user) {
    return jwt.sign(
      {
        id: user.id,
        stellarPublicKey: user.stellarPublicKey,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  /**
   * Middleware to authenticate JWT token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No token provided'
        });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the session
      const session = await prisma.authSession.findUnique({
        where: { token },
        include: {
          user: true
        }
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      req.user = session.user;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  }
}

module.exports = new AuthController();
