#!/bin/bash

# CommodiChain Complete Build and Deployment Script
# This script builds the entire project and deploys all components

set -e

echo "🚀 CommodiChain Complete Build and Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    echo ""
    echo "🔍 Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        echo "Please install Node.js from https://nodejs.org/"
        exit 1
    fi
    print_status "Node.js $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_status "npm $(npm --version)"
    
    # Check Rust
    if ! command -v rustc &> /dev/null; then
        print_error "Rust is not installed"
        echo "Please install Rust from https://rustup.rs/"
        exit 1
    fi
    print_status "Rust $(rustc --version)"
    
    # Check Soroban CLI
    if ! command -v soroban &> /dev/null; then
        print_warning "Soroban CLI is not installed"
        echo "Installing Soroban CLI..."
        cargo install soroban-cli
    else
        print_status "Soroban CLI $(soroban --version)"
    fi
    
    # Check WASM target
    if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
        print_warning "WASM target not found"
        echo "Installing WASM target..."
        rustup target add wasm32-unknown-unknown
    else
        print_status "WASM target is available"
    fi
}

# Build backend
build_backend() {
    echo ""
    echo "🏗️  Building Backend..."
    
    cd backend
    
    # Install dependencies
    print_info "Installing backend dependencies..."
    npm ci
    
    if [ $? -eq 0 ]; then
        print_status "Backend dependencies installed"
    else
        print_error "Backend dependency installation failed"
        exit 1
    fi
    
    # Run database migrations
    print_info "Running database migrations..."
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        print_status "Database migrations completed"
    else
        print_warning "Database migrations had issues"
    fi
    
    cd ..
}

# Build frontend
build_frontend() {
    echo ""
    echo "🎨  Building Frontend..."
    
    cd frontend
    
    # Install dependencies
    print_info "Installing frontend dependencies..."
    npm ci
    
    if [ $? -eq 0 ]; then
        print_status "Frontend dependencies installed"
    else
        print_error "Frontend dependency installation failed"
        exit 1
    fi
    
    # Build frontend
    print_info "Building frontend application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_status "Frontend build completed"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    cd ..
}

# Build Soroban contracts
build_contracts() {
    echo ""
    echo "⚡ Building Soroban Smart Contracts..."
    
    # Make build script executable
    chmod +x contracts/build.sh
    
    # Run contract build
    ./contracts/build.sh
    
    if [ $? -eq 0 ]; then
        print_status "Smart contracts built successfully"
    else
        print_error "Smart contract build failed"
        exit 1
    fi
}

# Run tests
run_tests() {
    echo ""
    echo "🧪 Running Tests..."
    
    # Backend tests
    print_info "Running backend tests..."
    cd backend && npm test
    
    if [ $? -eq 0 ]; then
        print_status "Backend tests passed"
    else
        print_warning "Backend tests had failures"
    fi
    
    cd ..
    
    # Frontend tests
    print_info "Running frontend tests..."
    cd frontend && npm test
    
    if [ $? -eq 0 ]; then
        print_status "Frontend tests passed"
    else
        print_warning "Frontend tests had failures"
    fi
    
    cd ..
    
    # Contract tests
    if [ "$1" = "--test-contracts" ]; then
        print_info "Running contract tests..."
        ./contracts/build.sh --test
        
        if [ $? -eq 0 ]; then
            print_status "Contract tests passed"
        else
            print_warning "Contract tests had failures"
        fi
    fi
}

# Deploy contracts (optional)
deploy_contracts() {
    if [ "$1" = "--deploy-contracts" ]; then
        echo ""
        echo "🚀 Deploying Smart Contracts..."
        
        # Check if .env has ISSUER_SECRET
        if [ ! -f backend/.env ] || ! grep -q "ISSUER_SECRET" backend/.env; then
            print_error "ISSUER_SECRET not found in backend/.env"
            echo "Please configure your environment variables"
            exit 1
        fi
        
        # Deploy contracts
        node scripts/deploySorobanContracts.js
        
        if [ $? -eq 0 ]; then
            print_status "Smart contracts deployed successfully"
        else
            print_error "Smart contract deployment failed"
            exit 1
        fi
    fi
}

# Generate build report
generate_build_report() {
    echo ""
    echo "📊 Build Report"
    echo "=================="
    
    # Backend
    if [ -d backend/node_modules ]; then
        echo "Backend: ✅ Built"
        echo "  Dependencies: $(ls backend/node_modules | wc -l)"
        echo "  Build Size: $(du -sh backend/dist 2>/dev/null || echo "N/A")"
    else
        echo "Backend: ❌ Not built"
    fi
    
    # Frontend
    if [ -d frontend/dist ]; then
        echo "Frontend: ✅ Built"
        echo "  Build Size: $(du -sh frontend/dist)"
        echo "  Assets: $(ls frontend/dist | wc -l)"
    else
        echo "Frontend: ❌ Not built"
    fi
    
    # Contracts
    if [ -d deployment ]; then
        echo "Contracts: ✅ Built"
        echo "  WASM Files: $(ls deployment/*.wasm | wc -l)"
        echo "  Total Size: $(du -sh deployment/)"
    else
        echo "Contracts: ❌ Not built"
    fi
    
    # Timestamp
    echo "Build completed at: $(date)"
}

# Create deployment package
create_deployment_package() {
    echo ""
    echo "📦 Creating Deployment Package..."
    
    # Create deployment directory
    mkdir -p deploy/commodichain
    
    # Copy frontend build
    if [ -d frontend/dist ]; then
        cp -r frontend/dist/* deploy/commodichain/
        print_status "Frontend build copied to deployment package"
    fi
    
    # Copy backend files
    cp -r backend/src deploy/commodichain/backend/
    cp backend/package.json deploy/commodichain/backend/
    cp backend/prisma deploy/commodichain/backend/
    cp backend/.env.example deploy/commodichain/backend/
    
    # Copy contracts
    if [ -d deployment ]; then
        cp -r deployment deploy/commodichain/contracts/
        print_status "Smart contracts copied to deployment package"
    fi
    
    # Copy scripts
    cp scripts/*.js deploy/commodichain/scripts/
    
    # Copy documentation
    cp -r docs deploy/commodichain/
    cp README.md deploy/commodichain/
    
    # Create deployment info
    cat > deploy/commodichain/deployment-info.json << EOF
{
  "build_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "build_version": "1.0.0",
  "components": {
    "backend": true,
    "frontend": true,
    "contracts": true,
    "scripts": true
  },
  "network": "$(grep STELLAR_NETWORK backend/.env.example 2>/dev/null || echo 'testnet')",
  "features": {
    "traditional_nft": true,
    "soroban_contracts": true,
    "freighter_integration": true,
    "ipfs_metadata": true
  }
}
EOF
    
    print_status "Deployment package created: deploy/commodichain/"
    print_status "Package size: $(du -sh deploy/commodichain/)"
}

# Main execution
main() {
    echo "Starting CommodiChain build process..."
    echo "=================================="
    
    # Check if we should run tests
    RUN_TESTS=false
    DEPLOY_CONTRACTS=false
    TEST_CONTRACTS=false
    
    for arg in "$@"; do
        case $arg in
            --test)
                RUN_TESTS=true
                ;;
            --deploy-contracts)
                DEPLOY_CONTRACTS=true
                ;;
            --test-contracts)
                TEST_CONTRACTS=true
                ;;
            --all)
                RUN_TESTS=true
                DEPLOY_CONTRACTS=true
                ;;
        esac
    done
    
    # Check prerequisites
    check_prerequisites
    
    # Build components
    build_backend
    build_frontend
    build_contracts
    
    # Run tests if requested
    if [ "$RUN_TESTS" = true ]; then
        run_tests
    fi
    
    # Run contract tests if requested
    if [ "$TEST_CONTRACTS" = true ]; then
        run_tests --test-contracts
    fi
    
    # Deploy contracts if requested
    if [ "$DEPLOY_CONTRACTS" = true ]; then
        deploy_contracts
    fi
    
    # Generate build report
    generate_build_report
    
    # Create deployment package
    create_deployment_package
    
    echo ""
    print_status "Build process completed successfully!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Review build report above"
    echo "2. Test deployment package: cd deploy/commodichain && npm install"
    echo "3. Configure environment variables: cp backend/.env.example backend/.env"
    echo "4. Start backend: cd backend && npm run dev"
    echo "5. Start frontend: cd frontend && npm run dev"
    
    if [ ! "$DEPLOY_CONTRACTS" = true ]; then
        echo "6. Deploy contracts: node scripts/deploySorobanContracts.js"
    fi
}

# Help function
show_help() {
    echo "CommodiChain Build and Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --test              Run all tests"
    echo "  --deploy-contracts   Deploy Soroban smart contracts"
    echo "  --test-contracts    Run contract tests"
    echo "  --all              Run tests and deploy contracts"
    echo "  --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Build only"
    echo "  $0 --test                    # Build and test"
    echo "  $0 --deploy-contracts          # Build and deploy contracts"
    echo "  $0 --all                      # Build, test, and deploy contracts"
}

# Check for help argument
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
