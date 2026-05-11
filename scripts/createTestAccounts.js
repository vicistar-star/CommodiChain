const StellarSdk = require('@stellar/stellar-sdk');

/**
 * Script to create and fund test accounts on Stellar testnet
 * This script creates multiple test accounts for development and testing
 */

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = StellarSdk.Networks.TESTNET;

async function createAndFundAccount() {
  try {
    // Create a new keypair
    const keypair = StellarSdk.Keypair.random();
    const publicKey = keypair.publicKey();
    const secretKey = keypair.secret();

    console.log(`🔑 Created new account:`);
    console.log(`   Public Key: ${publicKey}`);
    console.log(`   Secret Key: ${secretKey}`);

    // Fund the account using friendbot (testnet only)
    console.log('💰 Funding account with friendbot...');
    
    const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    const responseJSON = await response.json();

    if (responseJSON.success) {
      console.log('✅ Account funded successfully!');
      console.log(`   Starting Balance: ${responseJSON.result.starting_balance} XLM`);
      
      return {
        publicKey,
        secretKey,
        startingBalance: responseJSON.result.starting_balance
      };
    } else {
      throw new Error('Failed to fund account');
    }
  } catch (error) {
    console.error('❌ Error creating account:', error.message);
    return null;
  }
}

async function setupTrustline(secretKey, assetCode, issuerPublicKey) {
  try {
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    const account = await server.loadAccount(keypair.publicKey());

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(StellarSdk.Operation.changeTrust({
        asset: new StellarSdk.Asset(assetCode, issuerPublicKey),
      }))
      .setTimeout(30)
      .build();

    transaction.sign(keypair);
    const result = await server.submitTransaction(transaction);
    
    console.log(`✅ Trustline established for ${assetCode}`);
    return result;
  } catch (error) {
    console.error('❌ Error setting up trustline:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Setting up Stellar Testnet Accounts for CommodiChain\n');

  // Create multiple test accounts for different roles
  const roles = ['Issuer', 'Producer', 'Trader', 'Custodian', 'Inspector'];
  const accounts = {};

  for (const role of roles) {
    console.log(`\n📝 Creating ${role} account...`);
    const account = await createAndFundAccount();
    if (account) {
      accounts[role.toLowerCase()] = account;
    }
  }

  // Save accounts to .env file format
  console.log('\n📄 Environment Variables:');
  console.log('Copy these to your .env file:\n');
  
  Object.entries(accounts).forEach(([role, account]) => {
    console.log(`${role.toUpperCase()}_PUBLIC_KEY=${account.publicKey}`);
    console.log(`${role.toUpperCase()}_SECRET_KEY=${account.secretKey}`);
  });

  // Set up trustlines between accounts (example)
  if (accounts.issuer && accounts.producer) {
    console.log('\n🔗 Setting up trustline from Producer to Issuer...');
    await setupTrustline(
      accounts.producer.secretKey,
      'TESTASSET',
      accounts.issuer.publicKey
    );
  }

  console.log('\n✅ Test account setup complete!');
  console.log('\n💡 Next steps:');
  console.log('1. Copy the environment variables to your .env file');
  console.log('2. Update the ISSUER_SECRET in your backend .env');
  console.log('3. Run the mintSampleNFT.js script to test NFT minting');

  // Save accounts to JSON file for easy access
  const fs = require('fs');
  fs.writeFileSync(
    './testAccounts.json',
    JSON.stringify(accounts, null, 2)
  );
  console.log('\n💾 Accounts saved to ./testAccounts.json');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createAndFundAccount, setupTrustline };
