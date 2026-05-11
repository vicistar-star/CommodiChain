require('dotenv').config();
const StellarSdk = require('@stellar/stellar-sdk');
const axios = require('axios');

/**
 * Script to mint a sample NFT for testing and demonstration
 * This script demonstrates the complete NFT minting process
 */

const server = new StellarSdk.Horizon.Server(process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org');
const networkPassphrase = process.env.STELLAR_NETWORK === 'mainnet' 
  ? StellarSdk.Networks.PUBLIC 
  : StellarSdk.Networks.TESTNET;

// Sample commodity data
const sampleCommodity = {
  batchId: 'NG-AU-2024-00142',
  type: 'Gold',
  weight: '10kg',
  purity: '99.9%',
  origin: 'Zamfara State, Nigeria',
  productionDate: '2024-11-01',
  inspector: 'Bureau Veritas Nigeria',
  inspectionDate: '2024-11-03',
  reportHash: 'QmXyz...abc123'
};

const sampleCustodian = {
  name: 'Lagos Freeport Vaults Ltd',
  address: 'Tin Can Island, Apapa, Lagos',
  contact: 'custody@lagosfreeport.ng',
  licenseNo: 'LFV-2021-0034'
};

// Mock IPFS upload (in production, this would upload to actual IPFS)
async function uploadToIPFS(metadata) {
  console.log('📤 Uploading metadata to IPFS...');
  
  // For demo purposes, return a mock IPFS hash
  // In production, this would use the actual IPFS service
  const mockIpfsHash = 'QmSample' + Math.random().toString(36).substring(7);
  console.log(`✅ Metadata uploaded to IPFS: ${mockIpfsHash}`);
  
  return mockIpfsHash;
}

// Create metadata for the commodity
function createMetadata(commodity, custodian, imageHash = null) {
  const metadata = {
    name: `${commodity.type} Batch #${commodity.batchId}`,
    description: `${commodity.weight} ${commodity.type}, ${commodity.purity} purity, stored at ${custodian.name}`,
    commodity: {
      type: commodity.type,
      weight: commodity.weight,
      purity: commodity.purity,
      origin: commodity.origin,
      batchId: commodity.batchId,
      productionDate: commodity.productionDate
    },
    custodian: {
      name: custodian.name,
      address: custodian.address,
      contact: custodian.contact,
      licenseNo: custodian.licenseNo
    },
    inspection: {
      inspector: commodity.inspector,
      date: commodity.inspectionDate,
      reportHash: commodity.reportHash
    },
    createdAt: new Date().toISOString(),
    version: '1.0'
  };

  if (imageHash) {
    metadata.image = `ipfs://${imageHash}`;
  }

  return metadata;
}

// Mint NFT on Stellar
async function mintNFT(assetCode, ipfsHash, receiverPublicKey) {
  try {
    if (!process.env.ISSUER_SECRET) {
      throw new Error('ISSUER_SECRET not found in environment variables');
    }

    const issuerKeypair = StellarSdk.Keypair.fromSecret(process.env.ISSUER_SECRET);
    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
    
    // Create the NFT asset
    const nftAsset = new StellarSdk.Asset(assetCode, issuerKeypair.publicKey());

    console.log(`🏗️  Building transaction to mint NFT: ${assetCode}`);

    // Build transaction to mint NFT with supply of exactly 1
    const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
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
    const result = await server.submitTransaction(transaction);
    
    console.log(`✅ NFT minted successfully!`);
    console.log(`   Transaction Hash: ${result.hash}`);
    console.log(`   Asset Code: ${assetCode}`);
    console.log(`   Issuer: ${issuerKeypair.publicKey()}`);
    console.log(`   Receiver: ${receiverPublicKey}`);
    
    return {
      success: true,
      transactionHash: result.hash,
      assetCode,
      issuer: issuerKeypair.publicKey(),
      ipfsHash,
      receiver: receiverPublicKey
    };
  } catch (error) {
    console.error('❌ Error minting NFT:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  console.log('🏅 CommodiChain Sample NFT Minting Demo\n');

  try {
    // Check if issuer secret is available
    if (!process.env.ISSUER_SECRET) {
      console.log('❌ ISSUER_SECRET not found in environment variables');
      console.log('Please run createTestAccounts.js first to create test accounts');
      console.log('Or set ISSUER_SECRET in your .env file');
      return;
    }

    // Get receiver public key (can be passed as argument or use a test account)
    let receiverPublicKey = process.argv[2];
    
    if (!receiverPublicKey) {
      // Try to read from testAccounts.json
      try {
        const fs = require('fs');
        const testAccounts = JSON.parse(fs.readFileSync('./testAccounts.json', 'utf8'));
        receiverPublicKey = testAccounts.producer?.publicKey;
      } catch (error) {
        console.log('❌ No receiver public key provided');
        console.log('Usage: node mintSampleNFT.js <receiver_public_key>');
        console.log('Or ensure testAccounts.json exists from createTestAccounts.js');
        return;
      }
    }

    console.log(`📋 Commodity Details:`);
    console.log(`   Type: ${sampleCommodity.type}`);
    console.log(`   Batch ID: ${sampleCommodity.batchId}`);
    console.log(`   Weight: ${sampleCommodity.weight}`);
    console.log(`   Origin: ${sampleCommodity.origin}`);
    console.log(`   Receiver: ${receiverPublicKey}\n`);

    // Step 1: Create metadata
    const metadata = createMetadata(sampleCommodity, sampleCustodian);
    console.log('📝 Created metadata:');
    console.log(JSON.stringify(metadata, null, 2));

    // Step 2: Upload to IPFS (mock)
    const ipfsHash = await uploadToIPFS(metadata);

    // Step 3: Mint NFT
    const assetCode = `${sampleCommodity.type.toUpperCase()}-${sampleCommodity.batchId}`;
    const mintResult = await mintNFT(assetCode, ipfsHash, receiverPublicKey);

    console.log('\n🎉 Sample NFT minting completed successfully!');
    console.log('\n📊 NFT Information:');
    console.log(`   Asset Code: ${mintResult.assetCode}`);
    console.log(`   Transaction: https://stellar.expert/explorer/testnet/tx/${mintResult.transactionHash}`);
    console.log(`   IPFS Hash: ${mintResult.ipfsHash}`);
    console.log(`   Current Owner: ${mintResult.receiver}`);

    console.log('\n💡 Next steps:');
    console.log('1. Verify the NFT using the verifyNFT.js script');
    console.log('2. Test transfer functionality');
    console.log('3. Check the NFT on Stellar Explorer');

    // Save mint result for reference
    const fs = require('fs');
    const mintData = {
      ...mintResult,
      metadata,
      commodity: sampleCommodity,
      custodian: sampleCustodian,
      mintedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(
      './mintedNFT.json',
      JSON.stringify(mintData, null, 2)
    );
    console.log('\n💾 Mint data saved to ./mintedNFT.json');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { mintNFT, createMetadata };
