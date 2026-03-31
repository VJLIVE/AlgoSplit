# AlgoSplit Frontend Setup Guide

## Overview
AlgoSplit is a decentralized bill-splitting application built on Algorand blockchain with Next.js frontend. It uses pure wallet-based authentication - no JWT tokens needed!

## Prerequisites
- Node.js 18+ installed
- MongoDB installed and running locally (or MongoDB Atlas connection string)
- Pera Wallet mobile app or browser extension

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Update `.env.local` with your configuration:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/algosplit

# Algorand Network Configuration (TestNet)
NEXT_PUBLIC_ALGOD_SERVER=https://testnet-api.algonode.cloud
NEXT_PUBLIC_ALGOD_PORT=443
NEXT_PUBLIC_ALGOD_TOKEN=

NEXT_PUBLIC_INDEXER_SERVER=https://testnet-idx.algonode.cloud
NEXT_PUBLIC_INDEXER_PORT=443
NEXT_PUBLIC_INDEXER_TOKEN=

# Smart Contract App ID (deploy contract first, then add ID here)
NEXT_PUBLIC_APP_ID=
```

### 3. Start MongoDB
If using local MongoDB:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

Or use MongoDB Atlas and update `MONGODB_URI` with your connection string.

### 4. Deploy Smart Contract
Before running the frontend, deploy the AlgoSplit smart contract:

```bash
cd ../contract/projects/algosplit
algokit project run build
algokit project deploy testnet
```

Copy the deployed App ID and update `NEXT_PUBLIC_APP_ID` in `.env.local`.

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features Implemented

### Authentication (Wallet-Based)
- **Signup**: Two-step registration (name/email → wallet connection)
- **Login**: Direct wallet authentication with Pera Wallet
- **No JWT tokens**: Your wallet address IS your authentication
- Session persisted in localStorage (wallet address + user data)

### Dashboard
- View pending payments
- View completed payments
- View bills created by you
- Quick actions for creating bills and managing contacts

### Contacts Management
- Add contacts with custom names (wallet addresses)
- Edit contact names
- Delete contacts
- Each user has their own independent contact list

### Bill Management (Smart Contract Integration)
- Create bills with multiple members
- Split amounts among members
- Track payment status on-chain
- Automatic settlement detection

## Why No JWT?

In a blockchain dapp:
- **Wallet signature = Authentication**: Your wallet proves who you are
- **On-chain data = Source of truth**: All important data is on the blockchain
- **MongoDB = UI convenience only**: Just stores display names for contacts
- **Simpler & More Secure**: No token expiration, no refresh tokens, no server-side sessions

API routes verify the wallet address from the request header (`x-wallet-address`) and look up the user in MongoDB.

## Project Structure

```
algosplit_frontend/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.ts
│   │   │   └── login/route.ts
│   │   └── contacts/
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── contacts/page.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── Navbar.tsx
├── contexts/
│   ├── AuthContext.tsx (wallet-based)
│   └── WalletContext.tsx
├── lib/
│   ├── algorand.ts
│   └── mongodb.ts
├── models/
│   ├── User.ts
│   └── Contact.ts
└── .env.local
```

## Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  walletAddress: String (unique),
  createdAt: Date
}
```

### Contacts Collection
```javascript
{
  userId: ObjectId (ref: User),
  contactName: String,
  walletAddress: String,
  createdAt: Date
}
```

## Smart Contract Integration

The frontend interacts with the AlgoSplit smart contract for:
- Creating bills
- Adding/removing members
- Processing payments
- Tracking settlement status

All bill data is stored on-chain. MongoDB only stores:
- User profiles (name, email, wallet address)
- User-specific contact names

## Security Features

- Wallet-based authentication (no passwords!)
- Wallet signature verification
- Protected API routes (verify wallet address)
- Client-side route protection
- All financial data on-chain (trustless)

## Next Steps

1. Implement bill creation UI
2. Add blockchain interaction for creating bills
3. Implement payment flow with grouped transactions
4. Add real-time bill status updates
5. Implement notifications for pending payments

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env.local`
- Verify network access if using MongoDB Atlas

### Wallet Connection Issues
- Install Pera Wallet browser extension or mobile app
- Ensure you're on the correct network (TestNet)
- Clear browser cache and try again

### Smart Contract Errors
- Verify `NEXT_PUBLIC_APP_ID` is set correctly
- Ensure contract is deployed on TestNet
- Check Algorand node connectivity

## Support

For issues or questions, please refer to:
- [Algorand Documentation](https://developer.algorand.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Pera Wallet Documentation](https://docs.perawallet.app/)
