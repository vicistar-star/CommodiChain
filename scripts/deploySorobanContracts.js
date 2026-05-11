require('dotenv').config();
const { Keypair } = require('@stellar/stellar-sdk');
const sorobanService = require('../backend/src/services/soroban.service');

/**
 * Script to deploy Soroban smart contracts for CommodiChain
 * This script deploys and initializes all smart contracts
 */

async function main() {
  console.log('🚀 Deploying Soroban Smart Contracts for CommodiChain\n');

  try {
    // Check for issuer secret key
    if (!process.env.ISSUER_SECRET) {
      console.log('❌ ISSUER_SECRET not found in environment variables');
      console.log('Please set ISSUER_SECRET in your .env file');
      console.log('Or run createTestAccounts.js to create test accounts');
      return;
    }

    // Create deployer keypair
    const deployerKeypair = Keypair.fromSecret(process.env.ISSUER_SECRET);
    
    console.log('📋 Deployment Configuration:');
    console.log(`   Deployer: ${deployerKeypair.publicKey()}`);
    console.log(`   Network: ${process.env.STELLAR_NETWORK || 'testnet'}`);
    console.log(`   RPC URL: ${process.env.STELLAR_NETWORK === 'mainnet' 
      ? 'https://rpc.mainnet.stellar.org' 
      : 'https://rpc.testnet.stellar.org'}\n`);

    // Deploy all contracts
    console.log('🏗️  Deploying contracts...');
    const deploymentResult = await sorobanService.deployAllContracts(deployerKeypair);

    if (deploymentResult.success) {
      console.log('\n✅ All contracts deployed successfully!');
      
      console.log('\n📄 Contract Addresses:');
      Object.entries(deploymentResult.contracts).forEach(([name, result]) => {
        console.log(`   ${name}: ${result.contractAddress}`);
        console.log(`   WASM Hash: ${result.wasmHash}`);
      });

      // Save deployment info
      const fs = require('fs');
      const deploymentData = {
        ...deploymentResult,
        deployedAt: new Date().toISOString(),
        network: process.env.STELLAR_NETWORK || 'testnet',
        deployer: deployerKeypair.publicKey()
      };

      fs.writeFileSync(
        './sorobanContracts.json',
        JSON.stringify(deploymentData, null, 2)
      );

      console.log('\n💾 Deployment data saved to ./sorobanContracts.json');

      // Update backend environment variables
      console.log('\n⚙️  Update your backend .env with:');
      console.log(`   COMMODITY_NFT_CONTRACT=${deploymentResult.contracts.commodity_nft.contractAddress}`);
      console.log(`   CUSTODIAN_REGISTRY_CONTRACT=${deploymentResult.contracts.custodian_registry.contractAddress}`);

      console.log('\n🎉 Soroban deployment completed!');
      console.log('\n💡 Next steps:');
      console.log('1. Update backend .env with contract addresses');
      console.log('2. Test contract interactions with testSorobanContracts.js');
      console.log('3. Update frontend to use Soroban contracts');

    } else {
      console.log('❌ Contract deployment failed');
    }

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Build contracts before deployment
async function buildContracts() {
  console.log('🔨 Building contracts...');
  
  const { execSync } = require('child_process');
  
  try {
    // Build commodity_nft contract
    console.log('   Building commodity_nft...');
    execSync('cargo build --target wasm32-unknown-unknown --release', {
      cwd: './contracts/commodity_nft',
      stdio: 'inherit'
    });

    // Build custodian_registry contract
    console.log('   Building custodian_registry...');
    execSync('cargo build --target wasm32-unknown-unknown --release', {
      cwd: './contracts/custodian_registry',
      stdio: 'inherit'
    });

    console.log('✅ All contracts built successfully!');
    return true;
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    return false;
  }
}

// Check if Rust and Soroban CLI are installed
function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  const { execSync } = require('child_process');
  
  try {
    // Check Rust
    execSync('rustc --version', { stdio: 'pipe' });
    console.log('✅ Rust is installed');
  } catch (error) {
    console.log('❌ Rust is not installed');
    console.log('Please install Rust from https://rustup.rs/');
    return false;
  }

  try {
    // Check Soroban CLI
    execSync('soroban --version', { stdio: 'pipe' });
    console.log('✅ Soroban CLI is installed');
  } catch (error) {
    console.log('❌ Soroban CLI is not installed');
    console.log('Please install Soroban CLI: cargo install soroban-cli');
    return false;
  }

  try {
    // Check cargo target
    execSync('rustup target list --installed', { stdio: 'pipe' });
    console.log('✅ WASM target is available');
  } catch (error) {
    console.log('❌ WASM target not found');
    console.log('Please install WASM target: rustup target add wasm32-unknown-unknown');
    return false;
  }

  return true;
}

// Main execution
if (require.main === module) {
  // Check prerequisites first
  if (!checkPrerequisites()) {
    process.exit(1);
  }

  // Build contracts
  if (!buildContracts()) {
    process.exit(1);
  }

  // Deploy contracts
  main();
}

module.exports = { buildContracts, checkPrerequisites };
