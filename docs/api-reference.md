# CommodiChain API Reference

This document provides detailed API endpoints for the CommodiChain backend service.

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.commodichain.com/api
```

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication Endpoints

#### Get Challenge
```http
POST /auth/challenge
```

**Request Body:**
```json
{
  "publicKey": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "challenge": "AAAAAgAAAA...",
    "serverPublicKey": "GSERVER...",
    "network": "testnet"
  }
}
```

#### Verify Challenge
```http
POST /auth/verify
```

**Request Body:**
```json
{
  "publicKey": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "signature": "AAAAAgAAAA..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user_id",
      "stellarPublicKey": "G...",
      "email": "user@example.com",
      "name": "User Name",
      "role": "USER"
    },
    "expiresAt": "2024-11-02T10:30:00.000Z"
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
```

**Headers:**
```
Authorization: Bearer <current-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "user": {...},
    "expiresAt": "2024-11-02T10:30:00.000Z"
  }
}
```

#### Logout
```http
POST /auth/logout
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### NFT Endpoints

#### Mint NFT
```http
POST /nft/mint
```

**Authentication Required:** Yes

**Request Body:**
```json
{
  "assetCode": "GOLD-NG-AU-2024-00142",
  "commodityDetails": {
    "batchId": "NG-AU-2024-00142",
    "type": "Gold",
    "weight": "10kg",
    "purity": "99.9%",
    "origin": "Zamfara State, Nigeria",
    "productionDate": "2024-11-01",
    "inspector": "Bureau Veritas Nigeria",
    "inspectionDate": "2024-11-03",
    "reportHash": "QmXyz...abc123"
  },
  "custodian": {
    "name": "Lagos Freeport Vaults Ltd",
    "address": "Tin Can Island, Apapa, Lagos",
    "contact": "custody@lagosfreeport.ng",
    "licenseNo": "LFV-2021-0034"
  },
  "receiverPublicKey": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "tx_hash_here",
    "assetCode": "GOLD-NG-AU-2024-00142",
    "issuer": "GISSUER...",
    "ipfsHash": "QmSampleHash",
    "receiver": "GRECEIVER...",
    "nftId": "nft_id",
    "metadata": {
      "name": "Gold Batch #NG-AU-2024-00142",
      "description": "10kg Gold, 99.9% purity...",
      "commodity": {...},
      "custodian": {...}
    }
  }
}
```

#### Transfer Ownership
```http
POST /nft/transfer
```

**Authentication Required:** Yes

**Request Body:**
```json
{
  "assetCode": "GOLD-NG-AU-2024-00142",
  "issuer": "GISSUER...",
  "fromSecret": "SFROMSECRET...",
  "toPublicKey": "GTOADDRESS..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "tx_hash_here",
    "assetCode": "GOLD-NG-AU-2024-00142",
    "from": "GFROM...",
    "to": "GTO...",
    "newOwner": "GTO..."
  }
}
```

#### Verify Ownership
```http
GET /nft/verify/:assetCode/:issuer
```

**Path Parameters:**
- `assetCode`: The NFT asset code
- `issuer`: The issuer's public key

**Response:**
```json
{
  "success": true,
  "data": {
    "owner": "GCURRENTOWNER...",
    "balance": "1",
    "metadata": {
      "name": "Gold Batch #NG-AU-2024-00142",
      "description": "10kg Gold..."
    },
    "ipfsHash": "QmSampleHash",
    "assetCode": "GOLD-NG-AU-2024-00142",
    "issuer": "GISSUER...",
    "lastModified": 123456,
    "isBurned": false,
    "burnedAt": null,
    "commodity": {
      "type": "Gold",
      "batchId": "NG-AU-2024-00142",
      "weight": "10kg"
    }
  }
}
```

#### Burn/Redeem NFT
```http
POST /nft/burn
```

**Authentication Required:** Yes

**Request Body:**
```json
{
  "assetCode": "GOLD-NG-AU-2024-00142",
  "issuer": "GISSUER...",
  "ownerSecret": "SOWNERSECRET..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "tx_hash_here",
    "assetCode": "GOLD-NG-AU-2024-00142",
    "status": "redeemed",
    "redeemedBy": "GOWNER...",
    "burnedAt": "2024-11-01T15:30:00.000Z"
  }
}
```

#### Get Owned NFTs
```http
GET /nft/owned/:ownerAddress
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `includeBurned` (optional): Include burned NFTs (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "nfts": [
      {
        "id": "nft_id",
        "assetCode": "GOLD-NG-AU-2024-00142",
        "currentOwner": "GOWNER...",
        "ipfsHash": "QmSampleHash",
        "isBurned": false,
        "createdAt": "2024-11-01T10:00:00.000Z",
        "commodity": {...}
      }
    ],
    "statistics": {
      "total": 5,
      "active": 4,
      "burned": 1,
      "mintedThisMonth": 2,
      "transferredThisMonth": 1
    },
    "pagination": {
      "page": 1,
      "limit": 10
    }
  }
}
```

### Commodity Endpoints

#### Register Commodity
```http
POST /commodity/register
```

**Authentication Required:** Yes

**Request Body:**
```json
{
  "batchId": "NG-AU-2024-00142",
  "type": "Gold",
  "weight": "10kg",
  "purity": "99.9%",
  "origin": "Zamfara State, Nigeria",
  "productionDate": "2024-11-01",
  "producerId": "producer_user_id",
  "custodianId": "custodian_id",
  "inspectorId": "inspector_id",
  "inspectionDate": "2024-11-03",
  "reportHash": "QmXyz...abc123",
  "imageHash": "QmImageHash"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "commodity_id",
    "batchId": "NG-AU-2024-00142",
    "type": "Gold",
    "weight": "10kg",
    "status": "REGISTERED",
    "createdAt": "2024-11-01T10:00:00.000Z",
    "producer": {
      "id": "producer_id",
      "stellarPublicKey": "GPRODUCER...",
      "name": "Producer Name"
    }
  }
}
```

#### Get Commodity
```http
GET /commodity/:batchId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "commodity_id",
    "batchId": "NG-AU-2024-00142",
    "type": "Gold",
    "weight": "10kg",
    "purity": "99.9%",
    "origin": "Zamfara State, Nigeria",
    "status": "VERIFIED",
    "producer": {...},
    "nft": {...}
  }
}
```

#### Get Commodities by Producer
```http
GET /commodity/producer/:producerId
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "commodities": [...],
    "statistics": {
      "total": 10,
      "byStatus": {
        "registered": 2,
        "verified": 3,
        "stored": 2,
        "transferred": 2,
        "redeemed": 1
      }
    },
    "pagination": {
      "page": 1,
      "limit": 10
    }
  }
}
```

#### Update Commodity Status
```http
PATCH /commodity/:batchId/status
```

**Authentication Required:** Yes

**Request Body:**
```json
{
  "status": "VERIFIED"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "commodity_id",
    "batchId": "NG-AU-2024-00142",
    "status": "VERIFIED",
    "updatedAt": "2024-11-01T11:00:00.000Z"
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to 100 requests per 15-minute window per IP address.

## WebSocket Support

Real-time updates are available via WebSocket connections for:
- NFT transfer events
- Commodity status changes
- Transaction confirmations

Connect to: `ws://localhost:3000/ws` (development) or `wss://api.commodichain.com/ws` (production)

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Mint NFT
const mintNFT = async (data) => {
  try {
    const response = await axios.post('http://localhost:3000/api/nft/mint', data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error minting NFT:', error.response.data);
  }
};
```

### React

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const useNFTs = (ownerAddress) => {
  const [nfts, setNFTs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        const response = await axios.get(`/api/nft/owned/${ownerAddress}`);
        setNFTs(response.data.data.nfts);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [ownerAddress]);

  return { nfts, loading };
};
```
