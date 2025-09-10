# 🤖 TaskquerBot - Advanced Telegram Task Management Bot

A sophisticated Telegram bot for managing social media campaigns and tasks with TON blockchain integration, URL validation, and comprehensive admin controls.

## ✨ Features

### 🎯 Core Functionality
- **Campaign Creation** - Multi-step campaign creation with platform-specific validation
- **Task Management** - Complete task lifecycle management
- **Balance Management** - TON blockchain integration for USDT transactions
- **User Management** - Account creation and wallet management
- **Admin Panel** - Comprehensive administrative controls

### 🔒 Security Features
- **URL Validation** - Platform-specific URL verification (Facebook, Twitter, Instagram, etc.)
- **Phishing Protection** - Detection and blocking of suspicious URLs
- **Shortened URL Detection** - Prevention of malicious shortened links
- **Domain Verification** - Ensures URLs match selected platforms

### 🛡️ Admin Controls
- **Dynamic Platform Management** - Add/remove campaign platforms
- **User Balance Management** - View and manage user balances
- **Transaction Monitoring** - Track deposits and withdrawals
- **Campaign Oversight** - Pause, reactivate, and delete campaigns
- **System Settings** - Configure bot parameters

### 💰 Blockchain Integration
- **TON Network** - Full TON blockchain integration
- **USDT Support** - Jetton-based USDT transactions
- **Escrow System** - Secure fund management
- **Transaction Tracking** - Complete transaction history

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Telegram Bot Token
- TON API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ronsuru/taskquerbot.git
   cd taskquerbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with the following variables:
   ```env
   # Database
   DATABASE_URL=your_postgresql_connection_string
   
   # Telegram Bot
   TELEGRAM_BOT_TOKEN=your_bot_token
   ADMIN_TELEGRAM_ID=your_admin_telegram_id
   
   # TON Blockchain
   TON_API_KEY=your_ton_api_key
   ESCROW_WALLET=your_escrow_wallet_address
   
   # Google Cloud Storage (optional)
   GOOGLE_CLOUD_PROJECT_ID=your_project_id
   GOOGLE_CLOUD_KEY_FILE=path_to_service_account_key.json
   ```

4. **Database Setup**
   The bot will automatically create necessary tables on first run.

5. **Start the Bot**
   ```bash
   # TypeScript version (recommended)
   npx tsx server/telegramBot.ts
   
   # Or JavaScript version
   npm run pure-bot
   ```

## 📱 Bot Commands

### User Commands
- `/start` - Initialize bot and show main menu
- `/help` - Display help information
- `/balance` - Check account balance
- `/withdraw` - Withdraw funds
- `/profile` - View account details

### Admin Commands
- **Admin Panel** - Access administrative controls
- **Platform Management** - Add/remove campaign platforms
- **User Management** - View and manage user accounts
- **Balance Management** - Monitor and adjust user balances
- **Transaction Review** - Review deposits and withdrawals

## 🏗️ Architecture

### Project Structure
```
taskquerbot/
├── client/                 # React frontend (optional)
├── server/                 # Backend services
│   ├── telegramBot.ts     # Main bot implementation
│   ├── storage.ts         # Database operations
│   ├── tonService.ts      # TON blockchain integration
│   └── urlValidator.ts    # URL validation system
├── shared/                # Shared schemas and types
├── pure-telegram-bot.js   # Standalone JavaScript bot
└── package.json          # Dependencies and scripts
```

### Key Components

#### 🤖 Telegram Bot (`server/telegramBot.ts`)
- Complete bot implementation with TypeScript
- Multi-step campaign creation flow
- Admin panel with full controls
- URL validation and security features
- Balance management and transaction handling

#### 🔗 URL Validator (`server/urlValidator.ts`)
- Platform-specific URL validation
- Phishing detection
- Shortened URL blocking
- Domain verification

#### 💾 Database Layer (`server/storage.ts`)
- PostgreSQL integration with Drizzle ORM
- User, campaign, and transaction management
- Platform configuration storage
- Admin settings management

#### ⛓️ TON Integration (`server/tonService.ts`)
- TON blockchain connectivity
- USDT transaction handling
- Balance checking and updates
- Transaction verification

## 🔧 Configuration

### Platform Management
The bot supports dynamic platform management. Admins can add/remove platforms through the admin panel:

**Supported Platforms:**
- Facebook
- Twitter/X
- Instagram
- TikTok
- YouTube
- LinkedIn
- Telegram
- Discord
- Reddit
- Snapchat
- Pinterest

### URL Validation Rules
- **Platform Matching** - URLs must match selected platform
- **HTTPS Enforcement** - Only secure connections allowed
- **Domain Verification** - Valid platform domains only
- **Phishing Protection** - Suspicious patterns blocked
- **Shortened URL Blocking** - No bit.ly, tinyurl.com, etc.

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run pure-bot     # Run JavaScript bot
npm run test:gcs     # Test Google Cloud Storage
npm run test:ton     # Test TON integration
npm run test:telegram # Test Telegram bot
```

### Database Schema
- **users** - User accounts and balances
- **campaigns** - Campaign information
- **transactions** - Transaction history
- **system_settings** - Platform and system configuration

## 🔐 Security

### Admin Access
- **Primary Admin:** `5154336054`
- **Secondary Admin:** `7060994514`
- Admin privileges include full system control

### Data Protection
- Environment variables for sensitive data
- Database connection encryption
- Secure TON wallet integration
- Input validation and sanitization

## 📊 Monitoring

### Logs
- Comprehensive error logging
- Transaction tracking
- User activity monitoring
- Admin action logging

### Health Checks
- Database connectivity
- TON network status
- Telegram API status
- Bot functionality verification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Telegram:** Contact the bot directly
- **Issues:** Create a GitHub issue
- **Documentation:** Check this README

## 🚀 Deployment

### Production Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy to your preferred hosting platform
4. Set up process management (PM2 recommended)
5. Configure monitoring and logging

### Recommended Hosting
- **VPS/Cloud:** DigitalOcean, AWS, Google Cloud
- **Serverless:** Vercel, Netlify (for frontend)
- **Database:** Neon, Supabase, AWS RDS

---

**Built with ❤️ using TypeScript, Node.js, and TON blockchain**