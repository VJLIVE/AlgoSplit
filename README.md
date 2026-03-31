# AlgoSplit

> Decentralized bill splitting on Algorand blockchain with instant settlement

AlgoSplit is a blockchain-powered bill splitting application that enables transparent, instant, and trustless expense sharing. Built on Algorand, it provides ~4.5 second settlement times with minimal fees (~$0.0002 per transaction).

## 🌟 Features

### Core Functionality
- **Create Bills**: Split expenses among multiple members with customizable shares
- **Instant Settlement**: Payments settle in ~4.5 seconds on Algorand blockchain
- **Wallet-Based Auth**: No passwords - authenticate with Pera Wallet
- **Contact Management**: Save frequently used wallet addresses with custom names
- **Bill Management**: Track pending, completed, and created bills
- **Analytics Dashboard**: Visualize spending patterns and transaction history
- **Flexible Splitting**: Equal split or custom amounts per member

### Smart Contract Features
- **On-Chain Storage**: All bill data stored immutably on Algorand
- **Payment Tracking**: Real-time payment status for each member
- **Bill Cancellation**: Creators can cancel bills before any payments
- **Member Management**: Add/remove members, update shares before payment
- **Atomic Transactions**: Grouped transactions ensure payment + settlement atomicity

## 🏗️ Architecture

### Technology Stack

**Frontend**
- Next.js 16.2.1 (React 19)
- TypeScript
- Tailwind CSS 4
- Pera Wallet Connect
- AlgoSDK 3.5.2

**Blockchain**
- Algorand TestNet
- Python/AlgoPy smart contracts
- Box storage for state management

**Backend**
- Next.js API Routes
- MongoDB (Mongoose ODM)
- Wallet-based authentication

### Project Structure

```
AlgoSplit/
├── algosplit_frontend/          # Next.js frontend application
│   ├── app/
│   │   ├── api/                 # API routes (auth, contacts)
│   │   ├── dashboard/           # Main application pages
│   │   │   ├── analytics/       # Analytics & insights
│   │   │   ├── bills/[id]/      # Bill details page
│   │   │   ├── contacts/        # Contact management
│   │   │   └── create-bill/     # Bill creation form
│   │   ├── login/               # Login page
│   │   ├── signup/              # Registration page
│   │   └── page.tsx             # Landing page
│   ├── components/              # Reusable components
│   │   └── Navbar.tsx
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── WalletContext.tsx    # Wallet connection
│   ├── lib/                     # Utility libraries
│   │   ├── algorand.ts          # Algorand client setup
│   │   ├── contract.ts          # Smart contract interactions
│   │   └── mongodb.ts           # Database connection
│   ├── models/                  # MongoDB models
│   │   ├── User.ts
│   │   └── Contact.ts
│   └── .env.local               # Environment variables
│
└── contract/                    # Smart contract project
    └── projects/algosplit/
        ├── smart_contracts/
        │   └── algosplit/
        │       ├── contract.py  # Main smart contract
        │       └── deploy_config.py
        └── artifacts/           # Compiled TEAL code
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+
- MongoDB (local or Atlas)
- Pera Wallet (browser extension or mobile app)
- AlgoKit CLI (for contract deployment)
- Poetry (Python package manager)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/algosplit.git
cd algosplit
```

#### 2. Frontend Setup

```bash
cd algosplit_frontend
npm install
```

#### 3. Environment Configuration

Create `.env.local` in `algosplit_frontend/`:

```env
# MongoDB Connection (use standard format, not SRV if DNS issues)
MONGODB_URI=mongodb://username:password@host1:27017,host2:27017,host3:27017/algosplit?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin

# Algorand TestNet Configuration
NEXT_PUBLIC_ALGOD_SERVER=https://testnet-api.algonode.cloud
NEXT_PUBLIC_ALGOD_PORT=443
NEXT_PUBLIC_ALGOD_TOKEN=

# Algorand Indexer
NEXT_PUBLIC_INDEXER_SERVER=https://testnet-idx.algonode.cloud
NEXT_PUBLIC_INDEXER_PORT=443
NEXT_PUBLIC_INDEXER_TOKEN=

# Smart Contract App ID (update after deployment)
NEXT_PUBLIC_APP_ID=758031678
```

#### 4. Smart Contract Deployment

```bash
cd contract/projects/algosplit

# Install dependencies
poetry install

# Build contract
algokit project run build

# Deploy to TestNet
algokit project deploy testnet
```

After deployment, update `NEXT_PUBLIC_APP_ID` in `.env.local` with the new App ID.

#### 5. Start Development Server

```bash
cd algosplit_frontend
npm run dev
```

Visit `http://localhost:3000`

### MongoDB Setup

#### Option 1: MongoDB Atlas (Cloud)

1. Create account at https://cloud.mongodb.com/
2. Create a new cluster
3. Add database user (Database Access)
4. Whitelist IP address (Network Access): Add `0.0.0.0/0` for development
5. Get connection string:
   - Click "Connect" → "Drivers"
   - Select "Standard Connection String" (not SRV if you have DNS issues)
   - Copy and paste into `.env.local`

#### Option 2: Local MongoDB

```bash
# Install MongoDB Community Edition
# Then use:
MONGODB_URI=mongodb://localhost:27017/algosplit
```

### Wallet Setup

1. Install Pera Wallet:
   - Browser: https://chrome.google.com/webstore (search "Pera Wallet")
   - Mobile: iOS App Store or Google Play Store

2. Create/Import wallet
3. Switch to TestNet in wallet settings
4. Get TestNet ALGO from faucet: https://bank.testnet.algorand.network/

## 📖 Usage Guide

### Creating an Account

1. Click "Sign Up" on homepage
2. Enter name and email
3. Click "Connect Pera Wallet"
4. Approve connection in Pera Wallet
5. Account created - redirected to dashboard

### Creating a Bill

1. Navigate to Dashboard → "Create Bill"
2. Enter total bill amount
3. Add members:
   - Enter name, wallet address, and share amount
   - Or click "Import Contacts" to select saved contacts
   - Use "Split Equally" to auto-calculate shares
4. Click "Create Bill"
5. Approve MBR payment transaction in Pera Wallet (~0.15 ALGO)
6. Bill created on blockchain

### Paying a Bill

1. Go to Dashboard → "Pending Payments" tab
2. Click on a bill to view details
3. Click "Pay Bill" button
4. Approve payment transaction in Pera Wallet
5. Payment settles in ~4.5 seconds

### Managing Contacts

1. Navigate to Dashboard → "Contacts"
2. Click "Add Contact"
3. Enter contact name and wallet address
4. Contacts auto-save when creating bills with new addresses

### Viewing Analytics

1. Navigate to Dashboard → "Analytics"
2. View:
   - Total spent and received
   - Bill statistics
   - Spending over time graph
   - Recent transaction history

## 🔧 Smart Contract API

### Data Structures

```python
class Bill(Struct):
    creator: Account          # Bill creator's address
    total_amount: UInt64      # Total bill amount in microAlgos
    member_count: UInt64      # Number of members
    settled_count: UInt64     # Number of members who paid
    is_settled: Bool          # True when all members paid

class Member(Struct):
    share: UInt64             # Amount owed in microAlgos
    paid: Bool                # Payment status
```

### Methods

#### `create_bill(members, shares, mbr_payment) -> bill_id`
Create a new bill with specified members and their shares.

**Parameters:**
- `members`: Array of member wallet addresses
- `shares`: Array of share amounts (in microAlgos)
- `mbr_payment`: Payment transaction for box storage MBR

**Returns:** Bill ID (uint64)

#### `pay_bill(bill_id, payment) -> success`
Pay your share of a bill (grouped with payment transaction).

**Parameters:**
- `bill_id`: The bill ID to pay
- `payment`: Payment transaction to bill creator

**Returns:** Success boolean

#### `cancel_bill(bill_id) -> success`
Cancel a bill (creator only, before any payments).

**Parameters:**
- `bill_id`: The bill ID to cancel

**Returns:** Success boolean

#### `get_bill(bill_id) -> Bill`
Retrieve bill details (read-only).

#### `get_member(bill_id, member_address) -> Member`
Get member payment status (read-only).

#### `get_user_bills(user_address) -> bill_ids[]`
List all bills a user participates in (read-only).

### Box Storage

- **Bill boxes**: `bill_<id>` (57 bytes)
- **Member boxes**: `bill_<id>_member_<address>` (9 bytes)
- **User boxes**: `user_<address>` (dynamic array of bill IDs)

### MBR Calculation

- Flat: 2,500 microAlgos per box
- Per byte: 400 microAlgos
- Typical bill creation: ~0.15 ALGO (includes buffer for account minimum balance)

## 🔐 Security

### Authentication
- **Wallet-based**: No passwords, cryptographic signature verification
- **Session management**: Wallet address + user data in localStorage
- **API protection**: Routes verify `x-wallet-address` header

### Smart Contract
- **Input validation**: Checks for valid addresses, amounts, permissions
- **Access control**: Only creators can cancel/modify bills
- **Atomic transactions**: Grouped transactions ensure consistency
- **Immutable storage**: All financial data on blockchain

### Best Practices
- Never share your wallet seed phrase
- Verify transaction details before signing
- Use TestNet for development/testing
- Keep sufficient ALGO for minimum balance requirements

## 🎨 UI/UX Features

### Design System
- **Color Palette**: Soft-light fintech theme (Linear/Stripe/Notion inspired)
- **Typography**: Clean hierarchy with proper contrast
- **Spacing**: Consistent 8px grid system
- **Animations**: Subtle 150ms transitions
- **Responsive**: Mobile-first design

### Key Components
- **Navbar**: Unified navigation for authenticated and public pages
- **Dashboard Tabs**: Pending, Completed, Created by Me
- **Bill Cards**: Status indicators, member count, amount display
- **Analytics Charts**: Time-series spending visualization
- **Empty States**: Helpful guidance when no data exists

## 📊 Performance

- **Settlement Time**: ~4.5 seconds (Algorand block finality)
- **Transaction Fee**: ~0.001 ALGO (~$0.0002 USD)
- **MBR Cost**: ~0.15 ALGO per bill (refundable when bill deleted)
- **Network**: Algorand TestNet (4.5s block time, 1000 TPS)

## 🌍 Environmental Impact

Algorand is a carbon-negative blockchain, making AlgoSplit an environmentally friendly choice for bill splitting.

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error**: `querySrv ECONNREFUSED`

**Solution**: Use standard connection string instead of SRV format:
```env
# Instead of mongodb+srv://...
# Use mongodb://host1:27017,host2:27017,host3:27017/...
```

Get standard connection string from MongoDB Atlas:
1. Connect → Drivers → "Standard Connection String"

### Insufficient Balance Errors

**Error**: `balance below min`

**Cause**: Account minimum balance locked due to assets/boxes

**Solution**:
- Get more TestNet ALGO from faucet
- Check available balance vs locked balance in console logs
- Opt out of unused assets to free up locked ALGO

### Transaction Failures

**Common causes**:
- Insufficient ALGO for fees + MBR
- Box references missing (should be auto-calculated)
- Network connectivity issues
- Wallet not connected

**Debug steps**:
1. Check browser console for detailed errors
2. Verify wallet has sufficient ALGO
3. Ensure you're on TestNet
4. Try reconnecting wallet

### Smart Contract Errors

**Error**: `box not found`

**Solution**: Ensure box references are included in transaction (handled automatically by `lib/contract.ts`)

**Error**: `invalid Box reference`

**Solution**: Box name encoding issue - verify bill ID encoding matches contract expectations

## 🚧 Development

### Running Tests

```bash
# Frontend
cd algosplit_frontend
npm run lint

# Smart Contract
cd contract/projects/algosplit
poetry run pytest
```

### Building for Production

```bash
# Frontend
cd algosplit_frontend
npm run build
npm start

# Smart Contract
cd contract/projects/algosplit
algokit project run build
```

### Code Style

- **Frontend**: ESLint + TypeScript strict mode
- **Smart Contract**: Python type hints, AlgoPy conventions
- **Formatting**: Prettier (frontend), Black (Python)

## 📝 API Reference

### Authentication Endpoints

#### `POST /api/auth/signup`
Register new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "walletAddress": "ALGORAND_ADDRESS"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "walletAddress": "ALGORAND_ADDRESS"
  }
}
```

#### `POST /api/auth/login`
Authenticate existing user.

### Contact Endpoints

#### `GET /api/contacts`
Fetch user's contacts (requires `x-wallet-address` header).

#### `POST /api/contacts`
Create new contact.

**Request:**
```json
{
  "contactName": "Alice",
  "walletAddress": "ALGORAND_ADDRESS"
}
```

#### `PUT /api/contacts/[id]`
Update contact.

#### `DELETE /api/contacts/[id]`
Delete contact.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Use meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Algorand Foundation** - For the blockchain infrastructure
- **Pera Wallet** - For wallet integration
- **AlgoKit** - For development tools
- **Next.js Team** - For the React framework
- **MongoDB** - For database services

## 📞 Support

- **Issues**: https://github.com/yourusername/algosplit/issues
- **Discussions**: https://github.com/yourusername/algosplit/discussions
- **Email**: support@algosplit.example.com

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Basic bill creation and payment
- ✅ Wallet-based authentication
- ✅ Contact management
- ✅ Analytics dashboard

### Phase 2 (Planned)
- [ ] MainNet deployment
- [ ] Multi-currency support
- [ ] Recurring bills
- [ ] Bill templates
- [ ] Email notifications
- [ ] Mobile app (React Native)

### Phase 3 (Future)
- [ ] Group management
- [ ] Bill splitting algorithms (by percentage, by item)
- [ ] Integration with payment apps
- [ ] Advanced analytics
- [ ] Export transaction history

## 📈 Status

- **Smart Contract**: Deployed on TestNet (App ID: 758031678)
- **Frontend**: Development ready
- **Database**: MongoDB configured
- **Network**: Algorand TestNet
- **Production**: Not yet deployed

---

**Built with ❤️ on Algorand**

*Making bill splitting transparent, instant, and trustless.*
