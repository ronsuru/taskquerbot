# TaskBot Deployment Guide

This guide will help you deploy TaskBot to various platforms.

## 🚀 Quick Deployment Options

### 1. Railway (Recommended)
Railway provides easy deployment with automatic environment variable management.

1. **Connect Repository**
   - Go to [Railway](https://railway.app/)
   - Connect your GitHub repository
   - Select the Taskquer1 project

2. **Configure Environment Variables**
   ```env
   DATABASE_URL=postgresql://...
   TELEGRAM_BOT_TOKEN=your_bot_token
   ADMIN_TELEGRAM_ID=your_telegram_id
   GOOGLE_CLOUD_PROJECT_ID=your_project_id
   GOOGLE_APPLICATION_CREDENTIALS=service-account-key.json
   TON_API_KEY=your_ton_api_key
   MNEMONIC_WALLET_KEY=your_wallet_mnemonic
   SESSION_SECRET=your_session_secret
   ```

3. **Deploy**
   - Railway will automatically build and deploy
   - Your app will be available at `https://your-app.railway.app`

### 2. Heroku
1. **Install Heroku CLI**
2. **Create Heroku App**
   ```bash
   heroku create your-taskbot-app
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set DATABASE_URL=postgresql://...
   heroku config:set TELEGRAM_BOT_TOKEN=your_bot_token
   # ... set all other variables
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

### 3. Vercel
1. **Connect Repository**
   - Go to [Vercel](https://vercel.com/)
   - Import your GitHub repository

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set Environment Variables**
   - Add all required environment variables in Vercel dashboard

## 🔧 Manual Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Domain name (optional)

### Steps
1. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd Taskquer1
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Set Environment Variables**
   ```bash
   export DATABASE_URL="postgresql://..."
   export TELEGRAM_BOT_TOKEN="your_bot_token"
   # ... set all other variables
   ```

5. **Start Application**
   ```bash
   npm start
   ```

## 🤖 Telegram Bot Deployment

### Webhook Setup (Recommended for Production)
1. **Set Webhook URL**
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://your-domain.com/webhook/<YOUR_BOT_TOKEN>"}'
   ```

2. **Update Environment Variables**
   ```env
   WEBHOOK_URL=https://your-domain.com/webhook/<YOUR_BOT_TOKEN>
   ```

### Polling Mode (Development)
- Use the standalone bot script: `npm run bot`
- No additional configuration needed

## 🗄️ Database Setup

### Neon Database (Recommended)
1. **Create Account**
   - Go to [Neon](https://neon.tech/)
   - Create a new project

2. **Get Connection String**
   - Copy the connection string
   - Set as `DATABASE_URL` in environment variables

3. **Run Migrations**
   ```bash
   npm run db:push
   ```

### Self-Hosted PostgreSQL
1. **Install PostgreSQL**
2. **Create Database**
   ```sql
   CREATE DATABASE taskbot;
   ```

3. **Set Connection String**
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/taskbot
   ```

## ☁️ Google Cloud Storage Setup

1. **Create Service Account**
   - Go to Google Cloud Console
   - Create a new service account
   - Download the JSON key file

2. **Upload Key File**
   - Upload `service-account-key.json` to your server
   - Set path in `GOOGLE_APPLICATION_CREDENTIALS`

3. **Create Storage Bucket**
   - Create a new bucket in Google Cloud Storage
   - Set appropriate permissions

## 🔐 Security Checklist

- [ ] All environment variables are set
- [ ] `.env` file is not committed to git
- [ ] Service account key is secure
- [ ] Database is properly configured
- [ ] HTTPS is enabled (for production)
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented

## 📊 Monitoring

### Health Checks
- **Web App**: `GET /api/health`
- **Bot Status**: `npm run check:bot`
- **Database**: Check connection logs

### Logs
- **Web Server**: Check application logs
- **Bot**: Check bot polling logs
- **Database**: Check query logs

## 🚨 Troubleshooting

### Common Issues

1. **Bot Not Responding**
   - Check if webhook is set correctly
   - Verify bot token is valid
   - Check for polling conflicts

2. **Database Connection Failed**
   - Verify `DATABASE_URL` is correct
   - Check database server is running
   - Verify network connectivity

3. **File Upload Issues**
   - Check Google Cloud credentials
   - Verify bucket permissions
   - Check file size limits

### Debug Commands
```bash
# Check bot status
npm run check:bot

# Test Google Cloud Storage
npm run test:gcs

# Test TON API
npm run test:ton

# Test Telegram bot
npm run test:telegram
```

## 📞 Support

If you encounter issues:
1. Check the logs for error messages
2. Verify all environment variables are set
3. Test individual services using the test scripts
4. Create an issue in the repository with detailed error information
