import TelegramBot from 'node-telegram-bot-api';
import { storage } from './storage';
import { tonService } from './tonService';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ESCROW_WALLET = "EQBUNIp7rk76qbgMPq8vlW8fF4l56IcrOwzEpVjHFfzUY3Yv";

export class TaskBot {
  private bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(BOT_TOKEN, { polling: true });
    this.setupCommands();
  }

  private setupCommands() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
🚀 Welcome to TaskBot!

Your social media marketing automation platform on TON Network.

🔹 Complete tasks and earn USDT
🔹 Create campaigns to promote your content
🔹 Secure escrow system for payments

Use /menu to see all available commands.
      `;
      
      this.bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: {
          keyboard: [
            [{ text: '👤 Create Account' }, { text: '💰 Fund Account' }],
            [{ text: '📋 Available Campaigns' }, { text: '🎯 My Campaigns' }],
            [{ text: '💸 Withdraw Funds' }, { text: '🆘 Contact Support' }]
          ],
          resize_keyboard: true,
          one_time_keyboard: false
        }
      });
    });

    // Menu command
    this.bot.onText(/\/menu/, (msg) => {
      this.showMainMenu(msg.chat.id);
    });

    // Handle button clicks
    this.bot.on('message', (msg) => {
      if (!msg.text) return;
      
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString() || '';

      switch (msg.text) {
        case '👤 Create Account':
          this.handleCreateAccount(chatId, telegramId);
          break;
        case '💰 Fund Account':
          this.handleFundAccount(chatId, telegramId);
          break;
        case '📋 Available Campaigns':
          this.handleAvailableCampaigns(chatId, telegramId);
          break;
        case '🎯 My Campaigns':
          this.handleMyCampaigns(chatId, telegramId);
          break;
        case '💸 Withdraw Funds':
          this.handleWithdrawFunds(chatId, telegramId);
          break;
        case '🆘 Contact Support':
          this.handleContactSupport(chatId, telegramId);
          break;
      }
    });

    // Handle wallet address input
    this.bot.onText(/^(EQ|UQ)[A-Za-z0-9_-]{46}$/, async (msg, match) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString() || '';
      const walletAddress = match?.[0] || '';

      if (walletAddress) {
        await this.createUserAccount(chatId, telegramId, walletAddress);
      }
    });

    // Handle campaign creation messages
    this.bot.onText(/^Title:/i, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString() || '';
      const text = msg.text || '';

      await this.parseCampaignCreation(chatId, telegramId, text);
    });

    // Handle transaction hash verification
    this.bot.onText(/^[a-fA-F0-9]{64}$/, async (msg, match) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString() || '';
      const hash = match?.[0] || '';

      if (hash) {
        await this.verifyTransaction(chatId, telegramId, hash);
      }
    });
  }

  private showMainMenu(chatId: number) {
    const menuMessage = `
📋 Main Menu

Choose an option:

👤 Create Account - Register your TON wallet
💰 Fund Account - Add USDT to your balance
📋 Available Campaigns - Browse and join tasks
🎯 My Campaigns - Create and manage campaigns
💸 Withdraw Funds - Withdraw your earnings
🆘 Contact Support - Get help from our team
    `;

    this.bot.sendMessage(chatId, menuMessage, {
      reply_markup: {
        keyboard: [
          [{ text: '👤 Create Account' }, { text: '💰 Fund Account' }],
          [{ text: '📋 Available Campaigns' }, { text: '🎯 My Campaigns' }],
          [{ text: '💸 Withdraw Funds' }, { text: '🆘 Contact Support' }]
        ],
        resize_keyboard: true
      }
    });
  }

  private async handleCreateAccount(chatId: number, telegramId: string) {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByTelegramId(telegramId);
      
      if (existingUser) {
        const accountInfo = `
✅ Account Already Active

👤 User ID: ${existingUser.id}
💰 Balance: ${existingUser.balance} USDT
🏆 Total Rewards: ${existingUser.rewards} USDT
📊 Tasks Completed: ${existingUser.completedTasks}

Your account is ready to use!
        `;
        
        this.bot.sendMessage(chatId, accountInfo);
        return;
      }

      const message = `
🔐 Create Your Account

To activate your account, please send your TON wallet address.

✅ Use bounceable format (recommended):
EQBUNIp7rk76qbgMPq8vlW8fF4l56IcrOwzEpVjHFfzUY3Yv

⚠️ Make sure you own this wallet as all payments will be sent here.
      `;

      this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error in handleCreateAccount:', error);
      this.bot.sendMessage(chatId, '❌ Error accessing account. Please try again.');
    }
  }

  private async createUserAccount(chatId: number, telegramId: string, walletAddress: string) {
    try {
      // Validate wallet address
      if (!tonService.validateAddress(walletAddress)) {
        this.bot.sendMessage(chatId, '❌ Invalid TON wallet address. Please try again.');
        return;
      }

      // Convert wallet address to bounceable format and create user account
      const bounceableAddress = tonService.toBounceable(walletAddress);
      const user = await storage.createUser({
        telegramId,
        walletAddress: bounceableAddress,
        balance: "0",
        rewards: "0",
        completedTasks: 0
      });

      const successMessage = `
✅ Account Created Successfully!

👤 User ID: ${user.id}
💰 Balance: ${user.balance} USDT
🏆 Rewards: ${user.rewards} USDT
📊 Tasks Completed: ${user.completedTasks}

Your account is now active! You can start earning by completing tasks or create your own campaigns.
      `;

      this.bot.sendMessage(chatId, successMessage);
    } catch (error) {
      console.error('Error creating user account:', error);
      this.bot.sendMessage(chatId, '❌ Error creating account. Please try again.');
    }
  }

  private async handleFundAccount(chatId: number, telegramId: string) {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        this.bot.sendMessage(chatId, '❌ Please create an account first using "👤 Create Account"');
        return;
      }

      const fundingMessage = `
💰 Fund Your Account

Send USDT (TRC-20) to our escrow wallet:

🏦 Escrow Wallet:
\`${ESCROW_WALLET}\`

⚠️ Important:
• Only send USDT on TON Network
• Minimum amount: 1 USDT
• 1% fee will be charged

After sending, paste your transaction hash to verify the payment.

Example: a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890
      `;

      this.bot.sendMessage(chatId, fundingMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in handleFundAccount:', error);
      this.bot.sendMessage(chatId, '❌ Error accessing account. Please try again.');
    }
  }

  private async verifyTransaction(chatId: number, telegramId: string, hash: string) {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        this.bot.sendMessage(chatId, '❌ Please create an account first.');
        return;
      }

      this.bot.sendMessage(chatId, '⏳ Verifying transaction...');

      // Verify transaction using TON API
      const verification = await tonService.verifyTransaction(hash);
      
      if (!verification.valid) {
        this.bot.sendMessage(chatId, '❌ Transaction verification failed. Please check your transaction hash.');
        return;
      }

      // Calculate fee and net amount
      const amount = parseFloat(verification.amount || '0');
      const fee = amount * 0.01;
      const netAmount = amount - fee;

      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        type: 'deposit',
        amount: netAmount.toString(),
        fee: fee.toString(),
        status: 'completed',
        hash
      });

      // Update user balance
      const newBalance = (parseFloat(user.balance) + netAmount).toString();
      await storage.updateUserBalance(user.id, newBalance);

      const successMessage = `
🎉 Transaction Verified Successfully!

📊 Transaction Summary:
💳 Amount Sent: ${amount} USDT
💰 Fee (1%): ${fee.toFixed(8)} USDT
✅ Credited: ${netAmount.toFixed(8)} USDT

💰 New Balance: ${newBalance} USDT

Your account has been funded! Click "FUND CONFIRMED" to continue.
      `;

      this.bot.sendMessage(chatId, successMessage, {
        reply_markup: {
          inline_keyboard: [[
            { text: 'FUND CONFIRMED ✅', callback_data: 'fund_confirmed' }
          ]]
        }
      });

    } catch (error) {
      console.error('Error verifying transaction:', error);
      this.bot.sendMessage(chatId, '❌ Error verifying transaction. Please try again.');
    }
  }

  private async handleAvailableCampaigns(chatId: number, telegramId: string) {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        this.bot.sendMessage(chatId, '❌ Please create an account first using "👤 Create Account"');
        return;
      }

      const campaigns = await storage.getCampaigns();
      
      if (campaigns.length === 0) {
        this.bot.sendMessage(chatId, '📋 No campaigns available at the moment. Check back later!');
        return;
      }

      const platformButtons = [
        [
          { text: '🐦 Twitter', callback_data: 'platform_twitter' },
          { text: '🎵 TikTok', callback_data: 'platform_tiktok' }
        ],
        [
          { text: '📘 Facebook', callback_data: 'platform_facebook' },
          { text: '💬 Telegram', callback_data: 'platform_telegram' }
        ],
        [
          { text: '📋 All Platforms', callback_data: 'platform_all' }
        ]
      ];

      this.bot.sendMessage(chatId, '📋 Choose a platform to browse campaigns:', {
        reply_markup: { inline_keyboard: platformButtons }
      });

    } catch (error) {
      console.error('Error in handleAvailableCampaigns:', error);
      this.bot.sendMessage(chatId, '❌ Error loading campaigns. Please try again.');
    }
  }

  private async handleMyCampaigns(chatId: number, telegramId: string) {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        this.bot.sendMessage(chatId, '❌ Please create an account first using "👤 Create Account"');
        return;
      }

      const campaignMessage = `
🎯 Campaign Creation

Create a new marketing campaign:

📝 Required Information:
• Platform (Twitter, TikTok, Facebook, Telegram)
• Task type (Like, Retweet, Follow, etc.)
• Number of slots (minimum 5)
• Reward per task (minimum 0.015 USDT)
• Campaign description

💰 Costs:
• Total cost = (Slots × Reward) + 1% fee
• Funds held in escrow until completion

Would you like to create a new campaign?
      `;

      this.bot.sendMessage(chatId, campaignMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✨ Create New Campaign', callback_data: 'create_campaign' }],
            [{ text: '📊 View My Campaigns', callback_data: 'view_my_campaigns' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in handleMyCampaigns:', error);
      this.bot.sendMessage(chatId, '❌ Error accessing campaigns. Please try again.');
    }
  }

  private async handleCreateCampaign(chatId: number, telegramId: string) {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        this.bot.sendMessage(chatId, '❌ Please create an account first using "👤 Create Account"');
        return;
      }

      const createMessage = `
🎯 Create New Campaign

📝 Platform Selection:
Choose which platform you want to create a campaign for:

🐦 Twitter - Posts, retweets, likes
📱 TikTok - Videos, comments, follows
📘 Facebook - Posts, shares, likes
💬 Telegram - Channel joins, shares

Select a platform to continue:
      `;

      this.bot.sendMessage(chatId, createMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🐦 Twitter', callback_data: 'create_platform_twitter' }],
            [{ text: '📱 TikTok', callback_data: 'create_platform_tiktok' }],
            [{ text: '📘 Facebook', callback_data: 'create_platform_facebook' }],
            [{ text: '💬 Telegram', callback_data: 'create_platform_telegram' }],
            [{ text: '🔙 Back to My Campaigns', callback_data: 'back_to_campaigns' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in handleCreateCampaign:', error);
      this.bot.sendMessage(chatId, '❌ Error starting campaign creation. Please try again.');
    }
  }

  private async handleViewMyCampaigns(chatId: number, telegramId: string) {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        this.bot.sendMessage(chatId, '❌ Please create an account first using "👤 Create Account"');
        return;
      }

      const userCampaigns = await storage.getUserCampaigns(user.id);
      
      if (userCampaigns.length === 0) {
        this.bot.sendMessage(chatId, `
📊 My Campaigns

You haven't created any campaigns yet. Click "✨ Create New Campaign" to get started!

💡 Tips for successful campaigns:
• Offer competitive rewards
• Write clear task descriptions
• Choose the right platform for your audience
        `, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✨ Create New Campaign', callback_data: 'create_campaign' }]
            ]
          }
        });
        return;
      }

      let campaignList = `📊 My Campaigns (${userCampaigns.length} total):\n\n`;
      
      userCampaigns.slice(0, 5).forEach((campaign, index) => {
        const progress = ((campaign.totalSlots - campaign.availableSlots) / campaign.totalSlots) * 100;
        campaignList += `${index + 1}. ${campaign.title}\n`;
        campaignList += `🎯 Platform: ${campaign.platform}\n`;
        campaignList += `💰 Reward: ${campaign.rewardAmount} USDT per task\n`;
        campaignList += `📊 Progress: ${campaign.totalSlots - campaign.availableSlots}/${campaign.totalSlots} completed (${progress.toFixed(1)}%)\n`;
        campaignList += `📈 Status: ${campaign.status}\n\n`;
      });

      if (userCampaigns.length > 5) {
        campaignList += `... and ${userCampaigns.length - 5} more campaigns\n\n`;
      }

      this.bot.sendMessage(chatId, campaignList, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✨ Create New Campaign', callback_data: 'create_campaign' }],
            [{ text: '🔄 Refresh List', callback_data: 'view_my_campaigns' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in handleViewMyCampaigns:', error);
      this.bot.sendMessage(chatId, '❌ Error loading your campaigns. Please try again.');
    }
  }

  private async handlePlatformCampaignCreation(chatId: number, telegramId: string, platform: string) {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        this.bot.sendMessage(chatId, '❌ Please create an account first using "👤 Create Account"');
        return;
      }

      const platformEmoji = {
        'twitter': '🐦',
        'tiktok': '📱',
        'facebook': '📘',
        'telegram': '💬'
      }[platform] || '🎯';

      const instructionMessage = `
${platformEmoji} Creating ${platform.toUpperCase()} Campaign

📝 Campaign Setup Instructions:

Please send the following information in this format:

**Title:** Your campaign title
**Description:** What users need to do
**Reward:** Amount in USDT per task (e.g., 0.5)
**Slots:** Number of people needed (e.g., 100)
**URL:** Link to your ${platform} content

💡 Example:
Title: Like my Twitter post
Description: Like and retweet my latest post about crypto
Reward: 0.25
Slots: 500
URL: https://twitter.com/username/status/123456789

Send all information in your next message to create the campaign!
      `;

      this.bot.sendMessage(chatId, instructionMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Platform Selection', callback_data: 'create_campaign' }]
          ]
        }
      });

      // Store the platform selection in a temporary state
      // Note: In a real implementation, you'd want to use a proper state management system
      // For now, we'll rely on the user sending the properly formatted message

    } catch (error) {
      console.error('Error in handlePlatformCampaignCreation:', error);
      this.bot.sendMessage(chatId, '❌ Error setting up campaign creation. Please try again.');
    }
  }

  private async parseCampaignCreation(chatId: number, telegramId: string, text: string) {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        this.bot.sendMessage(chatId, '❌ Please create an account first using "👤 Create Account"');
        return;
      }

      // Parse the campaign details
      const titleMatch = text.match(/Title:\s*(.+)/i);
      const descriptionMatch = text.match(/Description:\s*(.+)/i);
      const rewardMatch = text.match(/Reward:\s*([0-9.]+)/i);
      const slotsMatch = text.match(/Slots:\s*([0-9]+)/i);
      const urlMatch = text.match(/URL:\s*(https?:\/\/\S+)/i);

      if (!titleMatch || !descriptionMatch || !rewardMatch || !slotsMatch || !urlMatch) {
        this.bot.sendMessage(chatId, `
❌ Invalid format! Please include all required fields:

**Title:** Your campaign title
**Description:** What users need to do
**Reward:** Amount in USDT per task
**Slots:** Number of people needed
**URL:** Link to your content

Example:
Title: Like my Twitter post
Description: Like and retweet my latest post
Reward: 0.25
Slots: 100
URL: https://twitter.com/username/status/123
        `);
        return;
      }

      const title = titleMatch[1].trim();
      const description = descriptionMatch[1].trim();
      const rewardAmount = parseFloat(rewardMatch[1]);
      const totalSlots = parseInt(slotsMatch[1]);
      const taskUrl = urlMatch[1].trim();

      // Determine platform from URL
      let platform = 'other';
      if (taskUrl.includes('twitter.com') || taskUrl.includes('x.com')) {
        platform = 'twitter';
      } else if (taskUrl.includes('tiktok.com')) {
        platform = 'tiktok';
      } else if (taskUrl.includes('facebook.com')) {
        platform = 'facebook';
      } else if (taskUrl.includes('t.me')) {
        platform = 'telegram';
      }

      // Calculate total campaign cost
      const totalCost = rewardAmount * totalSlots;
      const userBalance = parseFloat(user.balance);

      if (userBalance < totalCost) {
        this.bot.sendMessage(chatId, `
❌ Insufficient Balance

💰 Your balance: ${userBalance} USDT
💸 Campaign cost: ${totalCost} USDT (${rewardAmount} × ${totalSlots})
📊 Need: ${(totalCost - userBalance).toFixed(2)} USDT more

Please fund your account first using "💰 Fund Account"
        `);
        return;
      }

      // Create the campaign
      const campaign = await storage.createCampaign({
        creatorId: user.id,
        title,
        description,
        platform,
        rewardAmount: rewardAmount.toString(),
        totalSlots,
        availableSlots: totalSlots,
        taskUrl,
        status: 'active'
      });

      // Deduct the cost from user balance
      const newBalance = userBalance - totalCost;
      await storage.updateUserBalance(user.id, newBalance.toString());

      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        type: 'campaign_funding',
        amount: totalCost.toString(),
        status: 'completed',
        description: `Campaign funding: ${title}`
      });

      this.bot.sendMessage(chatId, `
✅ Campaign Created Successfully!

🎯 **${title}**
📝 ${description}
🎪 Platform: ${platform.toUpperCase()}
💰 Reward: ${rewardAmount} USDT per task
👥 Slots: ${totalSlots} people needed
🔗 URL: ${taskUrl}

💸 **Payment Details:**
• Total cost: ${totalCost} USDT
• Remaining balance: ${newBalance.toFixed(2)} USDT

🚀 Your campaign is now live and available to users!
      `, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 View My Campaigns', callback_data: 'view_my_campaigns' }],
            [{ text: '✨ Create Another Campaign', callback_data: 'create_campaign' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in parseCampaignCreation:', error);
      this.bot.sendMessage(chatId, '❌ Error creating campaign. Please try again.');
    }
  }

  private async handleWithdrawFunds(chatId: number, telegramId: string) {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        this.bot.sendMessage(chatId, '❌ Please create an account first using "👤 Create Account"');
        return;
      }

      const balance = parseFloat(user.balance);
      
      if (balance < 1) {
        this.bot.sendMessage(chatId, '❌ Minimum withdrawal amount is 1 USDT. Complete more tasks to earn rewards!');
        return;
      }

      const withdrawalMessage = `
💸 Withdraw Your Earnings

💰 Available Balance: ${user.balance} USDT

📋 Withdrawal Details:
• Minimum amount: 1 USDT  
• Network fee: 1% of withdrawal amount
• Processing time: 5-15 minutes
• Funds sent to your registered wallet

Would you like to proceed with withdrawal?
      `;

      this.bot.sendMessage(chatId, withdrawalMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💸 Withdraw All Funds', callback_data: `withdraw_all_${user.id}` }],
            [{ text: '💰 Custom Amount', callback_data: `withdraw_custom_${user.id}` }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in handleWithdrawFunds:', error);
      this.bot.sendMessage(chatId, '❌ Error accessing withdrawal. Please try again.');
    }
  }

  private async handleContactSupport(chatId: number, telegramId: string) {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      const userId = user ? user.id : 'N/A';
      
      const supportMessage = `
🆘 Contact Support

For assistance with tasks, payments, or campaigns, contact our support team:

👤 Support: @crypticdemigod

📋 Template Message:
\`\`\`
User ID: ${userId}
Transaction Hash: [Your transaction hash if applicable]
Issue Description: [Describe your issue here]
\`\`\`

Copy the template above and send it to our support team for faster assistance.
      `;

      this.bot.sendMessage(chatId, supportMessage, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💬 Contact @crypticdemigod', url: 'https://t.me/crypticdemigod' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in handleContactSupport:', error);
      this.bot.sendMessage(chatId, '❌ Error loading support information. Please try again.');
    }
  }

  // Handle callback queries
  public setupCallbackHandlers() {
    this.bot.on('callback_query', async (callbackQuery) => {
      const msg = callbackQuery.message;
      const data = callbackQuery.data;
      const telegramId = callbackQuery.from.id.toString();
      
      if (!msg || !data) return;

      if (data === 'fund_confirmed') {
        this.bot.editMessageText('✅ Funding confirmed! Your account has been updated.', {
          chat_id: msg.chat.id,
          message_id: msg.message_id
        });
      }

      if (data === 'create_campaign') {
        await this.handleCreateCampaign(msg.chat.id, telegramId);
      }

      if (data === 'view_my_campaigns') {
        await this.handleViewMyCampaigns(msg.chat.id, telegramId);
      }

      if (data === 'back_to_campaigns') {
        await this.handleMyCampaigns(msg.chat.id, telegramId);
      }

      if (data.startsWith('create_platform_')) {
        const platform = data.replace('create_platform_', '');
        await this.handlePlatformCampaignCreation(msg.chat.id, telegramId, platform);
      }
      
      if (data.startsWith('platform_')) {
        const platform = data.replace('platform_', '');
        await this.showCampaignsByPlatform(msg.chat.id, platform);
      }

      if (data.startsWith('withdraw_')) {
        const parts = data.split('_');
        const type = parts[1]; // 'all' or 'custom'
        const userId = parts[2];
        await this.processWithdrawal(msg.chat.id, telegramId, userId, type);
      }

      this.bot.answerCallbackQuery(callbackQuery.id);
    });
  }

  private async showCampaignsByPlatform(chatId: number, platform: string) {
    try {
      const campaigns = await storage.getCampaigns(platform === 'all' ? undefined : platform);
      
      if (campaigns.length === 0) {
        this.bot.sendMessage(chatId, `📋 No ${platform} campaigns available at the moment.`);
        return;
      }

      let message = `📋 Available ${platform.toUpperCase()} Campaigns:\n\n`;
      
      campaigns.slice(0, 5).forEach((campaign, index) => {
        const progress = ((campaign.totalSlots - campaign.availableSlots) / campaign.totalSlots) * 100;
        message += `${index + 1}. ${campaign.title}\n`;
        message += `💰 Reward: ${campaign.rewardAmount} USDT\n`;
        message += `📊 Slots: ${campaign.availableSlots}/${campaign.totalSlots} available\n`;
        message += `📈 Progress: ${progress.toFixed(1)}%\n\n`;
      });

      this.bot.sendMessage(chatId, message);
      
    } catch (error) {
      console.error('Error showing campaigns by platform:', error);
      this.bot.sendMessage(chatId, '❌ Error loading campaigns. Please try again.');
    }
  }

  private async processWithdrawal(chatId: number, telegramId: string, userId: string, type: string) {
    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        this.bot.sendMessage(chatId, '❌ User not found.');
        return;
      }

      const balance = parseFloat(user.balance);
      let withdrawAmount = balance;
      
      if (type === 'custom') {
        this.bot.sendMessage(chatId, 'Please enter the amount you want to withdraw (minimum 1 USDT):');
        return;
      }

      const fee = withdrawAmount * 0.01;
      const finalAmount = withdrawAmount - fee;

      // Process withdrawal
      const withdrawal = await storage.createWithdrawal({
        userId: user.id,
        amount: finalAmount.toString(),
        fee: fee.toString(),
        destinationWallet: user.walletAddress,
        status: 'pending'
      });

      // Update user balance
      await storage.updateUserBalance(user.id, '0');

      // Process with TON service
      const result = await tonService.processWithdrawal(user.walletAddress, finalAmount.toString());
      
      if (result.success) {
        await storage.updateWithdrawalStatus(withdrawal.id, 'completed', result.hash);
        
        this.bot.sendMessage(chatId, `
✅ Withdrawal Processed Successfully!

💰 Amount: ${finalAmount.toFixed(8)} USDT
💳 Fee: ${fee.toFixed(8)} USDT
🏦 Sent to: ${user.walletAddress}
🔗 Hash: ${result.hash}

Funds will arrive in 5-15 minutes.
        `);
      } else {
        await storage.updateWithdrawalStatus(withdrawal.id, 'failed');
        await storage.updateUserBalance(user.id, user.balance); // Refund
        
        this.bot.sendMessage(chatId, '❌ Withdrawal failed. Please try again later. Your balance has been restored.');
      }

    } catch (error) {
      console.error('Error processing withdrawal:', error);
      this.bot.sendMessage(chatId, '❌ Error processing withdrawal. Please try again.');
    }
  }

  public start() {
    console.log('TaskBot started successfully!');
    this.setupCallbackHandlers();
  }
}

// Initialize and start the bot
let taskBotInstance: TaskBot | null = null;

if (BOT_TOKEN) {
  taskBotInstance = new TaskBot();
  taskBotInstance.start();
} else {
  console.warn('TELEGRAM_BOT_TOKEN not provided. Bot will not start.');
}

export default TaskBot;
export { taskBotInstance };