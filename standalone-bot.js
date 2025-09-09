#!/usr/bin/env node

/**
 * Standalone Telegram Bot
 * This runs the bot independently to avoid conflicts
 */

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || '';

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in .env file');
  process.exit(1);
}

console.log('🤖 Starting Standalone Telegram Bot...\n');

// Create bot instance with proper polling configuration
const bot = new TelegramBot(BOT_TOKEN, { 
  polling: {
    interval: 2000,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
  if (error.message.includes('409 Conflict')) {
    console.log('🔄 Conflict detected, waiting 10 seconds before retry...');
    setTimeout(async () => {
      try {
        console.log('🔄 Attempting to restart polling...');
        await bot.stopPolling();
        await new Promise(resolve => setTimeout(resolve, 3000));
        await bot.startPolling();
        console.log('✅ Polling restarted successfully');
      } catch (err) {
        console.error('❌ Error restarting:', err.message);
      }
    }, 10000);
  }
});

bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🚀 Welcome to TaskBot!

Your social media marketing automation platform on TON Network.

🔹 Complete tasks and earn USDT
🔹 Create campaigns to promote your content
🔹 Secure escrow system for payments

Use /help to see all available commands.
  `;
  
  bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📋 Available Commands:

/start - Start the bot
/help - Show this help message
/status - Check bot status
/admin - Admin commands (admin only)

🔹 Visit the web app: http://localhost:5000
  `;
  
  bot.sendMessage(chatId, helpMessage);
});

bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const statusMessage = `
🤖 Bot Status: ✅ Online
🌐 Web App: http://localhost:5000
⏰ Time: ${new Date().toLocaleString()}
  `;
  
  bot.sendMessage(chatId, statusMessage);
});

bot.onText(/\/admin/, (msg) => {
  const chatId = msg.chat.id;
  
  if (chatId.toString() !== ADMIN_TELEGRAM_ID) {
    bot.sendMessage(chatId, '❌ Admin access required');
    return;
  }
  
  const adminMessage = `
👑 Admin Panel

🔹 Web Dashboard: http://localhost:5000
🔹 Bot Status: ✅ Online
🔹 Server Time: ${new Date().toLocaleString()}

Use the web interface for full admin controls.
  `;
  
  bot.sendMessage(chatId, adminMessage);
});

// Handle all other messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  if (msg.text && !msg.text.startsWith('/')) {
    bot.sendMessage(chatId, '👋 Hi! Use /help to see available commands or visit http://localhost:5000 for the full experience.');
  }
});

// Bot is ready

console.log('✅ Standalone bot started successfully!');
console.log('📱 Bot is ready to receive messages');
console.log('🌐 Web app should be running on http://localhost:5000');
console.log('🛑 Press Ctrl+C to stop the bot');
console.log('📋 Send /start to @taskquer_bot to test\n');
