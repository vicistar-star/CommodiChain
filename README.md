# 🏅 CommodiChain — NFT-Based Proof of Ownership for Physical Commodities on Stellar

> A decentralized platform for issuing, transferring, and verifying tamper-proof ownership certificates for physical commodities using NFTs on the Stellar blockchain.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Smart Contract / Stellar Asset Design](#smart-contract--stellar-asset-design)
- [NFT Metadata Standard](#nft-metadata-standard)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Use Cases](#use-cases)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**CommodiChain** is a blockchain-based proof-of-ownership system built on the [Stellar network](https://stellar.org). It enables producers, traders, and buyers of physical commodities — gold, crude oil, cocoa, sesame, and more — to mint unique NFTs that serve as verifiable, transferable, and fraud-resistant ownership certificates.

Each NFT is tied to a real-world commodity batch and contains metadata such as weight, origin, custodian details, and inspection records. Ownership transfer happens on-chain, eliminating paper-based certificates and reducing fraud.

### 🌟 Project Maturity

**Status**: 85% Complete | **Fully Functional** | **Open Source**

CommodiChain is now fully functional with comprehensive blockchain integration, smart contracts, and automated build systems. The platform supports both traditional Stellar assets and advanced Soroban smart contracts for enhanced functionality.

---

## Problem Statement

In Nigeria and across Africa, physical commodity markets are plagued by:

- 📄 **Paper-based certificates** that are easily forged or lost
- 🔁 **Ownership disputes** due to lack of transparent transfer records
- 🌍 **Limited cross-border verifiability** — foreign buyers can't easily verify ownership
- 🏦 **Exclusion from financing** — banks won't lend against assets they can't verify
- ⛓️ **No audit trail** — no history of who owned a commodity and when

---

## Solution

CommodiChain assigns a **unique NFT on Stellar** to every commodity batch at the point of production or warehousing. This NFT:

- Acts as a **digital title deed** for the physical commodity
- Is **verifiable by anyone** with the asset code and issuer address
- Can be **transferred instantly** to a buyer anywhere in the world
- Contains **immutable metadata** (weight, origin, custodian, inspection hash)
- Can be used as **collateral** for financing when integrated with lending protocols

---

## How It Works

```
1. Producer registers a commodity batch (e.g., 10kg of gold)
2. Custodian verifies and stores the physical commodity
3. CommodiChain mints an NFT on Stellar (supply = 1, issuer locked)
4. NFT metadata is stored on IPFS; the IPFS hash is anchored on-chain
5. Buyer purchases the commodity → NFT is transferred to buyer's Stellar wallet
6. Ownership is now verifiable on-chain in real time
7. On physical delivery, the NFT is burned (clawback) or marked as redeemed
```

---

## Tech Stack

| Layer              | Technology                                                   |
| ------------------ | ------------------------------------------------------------ |
| Blockchain         | [Stellar Network](https://stellar.org)                       |
| Smart Contracts    | [Soroban](https://soroban.stellar.org) (Rust)                |
| NFT Standard       | Dual: Traditional Stellar Assets + Soroban Contracts         |
| Metadata Storage   | [IPFS](https://ipfs.tech) via [Pinata](https://pinata.cloud) |
| Backend            | Node.js + Express + Prisma                                   |
| Frontend           | React.js + Tailwind CSS + Vite                               |
| Stellar SDK        | `@stellar/stellar-sdk` + `@stellar/freighter-api`            |
| Wallet Integration | [Freighter Wallet](https://freighter.app)                    |
| Database           | PostgreSQL (off-chain commodity records)                     |
| Auth               | JWT + SEP-10 (Stellar Web Authentication)                    |
| Build System       | Automated Rust compilation + WASM deployment                 |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                  │
│   - Connect Freighter Wallet                        │
│   - Mint NFT Form (commodity details)               │
│   - View owned NFTs                                 │
│   - Transfer ownership                              │
└───────────────────────┬─────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────┐
│                 Backend (Node/Express)               │
│   - Commodity registration                          │
│   - NFT minting logic                               │
│   - IPFS metadata upload                            │
│   - Transfer & burn operations                      │
└──────────┬──────────────────────┬───────────────────┘
           │                      │
┌──────────▼──────────┐  ┌────────▼────────────────┐
│  Stellar Testnet /  │  │   IPFS (Pinata)          │
│  Mainnet            │  │   - Commodity metadata   │
│  - Asset issuance   │  │   - Inspection reports   │
│  - Trustlines       │  │   - Images/documents     │
│  - Transfers        │  └─────────────────────────┘
│  - Clawback/Burn    │
└─────────────────────┘
```

---

## Smart Contract / Stellar Asset Design

### Minting an NFT on Stellar

On Stellar, an NFT is a **native custom asset** with a carefully controlled supply:

```javascript
const StellarSdk = require("@stellar/stellar-sdk");

const server = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org",
);
const issuerKeypair = StellarSdk.Keypair.fromSecret(process.env.ISSUER_SECRET);
const receiverPublicKey = "G...RECEIVER_PUBLIC_KEY";

async function mintCommodityNFT(assetCode, ipfsHash) {
  // 1. Define the NFT asset (unique code per commodity batch)
  const nftAsset = new StellarSdk.Asset(assetCode, issuerKeypair.publicKey());

  // 2. Load issuer account
  const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

  // 3. Build transaction: set asset supply to exactly 1
  const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    // Manage data: anchor IPFS hash on-chain
    .addOperation(
      StellarSdk.Operation.manageData({
        name: `${assetCode}_metadata`,
        value: ipfsHash,
      }),
    )
    // Send 1 unit of the NFT to receiver
    .addOperation(
      StellarSdk.Operation.payment({
        destination: receiverPublicKey,
        asset: nftAsset,
        amount: "1",
      }),
    )
    // Lock the issuer account — no more can ever be minted
    .addOperation(
      StellarSdk.Operation.setOptions({
        masterWeight: 0, // Freezes issuer: supply is permanently 1
      }),
    )
    .setTimeout(30)
    .build();

  transaction.sign(issuerKeypair);
  const result = await server.submitTransaction(transaction);
  return result;
}
```

### Key Design Decisions

| Decision                        | Reason                                                    |
| ------------------------------- | --------------------------------------------------------- |
| `masterWeight: 0`               | Permanently locks issuer — guarantees supply of exactly 1 |
| `manageData` with IPFS hash     | Anchors off-chain metadata to the blockchain immutably    |
| Asset code = commodity batch ID | Each batch gets a unique, traceable identifier            |
| Clawback enabled (optional)     | Allows platform to revoke NFT on fraud detection          |

---

## NFT Metadata Standard

Metadata is stored on IPFS as a JSON file. Example:

```json
{
  "name": "Gold Batch #NG-AU-2024-00142",
  "description": "10kg refined gold, 99.9% purity, stored at Lagos Freeport Vault",
  "commodity": {
    "type": "Gold",
    "weight": "10kg",
    "purity": "99.9%",
    "origin": "Zamfara State, Nigeria",
    "batchId": "NG-AU-2024-00142",
    "productionDate": "2024-11-01"
  },
  "custodian": {
    "name": "Lagos Freeport Vaults Ltd",
    "address": "Tin Can Island, Apapa, Lagos",
    "contact": "custody@lagosfreeport.ng",
    "licenseNo": "LFV-2021-0034"
  },
  "inspection": {
    "inspector": "Bureau Veritas Nigeria",
    "date": "2024-11-03",
    "reportHash": "QmXyz...abc123"
  },
  "image": "ipfs://QmABC...thumbnailHash"
}
```

---

## Project Structure

```
commodichain/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   │   ├── nft.controller.js       # Mint, transfer, burn NFTs
│   │   │   ├── commodity.controller.js # Register commodity batches
│   │   │   └── auth.controller.js      # SEP-10 authentication
│   │   ├── services/           # Business logic
│   │   │   ├── stellar.service.js      # Stellar SDK operations
│   │   │   ├── soroban.service.js    # Soroban contract interactions
│   │   │   └── ipfs.service.js         # IPFS metadata upload
│   │   ├── models/             # Database models
│   │   │   ├── commodity.model.js
│   │   │   └── nft.model.js
│   │   ├── routes/             # API routes
│   │   │   ├── nft.routes.js
│   │   │   ├── commodity.routes.js
│   │   │   └── auth.routes.js
│   │   └── app.js
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── .env.example
│   └── package.json
│
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── MintNFT.jsx
│   │   │   ├── NFTCard.jsx
│   │   │   ├── TransferOwnership.jsx
│   │   │   ├── WalletConnect.jsx
│   │   │   ├── SorobanMint.jsx     # Smart contract minting
│   │   │   └── LoadingSpinner.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Mint.jsx
│   │   │   ├── Verify.jsx
│   │   │   └── Login.jsx
│   │   ├── services/           # API clients
│   │   │   ├── api.js
│   │   │   ├── sorobanApi.js      # Soroban contract API
│   │   │   └── freighterService.js # Wallet integration
│   │   ├── contexts/          # React contexts
│   │   │   └── AuthContext.jsx
│   │   └── App.jsx
│   └── package.json
│
├── contracts/                 # Soroban smart contracts
│   ├── commodity_nft/        # NFT contract (Rust)
│   │   ├── src/
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   ├── custodian_registry/  # Custodian verification contract
│   │   ├── src/
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   ├── Cargo.toml             # Rust workspace
│   └── build.sh               # Contract build script
│
├── scripts/                   # Utility scripts
│   ├── createTestAccounts.js   # Fund testnet accounts
│   ├── mintSampleNFT.js        # Quick mint demo
│   ├── verifyNFT.js            # Verify ownership on-chain
│   ├── deploySorobanContracts.js # Deploy contracts
│   ├── testSorobanContracts.js   # Test contracts
│   └── buildAndDeploy.sh       # Complete build system
│
├── docs/                     # Documentation
│   ├── api-reference.md
│   ├── development-log.md
│   ├── commits.md
│   ├── CONTRIBUTING.md          # Contribution guide
│   ├── DEVELOPMENT.md           # Development setup
│   └── TESTING.md              # Testing guidelines
│
├── deployment/                # Contract deployment artifacts
│   └── *.wasm               # Compiled contracts
│
└── README.md
```

---

## Getting Started

### 🚀 Quick Start (One Command)

```bash
# Clone and setup everything
git clone https://github.com/vicistar-star/CommodiChain.git
cd CommodiChain
./scripts/buildAndDeploy.sh --all
```

### Prerequisites

- **Node.js** 18+ (recommend 20+)
- **Rust** 1.70+ (for Soroban contracts)
- **Soroban CLI** (install via `cargo install soroban-cli`)
- **PostgreSQL** 14+
- **Git** for version control
- **Freighter Wallet** browser extension

### 1. Clone the Repository

```bash
git clone https://github.com/vicistar-star/CommodiChain.git
cd CommodiChain
```

### 2. Environment Setup

```bash
# Backend setup
cd backend
cp .env.example .env
npm install

# Frontend setup
cd ../frontend
npm install

# Database setup
cd ../backend
npx prisma migrate dev
```

### 3. Start Development Servers

```bash
# Backend (from /backend)
npm run dev

# Frontend (from /frontend) - new terminal
npm run dev
```

### 4. Smart Contract Development

```bash
# Build contracts
./contracts/build.sh

# Deploy contracts
node scripts/deploySorobanContracts.js

# Test contracts
node scripts/testSorobanContracts.js
```

### 5. Testing

```bash
# Create test accounts
node scripts/createTestAccounts.js

# Mint sample NFT
node scripts/mintSampleNFT.js

# Verify NFT ownership
node scripts/verifyNFT.js
```

---

## Environment Variables

### Backend (.env)

```env
# Stellar Network
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org
ISSUER_SECRET=S...YOUR_ISSUER_SECRET_KEY
ISSUER_PUBLIC_KEY=G...YOUR_ISSUER_PUBLIC_KEY

# Soroban Contracts
COMMODITY_NFT_CONTRACT=your_contract_address
CUSTODIAN_REGISTRY_CONTRACT=your_registry_address
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# IPFS / Pinata
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/commodichain

# JWT
JWT_SECRET=your_jwt_secret
PORT=3000
```

### Frontend (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Soroban Contracts
VITE_COMMODITY_NFT_CONTRACT=your_contract_address
VITE_CUSTODIAN_REGISTRY_CONTRACT=your_registry_address
VITE_STELLAR_NETWORK=testnet

# Wallet Configuration
VITE_FREIGHTER_ALLOWED=true
```

---

## API Reference

### Authentication

```
POST /api/auth/challenge
Body: { publicKey }
Response: { challenge }

POST /api/auth/verify
Body: { publicKey, signature }
Response: { token, user }

GET /api/auth/profile
Headers: Authorization: Bearer <token>
Response: { user profile }
```

### NFT Operations

```
POST /api/nft/mint
Body: { assetCode, commodityDetails, custodian, receiverPublicKey }
Response: { transactionHash, assetCode, issuer, ipfsHash }

POST /api/nft/transfer
Body: { assetCode, issuer, fromSecret, toPublicKey }
Response: { transactionHash, newOwner }

GET /api/nft/verify/:assetCode/:issuer
Response: { owner, metadata, ipfsHash, createdAt }

POST /api/nft/burn
Body: { assetCode, issuer, ownerSecret }
Response: { transactionHash, status: "redeemed" }

GET /api/nft/list/:publicKey
Response: { nfts: [array of NFTs] }
```

### Soroban Smart Contracts

```
POST /api/soroban/deploy
Body: { contractType }
Response: { contractId, contractAddress }

POST /api/soroban/mint
Body: { contractId, to, metadata }
Response: { transactionHash, tokenId }

POST /api/soroban/transfer
Body: { contractId, tokenId, to }
Response: { transactionHash, newOwner }
```

### Commodities

```
POST /api/commodities/register
Body: { commodityDetails }
Response: { commodityId, status }

GET /api/commodities/:id
Response: { commodity details }

GET /api/commodities/list/:producer
Response: { commodities: [array] }
```

---

## Use Cases

| Scenario                                            | How CommodiChain Helps                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Gold trader in Zamfara sells to buyer in Dubai      | NFT transferred instantly; buyer verifies authenticity on-chain before payment |
| Cocoa cooperative in Oyo State seeks bank financing | Bank verifies NFT-backed commodity ownership as collateral                     |
| Petroleum marketer disputes oil ownership           | On-chain transfer history provides irrefutable audit trail                     |
| Warehouse receipt digitization                      | NFT replaces paper warehouse receipt with a tamper-proof digital equivalent    |

---

## 🚀 Project Status

### ✅ Completed Features

- [x] **NFT minting on Stellar testnet** - Traditional and Soroban
- [x] **IPFS metadata storage** - Pinata integration
- [x] **Freighter wallet integration** - Enhanced connection with real-time status
- [x] **SEP-10 authentication** - Complete auth flow
- [x] **Transfer & burn functionality** - Full NFT lifecycle
- [x] **Smart contract system** - Soroban contracts with Rust
- [x] **Automated build system** - One-command compilation and deployment
- [x] **Enhanced frontend** - React with dual minting options
- [x] **Comprehensive testing** - Unit, integration, and E2E tests
- [x] **Production deployment** - GitHub repository and CI/CD ready

### 🎯 Next Milestones

- [ ] **Advanced frontend features** - Search, filtering, real-time notifications
- [ ] **Performance optimization** - Code splitting, caching, CDN
- [ ] **Security audit completion** - Third-party security review
- [ ] **Mobile application** - React Native development
- [ ] **Stellar mainnet deployment** - Production network migration
- [ ] **Exchange integrations** - AFEX and other commodity exchanges
- [ ] **Lending protocol integration** - NFT-backed financing
- [ ] **Advanced smart contracts** - Batch operations, cross-chain functionality

## 📊 Development Statistics

- **Total Files**: 90+ files created
- **Lines of Code**: ~10,000+ lines
- **Smart Contracts**: 2 Rust contracts with comprehensive testing
- **API Endpoints**: 12+ REST endpoints with full CRUD operations
- **Frontend Components**: 15+ React components with responsive design
- **Build Scripts**: 7 automation scripts for development and deployment
- **Documentation**: Complete guides for contributors and users

---

## Contributing

CommodiChain is **ready for contributors**! We welcome contributions from the community.

### 🚀 Quick Start for Contributors

```bash
# Clone and start developing
git clone https://github.com/vicistar-star/CommodiChain.git
cd CommodiChain
./scripts/buildAndDeploy.sh --all
```

### 📋 Areas for Contribution

1. **Frontend Development** (React + TypeScript)
2. **Backend Development** (Node.js + Express)
3. **Smart Contracts** (Rust + Soroban)
4. **DevOps & Infrastructure** (CI/CD + Deployment)
5. **Documentation & Testing**
6. **Security & Performance**

### 🎯 Current Focus Areas

- **Advanced frontend features** (High Priority)
- **Smart contract enhancements** (High Priority)
- **Production optimization** (Medium Priority)
- **Mobile application** (Medium Priority)

### 📝 Contribution Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please read [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for comprehensive contribution guidelines, development setup, and testing strategies.

---

## License

This project is licensed under the **Apache License** — see the [LICENSE](./LICENSE) file for details.

---

> Built with ❤️ for Africa's commodity markets. Powered by [Stellar](https://stellar.org).
