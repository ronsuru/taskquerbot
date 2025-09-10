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

Choose an option below to get started:
  `;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 View Tasks', callback_data: 'view_tasks' },
          { text: '🎯 Create Campaign', callback_data: 'create_campaign' }
        ],
        [
          { text: '💰 My Balance', callback_data: 'my_balance' },
          { text: '📊 Dashboard', callback_data: 'dashboard' }
        ],
        [
          { text: 'ℹ️ Help', callback_data: 'help' },
          { text: '🌐 Web App', callback_data: 'web_app' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, welcomeMessage, keyboard);
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
ℹ️ **Help & Commands**

**Available Commands:**
/start - Start the bot and see main menu
/help - Show this help message
/status - Check bot status
/admin - Admin commands (admin only)

**Main Features:**
🔹 Task Management
🔹 Campaign Creation
🔹 USDT Payments
🔹 Admin Dashboard

**Web App:**
🌐 http://localhost:5000

**Need more help?**
Visit the web app for full functionality!
  `;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🚀 Main Menu', callback_data: 'main_menu' },
          { text: '🌐 Web App', callback_data: 'web_app' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, helpMessage, { ...keyboard, parse_mode: 'Markdown' });
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

// Handle callback queries (button presses)
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  // Answer the callback query to remove loading state
  bot.answerCallbackQuery(callbackQuery.id);

  switch (data) {
    case 'view_tasks':
      const tasksMessage = `
📋 **Available Tasks**

Currently, there are no active tasks available.

🔹 Check back later for new tasks
🔹 Visit the web app for more details
🔹 Use /help for more commands

🌐 **Web App**: http://localhost:5000
      `;
      bot.sendMessage(chatId, tasksMessage, { parse_mode: 'Markdown' });
      break;

    case 'create_campaign':
      const campaignMessage = `
🎯 **Create Campaign**

To create a new campaign:

1. Visit the web app: http://localhost:5000
2. Log in with your Telegram account
3. Go to the Admin Dashboard
4. Click "Create Campaign"

🔹 Set campaign details
🔹 Configure rewards
🔹 Launch your campaign

🌐 **Web App**: http://localhost:5000
      `;
      bot.sendMessage(chatId, campaignMessage, { parse_mode: 'Markdown' });
      break;

    case 'my_balance':
      const balanceMessage = `
💰 **My Balance**

Your current balance: **0 USDT**

🔹 Complete tasks to earn USDT
🔹 Check transactions in web app
🔹 Withdraw funds when ready

🌐 **Web App**: http://localhost:5000
      `;
      bot.sendMessage(chatId, balanceMessage, { parse_mode: 'Markdown' });
      break;

    case 'dashboard':
      const dashboardMessage = `
📊 **Dashboard**

Choose what you'd like to do:
      `;
      
      const dashboardKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📋 My Tasks', callback_data: 'my_tasks' },
              { text: '🎯 My Campaigns', callback_data: 'my_campaigns' }
            ],
            [
              { text: '💰 Earnings', callback_data: 'earnings' },
              { text: '📈 Analytics', callback_data: 'analytics' }
            ],
            [
              { text: '⚙️ Settings', callback_data: 'settings' },
              { text: '👤 Profile', callback_data: 'profile' }
            ],
            [
              { text: '🌐 Open Web App', callback_data: 'web_app' },
              { text: '🔙 Back to Menu', callback_data: 'main_menu' }
            ]
          ]
        }
      };
      
      bot.sendMessage(chatId, dashboardMessage, { ...dashboardKeyboard, parse_mode: 'Markdown' });
      break;

    case 'help':
      const helpMessage = `
ℹ️ **Help & Commands**

**Available Commands:**
/start - Start the bot and see main menu
/help - Show this help message
/status - Check bot status

**Main Features:**
🔹 Task Management
🔹 Campaign Creation
🔹 USDT Payments
🔹 Admin Dashboard

**Web App:**
🌐 http://localhost:5000

**Need more help?**
Visit the web app for full functionality!
      `;
      bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
      break;

    case 'main_menu':
      const mainMenuMessage = `
🚀 **TaskBot Main Menu**

Choose an option below to get started:

🔹 Complete tasks and earn USDT
🔹 Create campaigns to promote your content
🔹 Secure escrow system for payments
      `;
      
      const mainKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📋 View Tasks', callback_data: 'view_tasks' },
              { text: '🎯 Create Campaign', callback_data: 'create_campaign' }
            ],
            [
              { text: '💰 My Balance', callback_data: 'my_balance' },
              { text: '📊 Dashboard', callback_data: 'dashboard' }
            ],
            [
              { text: 'ℹ️ Help', callback_data: 'help' },
              { text: '🌐 Web App', callback_data: 'web_app' }
            ]
          ]
        }
      };
      
      bot.sendMessage(chatId, mainMenuMessage, mainKeyboard);
      break;

    case 'web_app':
      const webAppMessage = `
🌐 **Web Application**

Access the full TaskBot web application:

🔗 **URL**: http://localhost:5000

**Features Available:**
🔹 Complete task management
🔹 Campaign creation and management
🔹 Admin dashboard
🔹 Transaction history
🔹 User settings

**How to Access:**
1. Open your web browser
2. Go to: http://localhost:5000
3. Log in with your Telegram account
4. Start using all features!

**Note**: Make sure the web server is running on port 5000
      `;
      
      const webAppKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🚀 Main Menu', callback_data: 'main_menu' },
              { text: 'ℹ️ Help', callback_data: 'help' }
            ]
          ]
        }
      };
      
      bot.sendMessage(chatId, webAppMessage, { ...webAppKeyboard, parse_mode: 'Markdown' });
      break;

    case 'my_tasks':
      const myTasksMessage = `
📋 **My Tasks**

**Active Tasks:**
🔹 No active tasks at the moment

**Completed Tasks:**
🔹 0 tasks completed

**Earnings from Tasks:**
🔹 0 USDT earned

**Next Steps:**
🔹 Check for new tasks regularly
🔹 Complete tasks to earn USDT
🔹 Visit web app for more details
      `;
      
      const myTasksKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Refresh', callback_data: 'my_tasks' },
              { text: '📊 Dashboard', callback_data: 'dashboard' }
            ],
            [
              { text: '🌐 Web App', callback_data: 'web_app' },
              { text: '🔙 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        }
      };
      
      bot.sendMessage(chatId, myTasksMessage, { ...myTasksKeyboard, parse_mode: 'Markdown' });
      break;

    case 'my_campaigns':
      const myCampaignsMessage = `
🎯 **My Campaigns**

**Active Campaigns:**
🔹 No active campaigns

**Completed Campaigns:**
🔹 0 campaigns completed

**Campaign Performance:**
🔹 Total views: 0
🔹 Total engagement: 0
🔹 Total spent: 0 USDT

**Create New Campaign:**
🔹 Use the web app for full campaign creation
🔹 Set budgets and rewards
🔹 Track performance in real-time
      `;
      
      const myCampaignsKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '➕ Create Campaign', callback_data: 'create_campaign' },
              { text: '📊 Dashboard', callback_data: 'dashboard' }
            ],
            [
              { text: '🌐 Web App', callback_data: 'web_app' },
              { text: '🔙 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        }
      };
      
      bot.sendMessage(chatId, myCampaignsMessage, { ...myCampaignsKeyboard, parse_mode: 'Markdown' });
      break;

    case 'earnings':
      const earningsMessage = `
💰 **Earnings Overview**

**Current Balance:**
🔹 Available: 0 USDT
🔹 Pending: 0 USDT
🔹 Total Earned: 0 USDT

**Earnings Sources:**
🔹 Task Completion: 0 USDT
🔹 Campaign Rewards: 0 USDT
🔹 Referrals: 0 USDT

**Withdrawal Options:**
🔹 Minimum withdrawal: 10 USDT
🔹 Withdrawal fee: 1 USDT
🔹 Processing time: 24-48 hours
      `;
      
      const earningsKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💸 Withdraw', callback_data: 'withdraw' },
              { text: '📊 Dashboard', callback_data: 'dashboard' }
            ],
            [
              { text: '🌐 Web App', callback_data: 'web_app' },
              { text: '🔙 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        }
      };
      
      bot.sendMessage(chatId, earningsMessage, { ...earningsKeyboard, parse_mode: 'Markdown' });
      break;

    case 'analytics':
      const analyticsMessage = `
📈 **Analytics**

**Account Statistics:**
🔹 Tasks completed: 0
🔹 Campaigns created: 0
🔹 Total earnings: 0 USDT
🔹 Account age: New user

**Performance Metrics:**
🔹 Success rate: 0%
🔹 Average task time: N/A
🔹 Campaign ROI: N/A

**Growth Opportunities:**
🔹 Complete your first task
🔹 Create your first campaign
🔹 Invite friends to earn bonuses
      `;
      
      const analyticsKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Refresh', callback_data: 'analytics' },
              { text: '📊 Dashboard', callback_data: 'dashboard' }
            ],
            [
              { text: '🌐 Web App', callback_data: 'web_app' },
              { text: '🔙 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        }
      };
      
      bot.sendMessage(chatId, analyticsMessage, { ...analyticsKeyboard, parse_mode: 'Markdown' });
      break;

    case 'settings':
      const settingsMessage = `
⚙️ **Settings**

**Account Settings:**
🔹 Notifications: Enabled
🔹 Language: English
🔹 Timezone: Auto-detect

**Privacy Settings:**
🔹 Profile visibility: Public
🔹 Data sharing: Minimal
🔹 Analytics: Enabled

**Security Settings:**
🔹 2FA: Not enabled
🔹 Login alerts: Enabled
🔹 Session timeout: 30 days
      `;
      
      const settingsKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔔 Notifications', callback_data: 'notification_settings' },
              { text: '🔒 Security', callback_data: 'security_settings' }
            ],
            [
              { text: '🌐 Web App', callback_data: 'web_app' },
              { text: '🔙 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        }
      };
      
      bot.sendMessage(chatId, settingsMessage, { ...settingsKeyboard, parse_mode: 'Markdown' });
      break;

    case 'profile':
      const profileMessage = `
👤 **Profile**

**Personal Information:**
🔹 Name: User
🔹 Telegram ID: ${chatId}
🔹 Join date: Today
🔹 Status: Active

**Account Level:**
🔹 Level: Beginner
🔹 Experience: 0 XP
🔹 Next level: 100 XP

**Achievements:**
🔹 First steps: Not earned
🔹 Task master: Not earned
🔹 Campaign creator: Not earned
      `;
      
      const profileKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🏆 Achievements', callback_data: 'achievements' },
              { text: '📊 Dashboard', callback_data: 'dashboard' }
            ],
            [
              { text: '🌐 Web App', callback_data: 'web_app' },
              { text: '🔙 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        }
      };
      
      bot.sendMessage(chatId, profileMessage, { ...profileKeyboard, parse_mode: 'Markdown' });
      break;

    case 'withdraw':
      const withdrawMessage = `
💸 **Withdraw Funds**

**Current Balance:** 0 USDT

**Withdrawal Requirements:**
🔹 Minimum amount: 10 USDT
🔹 Withdrawal fee: 1 USDT
🔹 Processing time: 24-48 hours

**Withdrawal Methods:**
🔹 TON Wallet (Recommended)
🔹 Bank Transfer
🔹 Crypto Exchange

**Note:** You need at least 10 USDT to make a withdrawal.
      `;
      
      const withdrawKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💰 My Balance', callback_data: 'my_balance' },
              { text: '📊 Dashboard', callback_data: 'dashboard' }
            ],
            [
              { text: '🌐 Web App', callback_data: 'web_app' },
              { text: '🔙 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        }
      };
      
      bot.sendMessage(chatId, withdrawMessage, { ...withdrawKeyboard, parse_mode: 'Markdown' });
      break;

    default:
      bot.sendMessage(chatId, '❌ Unknown command. Use /help for available commands.');
  }
});

// Handle all other messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  if (msg.text && !msg.text.startsWith('/')) {
    const responseMessage = `
👋 Hi! I'm TaskBot, your social media marketing assistant.

🔹 Use /start to see the main menu
🔹 Use /help for available commands
🔹 Visit http://localhost:5000 for the full web experience

Choose an option from the menu above! 🚀
    `;
    
    bot.sendMessage(chatId, responseMessage);
  }
});

// Bot is ready

console.log('✅ Standalone bot started successfully!');
console.log('📱 Bot is ready to receive messages');
console.log('🌐 Web app should be running on http://localhost:5000');
console.log('🛑 Press Ctrl+C to stop the bot');
console.log('📋 Send /start to @taskquer_bot to test\n');
