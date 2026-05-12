# Development Environment Setup Guide

This guide helps new contributors set up their development environment for CommodiChain.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (recommend 20+)
- **Rust** 1.70+ (for Soroban contracts)
- **Git** for version control
- **VS Code** or similar code editor
- **Freighter** browser extension (for testing)

### One-Command Setup
```bash
# Clone and setup everything
git clone https://github.com/vicistar-star/CommodiChain.git
cd CommodiChain
./scripts/buildAndDeploy.sh --all
```

## 📋 Detailed Setup

### 1. Clone Repository
```bash
git clone https://github.com/vicistar-star/CommodiChain.git
cd CommodiChain
```

### 2. Install Rust and Soroban (for smart contracts)
```bash
# Install Rust
curl --proto '=https' sh.rustup.rs' | sh
source ~/.cargo/env

# Install Soroban CLI
cargo install soroban-cli

# Add WASM target
rustup target add wasm32-unknown-unknown

# Verify installation
rustc --version
soroban --version
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env  # or your preferred editor
```

#### Required Environment Variables
```env
# Stellar Network
STELLAR_NETWORK=testnet

# Stellar Accounts
ISSUER_PUBLIC_KEY=your_issuer_public_key
ISSUER_SECRET=your_issuer_secret_key

# Soroban Contracts
COMMODITY_NFT_CONTRACT=your_contract_address
CUSTODIAN_REGISTRY_CONTRACT=your_registry_address
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/commodichain

# IPFS
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# JWT
JWT_SECRET=your_jwt_secret
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

#### Frontend Environment Variables
```env
# API URL
VITE_API_URL=http://localhost:3000

# Soroban Contracts
VITE_COMMODITY_NFT_CONTRACT=your_contract_address
VITE_CUSTODIAN_REGISTRY_CONTRACT=your_registry_address
VITE_STELLAR_NETWORK=testnet
```

### 5. Database Setup
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 6. Start Development Servers

#### Start Backend
```bash
cd backend
npm run dev
```
Server runs on: http://localhost:3000

#### Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173 (or next available port)

## 🧪 Smart Contract Development

### Build Contracts
```bash
# Build all contracts
./contracts/build.sh

# Build with tests
./contracts/build.sh --test
```

### Deploy Contracts
```bash
# Deploy to testnet
node scripts/deploySorobanContracts.js
```

### Test Contracts
```bash
# Run contract tests
node scripts/testSorobanContracts.js
```

## 🔧 Development Tools

### VS Code Extensions (Recommended)
- **ES7+ React/Redux/React-Native snippets**
- **Prettier - Code formatter**
- **ESLint**
- **Tailwind CSS IntelliSense**
- **GitLens**
- **Thunder Client** (for API testing)

### Browser Tools
- **Freighter** - Stellar wallet
- **Stellar Expert** - Stellar block explorer
- **StellarXLM Profiler** - Transaction analysis

## 🐛 Common Issues & Solutions

### Port Already in Use
```bash
# Kill processes on ports 3000 and 5173
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:5173 | xargs kill -9

# Or use different ports
# Backend: PORT=3001 npm run dev
# Frontend: PORT=5174 npm run dev
```

### Permission Denied (Linux/Mac)
```bash
# Fix npm permissions
sudo chown -R $(whoami) node_modules
sudo chown -R $(whoami) ~/.npm

# Fix file permissions
chmod +x scripts/*.sh
```

### Module Not Found Errors
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Tailwind CSS Not Working
```bash
# Reinstall dependencies
npm uninstall tailwindcss postcss autoprefixer
npm install tailwindcss postcss autoprefixer

# Restart dev server
npm run dev
```

## 📱 Testing

### Run All Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Contract tests
node scripts/testSorobanContracts.js
```

### Create Test Accounts
```bash
# Generate test accounts
node scripts/createTestAccounts.js
```

### Mint Sample NFT
```bash
# Mint a test NFT
node scripts/mintSampleNFT.js
```

## 🚀 Deployment

### Build for Production
```bash
# Build frontend
cd frontend && npm run build

# Build contracts
./contracts/build.sh
```

### Environment-Specific Setup

#### Development
```bash
# Use testnet
STELLAR_NETWORK=testnet

# Use local database
DATABASE_URL=postgresql://localhost:5432/commodichain

# Enable debug logging
DEBUG=commodichain:*
```

#### Production
```bash
# Use mainnet
STELLAR_NETWORK=public

# Use production database
DATABASE_URL=postgresql://user:pass@prod-host:5432/commodichain

# Disable debug logging
DEBUG=
```

## 🔄 Daily Development Workflow

### 1. Morning Setup
```bash
# Pull latest changes
git pull origin main

# Start services
npm run dev  # backend
npm run dev  # frontend (new terminal)
```

### 2. During Development
- Make frequent commits
- Test changes locally
- Run tests before commits
- Check browser console for errors
- Monitor network requests

### 3. End of Day
```bash
# Commit changes
git add .
git commit -m "Daily work: [description]"

# Push to feature branch
git push origin feature/your-feature
```

## 📊 Monitoring & Debugging

### Backend Logs
```bash
# View logs
npm run dev 2>&1 | tee backend.log

# Filter logs
npm run dev 2>&1 | grep ERROR
```

### Frontend Debugging
- Open browser dev tools
- Check Network tab for API calls
- Use React DevTools
- Monitor console for warnings/errors

### Database Debugging
```bash
# View database contents
npx prisma studio

# Reset database
npx prisma migrate reset
```

## 🎯 Development Best Practices

### Code Style
- Follow existing patterns
- Use descriptive variable names
- Add comments for complex logic
- Keep functions small and focused

### Git Practices
- Use conventional commit messages
- Create feature branches
- Write descriptive PR descriptions
- Keep PRs focused and reviewable

### Testing
- Write tests for new features
- Test edge cases
- Mock external dependencies
- Maintain test coverage

### Security
- Never commit secrets
- Use environment variables
- Validate all inputs
- Follow OWASP guidelines

## 🆘 Getting Help

### Resources
- **README.md**: Project overview
- **CONTRIBUTING.md**: Contribution guide
- **API Documentation**: Backend API reference
- **Discord**: Community support
- **GitHub Issues**: Bug reports and questions

### Troubleshooting Steps
1. Check this guide first
2. Search existing GitHub issues
3. Ask in Discord community
4. Create new issue with details

---

**Happy coding! 🚀**

Remember to test changes thoroughly and follow the contribution guidelines in CONTRIBUTING.md.
