#!/bin/bash

# TaskquerBot Deployment Script
echo "🚀 Starting TaskquerBot deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ if not already installed
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    sudo npm install -g pm2
fi

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Create logs directory
mkdir -p logs

# Set up environment variables
echo "🔧 Setting up environment variables..."
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please create it with your configuration."
    echo "Required variables:"
    echo "- DATABASE_URL"
    echo "- TELEGRAM_BOT_TOKEN"
    echo "- ADMIN_TELEGRAM_ID"
    echo "- TON_API_KEY"
    echo "- ESCROW_WALLET"
    exit 1
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Stop existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 stop taskquer-bot 2>/dev/null || true
pm2 delete taskquer-bot 2>/dev/null || true

# Start the bot with PM2
echo "🚀 Starting TaskquerBot..."
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup

echo "✅ TaskquerBot deployed successfully!"
echo "📊 Use 'pm2 status' to check bot status"
echo "📋 Use 'pm2 logs taskquer-bot' to view logs"
echo "🔄 Use 'pm2 restart taskquer-bot' to restart"
