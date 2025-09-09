#!/usr/bin/env node

/**
 * Check Telegram Bot Status
 * This will check if the bot is running without conflicts
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkBotStatus() {
  console.log('🤖 Checking Telegram Bot Status...\n');

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in .env file');
    process.exit(1);
  }

  try {
    // Get bot info
    const botResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botData = await botResponse.json();
    
    if (botData.ok) {
      console.log('✅ Bot is active and accessible');
      console.log(`   - Name: ${botData.result.first_name}`);
      console.log(`   - Username: @${botData.result.username}`);
    } else {
      console.error('❌ Bot is not accessible:', botData.description);
      process.exit(1);
    }

    // Check webhook status
    const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const webhookData = await webhookResponse.json();
    
    if (webhookData.ok) {
      const webhookInfo = webhookData.result;
      console.log('\n📊 Webhook Status:');
      console.log(`   - URL: ${webhookInfo.url || 'Not set (using polling)'}`);
      console.log(`   - Pending updates: ${webhookInfo.pending_update_count}`);
      console.log(`   - Last error: ${webhookInfo.last_error_message || 'None'}`);
      
      if (webhookInfo.url) {
        console.log('⚠️  Webhook is set - this might cause polling conflicts');
        console.log('   Consider clearing the webhook if you want to use polling mode');
      } else {
        console.log('✅ Using polling mode (no webhook conflicts)');
      }
    }

    // Check if there are any pending updates
    const updatesResponse = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=1`);
    const updatesData = await updatesResponse.json();
    
    if (updatesData.ok) {
      console.log(`\n📨 Pending updates: ${updatesData.result.length}`);
      if (updatesData.result.length > 0) {
        console.log('ℹ️  There are pending updates - bot should process them soon');
      } else {
        console.log('✅ No pending updates - bot is ready');
      }
    }

    console.log('\n🎉 Bot status check completed!');
    console.log('📋 If you see polling errors, they should resolve automatically with the new error handling');

  } catch (error) {
    console.error('\n❌ Error checking bot status:', error.message);
    process.exit(1);
  }
}

// Run the check
checkBotStatus();
