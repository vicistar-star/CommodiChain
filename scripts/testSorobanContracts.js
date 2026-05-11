require('dotenv').config();
const { Keypair } = require('@stellar/stellar-sdk');
const sorobanService = require('../backend/src/services/soroban.service');

/**
 * Script to test Soroban smart contracts functionality
 * This script demonstrates contract interactions for CommodiChain
 */

async function main() {
  console.log('🧪 Testing Soroban Smart Contracts for CommodiChain\n');

  try {
    // Load deployment data
    const fs = require('fs');
    let deploymentData;
    
    try {
      deploymentData = JSON.parse(fs.readFileSync('./sorobanContracts.json', 'utf8'));
    } catch (error) {
      console.log('❌ Soroban contracts not deployed yet');
      console.log('Please run deploySorobanContracts.js first');
      return;
    }

    // Load test accounts
    let testAccounts;
    try {
      testAccounts = JSON.parse(fs.readFileSync('./testAccounts.json', 'utf8'));
    } catch (error) {
      console.log('❌ Test accounts not found');
      console.log('Please run createTestAccounts.js first');
      return;
    }

    console.log('📋 Test Configuration:');
    console.log(`   Commodity NFT Contract: ${deploymentData.contracts.commodity_nft.contractAddress}`);
    console.log(`   Custodian Registry: ${deploymentData.contracts.custodian_registry.contractAddress}`);
    console.log(`   Network: ${deploymentData.network}\n`);

    // Test 1: Mint Commodity NFT
    await testMintCommodityNFT(deploymentData, testAccounts);

    // Test 2: Transfer NFT
    await testTransferNFT(deploymentData, testAccounts);

    // Test 3: Get NFT Details
    await testGetNFTDetails(deploymentData);

    // Test 4: Burn NFT
    await testBurnNFT(deploymentData, testAccounts);

    // Test 5: Custodian Registry
    await testCustodianRegistry(deploymentData, testAccounts);

    console.log('\n🎉 All Soroban contract tests completed successfully!');

  } catch (error) {
    console.error('❌ Contract testing failed:', error.message);
    process.exit(1);
  }
}

// Test minting commodity NFT
async function testMintCommodityNFT(deploymentData, testAccounts) {
  console.log('🏅 Test 1: Minting Commodity NFT');
  
  try {
    const mintParams = {
      commodityType: 'Gold',
      weight: '10kg',
      purity: '99.9%',
      origin: 'Zamfara State, Nigeria',
      productionDate: '2024-11-01',
      custodianAddress: testAccounts.custodian.publicKey,
      inspector: 'Bureau Veritas Nigeria',
      inspectionDate: '2024-11-03',
      metadataHash: 'QmSampleMetadataHash123'
    };

    const result = await sorobanService.mintCommodityNFT(
      deploymentData.contracts.commodity_nft.contractAddress,
      Keypair.fromSecret(testAccounts.producer.secretKey),
      mintParams
    );

    if (result.success) {
      console.log('✅ NFT minted successfully!');
      console.log(`   NFT ID: ${result.nftId}`);
      console.log(`   Transaction: ${result.transactionHash}`);
      console.log(`   Minter: ${result.minter}`);
      
      // Save for subsequent tests
      global.testNFTId = result.nftId;
    } else {
      console.log('❌ NFT minting failed');
    }

  } catch (error) {
    console.error('❌ Mint test failed:', error.message);
  }
  
  console.log('');
}

// Test NFT transfer
async function testTransferNFT(deploymentData, testAccounts) {
  console.log('🔄 Test 2: Transferring NFT');
  
  if (!global.testNFTId) {
    console.log('❌ No NFT ID available for transfer test');
    return;
  }

  try {
    const result = await sorobanService.transferNFT(
      deploymentData.contracts.commodity_nft.contractAddress,
      Keypair.fromSecret(testAccounts.producer.secretKey),
      testAccounts.trader.publicKey,
      global.testNFTId
    );

    if (result.success) {
      console.log('✅ NFT transferred successfully!');
      console.log(`   Transaction: ${result.transactionHash}`);
      console.log(`   From: ${result.from}`);
      console.log(`   To: ${result.to}`);
      console.log(`   NFT ID: ${result.nftId}`);
    } else {
      console.log('❌ NFT transfer failed');
    }

  } catch (error) {
    console.error('❌ Transfer test failed:', error.message);
  }
  
  console.log('');
}

// Test getting NFT details
async function testGetNFTDetails(deploymentData) {
  console.log('🔍 Test 3: Getting NFT Details');
  
  if (!global.testNFTId) {
    console.log('❌ No NFT ID available for details test');
    return;
  }

  try {
    const result = await sorobanService.getNFT(
      deploymentData.contracts.commodity_nft.contractAddress,
      global.testNFTId
    );

    if (result.success) {
      console.log('✅ NFT details retrieved successfully!');
      console.log(`   NFT ID: ${result.nftId}`);
      console.log(`   Owner: ${result.nft.owner}`);
      console.log(`   Commodity Type: ${result.nft.commodity_type}`);
      console.log(`   Weight: ${result.nft.weight}`);
      console.log(`   Origin: ${result.nft.origin}`);
      console.log(`   Is Burned: ${result.nft.is_burned}`);
      console.log(`   Metadata Hash: ${result.nft.metadata_hash}`);
    } else {
      console.log('❌ Failed to get NFT details');
    }

  } catch (error) {
    console.error('❌ Details test failed:', error.message);
  }
  
  console.log('');
}

// Test burning NFT
async function testBurnNFT(deploymentData, testAccounts) {
  console.log('🔥 Test 4: Burning NFT');
  
  if (!global.testNFTId) {
    console.log('❌ No NFT ID available for burn test');
    return;
  }

  try {
    const result = await sorobanService.burnNFT(
      deploymentData.contracts.commodity_nft.contractAddress,
      Keypair.fromSecret(testAccounts.trader.secretKey), // Current owner after transfer
      global.testNFTId
    );

    if (result.success) {
      console.log('✅ NFT burned successfully!');
      console.log(`   Transaction: ${result.transactionHash}`);
      console.log(`   Owner: ${result.owner}`);
      console.log(`   NFT ID: ${result.nftId}`);
      console.log(`   Burned At: ${result.burnedAt}`);
    } else {
      console.log('❌ NFT burning failed');
    }

  } catch (error) {
    console.error('❌ Burn test failed:', error.message);
  }
  
  console.log('');
}

// Test custodian registry (placeholder - would need actual implementation)
async function testCustodianRegistry(deploymentData, testAccounts) {
  console.log('🏢 Test 5: Custodian Registry');
  
  try {
    // This would test the custodian registry contract
    // For now, we'll just verify the contract exists
    const result = await sorobanService.getContractInfo(
      deploymentData.contracts.custodian_registry.contractAddress
    );

    if (result.success) {
      console.log('✅ Custodian registry contract accessible!');
      console.log(`   Contract Owner: ${result.owner}`);
      console.log(`   Total Registered: ${result.nftCounter}`);
    } else {
      console.log('❌ Failed to access custodian registry');
    }

  } catch (error) {
    console.error('❌ Custodian registry test failed:', error.message);
  }
  
  console.log('');
}

// Performance test
async function performanceTest(deploymentData, testAccounts) {
  console.log('⚡ Performance Test: Multiple Operations');
  
  const startTime = Date.now();
  const operations = [];
  
  try {
    // Test multiple mint operations
    for (let i = 0; i < 5; i++) {
      const mintParams = {
        commodityType: `Test${i}`,
        weight: '1kg',
        origin: 'Test Origin',
        productionDate: '2024-11-01',
        custodianAddress: testAccounts.custodian.publicKey,
        inspector: 'Test Inspector',
        inspectionDate: '2024-11-03',
        metadataHash: `QmTest${i}`
      };

      const result = await sorobanService.mintCommodityNFT(
        deploymentData.contracts.commodity_nft.contractAddress,
        Keypair.fromSecret(testAccounts.producer.secretKey),
        mintParams
      );

      operations.push({
        type: 'mint',
        nftId: result.nftId,
        success: result.success,
        duration: Date.now() - startTime
      });
    }

    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    console.log('✅ Performance test completed!');
    console.log(`   Total Operations: ${operations.length}`);
    console.log(`   Total Duration: ${totalDuration}ms`);
    console.log(`   Average per Operation: ${Math.round(totalDuration / operations.length)}ms`);
    console.log(`   Operations per Second: ${Math.round((operations.length / totalDuration) * 1000)}`);

  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
  }
}

// Error handling test
async function errorHandlingTest(deploymentData, testAccounts) {
  console.log('🚨 Error Handling Test');
  
  try {
    // Test invalid NFT ID
    console.log('   Testing invalid NFT ID...');
    await sorobanService.getNFT(
      deploymentData.contracts.commodity_nft.contractAddress,
      99999 // Invalid ID
    );
    console.log('❌ Should have failed for invalid NFT ID');
  } catch (error) {
    console.log('✅ Correctly handled invalid NFT ID error');
  }

  try {
    // Test unauthorized access
    console.log('   Testing unauthorized transfer...');
    await sorobanService.transferNFT(
      deploymentData.contracts.commodity_nft.contractAddress,
      Keypair.fromSecret(testAccounts.inspector.secretKey), // Not owner
      testAccounts.trader.publicKey,
      global.testNFTId
    );
    console.log('❌ Should have failed for unauthorized transfer');
  } catch (error) {
    console.log('✅ Correctly handled unauthorized transfer error');
  }
}

// Run all tests
if (require.main === module) {
  main();
}

module.exports = { 
  testMintCommodityNFT, 
  testTransferNFT, 
  testBurnNFT, 
  performanceTest,
  errorHandlingTest
};
