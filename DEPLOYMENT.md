# 🚀 VPS Deployment Guide for TaskquerBot

This guide will help you deploy your Telegram bot on a VPS using multiple methods.

## 📋 Prerequisites

- VPS with Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access
- Domain name (optional, for webhook setup)
- All environment variables ready

## 🛠️ Method 1: Direct PM2 Deployment (Recommended)

### Step 1: Connect to Your VPS
```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### Step 2: Clone Repository
```bash
git clone https://github.com/ronsuru/taskquerbot.git
cd taskquerbot
```

### Step 3: Run Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh
```

### Step 4: Configure Environment Variables
```bash
nano .env
```

Add your environment variables:
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

### Step 5: Start the Bot
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🐳 Method 2: Docker Deployment

### Step 1: Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
```

### Step 2: Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3: Deploy with Docker
```bash
git clone https://github.com/ronsuru/taskquerbot.git
cd taskquerbot
cp .env.example .env
# Edit .env with your values
docker-compose up -d
```

## 🔧 Management Commands

### PM2 Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs taskquer-bot

# Restart bot
pm2 restart taskquer-bot

# Stop bot
pm2 stop taskquer-bot

# Monitor
pm2 monit
```

### Docker Commands
```bash
# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Update and restart
docker-compose pull
docker-compose up -d
```

## 🔒 Security Setup

### 1. Firewall Configuration
```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. SSL Certificate (Optional)
```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com
```

### 3. Nginx Reverse Proxy (Optional)
```bash
# Install Nginx
sudo apt install nginx

# Create configuration
sudo nano /etc/nginx/sites-available/taskquer-bot
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring & Logs

### 1. Set up Log Rotation
```bash
sudo nano /etc/logrotate.d/taskquer-bot
```

Add:
```
/path/to/taskquerbot/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
}
```

### 2. Monitor Resources
```bash
# Install htop for monitoring
sudo apt install htop

# Monitor with PM2
pm2 monit
```

## 🔄 Updates & Maintenance

### Update Bot
```bash
cd taskquerbot
git pull origin main
npm install
npm run build
pm2 restart taskquer-bot
```

### Backup Database
```bash
# Create backup script
nano backup.sh
```

Add:
```bash
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🚨 Troubleshooting

### Common Issues

1. **Bot not starting**
   ```bash
   pm2 logs taskquer-bot
   # Check for error messages
   ```

2. **Database connection issues**
   ```bash
   # Test database connection
   node -e "console.log(process.env.DATABASE_URL)"
   ```

3. **Memory issues**
   ```bash
   # Check memory usage
   free -h
   pm2 monit
   ```

4. **Port conflicts**
   ```bash
   # Check what's using port 3000
   sudo netstat -tlnp | grep :3000
   ```

## 📈 Performance Optimization

### 1. Increase PM2 Memory Limit
```bash
# Edit ecosystem.config.js
max_memory_restart: '2G'
```

### 2. Enable PM2 Clustering (if needed)
```bash
# In ecosystem.config.js
instances: 'max'
```

### 3. Database Optimization
- Use connection pooling
- Optimize queries
- Regular maintenance

## 🔐 Environment Variables Checklist

Make sure these are set in your `.env` file:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- [ ] `ADMIN_TELEGRAM_ID` - Your Telegram ID
- [ ] `TON_API_KEY` - TON API key
- [ ] `ESCROW_WALLET` - TON wallet address
- [ ] `GOOGLE_CLOUD_PROJECT_ID` - (Optional)
- [ ] `GOOGLE_CLOUD_KEY_FILE` - (Optional)

## 📞 Support

If you encounter issues:

1. Check the logs: `pm2 logs taskquer-bot`
2. Verify environment variables
3. Test database connectivity
4. Check Telegram bot token
5. Review the troubleshooting section above

---

**Your TaskquerBot is now ready to run 24/7 on your VPS! 🎉**