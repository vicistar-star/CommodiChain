const StellarSdk = require('@stellar/stellar-sdk');

class StellarService {
  constructor() {
    this.server = new StellarSdk.Horizon.Server(
      process.env.STELLAR_NETWORK === 'mainnet' 
        ? 'https://horizon.stellar.org' 
        : 'https://horizon-testnet.stellar.org'
    );
    this.networkPassphrase = process.env.STELLAR_NETWORK === 'mainnet' 
      ? StellarSdk.Networks.PUBLIC 
      : StellarSdk.Networks.TESTNET;
  }

  /**
   * Mint a commodity NFT on Stellar
   * @param {string} assetCode - Unique asset code for the commodity batch
   * @param {string} ipfsHash - IPFS hash containing metadata
   * @param {string} receiverPublicKey - Recipient's Stellar public key
   * @returns {Promise<Object>} Transaction result
   */
  async mintCommodityNFT(assetCode, ipfsHash, receiverPublicKey) {
    try {
      const issuerKeypair = StellarSdk.Keypair.fromSecret(process.env.ISSUER_SECRET);
      const issuerAccount = await this.server.loadAccount(issuerKeypair.publicKey());
      
      // Create the NFT asset
      const nftAsset = new StellarSdk.Asset(assetCode, issuerKeypair.publicKey());

      // Build transaction to mint NFT with supply of exactly 1
      const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        // Store IPFS hash on-chain
        .addOperation(StellarSdk.Operation.manageData({
          name: `${assetCode}_metadata`,
          value: ipfsHash,
        }))
        // Send 1 unit of the NFT to receiver
        .addOperation(StellarSdk.Operation.payment({
          destination: receiverPublicKey,
          asset: nftAsset,
          amount: '1',
        }))
        // Lock the issuer account - no more can ever be minted
        .addOperation(StellarSdk.Operation.setOptions({
          masterWeight: 0, // Freezes issuer: supply is permanently 1
        }))
        .setTimeout(30)
        .build();

      transaction.sign(issuerKeypair);
      const result = await this.server.submitTransaction(transaction);
      
      return {
        success: true,
        transactionHash: result.hash,
        assetCode,
        issuer: issuerKeypair.publicKey(),
        ipfsHash,
        receiver: receiverPublicKey
      };
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw new Error(`Failed to mint NFT: ${error.message}`);
    }
  }

  /**
   * Transfer NFT ownership
   * @param {string} assetCode - Asset code of the NFT
   * @param {string} issuerPublicKey - Issuer public key
   * @param {string} fromSecret - Current owner's secret key
   * @param {string} toPublicKey - Recipient's public key
   * @returns {Promise<Object>} Transaction result
   */
  async transferNFT(assetCode, issuerPublicKey, fromSecret, toPublicKey) {
    try {
      const fromKeypair = StellarSdk.Keypair.fromSecret(fromSecret);
      const fromAccount = await this.server.loadAccount(fromKeypair.publicKey());
      
      const nftAsset = new StellarSdk.Asset(assetCode, issuerPublicKey);

      const transaction = new StellarSdk.TransactionBuilder(fromAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(StellarSdk.Operation.payment({
          destination: toPublicKey,
          asset: nftAsset,
          amount: '1',
        }))
        .setTimeout(30)
        .build();

      transaction.sign(fromKeypair);
      const result = await this.server.submitTransaction(transaction);

      return {
        success: true,
        transactionHash: result.hash,
        assetCode,
        from: fromKeypair.publicKey(),
        to: toPublicKey
      };
    } catch (error) {
      console.error('Error transferring NFT:', error);
      throw new Error(`Failed to transfer NFT: ${error.message}`);
    }
  }

  /**
   * Verify NFT ownership
   * @param {string} assetCode - Asset code of the NFT
   * @param {string} issuerPublicKey - Issuer public key
   * @returns {Promise<Object>} Ownership details
   */
  async verifyNFTOwnership(assetCode, issuerPublicKey) {
    try {
      const nftAsset = new StellarSdk.Asset(assetCode, issuerPublicKey);
      
      // Find all accounts holding this asset
      const accounts = await this.server.accounts()
        .forAsset(nftAsset)
        .call();

      if (accounts.records.length === 0) {
        return {
          success: false,
          error: 'NFT not found or not held by any account'
        };
      }

      const holder = accounts.records[0];
      const balance = holder.balances.find(b => 
        b.asset_code === assetCode && b.asset_issuer === issuerPublicKey
      );

      // Get metadata from on-chain data
      let metadata = null;
      try {
        const issuerAccount = await this.server.loadAccount(issuerPublicKey);
        const dataEntry = issuerAccount.data.find(d => d.name === `${assetCode}_metadata`);
        if (dataEntry) {
          metadata = dataEntry.value.toString('base64');
        }
      } catch (error) {
        console.warn('Could not fetch metadata:', error.message);
      }

      return {
        success: true,
        owner: holder.account_id,
        balance: balance ? balance.balance : '0',
        metadata,
        assetCode,
        issuer: issuerPublicKey,
        lastModified: holder.last_modified_ledger
      };
    } catch (error) {
      console.error('Error verifying NFT ownership:', error);
      throw new Error(`Failed to verify NFT ownership: ${error.message}`);
    }
  }

  /**
   * Burn/Redeem NFT (requires issuer with clawback enabled)
   * @param {string} assetCode - Asset code of the NFT
   * @param {string} issuerPublicKey - Issuer public key
   * @param {string} ownerSecret - Current owner's secret key
   * @returns {Promise<Object>} Transaction result
   */
  async burnNFT(assetCode, issuerPublicKey, ownerSecret) {
    try {
      const ownerKeypair = StellarSdk.Keypair.fromSecret(ownerSecret);
      const ownerAccount = await this.server.loadAccount(ownerKeypair.publicKey());
      
      const nftAsset = new StellarSdk.Asset(assetCode, issuerPublicKey);

      // Send NFT back to issuer for burning
      const transaction = new StellarSdk.TransactionBuilder(ownerAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(StellarSdk.Operation.payment({
          destination: issuerPublicKey,
          asset: nftAsset,
          amount: '1',
        }))
        .setTimeout(30)
        .build();

      transaction.sign(ownerKeypair);
      const result = await this.server.submitTransaction(transaction);

      return {
        success: true,
        transactionHash: result.hash,
        assetCode,
        status: 'redeemed',
        redeemedBy: ownerKeypair.publicKey()
      };
    } catch (error) {
      console.error('Error burning NFT:', error);
      throw new Error(`Failed to burn NFT: ${error.message}`);
    }
  }

  /**
   * Create SEP-10 challenge transaction for authentication
   * @param {string} publicKey - User's Stellar public key
   * @param {string} serverKeypair - Server's Stellar keypair
   * @returns {Promise<string>} Challenge transaction XDR
   */
  async createChallenge(publicKey, serverKeypair) {
    try {
      const serverAccount = await this.server.loadAccount(serverKeypair.publicKey());
      
      const transaction = new StellarSdk.TransactionBuilder(serverAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
        timebounds: {
          minTime: 0,
          maxTime: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        },
      })
        .addOperation(StellarSdk.Operation.manageData({
          name: 'commodichain_auth',
          value: `${Date.now()}`,
        }))
        .build();

      transaction.sign(serverKeypair);
      return transaction.toXDR();
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw new Error(`Failed to create challenge: ${error.message}`);
    }
  }

  /**
   * Verify SEP-10 challenge transaction
   * @param {string} challengeXdr - Challenge transaction XDR
   * @param {string} publicKey - User's public key
   * @returns {Promise<boolean>} Verification result
   */
  async verifyChallenge(challengeXdr, publicKey) {
    try {
      const transaction = StellarSdk.TransactionBuilder.fromXDR(challengeXdr, this.networkPassphrase);
      
      // Verify the transaction is signed by the user
      const signatures = transaction.signatures;
      if (signatures.length === 0) {
        return false;
      }

      // Verify the signature matches the public key
      const keypair = StellarSdk.Keypair.fromPublicKey(publicKey);
      return transaction.signatures.some(sig => 
        keypair.verify(transaction.hash(), sig.signature())
      );
    } catch (error) {
      console.error('Error verifying challenge:', error);
      return false;
    }
  }
}

module.exports = new StellarService();
