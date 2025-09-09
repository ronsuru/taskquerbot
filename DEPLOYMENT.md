# 🚀 Deployment Guide - Non-Replit Environment

This guide helps you deploy TaskBot outside of Replit with all dependencies properly configured.

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Cloud Storage bucket
- TON blockchain API access

## 🔧 Environment Variables

Create a `.env` file in the project root with the following variables:

### Database Configuration
```bash
DATABASE_URL=postgresql://username:password@host:port/database
```

### Google Cloud Storage Configuration
Choose **ONE** of the following authentication methods:

#### Option 1: Service Account Key File
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

#### Option 2: Service Account JSON in Environment Variable
```bash
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

#### Option 3: Default Credentials (for GCP environments)
```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
# No additional credentials needed - uses default service account
```

### TON Blockchain Configuration
```bash
TON_API_KEY=your-tonapi-key
MNEMONIC_WALLET_KEY="your 24 word mnemonic phrase here"
```

### Optional Configuration
```bash
# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
ADMIN_TELEGRAM_ID=your-admin-telegram-id

# Server Configuration
PORT=5000
NODE_ENV=production

# Object Storage
PUBLIC_OBJECT_SEARCH_PATHS=/public,/uploads
```

## 🛠️ Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Database**
   ```bash
   npm run db:push
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Start Application**
   ```bash
   npm start
   ```

## 🔐 Google Cloud Storage Setup

1. **Create a Google Cloud Project**
2. **Enable Cloud Storage API**
3. **Create a Service Account** with Storage Admin permissions
4. **Download the service account key** (JSON file)
5. **Configure authentication** using one of the methods above

## ⛓️ TON Blockchain Setup

1. **Get TonAPI Key** from [tonapi.io](https://tonapi.io)
2. **Create a TON wallet** and get the 24-word mnemonic
3. **Fund the wallet** with TON for transaction fees
4. **Set the environment variables** as shown above

## 🚀 Deployment Platforms

### Vercel
- Set environment variables in Vercel dashboard
- Deploy using Vercel CLI or GitHub integration

### Railway
- Connect your GitHub repository
- Set environment variables in Railway dashboard
- Deploy automatically

### DigitalOcean App Platform
- Connect your repository
- Configure environment variables
- Deploy with automatic builds

### Self-hosted (VPS/Dedicated Server)
- Follow the installation steps above
- Use PM2 or similar process manager
- Set up reverse proxy (nginx/Apache)

## ✅ Verification

After deployment, verify:
1. Database connection is working
2. Google Cloud Storage authentication is successful
3. TON blockchain integration is functional
4. All API endpoints are responding correctly

## 🔧 Troubleshooting

### Google Cloud Storage Issues
- Verify service account permissions
- Check project ID is correct
- Ensure Cloud Storage API is enabled

### TON Blockchain Issues
- Verify API key is valid
- Check wallet mnemonic is correct
- Ensure wallet has sufficient TON for fees

### Database Issues
- Verify DATABASE_URL format
- Check database server is accessible
- Ensure database exists and user has permissions
