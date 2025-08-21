import TelegramBot from 'node-telegram-bot-api';
import { storage } from './storage';
import { tonService } from './tonService';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ESCROW_WALLET = "EQBUNIp7rk76qbgMPq8vlW8fF4l56IcrOwzEpVjHFfzUY3Yv";

// Campaign creation state management
interface CampaignCreationState {
  step: 'platform' | 'title' | 'description' | 'reward' | 'slots' | 'url' | 'confirm';
  platform?: string;
  title?: string;
  description?: string;
  reward?: number;
  slots?: number;
  url?: string;
}

const campaignCreationStates = new Map<string, CampaignCreationState>();

// Withdrawal state management
const awaitingWithdrawalAmount = new Map<string, string>(); // telegramId -> userId

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
        case '🔧 Test Wallet':
          this.handleTestWallet(chatId, telegramId);
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

    // Handle campaign creation conversation
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString() || '';
      const text = msg.text || '';

      // Check if user is in campaign creation flow
      const state = campaignCreationStates.get(telegramId);
      if (state && text && !text.startsWith('/') && !text.match(/^(EQ|UQ)[A-Za-z0-9_-]{46}$/) && !text.match(/^[a-fA-F0-9]{64}$/)) {
        await this.handleCampaignCreationStep(chatId, telegramId, text, state);
        return;
      }

      // Check if user is entering custom withdrawal amount
      const awaitingUserId = awaitingWithdrawalAmount.get(telegramId);
      if (awaitingUserId && text && !text.startsWith('/') && !text.match(/^(EQ|UQ)[A-Za-z0-9_-]{46}$/) && !text.match(/^[a-fA-F0-9]{64}$/)) {
        await this.handleCustomWithdrawalAmount(chatId, telegramId, awaitingUserId, text);
        return;
      }
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
🔧 Test Wallet - Check blockchain connectivity
    `;

    this.bot.sendMessage(chatId, menuMessage, {
      reply_markup: {
        keyboard: [
          [{ text: '👤 Create Account' }, { text: '💰 Fund Account' }],
          [{ text: '📋 Available Campaigns' }, { text: '🎯 My Campaigns' }],
          [{ text: '💸 Withdraw Funds' }, { text: '🆘 Contact Support' }],
          [{ text: '🔧 Test Wallet' }]
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

      // Check if user already exists first
      const existingUser = await storage.getUserByTelegramId(telegramId);
      
      if (existingUser) {
        const accountInfo = `
✅ Account Already Exists!

👤 User ID: ${existingUser.id}
💰 Balance: ${existingUser.balance} USDT
🏆 Total Rewards: ${existingUser.rewards} USDT
📊 Tasks Completed: ${existingUser.completedTasks}
💼 Wallet: ${existingUser.walletAddress}

Your account is already active and your User ID remains permanent!
        `;
        
        this.bot.sendMessage(chatId, accountInfo);
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

🔒 Your User ID is now PERMANENT and will never change!

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
• Minimum amount: 0.020 USDT
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

      // Initialize campaign creation state
      campaignCreationStates.set(telegramId, { step: 'platform' });

      const createMessage = `
🎯 Create New Campaign

📝 **Step 1: Platform Selection**

Choose which platform you want to create a campaign for:

🐦 **Twitter** - Posts, retweets, likes
📱 **TikTok** - Videos, comments, follows  
📘 **Facebook** - Posts, shares, likes
💬 **Telegram** - Channel joins, shares

Select a platform to continue:
      `;

      this.bot.sendMessage(chatId, createMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🐦 Twitter', callback_data: 'create_platform_twitter' }],
            [{ text: '📱 TikTok', callback_data: 'create_platform_tiktok' }],
            [{ text: '📘 Facebook', callback_data: 'create_platform_facebook' }],
            [{ text: '💬 Telegram', callback_data: 'create_platform_telegram' }],
            [{ text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }]
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

      // Update campaign creation state
      const state = campaignCreationStates.get(telegramId);
      if (!state) {
        this.bot.sendMessage(chatId, '❌ Campaign creation session expired. Please start again.');
        return;
      }

      state.platform = platform;
      state.step = 'title';
      campaignCreationStates.set(telegramId, state);

      const platformEmoji = {
        'twitter': '🐦',
        'tiktok': '📱',
        'facebook': '📘',
        'telegram': '💬'
      }[platform] || '🎯';

      const titleMessage = `
${platformEmoji} Creating ${platform.toUpperCase()} Campaign

📝 **Step 2: Campaign Title**

What's the title of your campaign?

💡 **Examples:**
• "Like my latest Twitter post"
• "Follow my TikTok account"  
• "Join my Telegram channel"
• "Share my Facebook post"

Please type your campaign title:
      `;

      this.bot.sendMessage(chatId, titleMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Platform Selection', callback_data: 'create_campaign' }],
            [{ text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in handlePlatformCampaignCreation:', error);
      this.bot.sendMessage(chatId, '❌ Error setting up campaign creation. Please try again.');
    }
  }

  private async handleCampaignCreationStep(chatId: number, telegramId: string, text: string, state: CampaignCreationState) {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        this.bot.sendMessage(chatId, '❌ Please create an account first using "👤 Create Account"');
        campaignCreationStates.delete(telegramId);
        return;
      }

      switch (state.step) {
        case 'title':
          await this.handleTitleStep(chatId, telegramId, text, state);
          break;
        case 'description':
          await this.handleDescriptionStep(chatId, telegramId, text, state);
          break;
        case 'reward':
          await this.handleRewardStep(chatId, telegramId, text, state);
          break;
        case 'slots':
          await this.handleSlotsStep(chatId, telegramId, text, state);
          break;
        case 'url':
          await this.handleUrlStep(chatId, telegramId, text, state);
          break;
        case 'confirm':
          await this.handleConfirmStep(chatId, telegramId, text, state, user);
          break;
      }

    } catch (error) {
      console.error('Error in handleCampaignCreationStep:', error);
      this.bot.sendMessage(chatId, '❌ Error processing your input. Please try again.');
    }
  }

  private async handleTitleStep(chatId: number, telegramId: string, text: string, state: CampaignCreationState) {
    state.title = text.trim();
    state.step = 'description';
    campaignCreationStates.set(telegramId, state);

    const platformEmoji = {
      'twitter': '🐦',
      'tiktok': '📱',
      'facebook': '📘',
      'telegram': '💬'
    }[state.platform!] || '🎯';

    this.bot.sendMessage(chatId, `
${platformEmoji} Creating ${state.platform!.toUpperCase()} Campaign

📝 **Step 3: Description** (Optional)

Great! Your title: "${text}"

Now, please describe what users need to do to complete this task.

💡 **Examples:**
• "Like and retweet this post"
• "Follow my account and like 3 recent posts"
• "Join the channel and stay for 1 week"
• "Share this post and tag 2 friends"

Type "skip" if you want to skip this step, or provide a description:
    `, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '⏭️ Skip Description', callback_data: 'skip_description' }],
          [{ text: '🔙 Back to Title', callback_data: 'back_to_title' }],
          [{ text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }]
        ]
      }
    });
  }

  private async handleDescriptionStep(chatId: number, telegramId: string, text: string, state: CampaignCreationState) {
    if (text.toLowerCase() !== 'skip') {
      state.description = text.trim();
    }
    state.step = 'reward';
    campaignCreationStates.set(telegramId, state);

    const platformEmoji = {
      'twitter': '🐦',
      'tiktok': '📱',
      'facebook': '📘',
      'telegram': '💬'
    }[state.platform!] || '🎯';

    this.bot.sendMessage(chatId, `
${platformEmoji} Creating ${state.platform!.toUpperCase()} Campaign

💰 **Step 4: Reward Amount**

How much USDT will you pay per completed task?

💡 **Suggested amounts:**
• Simple tasks (like, follow): 0.1 - 0.5 USDT
• Medium tasks (comment, share): 0.5 - 1.0 USDT
• Complex tasks (content creation): 1.0 - 5.0 USDT

Please enter the reward amount (numbers only, e.g., 0.25):
    `, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💰 0.1', callback_data: 'reward_0.1' }, { text: '💰 0.25', callback_data: 'reward_0.25' }],
          [{ text: '💰 0.5', callback_data: 'reward_0.5' }, { text: '💰 1.0', callback_data: 'reward_1.0' }],
          [{ text: '🔙 Back to Description', callback_data: 'back_to_description' }],
          [{ text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }]
        ]
      }
    });
  }

  private async handleRewardStep(chatId: number, telegramId: string, text: string, state: CampaignCreationState) {
    const reward = parseFloat(text);
    if (isNaN(reward) || reward <= 0) {
      this.bot.sendMessage(chatId, '❌ Please enter a valid number greater than 0 (e.g., 0.25)');
      return;
    }

    state.reward = reward;
    state.step = 'slots';
    campaignCreationStates.set(telegramId, state);

    const platformEmoji = {
      'twitter': '🐦',
      'tiktok': '📱',
      'facebook': '📘',
      'telegram': '💬'
    }[state.platform!] || '🎯';

    this.bot.sendMessage(chatId, `
${platformEmoji} Creating ${state.platform!.toUpperCase()} Campaign

👥 **Step 5: Number of Participants**

How many people do you want to complete this task?

💡 **Recommendations:**
• Small campaign: 50-100 people
• Medium campaign: 100-500 people  
• Large campaign: 500-1000+ people

Please enter the number of participants needed:
    `, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👥 50', callback_data: 'slots_50' }, { text: '👥 100', callback_data: 'slots_100' }],
          [{ text: '👥 250', callback_data: 'slots_250' }, { text: '👥 500', callback_data: 'slots_500' }],
          [{ text: '🔙 Back to Reward', callback_data: 'back_to_reward' }],
          [{ text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }]
        ]
      }
    });
  }

  private async handleSlotsStep(chatId: number, telegramId: string, text: string, state: CampaignCreationState) {
    const slots = parseInt(text);
    if (isNaN(slots) || slots <= 0) {
      this.bot.sendMessage(chatId, '❌ Please enter a valid number greater than 0 (e.g., 100)');
      return;
    }

    state.slots = slots;
    state.step = 'url';
    campaignCreationStates.set(telegramId, state);

    const platformEmoji = {
      'twitter': '🐦',
      'tiktok': '📱',
      'facebook': '📘',
      'telegram': '💬'
    }[state.platform!] || '🎯';

    const urlExamples = {
      'twitter': 'https://twitter.com/username/status/123456789',
      'tiktok': 'https://tiktok.com/@username/video/123456789',
      'facebook': 'https://facebook.com/username/posts/123456789',
      'telegram': 'https://t.me/channelname'
    }[state.platform!] || 'https://example.com/your-content';

    this.bot.sendMessage(chatId, `
${platformEmoji} Creating ${state.platform!.toUpperCase()} Campaign

🔗 **Step 6: Content URL**

Please provide the link to your ${state.platform} content that users need to interact with.

💡 **Example for ${state.platform}:**
${urlExamples}

Paste your ${state.platform} URL here:
    `, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Participants', callback_data: 'back_to_slots' }],
          [{ text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }]
        ]
      }
    });
  }

  private async handleUrlStep(chatId: number, telegramId: string, text: string, state: CampaignCreationState) {
    if (!text.startsWith('http')) {
      this.bot.sendMessage(chatId, '❌ Please provide a valid URL starting with http:// or https://');
      return;
    }

    state.url = text.trim();
    state.step = 'confirm';
    campaignCreationStates.set(telegramId, state);

    const totalCost = state.reward! * state.slots!;
    const platformEmoji = {
      'twitter': '🐦',
      'tiktok': '📱',
      'facebook': '📘',
      'telegram': '💬'
    }[state.platform!] || '🎯';

    this.bot.sendMessage(chatId, `
${platformEmoji} **Campaign Summary**

📝 **Title:** ${state.title}
📄 **Description:** ${state.description || 'No description'}
🎪 **Platform:** ${state.platform!.toUpperCase()}
💰 **Reward:** ${state.reward} USDT per task
👥 **Participants:** ${state.slots} people
🔗 **URL:** ${state.url}

💸 **Total Cost:** ${totalCost} USDT

Are you sure you want to create this campaign?
    `, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Create Campaign', callback_data: 'confirm_campaign_creation' }],
          [{ text: '🔙 Back to URL', callback_data: 'back_to_url' }],
          [{ text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }]
        ]
      }
    });
  }

  private async handleConfirmStep(chatId: number, telegramId: string, text: string, state: CampaignCreationState, user: any) {
    // This step is handled by callback query, not text input
    this.bot.sendMessage(chatId, '❌ Please use the buttons to confirm or cancel the campaign creation.');
  }

  private async finalizeCampaignCreation(chatId: number, telegramId: string) {
    try {
      const state = campaignCreationStates.get(telegramId);
      const user = await storage.getUserByTelegramId(telegramId);

      if (!state || !user) {
        this.bot.sendMessage(chatId, '❌ Campaign creation session expired. Please start again.');
        campaignCreationStates.delete(telegramId);
        return;
      }

      // Calculate total campaign cost
      const totalCost = state.reward! * state.slots!;
      const userBalance = parseFloat(user.balance);

      if (userBalance < totalCost) {
        this.bot.sendMessage(chatId, `
❌ Insufficient Balance

💰 Your balance: ${userBalance} USDT
💸 Campaign cost: ${totalCost} USDT (${state.reward} × ${state.slots})
📊 Need: ${(totalCost - userBalance).toFixed(2)} USDT more

Please fund your account first using "💰 Fund Account"
        `);
        campaignCreationStates.delete(telegramId);
        return;
      }

      // Create the campaign
      const campaign = await storage.createCampaign({
        creatorId: user.id,
        title: state.title!,
        description: state.description || '',
        platform: state.platform!,
        taskType: 'engagement', // Default task type for social media campaigns
        taskUrl: state.url!,
        totalSlots: state.slots!,
        availableSlots: state.slots!,
        rewardAmount: state.reward!.toString(),
        escrowAmount: totalCost.toString(),
        fee: "0", // No additional fee for basic campaigns
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
        campaignId: campaign.id
      });

      // Clear the creation state
      campaignCreationStates.delete(telegramId);

      const platformEmoji = {
        'twitter': '🐦',
        'tiktok': '📱',
        'facebook': '📘',
        'telegram': '💬'
      }[state.platform!] || '🎯';

      this.bot.sendMessage(chatId, `
✅ Campaign Created Successfully!

${platformEmoji} **${state.title}**
📝 ${state.description || 'No description'}
🎪 Platform: ${state.platform!.toUpperCase()}
💰 Reward: ${state.reward} USDT per task
👥 Slots: ${state.slots} people needed
🔗 URL: ${state.url}

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
      console.error('Error in finalizeCampaignCreation:', error);
      this.bot.sendMessage(chatId, '❌ Error creating campaign. Please try again.');
      campaignCreationStates.delete(telegramId);
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
      
      if (balance < 0.020) {
        this.bot.sendMessage(chatId, '❌ Minimum withdrawal amount is 0.020 USDT. Complete more tasks to earn rewards!');
        return;
      }

      const withdrawalMessage = `
💸 Withdraw Your Earnings

💰 Available Balance: ${user.balance} USDT

📋 Withdrawal Details:
• Minimum amount: 0.020 USDT  
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

  private async handleTestWallet(chatId: number, telegramId: string) {
    try {
      this.bot.sendMessage(chatId, '🔧 Testing wallet connectivity...');
      
      const testResult = await tonService.testWallet();
      
      if (testResult.valid) {
        this.bot.sendMessage(chatId, `
✅ **Wallet Connected Successfully!**

🏦 **Wallet Address:** ${testResult.address}
💰 **TON Balance:** ${testResult.balance} TON

**Status:** Ready for automated withdrawals
**Network:** TON Mainnet
        `, { parse_mode: 'Markdown' });
      } else {
        this.bot.sendMessage(chatId, `
❌ **Wallet Connection Failed**

**Error:** ${testResult.error}

Please check:
• Mnemonic phrase has exactly 24 words
• All words are valid BIP39 words
• No extra spaces or special characters
        `);
      }
    } catch (error) {
      console.error('Error in handleTestWallet:', error);
      this.bot.sendMessage(chatId, '❌ Error testing wallet. Please try again.');
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

      // Campaign creation conversation callbacks
      if (data === 'cancel_campaign_creation') {
        campaignCreationStates.delete(telegramId);
        this.bot.editMessageText('❌ Campaign creation cancelled.', {
          chat_id: msg.chat.id,
          message_id: msg.message_id
        });
      }

      if (data === 'skip_description') {
        await this.handleDescriptionStep(msg.chat.id, telegramId, 'skip', campaignCreationStates.get(telegramId)!);
      }

      if (data.startsWith('reward_')) {
        const amount = data.replace('reward_', '');
        await this.handleRewardStep(msg.chat.id, telegramId, amount, campaignCreationStates.get(telegramId)!);
      }

      if (data.startsWith('slots_')) {
        const slots = data.replace('slots_', '');
        await this.handleSlotsStep(msg.chat.id, telegramId, slots, campaignCreationStates.get(telegramId)!);
      }

      if (data === 'confirm_campaign_creation') {
        await this.finalizeCampaignCreation(msg.chat.id, telegramId);
      }

      // Back navigation handlers
      if (data === 'back_to_title') {
        const state = campaignCreationStates.get(telegramId);
        if (state) {
          state.step = 'title';
          campaignCreationStates.set(telegramId, state);
          await this.handlePlatformCampaignCreation(msg.chat.id, telegramId, state.platform!);
        }
      }

      if (data === 'back_to_description') {
        const state = campaignCreationStates.get(telegramId);
        if (state) {
          state.step = 'description';
          campaignCreationStates.set(telegramId, state);
          await this.handleTitleStep(msg.chat.id, telegramId, state.title!, state);
        }
      }

      if (data === 'back_to_reward') {
        const state = campaignCreationStates.get(telegramId);
        if (state) {
          state.step = 'reward';
          campaignCreationStates.set(telegramId, state);
          await this.handleDescriptionStep(msg.chat.id, telegramId, state.description || 'skip', state);
        }
      }

      if (data === 'back_to_slots') {
        const state = campaignCreationStates.get(telegramId);
        if (state) {
          state.step = 'slots';
          campaignCreationStates.set(telegramId, state);
          await this.handleRewardStep(msg.chat.id, telegramId, state.reward!.toString(), state);
        }
      }

      if (data === 'back_to_url') {
        const state = campaignCreationStates.get(telegramId);
        if (state) {
          state.step = 'url';
          campaignCreationStates.set(telegramId, state);
          await this.handleSlotsStep(msg.chat.id, telegramId, state.slots!.toString(), state);
        }
      }
      
      if (data.startsWith('platform_')) {
        const platform = data.replace('platform_', '');
        await this.showCampaignsByPlatform(msg.chat.id, platform);
      }

      if (data === 'back_to_platforms') {
        await this.handleAvailableCampaigns(msg.chat.id, telegramId);
      }

      if (data.startsWith('join_campaign_')) {
        const campaignId = data.replace('join_campaign_', '');
        await this.handleJoinCampaign(msg.chat.id, telegramId, campaignId);
      }

      if (data.startsWith('claim_task_')) {
        const campaignId = data.replace('claim_task_', '');
        await this.handleClaimTask(msg.chat.id, telegramId, campaignId);
      }

      if (data.startsWith('submit_proof_')) {
        const submissionId = data.replace('submit_proof_', '');
        await this.handleSubmitProofPrompt(msg.chat.id, telegramId, submissionId);
      }

      if (data.startsWith('approve_submission_')) {
        const submissionId = data.replace('approve_submission_', '');
        await this.handleApproveSubmission(msg.chat.id, telegramId, submissionId);
      }

      if (data.startsWith('reject_submission_')) {
        const submissionId = data.replace('reject_submission_', '');
        await this.handleRejectSubmission(msg.chat.id, telegramId, submissionId);
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
      let buttons: any[] = [];
      
      campaigns.slice(0, 10).forEach((campaign, index) => {
        const progress = ((campaign.totalSlots - campaign.availableSlots) / campaign.totalSlots) * 100;
        message += `${index + 1}. **${campaign.title}**\n`;
        message += `📝 ${campaign.description || 'No description'}\n`;
        message += `💰 Reward: ${campaign.rewardAmount} USDT per task\n`;
        message += `📊 Slots: ${campaign.availableSlots}/${campaign.totalSlots} available\n`;
        message += `📈 Progress: ${progress.toFixed(1)}%\n`;
        message += `🔗 URL: ${campaign.taskUrl || 'No URL provided'}\n\n`;
        
        // Add participation button for each campaign
        if (campaign.availableSlots > 0) {
          buttons.push([{ 
            text: `🎯 Join Campaign: ${campaign.title.substring(0, 20)}${campaign.title.length > 20 ? '...' : ''}`, 
            callback_data: `join_campaign_${campaign.id}` 
          }]);
        }
      });

      if (campaigns.length > 10) {
        message += `... and ${campaigns.length - 10} more campaigns\n\n`;
      }

      this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: buttons.length > 0 ? [
            ...buttons,
            [{ text: '🔙 Back to Platforms', callback_data: 'back_to_platforms' }]
          ] : [
            [{ text: '🔙 Back to Platforms', callback_data: 'back_to_platforms' }]
          ]
        }
      });
      
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
        // Store the user ID for custom withdrawal amount input
        awaitingWithdrawalAmount.set(telegramId, userId);
        this.bot.sendMessage(chatId, 'Please enter the amount you want to withdraw (minimum 0.020 USDT):');
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

  private async handleJoinCampaign(chatId: number, telegramId: string, campaignId: string) {
    try {
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        this.bot.sendMessage(chatId, '❌ Campaign not found.');
        return;
      }

      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        this.bot.sendMessage(chatId, '❌ Please register first using /start');
        return;
      }

      // Check if user already has an active submission for this campaign
      const existingSubmission = await storage.getTaskSubmissionByCampaignAndUser(campaignId, user.id);
      if (existingSubmission) {
        // Only prevent if currently claimed or submitted (allow repeat participation for completed/rejected tasks)
        if (existingSubmission.status === 'claimed') {
          const timeLeft = Math.max(0, Math.floor((new Date(existingSubmission.expiresAt!).getTime() - Date.now()) / (1000 * 60 * 60)));
          this.bot.sendMessage(chatId, `⏳ You already claimed this task! You have ${timeLeft} hours left to submit proof.`);
          this.bot.sendMessage(chatId, '📤 Ready to submit proof?', {
            reply_markup: {
              inline_keyboard: [[
                { text: '📤 Submit Proof', callback_data: `submit_proof_${existingSubmission.id}` }
              ]]
            }
          });
          return;
        }
        if (existingSubmission.status === 'submitted') {
          this.bot.sendMessage(chatId, '📋 You already submitted proof for this task. Waiting for approval.');
          return;
        }
        // Allow participation again for approved, rejected, or expired tasks
      }

      // Show campaign details with claim button
      let message = `🎯 **${campaign.title}**\n\n`;
      message += `📝 ${campaign.description || 'No description'}\n`;
      message += `🔗 **Task URL:** ${campaign.taskUrl}\n`;
      message += `💰 **Reward:** ${campaign.rewardAmount} USDT\n`;
      message += `📊 **Slots Available:** ${campaign.availableSlots}/${campaign.totalSlots}\n`;
      message += `🌐 **Platform:** ${campaign.platform.toUpperCase()}\n\n`;
      message += `**Instructions:**\n`;
      message += `1. Click "Claim Task" to reserve your slot (24-hour timer starts)\n`;
      message += `2. Complete the task at the provided URL\n`;
      message += `3. Submit proof (screenshot/link) before timer expires\n`;
      message += `4. Wait for campaign creator approval\n`;
      message += `5. Receive USDT reward upon approval\n`;

      const buttons = [];
      if (campaign.availableSlots > 0) {
        buttons.push([{ text: '🎯 Claim Task (24h Timer)', callback_data: `claim_task_${campaignId}` }]);
      } else {
        message += `\n❌ **No slots available**`;
      }
      buttons.push([{ text: '🔙 Back to Campaigns', callback_data: `platform_${campaign.platform}` }]);

      this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
      });

    } catch (error) {
      console.error('Error handling join campaign:', error);
      this.bot.sendMessage(chatId, '❌ Error loading campaign. Please try again.');
    }
  }

  private async handleClaimTask(chatId: number, telegramId: string, campaignId: string) {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        this.bot.sendMessage(chatId, '❌ Please register first using /start');
        return;
      }

      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        this.bot.sendMessage(chatId, '❌ Campaign not found.');
        return;
      }

      if (campaign.availableSlots <= 0) {
        this.bot.sendMessage(chatId, '❌ No slots available for this campaign.');
        return;
      }

      // Check for existing active submission (only prevent if claimed or submitted)
      const existingSubmission = await storage.getTaskSubmissionByCampaignAndUser(campaignId, user.id);
      if (existingSubmission && (existingSubmission.status === 'claimed' || existingSubmission.status === 'submitted')) {
        this.bot.sendMessage(chatId, '❌ You already have an active submission for this campaign.');
        return;
      }

      // Create task submission with claimed status
      const submission = await storage.createTaskSubmission({
        campaignId,
        userId: user.id,
        status: 'claimed'
      });

      // Update available slots
      await storage.updateCampaignSlots(campaignId, campaign.availableSlots - 1);

      // Calculate expiry time
      const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const expiryTimeStr = expiryTime.toLocaleString();

      this.bot.sendMessage(chatId, `
🎉 **Task Claimed Successfully!**

⏰ **Timer Started:** 24 hours to complete
⏳ **Expires:** ${expiryTimeStr}
🎯 **Campaign:** ${campaign.title}
🔗 **Task URL:** ${campaign.taskUrl}

**Next Steps:**
1. Complete the task at the provided URL
2. Take a screenshot or get proof link
3. Submit your proof before the timer expires

**Important:** If you don't submit proof within 24 hours, your slot will be given to another participant!
      `, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '📤 Submit Proof Now', callback_data: `submit_proof_${submission.id}` }
          ]]
        }
      });

    } catch (error) {
      console.error('Error claiming task:', error);
      this.bot.sendMessage(chatId, '❌ Error claiming task. Please try again.');
    }
  }

  private async handleSubmitProofPrompt(chatId: number, telegramId: string, submissionId: string) {
    try {
      const submission = await storage.getSubmission(submissionId);
      if (!submission) {
        this.bot.sendMessage(chatId, '❌ Submission not found.');
        return;
      }

      const user = await storage.getUserByTelegramId(telegramId);
      if (!user || submission.userId !== user.id) {
        this.bot.sendMessage(chatId, '❌ Unauthorized access.');
        return;
      }

      if (submission.status !== 'claimed') {
        this.bot.sendMessage(chatId, '❌ This task is not in claimable state.');
        return;
      }

      // Check if expired
      if (new Date() > new Date(submission.expiresAt!)) {
        await storage.updateSubmissionStatus(submissionId, 'expired');
        this.bot.sendMessage(chatId, '⏰ This task has expired. The slot has been returned to the pool.');
        return;
      }

      // Store the submission ID for proof upload
      this.awaitingProofSubmission.set(telegramId, submissionId);

      this.bot.sendMessage(chatId, `
📤 **Submit Your Proof**

Please send a **screenshot image** showing task completion:
• 📸 **Screenshot** - Upload an image showing the completed task
• ✅ **Examples**: Screenshot of liked post, followed account, shared content, etc.

**Important:** Only image files are accepted as proof.

Send your screenshot now:
      `);

    } catch (error) {
      console.error('Error handling submit proof prompt:', error);
      this.bot.sendMessage(chatId, '❌ Error processing request. Please try again.');
    }
  }

  private async handleApproveSubmission(chatId: number, telegramId: string, submissionId: string) {
    try {
      const submission = await storage.getSubmission(submissionId);
      if (!submission) {
        this.bot.sendMessage(chatId, '❌ Submission not found.');
        return;
      }

      const campaign = await storage.getCampaign(submission.campaignId);
      if (!campaign) {
        this.bot.sendMessage(chatId, '❌ Campaign not found.');
        return;
      }

      const creator = await storage.getUserByTelegramId(telegramId);
      if (!creator || campaign.creatorId !== creator.id) {
        this.bot.sendMessage(chatId, '❌ Only campaign creators can approve submissions.');
        return;
      }

      if (submission.status !== 'submitted') {
        this.bot.sendMessage(chatId, '❌ This submission cannot be approved.');
        return;
      }

      // Approve the submission
      await storage.updateSubmissionStatus(submissionId, 'approved');

      // Get the participant user
      const participant = await storage.getUser(submission.userId);
      if (participant) {
        // Add reward to participant balance
        const newBalance = parseFloat(participant.balance) + parseFloat(campaign.rewardAmount);
        await storage.updateUserBalance(participant.id, newBalance.toString());

        // Create reward transaction
        await storage.createTransaction({
          userId: participant.id,
          type: 'reward',
          amount: campaign.rewardAmount,
          status: 'completed',
          campaignId: campaign.id
        });

        // Notify participant
        if (participant.telegramId) {
          this.bot.sendMessage(parseInt(participant.telegramId), `
🎉 **Submission Approved!**

✅ Your submission for "${campaign.title}" has been approved!
💰 **Reward:** ${campaign.rewardAmount} USDT added to your balance
📊 **New Balance:** ${newBalance.toFixed(8)} USDT

Great work! 🚀
          `);
        }
      }

      this.bot.sendMessage(chatId, `
✅ **Submission Approved**

The participant will receive ${campaign.rewardAmount} USDT as reward.
      `);

    } catch (error) {
      console.error('Error approving submission:', error);
      this.bot.sendMessage(chatId, '❌ Error approving submission. Please try again.');
    }
  }

  private async handleRejectSubmission(chatId: number, telegramId: string, submissionId: string) {
    try {
      const submission = await storage.getSubmission(submissionId);
      if (!submission) {
        this.bot.sendMessage(chatId, '❌ Submission not found.');
        return;
      }

      const campaign = await storage.getCampaign(submission.campaignId);
      if (!campaign) {
        this.bot.sendMessage(chatId, '❌ Campaign not found.');
        return;
      }

      const creator = await storage.getUserByTelegramId(telegramId);
      if (!creator || campaign.creatorId !== creator.id) {
        this.bot.sendMessage(chatId, '❌ Only campaign creators can reject submissions.');
        return;
      }

      if (submission.status !== 'submitted') {
        this.bot.sendMessage(chatId, '❌ This submission cannot be rejected.');
        return;
      }

      // Reject the submission
      await storage.updateSubmissionStatus(submissionId, 'rejected');

      // Return slot to the campaign
      await storage.updateCampaignSlots(campaign.id, campaign.availableSlots + 1);

      // Get the participant user
      const participant = await storage.getUser(submission.userId);
      if (participant && participant.telegramId) {
        // Notify participant
        this.bot.sendMessage(parseInt(participant.telegramId), `
❌ **Submission Rejected**

Your submission for "${campaign.title}" has been rejected.

**Reason:** Invalid proof, duplicate content, or didn't follow instructions.

You can try participating in other campaigns. Make sure to follow all requirements carefully.
        `);
      }

      this.bot.sendMessage(chatId, `
❌ **Submission Rejected**

The slot has been returned to the campaign pool.
      `);

    } catch (error) {
      console.error('Error rejecting submission:', error);
      this.bot.sendMessage(chatId, '❌ Error rejecting submission. Please try again.');
    }
  }

  private awaitingProofSubmission = new Map<string, string>(); // telegramId -> submissionId

  private async handleCustomWithdrawalAmount(chatId: number, telegramId: string, userId: string, text: string) {
    try {
      const amount = parseFloat(text);
      
      if (isNaN(amount) || amount <= 0) {
        this.bot.sendMessage(chatId, '❌ Please enter a valid number greater than 0 (e.g., 0.025)');
        return;
      }

      if (amount < 0.020) {
        this.bot.sendMessage(chatId, '❌ Minimum withdrawal amount is 0.020 USDT. Please enter a higher amount.');
        return;
      }

      const user = await storage.getUser(userId);
      if (!user) {
        this.bot.sendMessage(chatId, '❌ User not found.');
        awaitingWithdrawalAmount.delete(telegramId);
        return;
      }

      const balance = parseFloat(user.balance);
      if (amount > balance) {
        this.bot.sendMessage(chatId, `❌ Insufficient balance. You have ${balance} USDT available.`);
        return;
      }

      // Clear the awaiting state
      awaitingWithdrawalAmount.delete(telegramId);

      // Process the custom withdrawal
      const fee = amount * 0.01;
      const finalAmount = amount - fee;

      // Create withdrawal record
      const withdrawal = await storage.createWithdrawal({
        userId: user.id,
        amount: finalAmount.toString(),
        fee: fee.toString(),
        destinationWallet: user.walletAddress,
        status: 'pending'
      });

      // Update user balance
      const newBalance = balance - amount;
      await storage.updateUserBalance(user.id, newBalance.toString());

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
      console.error('Error processing custom withdrawal:', error);
      this.bot.sendMessage(chatId, '❌ Error processing withdrawal. Please try again.');
      awaitingWithdrawalAmount.delete(telegramId);
    }
  }

  public start() {
    console.log('TaskBot started successfully!');
    this.setupCallbackHandlers();
    this.setupProofSubmissionHandler();
  }

  private setupProofSubmissionHandler() {
    // Handle proof submissions (text messages and photos)
    this.bot.on('message', async (msg) => {
      const telegramId = msg.from?.id.toString();
      if (!telegramId || !this.awaitingProofSubmission.has(telegramId)) {
        return;
      }

      const submissionId = this.awaitingProofSubmission.get(telegramId)!;
      let proofUrl = '';
      let notes = '';

      try {
        if (msg.photo) {
          // Handle photo submission
          const photo = msg.photo[msg.photo.length - 1]; // Get highest resolution
          const fileLink = await this.bot.getFileLink(photo.file_id);
          proofUrl = fileLink;
          notes = msg.caption || '';
        } else {
          this.bot.sendMessage(msg.chat.id, '❌ Please send a screenshot image as proof. Text and links are not accepted.');
          return;
        }

        // Update submission with proof
        const submission = await storage.updateSubmissionProof(submissionId, proofUrl, notes);
        
        // Clear the awaiting state
        this.awaitingProofSubmission.delete(telegramId);

        // Get campaign and creator info
        const campaign = await storage.getCampaign(submission.campaignId);
        if (campaign) {
          const creator = await storage.getUser(campaign.creatorId);
          
          // Notify creator about new submission
          if (creator && creator.telegramId) {
            this.bot.sendMessage(parseInt(creator.telegramId), `
📋 **New Submission for Review**

🎯 **Campaign:** ${campaign.title}
👤 **Participant:** User #${submission.userId.substring(0, 8)}...
📤 **Proof:** ${proofUrl.length > 100 ? proofUrl.substring(0, 100) + '...' : proofUrl}
${notes ? `📝 **Notes:** ${notes}` : ''}

Please review and approve or reject:
            `, {
              reply_markup: {
                inline_keyboard: [[
                  { text: '✅ Approve', callback_data: `approve_submission_${submission.id}` },
                  { text: '❌ Reject', callback_data: `reject_submission_${submission.id}` }
                ]]
              }
            });
          }
        }

        this.bot.sendMessage(msg.chat.id, `
✅ **Proof Submitted Successfully!**

Your submission has been sent to the campaign creator for review.
You'll be notified once it's approved or rejected.

📋 **What you submitted:**
${proofUrl}
${notes ? `\n📝 **Notes:** ${notes}` : ''}
        `);

      } catch (error) {
        console.error('Error handling proof submission:', error);
        this.bot.sendMessage(msg.chat.id, '❌ Error submitting proof. Please try again.');
      }
    });
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