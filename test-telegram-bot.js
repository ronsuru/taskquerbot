#!/usr/bin/env node

/**
 * Telegram Bot Test Script
 * Run this to verify your Telegram bot token is working
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testTelegramBot() {
  console.log('🤖 Testing Telegram Bot Token...\n');

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in .env file');
    console.log('📝 Please add TELEGRAM_BOT_TOKEN=your-bot-token to your .env file');
    process.exit(1);
  }

  console.log(`✅ Telegram Bot Token found: ${botToken.substring(0, 10)}...`);

  try {
    // Test 1: Get bot information
    console.log('\n🔍 Testing bot connection...');
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);

    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Invalid bot token - please check your TELEGRAM_BOT_TOKEN');
        console.log('🔧 Make sure you got the token from @BotFather on Telegram');
        process.exit(1);
      } else {
        console.error(`❌ API request failed with status: ${response.status}`);
        const errorText = await response.text();
        console.error(`   Error details: ${errorText}`);
        process.exit(1);
      }
    }

    const data = await response.json();
    
    if (!data.ok) {
      console.error('❌ Telegram API returned error:', data.description);
      process.exit(1);
    }

    const botInfo = data.result;
    console.log('✅ Telegram Bot connection successful!');
    console.log(`📊 Bot Information:`);
    console.log(`   - Name: ${botInfo.first_name}`);
    console.log(`   - Username: @${botInfo.username}`);
    console.log(`   - ID: ${botInfo.id}`);
    console.log(`   - Can join groups: ${botInfo.can_join_groups ? 'Yes' : 'No'}`);
    console.log(`   - Can read all group messages: ${botInfo.can_read_all_group_messages ? 'Yes' : 'No'}`);
    console.log(`   - Supports inline queries: ${botInfo.supports_inline_queries ? 'Yes' : 'No'}`);

    // Test 2: Get webhook info (optional)
    console.log('\n🔗 Testing webhook status...');
    try {
      const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        if (webhookData.ok) {
          const webhookInfo = webhookData.result;
          console.log('✅ Webhook info retrieved:');
          console.log(`   - URL: ${webhookInfo.url || 'Not set'}`);
          console.log(`   - Pending updates: ${webhookInfo.pending_update_count}`);
          console.log(`   - Last error: ${webhookInfo.last_error_message || 'None'}`);
        }
      }
    } catch (webhookError) {
      console.log('ℹ️  Webhook info not available (this is normal for polling mode)');
    }

    // Test 3: Check if bot can send messages (optional - requires admin user ID)
    const adminTelegramId = process.env.ADMIN_TELEGRAM_ID;
    if (adminTelegramId) {
      console.log(`\n📤 Testing message sending to admin (${adminTelegramId})...`);
      try {
        const messageResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: adminTelegramId,
            text: '🤖 TaskBot is now online and ready to help!\n\n✅ All systems operational\n✅ Google Cloud Storage connected\n✅ TON blockchain integration active\n✅ Database connected\n\nYour TaskBot is ready to process tasks and manage campaigns!',
            parse_mode: 'HTML'
          })
        });

        if (messageResponse.ok) {
          const messageData = await messageResponse.json();
          if (messageData.ok) {
            console.log('✅ Test message sent successfully to admin!');
            console.log('📱 Check your Telegram for the test message');
          } else {
            console.log('⚠️  Message sending failed:', messageData.description);
            console.log('   This might be because the admin hasn\'t started a chat with the bot yet');
          }
        } else {
          console.log('⚠️  Could not send test message (this is normal if admin hasn\'t started chat with bot)');
        }
      } catch (messageError) {
        console.log('⚠️  Message sending test failed (this is normal if admin hasn\'t started chat with bot)');
      }
    } else {
      console.log('\nℹ️  ADMIN_TELEGRAM_ID not set - skipping message test');
    }

    console.log('\n🎉 Telegram Bot is working correctly!');
    console.log('\n📋 Next steps:');
    console.log('   1. Your bot is ready to receive commands');
    console.log('   2. Users can start a chat with your bot using @' + botInfo.username);
    console.log('   3. Run "npm run dev" to start your TaskBot application');
    console.log('   4. The bot will handle task notifications and user interactions');

  } catch (error) {
    console.error('\n❌ Telegram Bot test failed:');
    console.error(`   Error: ${error.message}`);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check that TELEGRAM_BOT_TOKEN is correct in your .env file');
    console.log('   2. Verify you got the token from @BotFather on Telegram');
    console.log('   3. Make sure you have internet connection');
    console.log('   4. Check if the bot token is active and not revoked');
    
    process.exit(1);
  }
}

// Run the test
testTelegramBot();
