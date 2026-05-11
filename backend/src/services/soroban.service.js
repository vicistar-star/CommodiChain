const { Contract, SorobanRpc, xdr, scValToNative } = require('@stellar/stellar-sdk');
const fs = require('fs');
const path = require('path');

class SorobanService {
  constructor() {
    this.rpcUrl = process.env.STELLAR_NETWORK === 'mainnet' 
      ? 'https://rpc.mainnet.stellar.org'
      : 'https://rpc.testnet.stellar.org';
    
    this.server = new SorobanRpc(this.rpcUrl);
    this.networkPassphrase = process.env.STELLAR_NETWORK === 'mainnet' 
      ? 'Public Global Stellar Network ; September 2015'
      : 'Test SDF Network ; September 2015';
  }

  /**
   * Deploy Soroban contract
   * @param {string} contractName - Name of the contract
   * @param {Object} deployerKeypair - Deployer's Stellar keypair
   * @returns {Promise<Object>} Deployment result
   */
  async deployContract(contractName, deployerKeypair) {
    try {
      // Load compiled WASM file
      const wasmPath = path.join(__dirname, '../../contracts', contractName, 'target', 'wasm', `${contractName}.wasm`);
      const wasmBuffer = fs.readFileSync(wasmPath);

      // Upload contract code
      const uploadResponse = await this.server.sendTransaction(
        new TransactionBuilder(deployerKeypair, {
          fee: '10000',
          networkPassphrase: this.networkPassphrase,
        })
          .addOperation(
            Operation.uploadContractWasm({
              wasm: wasmBuffer,
            })
          )
          .setTimeout(30)
          .build()
      );

      const wasmHash = uploadResponse.result.results[0].hash;

      // Create contract
      const createContractResponse = await this.server.sendTransaction(
        new TransactionBuilder(deployerKeypair, {
          fee: '10000',
          networkPassphrase: this.networkPassphrase,
        })
          .addOperation(
            Operation.createStellarAssetContract({
              wasmHash,
            })
          )
          .setTimeout(30)
          .build()
      );

      const contractAddress = createContractResponse.result.results[0].address;

      return {
        success: true,
        contractAddress,
        wasmHash,
        contractName
      };
    } catch (error) {
      console.error(`Error deploying ${contractName} contract:`, error);
      throw new Error(`Failed to deploy ${contractName} contract: ${error.message}`);
    }
  }

  /**
   * Initialize commodity NFT contract
   * @param {string} contractAddress - Contract address
   * @param {Object} adminKeypair - Admin's Stellar keypair
   * @returns {Promise<Object>} Initialization result
   */
  async initializeCommodityNFTContract(contractAddress, adminKeypair) {
    try {
      const contract = new Contract(contractAddress);
      
      const transaction = new TransactionBuilder(adminKeypair, {
        fee: '10000',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            "__init",
            ...[
              new Address(adminKeypair.publicKey()).toScVal()
            ]
          )
        )
        .setTimeout(30)
        .build();

      const result = await this.server.sendTransaction(transaction);
      
      return {
        success: true,
        transactionHash: result.hash,
        contractAddress
      };
    } catch (error) {
      console.error('Error initializing commodity NFT contract:', error);
      throw new Error(`Failed to initialize contract: ${error.message}`);
    }
  }

  /**
   * Mint commodity NFT using Soroban contract
   * @param {string} contractAddress - Contract address
   * @param {Object} minterKeypair - Minter's Stellar keypair
   * @param {Object} params - Minting parameters
   * @returns {Promise<Object>} Minting result
   */
  async mintCommodityNFT(contractAddress, minterKeypair, params) {
    try {
      const contract = new Contract(contractAddress);
      
      const mintParams = {
        commodity_type: params.commodityType,
        weight: params.weight,
        purity: params.purity || 'N/A',
        origin: params.origin,
        production_date: Math.floor(new Date(params.productionDate).getTime() / 1000),
        custodian: new Address(params.custodianAddress).toScVal(),
        inspector: params.inspector,
        inspection_date: Math.floor(new Date(params.inspectionDate).getTime() / 1000),
        metadata_hash: params.metadataHash
      };

      const transaction = new TransactionBuilder(minterKeypair, {
        fee: '10000',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            "mint",
            ...[
              new Address(minterKeypair.publicKey()).toScVal(),
              xdr.ScVal.scvMap(Object.entries(mintParams).map(([k, v]) => [
                new xdr.ScSymbol(k),
                typeof v === 'string' ? xdr.ScVal.scvString(v) : v
              ]))
            ]
          )
        )
        .setTimeout(30)
        .build();

      const result = await this.server.sendTransaction(transaction);
      
      // Parse the result to get NFT ID
      const nftId = scValToNative(result.result.results[0]);

      return {
        success: true,
        transactionHash: result.hash,
        nftId,
        contractAddress,
        minter: minterKeypair.publicKey()
      };
    } catch (error) {
      console.error('Error minting commodity NFT:', error);
      throw new Error(`Failed to mint NFT: ${error.message}`);
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
        from: new Address(fromKeypair.publicKey()).toScVal(),
        to: new Address(toAddress).toScVal()
      };

      const transaction = new TransactionBuilder(fromKeypair, {
        fee: '10000',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            "transfer",
            ...[
              new Address(fromKeypair.publicKey()).toScVal(),
              xdr.ScVal.scvMap(Object.entries(transferParams).map(([k, v]) => [
                new xdr.ScSymbol(k),
                v
              ]))
            ]
          )
        )
        .setTimeout(30)
        .build();

      const result = await this.server.sendTransaction(transaction);
      
      return {
        success: true,
        transactionHash: result.hash,
        contractAddress,
        from: fromKeypair.publicKey(),
        to: toAddress,
        nftId
      };
    } catch (error) {
      console.error('Error transferring NFT:', error);
      throw new Error(`Failed to transfer NFT: ${error.message}`);
    }
  }

  /**
   * Burn/redeem NFT using Soroban contract
   * @param {string} contractAddress - Contract address
   * @param {Object} ownerKeypair - Current owner's keypair
   * @param {number} nftId - NFT ID to burn
   * @returns {Promise<Object>} Burn result
   */
  async burnNFT(contractAddress, ownerKeypair, nftId) {
    try {
      const contract = new Contract(contractAddress);
      
      const transaction = new TransactionBuilder(ownerKeypair, {
        fee: '10000',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            "burn",
            ...[
              new Address(ownerKeypair.publicKey()).toScVal(),
              xdr.ScVal.scvU64(nftId)
            ]
          )
        )
        .setTimeout(30)
        .build();

      const result = await this.server.sendTransaction(transaction);
      
      return {
        success: true,
        transactionHash: result.hash,
        contractAddress,
        owner: ownerKeypair.publicKey(),
        nftId,
        burnedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error burning NFT:', error);
      throw new Error(`Failed to burn NFT: ${error.message}`);
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
      console.error('Error getting NFT:', error);
      throw new Error(`Failed to get NFT: ${error.message}`);
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
            val: new Address(ownerAddress).toScVal()
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
      console.error('Error getting owner NFTs:', error);
      throw new Error(`Failed to get owner NFTs: ${error.message}`);
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
      return false;
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
      throw new Error(`Failed to get contract info: ${error.message}`);
    }
  }

  /**
   * Build and deploy all contracts
   * @param {Object} deployerKeypair - Deployer's Stellar keypair
   * @returns {Promise<Object>} Deployment results
   */
  async deployAllContracts(deployerKeypair) {
    try {
      const contracts = ['commodity_nft', 'custodian_registry'];
      const deploymentResults = {};

      for (const contractName of contracts) {
        console.log(`Deploying ${contractName} contract...`);
        const result = await this.deployContract(contractName, deployerKeypair);
        deploymentResults[contractName] = result;
        
        // Initialize if needed
        if (contractName === 'commodity_nft') {
          await this.initializeCommodityNFTContract(result.contractAddress, deployerKeypair);
        }
        
        console.log(`✅ ${contractName} deployed at: ${result.contractAddress}`);
      }

      return {
        success: true,
        contracts: deploymentResults
      };
    } catch (error) {
      console.error('Error deploying contracts:', error);
      throw new Error(`Failed to deploy contracts: ${error.message}`);
    }
  }
}

module.exports = new SorobanService();
