#!/usr/bin/env node

/**
 * Pure Telegram Bot - TaskBot (Fixed Structure)
 * All functionality runs directly in Telegram
 * Matches the original project structure and flow
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

console.log('🤖 Starting Pure Telegram TaskBot (Fixed Structure)...\n');

// In-memory storage (in production, use a database)
const users = new Map();
const campaigns = new Map();
const tasks = new Map();
const transactions = new Map();

// Campaign creation state management (matching original structure)
const campaignCreationStates = new Map();

// User states for conversation flow
const userStates = new Map();

// Create bot instance
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

// Initialize user
function initializeUser(chatId) {
  if (!users.has(chatId)) {
    users.set(chatId, {
      id: chatId,
      balance: 100, // Start with some balance for testing
      tasksCompleted: 0,
      campaignsCreated: 0,
      joinDate: new Date(),
      isAdmin: chatId.toString() === ADMIN_TELEGRAM_ID
    });
  }
  return users.get(chatId);
}

// Main menu
function showMainMenu(chatId) {
  const user = initializeUser(chatId);
  const isAdmin = user.isAdmin;
  
  const message = `🚀 **TaskBot - Social Media Marketing Platform**

Welcome back! Choose an option below:

${isAdmin ? '👑 **Admin Features Available**' : ''}`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 View Tasks', callback_data: 'view_tasks' },
          { text: '💰 My Balance', callback_data: 'my_balance' }
        ],
        [
          { text: '📊 Dashboard', callback_data: 'dashboard' },
          { text: '👤 Profile', callback_data: 'profile' }
        ],
        [
          { text: '🎯 Create Campaign', callback_data: 'create_campaign' }
        ]
      ]
    }
  };

  if (isAdmin) {
    keyboard.reply_markup.inline_keyboard.push([
      { text: '⚙️ Admin Panel', callback_data: 'admin_panel' }
    ]);
  }

  keyboard.reply_markup.inline_keyboard.push([
    { text: 'ℹ️ Help', callback_data: 'help' }
  ]);

  return { message, keyboard };
}

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const { message, keyboard } = showMainMenu(chatId);
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `ℹ️ **TaskBot Help**

**Available Commands:**
/start - Show main menu
/help - Show this help
/balance - Check your balance
/tasks - View available tasks
/profile - View your profile

**How to Use:**
🔹 Click buttons to navigate
🔹 Complete tasks to earn USDT
🔹 Create campaigns to promote your content
🔹 Track your progress

**Earning USDT:**
🔹 Complete social media tasks
🔹 Create successful campaigns
🔹 Refer friends (coming soon)

**Need Help?**
Contact support or use the buttons above!`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🚀 Main Menu', callback_data: 'main_menu' },
          { text: '📋 View Tasks', callback_data: 'view_tasks' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, helpMessage, { ...keyboard, parse_mode: 'Markdown' });
});

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  // Answer the callback query
  bot.answerCallbackQuery(callbackQuery.id);

  switch (data) {
    case 'main_menu':
      const { message: mainMessage, keyboard: mainKeyboard } = showMainMenu(chatId);
      bot.sendMessage(chatId, mainMessage, { ...mainKeyboard, parse_mode: 'Markdown' });
      break;

    case 'view_tasks':
      showTasks(chatId);
      break;

    case 'my_balance':
      showBalance(chatId);
      break;

    case 'dashboard':
      showDashboard(chatId);
      break;

    case 'profile':
      showProfile(chatId);
      break;

    case 'create_campaign':
      handleCreateCampaign(chatId);
      break;

    case 'admin_panel':
      if (initializeUser(chatId).isAdmin) {
        showAdminPanel(chatId);
      } else {
        bot.sendMessage(chatId, '❌ Admin access required');
      }
      break;

    case 'help':
      showHelp(chatId);
      break;

    // Task management
    case 'complete_task_1':
      completeTask(chatId, 1);
      break;

    case 'complete_task_2':
      completeTask(chatId, 2);
      break;

    case 'complete_task_3':
      completeTask(chatId, 3);
      break;

    // Campaign creation flow (matching original structure)
    case 'create_platform_twitter':
      handlePlatformStep(chatId, 'twitter');
      break;

    case 'create_platform_tiktok':
      handlePlatformStep(chatId, 'tiktok');
      break;

    case 'create_platform_facebook':
      handlePlatformStep(chatId, 'facebook');
      break;

    case 'create_platform_telegram':
      handlePlatformStep(chatId, 'telegram');
      break;

    case 'confirm_campaign_creation':
      finalizeCampaignCreation(chatId);
      break;

    case 'cancel_campaign_creation':
      campaignCreationStates.delete(chatId);
      bot.sendMessage(chatId, '❌ Campaign creation cancelled.');
      break;

    default:
      bot.sendMessage(chatId, '❌ Unknown command. Use /help for available commands.');
  }
});

// Handle text messages for campaign creation
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (!text || text.startsWith('/')) return;
  
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  switch (state.step) {
    case 'title':
      handleTitleStep(chatId, text);
      break;
      
    case 'description':
      handleDescriptionStep(chatId, text);
      break;
      
    case 'reward':
      handleRewardStep(chatId, text);
      break;
      
    case 'slots':
      handleSlotsStep(chatId, text);
      break;
      
    case 'url':
      handleUrlStep(chatId, text);
      break;
      
    case 'duration':
      handleDurationStep(chatId, text);
      break;
      
    case 'proofType':
      handleProofTypeStep(chatId, text);
      break;
  }
});

// Show available tasks
function showTasks(chatId) {
  const user = initializeUser(chatId);
  
  const message = `📋 **Available Tasks**

**Current Tasks:**
🔹 **Task 1**: Follow @taskquer_bot on Twitter
   💰 Reward: 5 USDT
   ⏱️ Time: 2 minutes
   📊 Difficulty: Easy

🔹 **Task 2**: Share our post on Instagram
   💰 Reward: 10 USDT
   ⏱️ Time: 5 minutes
   📊 Difficulty: Medium

🔹 **Task 3**: Create a TikTok video
   💰 Reward: 20 USDT
   ⏱️ Time: 15 minutes
   📊 Difficulty: Hard

**Your Progress:**
🔹 Tasks completed: ${user.tasksCompleted}
🔹 Total earned: ${user.balance} USDT`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Complete Task 1', callback_data: 'complete_task_1' },
          { text: '✅ Complete Task 2', callback_data: 'complete_task_2' }
        ],
        [
          { text: '✅ Complete Task 3', callback_data: 'complete_task_3' }
        ],
        [
          { text: '🔄 Refresh', callback_data: 'view_tasks' },
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Complete a task
function completeTask(chatId, taskId) {
  const user = initializeUser(chatId);
  const taskRewards = { 1: 5, 2: 10, 3: 20 };
  const reward = taskRewards[taskId];
  
  // Simulate task completion
  user.balance += reward;
  user.tasksCompleted += 1;
  
  // Add transaction
  const transactionId = Date.now();
  transactions.set(transactionId, {
    id: transactionId,
    userId: chatId,
    type: 'task_completion',
    amount: reward,
    description: `Completed Task ${taskId}`,
    date: new Date()
  });
  
  const message = `✅ **Task ${taskId} Completed!**

🎉 Congratulations! You've successfully completed the task.

💰 **Reward Earned**: ${reward} USDT
💳 **New Balance**: ${user.balance} USDT
📊 **Total Tasks**: ${user.tasksCompleted}

**Next Steps:**
🔹 Complete more tasks to earn more USDT
🔹 Check your balance anytime
🔹 Create campaigns to promote your content`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 View More Tasks', callback_data: 'view_tasks' },
          { text: '💰 Check Balance', callback_data: 'my_balance' }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Show user balance
function showBalance(chatId) {
  const user = initializeUser(chatId);
  
  const withdrawalStatus = user.balance >= 50 ? '✅ You can withdraw funds!' : '⏳ Keep earning to reach withdrawal minimum';
  
  const message = `💰 **Your Balance**

💳 **Available Balance**: ${user.balance} USDT
⏳ **Pending**: 0 USDT
📈 **Total Earned**: ${user.balance} USDT

**Earnings Breakdown:**
🔹 Task Completions: ${user.balance} USDT
🔹 Campaign Rewards: 0 USDT
🔹 Referrals: 0 USDT

**Withdrawal Options:**
🔹 Minimum withdrawal: 50 USDT
🔹 Withdrawal fee: 2 USDT
🔹 Processing time: 24-48 hours

${withdrawalStatus}`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💸 Withdraw Funds', callback_data: user.balance >= 50 ? 'withdraw_funds' : 'insufficient_balance' },
          { text: '📋 View Tasks', callback_data: 'view_tasks' }
        ],
        [
          { text: '📊 Dashboard', callback_data: 'dashboard' },
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Show dashboard
function showDashboard(chatId) {
  const user = initializeUser(chatId);
  
  const message = `📊 **Dashboard**

**Account Overview:**
🔹 Balance: ${user.balance} USDT
🔹 Tasks completed: ${user.tasksCompleted}
🔹 Campaigns created: ${user.campaignsCreated}
🔹 Member since: ${user.joinDate.toLocaleDateString()}

**Recent Activity:**
🔹 Last task: ${user.tasksCompleted > 0 ? 'Completed recently' : 'No tasks completed'}
🔹 Last campaign: ${user.campaignsCreated > 0 ? 'Created recently' : 'No campaigns created'}

**Quick Actions:**
🔹 Complete tasks to earn USDT
🔹 Check your balance regularly
🔹 Create campaigns to promote your content`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 View Tasks', callback_data: 'view_tasks' },
          { text: '💰 My Balance', callback_data: 'my_balance' }
        ],
        [
          { text: '👤 Profile', callback_data: 'profile' },
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Show profile
function showProfile(chatId) {
  const user = initializeUser(chatId);
  
  const message = `👤 **Your Profile**

**Personal Information:**
🔹 Telegram ID: ${chatId}
🔹 Account Type: ${user.isAdmin ? 'Admin' : 'User'}
🔹 Join Date: ${user.joinDate.toLocaleDateString()}
🔹 Status: Active

**Statistics:**
🔹 Tasks Completed: ${user.tasksCompleted}
🔹 Campaigns Created: ${user.campaignsCreated}
🔹 Total Earnings: ${user.balance} USDT
🔹 Account Level: ${user.tasksCompleted >= 10 ? 'Expert' : user.tasksCompleted >= 5 ? 'Intermediate' : 'Beginner'}

**Achievements:**
🔹 ${user.tasksCompleted >= 1 ? '✅' : '⏳'} First Task
🔹 ${user.tasksCompleted >= 5 ? '✅' : '⏳'} Task Master
🔹 ${user.tasksCompleted >= 10 ? '✅' : '⏳'} Task Expert
🔹 ${user.balance >= 100 ? '✅' : '⏳'} High Earner`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📊 Dashboard', callback_data: 'dashboard' },
          { text: '💰 My Balance', callback_data: 'my_balance' }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Campaign creation flow (matching original structure)
function handleCreateCampaign(chatId) {
  const user = initializeUser(chatId);
  
  // Initialize campaign creation state
  campaignCreationStates.set(chatId, { step: 'platform' });

  const createMessage = `🎯 **Create New Campaign**

📝 **Step 1: Platform Selection**

Choose which platform you want to create a campaign for:

🐦 **Twitter** - Posts, retweets, likes
📱 **TikTok** - Videos, comments, follows  
📘 **Facebook** - Posts, shares, likes
💬 **Telegram** - Channel joins, shares

Select a platform to continue:`;

  bot.sendMessage(chatId, createMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🐦 Twitter', callback_data: 'create_platform_twitter' }],
        [{ text: '📱 TikTok', callback_data: 'create_platform_tiktok' }],
        [{ text: '📘 Facebook', callback_data: 'create_platform_facebook' }],
        [{ text: '💬 Telegram', callback_data: 'create_platform_telegram' }],
        [{ text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }]
      ]
    },
    parse_mode: 'Markdown'
  });
}

function handlePlatformStep(chatId, platform) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  state.platform = platform;
  state.step = 'title';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `📝 **Step 2: Campaign Title**

${platformEmoji[platform]} **Platform**: ${platform.charAt(0).toUpperCase() + platform.slice(1)}

Please provide a clear, descriptive title for your campaign.

**Examples:**
🔹 "Promote our new product launch"
🔹 "Increase brand awareness on ${platform.charAt(0).toUpperCase() + platform.slice(1)}"
🔹 "Drive traffic to our website"

**Send your campaign title now:**`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

function handleTitleStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  state.title = text.trim();
  state.step = 'description';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `📄 **Step 3: Campaign Description**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}

Please provide a detailed description of what users need to do.

**Include:**
🔹 What action to perform
🔹 What content to share
🔹 Any specific requirements
🔹 Proof of completion needed

**Send your campaign description now:**`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

function handleDescriptionStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  if (text.toLowerCase() !== 'skip') {
    state.description = text.trim();
  }
  state.step = 'reward';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `💰 **Step 4: Reward Amount**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
📄 **Description**: ${state.description || 'No description provided'}

How much USDT will you pay per completion?

**Recommended amounts:**
🔹 Easy task: 0.5-2 USDT
🔹 Medium task: 2-5 USDT
🔹 Hard task: 5-10 USDT

**Send the reward amount (numbers only):**`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

function handleRewardStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  const reward = parseFloat(text);
  if (isNaN(reward) || reward <= 0) {
    bot.sendMessage(chatId, '❌ Please enter a valid number greater than 0 (e.g., 0.25)');
    return;
  }

  state.reward = reward;
  state.step = 'slots';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `👥 **Step 5: Number of Slots**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
💰 **Reward**: ${reward} USDT per completion

How many people can complete this campaign?

**Recommended:**
🔹 Small campaign: 10-50 slots
🔹 Medium campaign: 50-200 slots
🔹 Large campaign: 200+ slots

**Send the number of slots (numbers only):**`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

function handleSlotsStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  const slots = parseInt(text);
  if (isNaN(slots) || slots <= 0) {
    bot.sendMessage(chatId, '❌ Please enter a valid number greater than 0 (e.g., 100)');
    return;
  }

  state.slots = slots;
  state.step = 'url';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `🔗 **Step 6: Task URL**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${slots} available

Please provide the URL that users need to visit or interact with.

**Examples:**
🔹 Website URL: https://example.com
🔹 Social media post: https://twitter.com/example/status/123
🔹 YouTube video: https://youtube.com/watch?v=example

**Send the task URL now:**`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

function handleUrlStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  if (!text.startsWith('http')) {
    bot.sendMessage(chatId, '❌ Please provide a valid URL starting with http:// or https://');
    return;
  }

  state.url = text.trim();
  state.step = 'duration';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `⏰ **Step 7: Campaign Duration**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
🔗 **URL**: ${state.url}

How many days should this campaign run?

**Recommended:**
🔹 Short campaign: 3-7 days
🔹 Medium campaign: 7-14 days
🔹 Long campaign: 14-30 days

**Send the duration in days (numbers only):**`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

function handleDurationStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  const duration = parseInt(text);
  if (isNaN(duration) || duration < 3) {
    bot.sendMessage(chatId, '❌ Please enter a valid number (minimum 3 days)');
    return;
  }

  state.duration = duration;
  state.step = 'proofType';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `📸 **Step 8: Proof Type**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
🔗 **URL**: ${state.url}
⏰ **Duration**: ${duration} days

What type of proof should users provide?

**Options:**
🔹 **Image** - Screenshot or photo proof
🔹 **Link** - URL to their post/activity

**Send your choice (image or link):**`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

function handleProofTypeStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  if (text.toLowerCase() !== 'image' && text.toLowerCase() !== 'link') {
    bot.sendMessage(chatId, '❌ Please enter either "image" or "link"');
    return;
  }

  state.proofType = text.toLowerCase();
  state.step = 'confirm';
  campaignCreationStates.set(chatId, state);

  // Show confirmation with balance check
  const totalCost = state.reward * state.slots;
  const user = initializeUser(chatId);
  
  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `✅ **Campaign Preview**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
📄 **Description**: ${state.description || 'No description provided'}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
🔗 **URL**: ${state.url}
⏰ **Duration**: ${state.duration} days
📸 **Proof Type**: ${state.proofType}

**Financial Summary:**
💸 **Total Budget**: ${totalCost} USDT
💳 **Your Balance**: ${user.balance} USDT
${user.balance >= totalCost ? '✅ **Sufficient Balance**' : '❌ **Insufficient Balance**'}

**Is this correct?**`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Create Campaign', callback_data: 'confirm_campaign_creation' },
          { text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

function finalizeCampaignCreation(chatId) {
  const state = campaignCreationStates.get(chatId);
  if (!state || !state.title) {
    bot.sendMessage(chatId, '❌ Campaign data incomplete. Please start over.');
    return;
  }
  
  // Calculate total campaign cost
  const totalCost = state.reward * state.slots;
  const user = initializeUser(chatId);
  
  // Check if user has sufficient balance
  if (user.balance < totalCost) {
    const needed = totalCost - user.balance;
    const message = `❌ **Insufficient Balance**

💰 **Your Balance**: ${user.balance} USDT
💸 **Campaign Cost**: ${totalCost} USDT (${state.reward} × ${state.slots})
📊 **Need**: ${needed.toFixed(2)} USDT more

**To create this campaign, you need to:**
🔹 Complete more tasks to earn USDT
🔹 Or fund your account with USDT

**Campaign Preview:**
📝 **Title**: ${state.title}
📄 **Description**: ${state.description}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
📱 **Platform**: ${state.platform}`;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📋 Complete Tasks', callback_data: 'view_tasks' },
            { text: '💰 Check Balance', callback_data: 'my_balance' }
          ],
          [
            { text: '🔙 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    };
    
    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
    campaignCreationStates.delete(chatId);
    return;
  }
  
  // Create the campaign
  const campaign = {
    id: Date.now(),
    title: state.title,
    description: state.description,
    reward: state.reward,
    slots: state.slots,
    platform: state.platform,
    url: state.url,
    duration: state.duration,
    proofType: state.proofType,
    creator: chatId,
    createdAt: new Date(),
    status: 'active',
    completions: 0,
    escrowAmount: totalCost
  };
  
  campaigns.set(campaign.id, campaign);
  
  // Deduct the cost from user balance
  user.balance -= totalCost;
  user.campaignsCreated += 1;
  
  // Add transaction record
  const transactionId = Date.now();
  transactions.set(transactionId, {
    id: transactionId,
    userId: chatId,
    type: 'campaign_creation',
    amount: -totalCost,
    description: `Created campaign: ${campaign.title}`,
    date: new Date()
  });
  
  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `✅ **Campaign Created Successfully!**

**Campaign Details:**
${platformEmoji[campaign.platform]} **Platform**: ${campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)}
📝 **Title**: ${campaign.title}
📄 **Description**: ${campaign.description}
💰 **Reward**: ${campaign.reward} USDT per completion
👥 **Slots**: ${campaign.slots} available
🔗 **URL**: ${campaign.url}
⏰ **Duration**: ${campaign.duration} days
📸 **Proof Type**: ${campaign.proofType}
🆔 **Campaign ID**: ${campaign.id}

**Financial Summary:**
💸 **Total Budget**: ${totalCost} USDT (deducted from your balance)
💳 **Remaining Balance**: ${user.balance} USDT

**Next Steps:**
🔹 Your campaign is now live
🔹 Users can start completing tasks
🔹 Monitor progress in Dashboard`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📊 Dashboard', callback_data: 'dashboard' },
          { text: '💰 My Balance', callback_data: 'my_balance' }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
  campaignCreationStates.delete(chatId);
}

// Show admin panel
function showAdminPanel(chatId) {
  const user = initializeUser(chatId);
  if (!user.isAdmin) {
    bot.sendMessage(chatId, '❌ Admin access required');
    return;
  }
  
  const totalUsers = users.size;
  const totalCampaigns = campaigns.size;
  const totalTasks = tasks.size;
  const totalTransactions = transactions.size;
  
  const message = `⚙️ **Admin Panel**

**Platform Statistics:**
👥 **Total Users**: ${totalUsers}
🎯 **Active Campaigns**: ${totalCampaigns}
📋 **Total Tasks**: ${totalTasks}
💰 **Total Transactions**: ${totalTransactions}

**Quick Actions:**
🔹 Manage users and campaigns
🔹 View platform analytics
🔹 Monitor transactions
🔹 System settings`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👥 Users', callback_data: 'admin_users' },
          { text: '🎯 Campaigns', callback_data: 'admin_campaigns' }
        ],
        [
          { text: '📋 Tasks', callback_data: 'admin_tasks' },
          { text: '💰 Balance', callback_data: 'admin_balance' }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Show help
function showHelp(chatId) {
  const message = `ℹ️ **TaskBot Help**

**How to Use:**
🔹 Click buttons to navigate
🔹 Complete tasks to earn USDT
🔹 Create campaigns to promote your content
🔹 Track your progress

**Available Commands:**
/start - Show main menu
/help - Show this help
/balance - Check your balance
/tasks - View available tasks
/profile - View your profile

**Earning USDT:**
🔹 Complete social media tasks
🔹 Create successful campaigns
🔹 Refer friends (coming soon)

**Admin Features:**
🔹 Create and manage campaigns
🔹 View platform statistics
🔹 Monitor user activity
🔹 Manage system settings`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🚀 Main Menu', callback_data: 'main_menu' },
          { text: '📋 View Tasks', callback_data: 'view_tasks' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

console.log('✅ Pure Telegram bot started successfully!');
console.log('📱 Bot is ready to receive messages');
console.log('🎯 All features run directly in Telegram');
console.log('🛑 Press Ctrl+C to stop the bot\n');
