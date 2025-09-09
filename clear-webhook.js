#!/usr/bin/env node

/**
 * Clear Telegram Webhook Script
 * This will clear any existing webhook to prevent conflicts
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function clearWebhook() {
  console.log('🧹 Clearing Telegram webhook...\n');

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in .env file');
    process.exit(1);
  }

  try {
    // Clear webhook
    const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        drop_pending_updates: true
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Webhook cleared successfully');
      console.log('✅ Pending updates dropped');
    } else {
      console.log('ℹ️  No webhook was set (this is normal)');
    }

    // Get webhook info to confirm
    const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const webhookData = await webhookResponse.json();
    
    if (webhookData.ok) {
      const webhookInfo = webhookData.result;
      console.log('\n📊 Current webhook status:');
      console.log(`   - URL: ${webhookInfo.url || 'Not set'}`);
      console.log(`   - Pending updates: ${webhookInfo.pending_update_count}`);
    }

    console.log('\n🎉 Telegram bot is ready for polling mode!');
    console.log('📋 You can now start your application without conflicts');

  } catch (error) {
    console.error('\n❌ Error clearing webhook:', error.message);
    process.exit(1);
  }
}

// Run the script
clearWebhook();
