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

| Layer | Technology |
|---|---|
| Blockchain | [Stellar Network](https://stellar.org) |
| NFT Standard | Stellar Custom Asset (supply = 1, locked issuer) |
| Metadata Storage | [IPFS](https://ipfs.tech) via [Pinata](https://pinata.cloud) |
| Backend | Node.js + Express |
| Frontend | React.js + Tailwind CSS |
| Stellar SDK | `@stellar/stellar-sdk` (JavaScript) |
| Wallet Integration | [Freighter Wallet](https://freighter.app) |
| Database | PostgreSQL (off-chain commodity records) |
| Auth | JWT + SEP-10 (Stellar Web Authentication) |

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
const StellarSdk = require('@stellar/stellar-sdk');

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const issuerKeypair = StellarSdk.Keypair.fromSecret(process.env.ISSUER_SECRET);
const receiverPublicKey = 'G...RECEIVER_PUBLIC_KEY';

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
    // Lock the issuer account — no more can ever be minted
    .addOperation(StellarSdk.Operation.setOptions({
      masterWeight: 0, // Freezes issuer: supply is permanently 1
    }))
    .setTimeout(30)
    .build();

  transaction.sign(issuerKeypair);
  const result = await server.submitTransaction(transaction);
  return result;
}
```

### Key Design Decisions

| Decision | Reason |
|---|---|
| `masterWeight: 0` | Permanently locks issuer — guarantees supply of exactly 1 |
| `manageData` with IPFS hash | Anchors off-chain metadata to the blockchain immutably |
| Asset code = commodity batch ID | Each batch gets a unique, traceable identifier |
| Clawback enabled (optional) | Allows platform to revoke NFT on fraud detection |

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
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── nft.controller.js       # Mint, transfer, burn NFTs
│   │   │   ├── commodity.controller.js # Register commodity batches
│   │   │   └── auth.controller.js      # SEP-10 authentication
│   │   ├── services/
│   │   │   ├── stellar.service.js      # Stellar SDK operations
│   │   │   └── ipfs.service.js         # IPFS metadata upload
│   │   ├── models/
│   │   │   ├── commodity.model.js
│   │   │   └── nft.model.js
│   │   ├── routes/
│   │   │   ├── nft.routes.js
│   │   │   └── commodity.routes.js
│   │   └── app.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MintNFT.jsx
│   │   │   ├── NFTCard.jsx
│   │   │   ├── TransferOwnership.jsx
│   │   │   └── WalletConnect.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Mint.jsx
│   │   │   └── Verify.jsx
│   │   └── App.jsx
│   └── package.json
│
├── scripts/
│   ├── createTestAccounts.js           # Fund testnet accounts
│   ├── mintSampleNFT.js                # Quick mint demo
│   └── verifyNFT.js                    # Verify ownership on-chain
│
├── docs/
│   ├── architecture.md
│   └── api-reference.md
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- A [Pinata](https://pinata.cloud) account (for IPFS)
- [Freighter Wallet](https://freighter.app) browser extension

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/commodichain.git
cd commodichain
```

### 2. Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
# Edit .env with your credentials (see below)
```

### 4. Set Up the Database

```bash
cd backend
npx prisma migrate dev --name init
```

### 5. Fund Testnet Accounts

```bash
node scripts/createTestAccounts.js
```

### 6. Run the Application

```bash
# Backend (from /backend)
npm run dev

# Frontend (from /frontend)
npm run dev
```

### 7. Mint a Sample NFT

```bash
node scripts/mintSampleNFT.js
```

---

## Environment Variables

```env
# Stellar
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org
ISSUER_SECRET=S...YOUR_ISSUER_SECRET_KEY

# IPFS / Pinata
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/commodichain

# App
JWT_SECRET=your_jwt_secret
PORT=3000
```

---

## API Reference

### Mint NFT
```
POST /api/nft/mint
Body: { assetCode, commodityDetails, custodian, receiverPublicKey }
Response: { transactionHash, assetCode, issuer, ipfsHash }
```

### Transfer Ownership
```
POST /api/nft/transfer
Body: { assetCode, issuer, fromSecret, toPublicKey }
Response: { transactionHash, newOwner }
```

### Verify Ownership
```
GET /api/nft/verify/:assetCode/:issuer
Response: { owner, metadata, ipfsHash, createdAt }
```

### Burn / Redeem NFT
```
POST /api/nft/burn
Body: { assetCode, issuer, ownerSecret }
Response: { transactionHash, status: "redeemed" }
```

---

## Use Cases

| Scenario | How CommodiChain Helps |
|---|---|
| Gold trader in Zamfara sells to buyer in Dubai | NFT transferred instantly; buyer verifies authenticity on-chain before payment |
| Cocoa cooperative in Oyo State seeks bank financing | Bank verifies NFT-backed commodity ownership as collateral |
| Petroleum marketer disputes oil ownership | On-chain transfer history provides irrefutable audit trail |
| Warehouse receipt digitization | NFT replaces paper warehouse receipt with a tamper-proof digital equivalent |

---

## Roadmap

- [x] NFT minting on Stellar testnet
- [x] IPFS metadata storage
- [ ] Freighter wallet integration (frontend)
- [ ] SEP-10 authentication
- [ ] Transfer & burn functionality
- [ ] Custodian verification portal
- [ ] Mobile app (React Native)
- [ ] Stellar mainnet deployment
- [ ] Integration with commodity exchanges (AFEX, etc.)
- [ ] Lending/collateral protocol integration

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please read [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for our code of conduct and contribution guidelines.

---

## License

This project is licensed under the **Apache License** — see the [LICENSE](./LICENSE) file for details.

---

> Built with ❤️ for Africa's commodity markets. Powered by [Stellar](https://stellar.org).
