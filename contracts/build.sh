#!/bin/bash

# CommodiChain Soroban Contracts Build Script
# This script builds all Soroban smart contracts for deployment

set -e

echo "🔨 Building Soroban Smart Contracts for CommodiChain"
echo "=================================================="

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust is not installed"
    echo "Please install Rust from: https://rustup.rs/"
    exit 1
fi

echo "✅ Rust version: $(rustc --version)"

# Check if Soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo "❌ Soroban CLI is not installed"
    echo "Installing Soroban CLI..."
    cargo install soroban-cli
fi

echo "✅ Soroban CLI version: $(soroban --version)"

# Check if WASM target is installed
if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
    echo "📦 Installing WASM target..."
    rustup target add wasm32-unknown-unknown
fi

echo "✅ WASM target is available"

# Function to build a contract
build_contract() {
    local contract_name=$1
    local contract_path="contracts/$contract_name"
    
    echo ""
    echo "🏗️  Building $contract_name contract..."
    
    if [ ! -d "$contract_path" ]; then
        echo "❌ Contract directory $contract_path does not exist"
        return 1
    fi
    
    # Build the contract
    cd "$contract_path"
    cargo build --target wasm32-unknown-unknown --release
    
    if [ $? -eq 0 ]; then
        echo "✅ $contract_name built successfully"
        
        # Check if WASM file was created
        if [ -f "target/wasm32-unknown-unknown/release/$contract_name.wasm" ]; then
            echo "📄 WASM file: target/wasm32-unknown-unknown/release/$contract_name.wasm"
            echo "📏 Size: $(du -h target/wasm32-unknown-unknown/release/$contract_name.wasm | cut -f1)"
        else
            echo "❌ WASM file not found"
            return 1
        fi
    else
        echo "❌ $contract_name build failed"
        return 1
    fi
    
    cd -..
}

# Build all contracts
echo ""
echo "🏗️  Building all contracts..."
echo ""

# Build commodity_nft contract
build_contract "commodity_nft"

# Build custodian_registry contract
build_contract "custodian_registry"

echo ""
echo "🎉 All contracts built successfully!"
echo ""

# Create deployment directory
mkdir -p deployment
echo "📁 Created deployment directory"

# Copy WASM files to deployment directory
echo "📋 Copying WASM files to deployment directory..."
cp contracts/commodity_nft/target/wasm32-unknown-unknown/release/commodity_nft.wasm deployment/
cp contracts/custodian_registry/target/wasm32-unknown-unknown/release/custodian_registry.wasm deployment/

echo "✅ WASM files copied to deployment/ directory"

# Generate deployment info
cat > deployment/contracts.json << EOF
{
  "commodity_nft": {
    "wasm_file": "commodity_nft.wasm",
    "built_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "size_bytes": $(wc -c < deployment/commodity_nft.wasm)
  },
  "custodian_registry": {
    "wasm_file": "custodian_registry.wasm", 
    "built_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "size_bytes": $(wc -c < deployment/custodian_registry.wasm)
  },
  "build_info": {
    "rust_version": "$(rustc --version)",
    "soroban_version": "$(soroban --version)",
    "target": "wasm32-unknown-unknown",
    "optimization": "release"
  }
}
EOF

echo "📄 Deployment info saved to deployment/contracts.json"

# Display summary
echo ""
echo "📊 Build Summary:"
echo "=================="
echo "Contracts built: 2"
echo "Total WASM size: $(du -sh deployment/ | cut -f1)"
echo "Build time: $(date)"
echo ""

echo "🚀 Ready for deployment!"
echo "Run: node scripts/deploySorobanContracts.js"
echo ""

# Optional: Run tests if requested
if [ "$1" = "--test" ]; then
    echo ""
    echo "🧪 Running contract tests..."
    echo ""
    
    # Test commodity_nft
    echo "Testing commodity_nft contract..."
    cd contracts/commodity_nft
    cargo test --target wasm32-unknown-unknown
    cd ..
    
    # Test custodian_registry  
    echo "Testing custodian_registry contract..."
    cd contracts/custodian_registry
    cargo test --target wasm32-unknown-unknown
    cd ..
    
    echo ""
    echo "✅ All tests completed!"
fi

echo "🎯 Build process completed successfully!"
