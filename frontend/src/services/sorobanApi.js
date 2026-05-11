import { Contract, SorobanRpc, xdr, scValToNative } from '@stellar/stellar-sdk';

class SorobanAPI {
  constructor() {
    this.rpcUrl = import.meta.env.VITE_STELLAR_NETWORK === 'mainnet' 
      ? 'https://rpc.mainnet.stellar.org'
      : 'https://rpc.testnet.stellar.org';
    
    this.server = new SorobanRpc(this.rpcUrl);
    this.networkPassphrase = import.meta.env.VITE_STELLAR_NETWORK === 'mainnet' 
      ? 'Public Global Stellar Network ; September 2015'
      : 'Test SDF Network ; September 2015';
  }

  /**
   * Deploy Soroban contract
   * @param {Object} deployerKeypair - Deployer's keypair
   * @param {ArrayBuffer} wasmBuffer - Contract WASM
   * @returns {Promise<Object>} Deployment result
   */
  async deployContract(deployerKeypair, wasmBuffer) {
    try {
      // This would typically be done on the backend for security
      // Frontend would call backend API to deploy
      throw new Error('Contract deployment should be done via backend API');
    } catch (error) {
      console.error('Error deploying contract:', error);
      throw error;
    }
  }

  /**
   * Mint commodity NFT using Soroban contract
   * @param {string} contractAddress - Contract address
   * @param {Object} keypair - User's keypair
   * @param {Object} params - Minting parameters
   * @returns {Promise<Object>} Minting result
   */
  async mintCommodityNFT(contractAddress, keypair, params) {
    try {
      const contract = new Contract(contractAddress);
      
      const mintParams = {
        commodity_type: params.commodityType,
        weight: params.weight,
        purity: params.purity || 'N/A',
        origin: params.origin,
        production_date: Math.floor(new Date(params.productionDate).getTime() / 1000),
        custodian: params.custodianAddress,
        inspector: params.inspector,
        inspection_date: Math.floor(new Date(params.inspectionDate).getTime() / 1000),
        metadata_hash: params.metadataHash
      };

      const transaction = await this.buildTransaction(keypair, contract, 'mint', [
        keypair.publicKey(),
        mintParams
      ]);

      const result = await this.signAndSubmitTransaction(keypair, transaction);
      
      // Parse result to get NFT ID
      const nftId = scValToNative(result.result.results[0]);

      return {
        success: true,
        transactionHash: result.hash,
        nftId,
        contractAddress,
        minter: keypair.publicKey()
      };
    } catch (error) {
      console.error('Error minting NFT with Soroban:', error);
      throw error;
    }
  }

  /**
   * Transfer NFT using Soroban contract
   * @param {string} contractAddress - Contract address
   * @param {Object} fromKeypair - Current owner's keypair
   * @param {string} toAddress - Recipient's address
   * @param {number} nftId - NFT ID to transfer
   * @returns {Promise<Object>} Transfer result
   */
  async transferNFT(contractAddress, fromKeypair, toAddress, nftId) {
    try {
      const contract = new Contract(contractAddress);
      
      const transferParams = {
        from: fromKeypair.publicKey(),
        to: toAddress
      };

      const transaction = await this.buildTransaction(fromKeypair, contract, 'transfer', [
        fromKeypair.publicKey(),
        transferParams,
        nftId
      ]);

      const result = await this.signAndSubmitTransaction(fromKeypair, transaction);

      return {
        success: true,
        transactionHash: result.hash,
        contractAddress,
        from: fromKeypair.publicKey(),
        to: toAddress,
        nftId
      };
    } catch (error) {
      console.error('Error transferring NFT with Soroban:', error);
      throw error;
    }
  }

  /**
   * Burn NFT using Soroban contract
   * @param {string} contractAddress - Contract address
   * @param {Object} ownerKeypair - Current owner's keypair
   * @param {number} nftId - NFT ID to burn
   * @returns {Promise<Object>} Burn result
   */
  async burnNFT(contractAddress, ownerKeypair, nftId) {
    try {
      const contract = new Contract(contractAddress);
      
      const transaction = await this.buildTransaction(ownerKeypair, contract, 'burn', [
        ownerKeypair.publicKey(),
        nftId
      ]);

      const result = await this.signAndSubmitTransaction(ownerKeypair, transaction);

      return {
        success: true,
        transactionHash: result.hash,
        contractAddress,
        owner: ownerKeypair.publicKey(),
        nftId,
        burnedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error burning NFT with Soroban:', error);
      throw error;
    }
  }

  /**
   * Get NFT details from Soroban contract
   * @param {string} contractAddress - Contract address
   * @param {number} nftId - NFT ID
   * @returns {Promise<Object>} NFT details
   */
  async getNFT(contractAddress, nftId) {
    try {
      const contract = new Contract(contractAddress);
      
      const result = await this.server.getContractData(
        contractAddress,
        xdr.ScVal.scvMap([
          new xdr.ScMapEntry({
            key: new xdr.ScSymbol("nfts"),
            val: xdr.ScVal.scvU64(nftId)
          })
        ])
      );

      const nftData = scValToNative(result.val);

      return {
        success: true,
        nft: nftData,
        contractAddress,
        nftId
      };
    } catch (error) {
      console.error('Error getting NFT from Soroban:', error);
      throw error;
    }
  }

  /**
   * Get all NFTs owned by an address
   * @param {string} contractAddress - Contract address
   * @param {string} ownerAddress - Owner's address
   * @returns {Promise<Array>} Array of NFT IDs
   */
  async getOwnerNFTs(contractAddress, ownerAddress) {
    try {
      const contract = new Contract(contractAddress);
      
      const result = await this.server.getContractData(
        contractAddress,
        xdr.ScVal.scvMap([
          new xdr.ScMapEntry({
            key: new xdr.ScSymbol("owner_nfts"),
            val: xdr.Address.fromString(ownerAddress).toScVal()
          })
        ])
      );

      const nftIds = scValToNative(result.val);

      return {
        success: true,
        nftIds,
        contractAddress,
        ownerAddress
      };
    } catch (error) {
      console.error('Error getting owner NFTs from Soroban:', error);
      throw error;
    }
  }

  /**
   * Check if NFT exists
   * @param {string} contractAddress - Contract address
   * @param {number} nftId - NFT ID
   * @returns {Promise<boolean>} Whether NFT exists
   */
  async nftExists(contractAddress, nftId) {
    try {
      const contract = new Contract(contractAddress);
      
      const result = await this.server.getContractData(
        contractAddress,
        xdr.ScVal.scvMap([
          new xdr.ScMapEntry({
            key: new xdr.ScSymbol("nfts"),
            val: xdr.ScVal.scvU64(nftId)
          })
        ])
      );

      return result.val !== undefined;
    } catch (error) {
      console.error('Error checking NFT existence:', error);
      return false;
    }
  }

  /**
   * Build transaction for Soroban contract interaction
   * @param {Object} keypair - Signer's keypair
   * @param {Contract} contract - Soroban contract instance
   * @param {string} method - Contract method name
   * @param {Array} args - Method arguments
   * @returns {Promise<Object>} Built transaction
   */
  async buildTransaction(keypair, contract, method, args) {
    const { TransactionBuilder } = await import('@stellar/stellar-sdk');
    
    // Get account info
    const account = await this.server.getAccount(keypair.publicKey());
    
    // Build transaction
    const transaction = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        contract.call(method, ...args)
      )
      .setTimeout(30)
      .build();

    return transaction;
  }

  /**
   * Sign and submit transaction to Stellar network
   * @param {Object} keypair - Signer's keypair
   * @param {Object} transaction - Built transaction
   * @returns {Promise<Object>} Transaction result
   */
  async signAndSubmitTransaction(keypair, transaction) {
    try {
      // Sign transaction
      transaction.sign(keypair);
      
      // Submit to network
      const result = await this.server.sendTransaction(transaction);
      
      return result;
    } catch (error) {
      console.error('Error submitting transaction:', error);
      throw error;
    }
  }

  /**
   * Get contract information
   * @param {string} contractAddress - Contract address
   * @returns {Promise<Object>} Contract information
   */
  async getContractInfo(contractAddress) {
    try {
      const contract = new Contract(contractAddress);
      
      const result = await this.server.getContractData(
        contractAddress,
        xdr.ScVal.scvMap([
          new xdr.ScMapEntry({
            key: new xdr.ScSymbol("DATA"),
            val: xdr.ScVal.scvVoid()
          })
        ])
      );

      const contractData = scValToNative(result.val);

      return {
        success: true,
        owner: contractData.owner,
        nftCounter: contractData.nft_counter,
        contractAddress
      };
    } catch (error) {
      console.error('Error getting contract info:', error);
      throw error;
    }
  }

  /**
   * Parse Soroban error from transaction result
   * @param {Object} result - Transaction result
   * @returns {string} Parsed error message
   */
  parseSorobanError(result) {
    if (!result.result || !result.result.results) {
      return 'Transaction failed';
    }

    const operationResult = result.result.results[0];
    if (operationResult && operationResult.xdr) {
      try {
        const xdrResult = xdr.ScVal.fromXdr(operationResult.xdr);
        return `Contract error: ${xdrResult.toString()}`;
      } catch (error) {
        return 'Unknown contract error';
      }
    }

    return 'Unknown error';
  }

  /**
   * Format address for display
   * @param {string} address - Stellar address
   * @returns {string} Formatted address
   */
  formatAddress(address) {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  }

  /**
   * Create contract instance for interaction
   * @param {string} contractAddress - Contract address
   * @returns {Contract} Contract instance
   */
  createContractInstance(contractAddress) {
    return new Contract(contractAddress);
  }
}

export default new SorobanAPI();
