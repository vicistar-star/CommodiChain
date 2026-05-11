/**
 * Enhanced Freighter Wallet Service for CommodiChain
 * Provides comprehensive wallet integration with Soroban support
 */

class FreighterService {
  constructor() {
    this.isFreighterAvailable = false;
    this.publicKey = null;
    this.isConnected = false;
    this.network = null;
  }

  /**
   * Check if Freighter wallet is available
   * @returns {Promise<boolean>} Whether Freighter is available
   */
  async checkAvailability() {
    try {
      if (window.freighter) {
        this.isFreighterAvailable = true;
        await this.getConnectionInfo();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking Freighter availability:', error);
      return false;
    }
  }

  /**
   * Get connection information from Freighter
   * @returns {Promise<Object>} Connection details
   */
  async getConnectionInfo() {
    try {
      if (!this.isFreighterAvailable) {
        throw new Error('Freighter is not available');
      }

      const isConnected = await window.freighter.isConnected();
      this.isConnected = isConnected;

      if (isConnected) {
        this.publicKey = await window.freighter.getPublicKey();
        this.network = await window.freighter.getNetwork();
      }

      return {
        isConnected,
        publicKey: this.publicKey,
        network: this.network
      };
    } catch (error) {
      console.error('Error getting connection info:', error);
      throw error;
    }
  }

  /**
   * Connect to Freighter wallet
   * @returns {Promise<Object>} Connection result
   */
  async connect() {
    try {
      if (!this.isFreighterAvailable) {
        throw new Error('Freighter is not available. Please install Freighter extension.');
      }

      // Request connection
      await window.freighter.connect();
      
      // Get connection info
      const connectionInfo = await this.getConnectionInfo();
      
      return {
        success: true,
        publicKey: connectionInfo.publicKey,
        network: connectionInfo.network,
        message: 'Successfully connected to Freighter wallet'
      };
    } catch (error) {
      console.error('Error connecting to Freighter:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to connect to Freighter wallet'
      };
    }
  }

  /**
   * Disconnect from Freighter wallet
   * @returns {Promise<Object>} Disconnection result
   */
  async disconnect() {
    try {
      if (!this.isFreighterAvailable) {
        throw new Error('Freighter is not available');
      }

      // Check if we can disconnect (Freighter doesn't have explicit disconnect)
      // We'll just clear our local state
      this.isConnected = false;
      this.publicKey = null;
      this.network = null;

      return {
        success: true,
        message: 'Successfully disconnected from Freighter wallet'
      };
    } catch (error) {
      console.error('Error disconnecting from Freighter:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to disconnect from Freighter wallet'
      };
    }
  }

  /**
   * Sign transaction with Freighter
   * @param {string} transactionXDR - Transaction in XDR format
   * @param {Object} options - Signing options
   * @returns {Promise<Object>} Signing result
   */
  async signTransaction(transactionXDR, options = {}) {
    try {
      if (!this.isFreighterAvailable || !this.isConnected) {
        throw new Error('Freighter is not connected');
      }

      const {
        network,
        accountToSign,
        isMultipartTransaction = false
      } = options;

      // Sign transaction
      const signedTransaction = await window.freighter.signTransaction(
        transactionXDR,
        {
          network,
          accountToSign,
          isMultipartTransaction
        }
      );

      return {
        success: true,
        signedTransaction,
        message: 'Transaction signed successfully'
      };
    } catch (error) {
      console.error('Error signing transaction:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to sign transaction'
      };
    }
  }

  /**
   * Sign Soroban transaction with Freighter
   * @param {string} transactionXDR - Soroban transaction in XDR format
   * @param {Object} options - Soroban signing options
   * @returns {Promise<Object>} Signing result
   */
  async signSorobanTransaction(transactionXDR, options = {}) {
    try {
      if (!this.isFreighterAvailable || !this.isConnected) {
        throw new Error('Freighter is not connected');
      }

      const {
        network,
        accountToSign
      } = options;

      // Sign Soroban transaction
      const signedTransaction = await window.freighter.signTransaction(
        transactionXDR,
        {
          network,
          accountToSign
        }
      );

      return {
        success: true,
        signedTransaction,
        message: 'Soroban transaction signed successfully'
      };
    } catch (error) {
      console.error('Error signing Soroban transaction:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to sign Soroban transaction'
      };
    }
  }

  /**
   * Get user-friendly address format
   * @returns {string} Formatted address
   */
  getFormattedAddress() {
    if (!this.publicKey) {
      return 'Not connected';
    }
    
    return `${this.publicKey.slice(0, 8)}...${this.publicKey.slice(-8)}`;
  }

  /**
   * Get network name
   * @returns {string} Network name
   */
  getNetworkName() {
    if (!this.network) {
      return 'Unknown';
    }

    switch (this.network) {
      case 'PUBLIC':
        return 'Mainnet';
      case 'TESTNET':
        return 'Testnet';
      default:
        return this.network || 'Unknown';
    }
  }

  /**
   * Check if address is valid Stellar address
   * @param {string} address - Address to validate
   * @returns {boolean} Whether address is valid
   */
  isValidStellarAddress(address) {
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Basic Stellar address validation (starts with 'G' and 56 characters)
    return /^G[A-Z0-9]{55}$/.test(address);
  }

  /**
   * Get wallet balance
   * @returns {Promise<Object>} Balance information
   */
  async getBalance() {
    try {
      if (!this.isFreighterAvailable || !this.isConnected) {
        throw new Error('Freighter is not connected');
      }

      const balance = await window.freighter.getBalance();
      
      return {
        success: true,
        balance,
        message: 'Balance retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get balance'
      };
    }
  }

  /**
   * Submit transaction to network
   * @param {string} signedTransactionXDR - Signed transaction XDR
   * @returns {Promise<Object>} Submission result
   */
  async submitTransaction(signedTransactionXDR) {
    try {
      if (!this.isFreighterAvailable || !this.isConnected) {
        throw new Error('Freighter is not connected');
      }

      const result = await window.freighter.submitTransaction(signedTransactionXDR);
      
      return {
        success: true,
        result,
        message: 'Transaction submitted successfully'
      };
    } catch (error) {
      console.error('Error submitting transaction:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to submit transaction'
      };
    }
  }

  /**
   * Get supported operations
   * @returns {Array>} List of supported operations
   */
  getSupportedOperations() {
    return [
      'connect',
      'disconnect',
      'isConnected',
      'getPublicKey',
      'getNetwork',
      'signTransaction',
      'signSorobanTransaction',
      'submitTransaction',
      'getBalance'
    ];
  }

  /**
   * Get wallet status
   * @returns {Object>} Current wallet status
   */
  getStatus() {
    return {
      isAvailable: this.isFreighterAvailable,
      isConnected: this.isConnected,
      publicKey: this.publicKey,
      formattedAddress: this.getFormattedAddress(),
      network: this.network,
      networkName: this.getNetworkName(),
      supportedOperations: this.getSupportedOperations()
    };
  }

  /**
   * Setup event listeners for wallet events
   * @param {Function} onConnected - Callback for connection
   * @param {Function} onDisconnected - Callback for disconnection
   * @param {Function} onNetworkChanged - Callback for network change
   */
  setupEventListeners(onConnected, onDisconnected, onNetworkChanged) {
    if (!this.isFreighterAvailable) {
      return;
    }

    // Listen for account changes
    window.addEventListener('stellar_account', async (event) => {
      const isConnected = await window.freighter.isConnected();
      
      if (isConnected && !this.isConnected) {
        this.isConnected = true;
        this.publicKey = await window.freighter.getPublicKey();
        onConnected?.(this.getStatus());
      } else if (!isConnected && this.isConnected) {
        this.isConnected = false;
        this.publicKey = null;
        onDisconnected?.(this.getStatus());
      }
    });

    // Listen for network changes
    window.addEventListener('stellar_network', async (event) => {
      const oldNetwork = this.network;
      this.network = await window.freighter.getNetwork();
      
      if (oldNetwork !== this.network) {
        onNetworkChanged?.(this.getStatus());
      }
    });
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    window.removeEventListener('stellar_account');
    window.removeEventListener('stellar_network');
  }
}

export default new FreighterService();
