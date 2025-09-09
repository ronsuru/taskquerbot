# TaskBot - Social Media Marketing Automation Platform

A comprehensive social media marketing automation platform built on the TON blockchain, featuring task management, campaign creation, and secure escrow payments.

## 🚀 Features

- **Task Management**: Create and manage social media marketing tasks
- **Campaign Creation**: Set up marketing campaigns with rewards
- **TON Blockchain Integration**: Secure payments using USDT on TON network
- **Telegram Bot**: Interactive bot for task management and notifications
- **Admin Dashboard**: Complete admin interface for platform management
- **Google Cloud Storage**: Secure file storage and management
- **Escrow System**: Secure payment handling with automatic releases

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for components
- **TanStack Query** for data fetching
- **Wouter** for routing

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** with PostgreSQL (Neon Database)
- **Telegram Bot API** for bot functionality
- **Google Cloud Storage** for file management

### Blockchain
- **TON Network** integration
- **USDT (Jetton)** payments
- **TonAPI.io** for blockchain data
- **TonKeeper** wallet integration

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Google Cloud Project with Storage API
- Telegram Bot Token
- TON API Key

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Taskquer1
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp create-env-example.txt .env
```

Fill in your environment variables in `.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your_bot_token"
ADMIN_TELEGRAM_ID="your_telegram_id"

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID="your_project_id"
GOOGLE_APPLICATION_CREDENTIALS="service-account-key.json"

# TON Blockchain
TON_API_KEY="your_ton_api_key"
MNEMONIC_WALLET_KEY="your_wallet_mnemonic"

# Session
SESSION_SECRET="your_session_secret"
```

### 4. Database Setup
```bash
npm run db:push
```

### 5. Start the Application

#### Option A: Start Everything Together
```bash
npm run start:all
```

#### Option B: Start Services Separately
```bash
# Terminal 1: Web Server
npm run dev

# Terminal 2: Telegram Bot
npm run bot
```

### 6. Access the Application
- **Web App**: http://localhost:5000
- **Telegram Bot**: @taskquer_bot

## 📁 Project Structure

```
Taskquer1/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility libraries
├── server/                # Backend Express server
│   ├── routes.ts          # API routes
│   ├── telegramBot.ts     # Telegram bot logic
│   ├── tonService.ts      # TON blockchain integration
│   └── objectStorage.ts   # Google Cloud Storage
├── shared/                # Shared schemas and types
└── scripts/               # Utility scripts
```

## 🔧 Available Scripts

### Development
- `npm run dev` - Start web server in development mode
- `npm run bot` - Start Telegram bot
- `npm run start:all` - Start both services together

### Testing
- `npm run test:gcs` - Test Google Cloud Storage
- `npm run test:ton` - Test TON API
- `npm run test:telegram` - Test Telegram bot
- `npm run check:bot` - Check bot status

### Utilities
- `npm run clear:webhook` - Clear Telegram webhook
- `npm run db:push` - Push database schema

## 🔐 Security Features

- **Environment Variables**: All sensitive data stored in `.env`
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Protection**: Drizzle ORM with parameterized queries
- **CORS Configuration**: Proper cross-origin resource sharing
- **Session Management**: Secure session handling

## 🌐 Deployment

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `ADMIN_TELEGRAM_ID` - Admin Telegram user ID
- `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud project ID
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account key
- `TON_API_KEY` - TON blockchain API key
- `MNEMONIC_WALLET_KEY` - Wallet mnemonic phrase
- `SESSION_SECRET` - Session encryption secret

### Production Build
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the setup guides in the root directory

## 🔗 Links

- [TON Network](https://ton.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Google Cloud Storage](https://cloud.google.com/storage)
- [Neon Database](https://neon.tech/)
