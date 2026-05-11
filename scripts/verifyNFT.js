require('dotenv').config();
const StellarSdk = require('@stellar/stellar-sdk');
const axios = require('axios');

/**
 * Script to verify NFT ownership and authenticity on Stellar
 * This script demonstrates how to verify NFT details from the blockchain
 */

const server = new StellarSdk.Horizon.Server(process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org');
const networkPassphrase = process.env.STELLAR_NETWORK === 'mainnet' 
  ? StellarSdk.Networks.PUBLIC 
  : StellarSdk.Networks.TESTNET;

// Verify NFT ownership on-chain
async function verifyNFTOnChain(assetCode, issuerPublicKey) {
  try {
    console.log(`🔍 Verifying NFT ${assetCode} from issuer ${issuerPublicKey}...`);
    
    const nftAsset = new StellarSdk.Asset(assetCode, issuerPublicKey);
    
    // Find all accounts holding this asset
    const accounts = await server.accounts()
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
      const issuerAccount = await server.loadAccount(issuerPublicKey);
      const dataEntry = issuerAccount.data.find(d => d.name === `${assetCode}_metadata`);
      if (dataEntry) {
        metadata = dataEntry.value.toString('base64');
      }
    } catch (error) {
      console.warn('⚠️  Could not fetch metadata from on-chain data:', error.message);
    }

    const result = {
      success: true,
      owner: holder.account_id,
      balance: balance ? balance.balance : '0',
      metadata,
      assetCode,
      issuer: issuerPublicKey,
      lastModified: holder.last_modified_ledger,
      holdersCount: accounts.records.length
    };

    console.log('✅ NFT verified on-chain!');
    console.log(`   Owner: ${result.owner}`);
    console.log(`   Balance: ${result.balance}`);
    console.log(`   Metadata: ${result.metadata || 'Not found'}`);
    console.log(`   Holders: ${result.holdersCount}`);

    return result;
  } catch (error) {
    console.error('❌ Error verifying NFT on-chain:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get metadata from IPFS
async function getMetadataFromIPFS(ipfsHash) {
  try {
    console.log(`📥 Fetching metadata from IPFS: ${ipfsHash}`);
    
    const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    const metadata = response.data;

    console.log('✅ Metadata retrieved from IPFS:');
    console.log(`   Name: ${metadata.name}`);
    console.log(`   Description: ${metadata.description}`);
    console.log(`   Commodity Type: ${metadata.commodity?.type}`);
    console.log(`   Weight: ${metadata.commodity?.weight}`);
    console.log(`   Origin: ${metadata.commodity?.origin}`);

    return metadata;
  } catch (error) {
    console.error('❌ Error fetching metadata from IPFS:', error.message);
    return null;
  }
}

// Get transaction history for an NFT
async function getTransactionHistory(assetCode, issuerPublicKey) {
  try {
    console.log(`📜 Getting transaction history for ${assetCode}...`);
    
    const nftAsset = new StellarSdk.Asset(assetCode, issuerPublicKey);
    
    // Get payments for this asset
    const payments = await server.payments()
      .forAsset(nftAsset)
      .order('desc')
      .limit(10)
      .call();

    const transactions = payments.records.map(record => ({
      hash: record.transaction_hash,
      type: record.type,
      from: record.from || 'N/A',
      to: record.to || 'N/A',
      amount: record.amount,
      asset_code: record.asset_code,
      asset_issuer: record.asset_issuer,
      created_at: record.created_at,
      memo: record.memo
    }));

    console.log(`✅ Found ${transactions.length} transactions`);
    transactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.type}: ${tx.from} → ${tx.to} (${tx.amount})`);
    });

    return transactions;
  } catch (error) {
    console.error('❌ Error getting transaction history:', error.message);
    return [];
  }
}

// Verify NFT using backend API (alternative method)
async function verifyWithBackendAPI(assetCode, issuerPublicKey) {
  try {
    console.log(`🌐 Verifying NFT using backend API...`);
    
    const response = await axios.get(`http://localhost:3000/api/nft/verify/${assetCode}/${issuerPublicKey}`);
    const result = response.data;

    if (result.success) {
      console.log('✅ NFT verified via backend API!');
      console.log(`   Owner: ${result.data.owner}`);
      console.log(`   Status: ${result.data.isBurned ? 'Burned' : 'Active'}`);
      
      return result.data;
    } else {
      console.log('❌ Backend API verification failed:', result.error);
      return null;
    }
  } catch (error) {
    console.warn('⚠️  Backend API not available, using on-chain verification only');
    return null;
  }
}

// Main verification function
async function verifyNFT(assetCode, issuerPublicKey, options = {}) {
  const { useBackend = false, includeHistory = false, fetchMetadata = true } = options;

  console.log(`🏅 CommodiChain NFT Verification\n`);
  console.log(`Asset Code: ${assetCode}`);
  console.log(`Issuer: ${issuerPublicKey}\n`);

  let verificationResult = null;

  // Try backend API first if requested
  if (useBackend) {
    verificationResult = await verifyWithBackendAPI(assetCode, issuerPublicKey);
  }

  // Fall back to on-chain verification
  if (!verificationResult) {
    verificationResult = await verifyNFTOnChain(assetCode, issuerPublicKey);
  }

  if (!verificationResult.success) {
    console.log('\n❌ Verification failed:', verificationResult.error);
    return verificationResult;
  }

  // Fetch metadata if available and requested
  let metadata = null;
  if (fetchMetadata && verificationResult.metadata) {
    metadata = await getMetadataFromIPFS(verificationResult.metadata);
    verificationResult.fullMetadata = metadata;
  }

  // Get transaction history if requested
  if (includeHistory) {
    const history = await getTransactionHistory(assetCode, issuerPublicKey);
    verificationResult.transactionHistory = history;
  }

  return verificationResult;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('❌ Missing required arguments');
    console.log('Usage: node verifyNFT.js <asset_code> <issuer_public_key> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --backend    Use backend API for verification');
    console.log('  --history    Include transaction history');
    console.log('  --no-meta    Skip metadata fetching');
    console.log('');
    console.log('Example: node verifyNFT.js GOLD-NG-AU-2024-00142 GABC...XYZ');
    
    // Try to read from mintedNFT.json if available
    try {
      const fs = require('fs');
      const mintedNFT = JSON.parse(fs.readFileSync('./mintedNFT.json', 'utf8'));
      console.log('\n💡 Using data from mintedNFT.json:');
      console.log(`   Asset Code: ${mintedNFT.assetCode}`);
      console.log(`   Issuer: ${mintedNFT.issuer}`);
      console.log('   Run: node verifyNFT.js', mintedNFT.assetCode, mintedNFT.issuer);
    } catch (error) {
      // No mintedNFT.json file found
    }
    
    return;
  }

  const [assetCode, issuerPublicKey, ...options] = args;
  
  const verificationOptions = {
    useBackend: options.includes('--backend'),
    includeHistory: options.includes('--history'),
    fetchMetadata: !options.includes('--no-meta')
  };

  try {
    const result = await verifyNFT(assetCode, issuerPublicKey, verificationOptions);

    if (result.success) {
      console.log('\n🎉 Verification completed successfully!');
      
      // Display summary
      console.log('\n📋 Verification Summary:');
      console.log(`   ✅ Asset Code: ${result.assetCode}`);
      console.log(`   ✅ Issuer: ${result.issuer}`);
      console.log(`   ✅ Current Owner: ${result.owner}`);
      console.log(`   ✅ Balance: ${result.balance}`);
      console.log(`   ✅ Authentic: Yes`);
      
      if (result.fullMetadata) {
        console.log(`   ✅ Metadata: Available`);
        console.log(`   📝 Commodity: ${result.fullMetadata.commodity?.type} - ${result.fullMetadata.commodity?.weight}`);
        console.log(`   📍 Origin: ${result.fullMetadata.commodity?.origin}`);
      }

      if (result.transactionHistory) {
        console.log(`   📜 Transactions: ${result.transactionHistory.length}`);
      }

      console.log('\n🔗 Explorer Links:');
      console.log(`   Stellar: https://stellar.expert/explorer/testnet/asset/${assetCode}-${issuerPublicKey}`);
      if (result.metadata) {
        console.log(`   IPFS: https://gateway.pinata.cloud/ipfs/${result.metadata}`);
      }
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { verifyNFT, verifyNFTOnChain, getMetadataFromIPFS };
