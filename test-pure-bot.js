#!/usr/bin/env node

/**
 * Test Pure Telegram Bot
 * Test all functionality of the pure Telegram bot
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPureBot() {
  console.log('🤖 Testing Pure Telegram Bot...\n');

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  
  if (!botToken || !adminId) {
    console.error('❌ Missing TELEGRAM_BOT_TOKEN or ADMIN_TELEGRAM_ID');
    process.exit(1);
  }

  try {
    const testMessage = `
🤖 **Pure Telegram Bot Test**

This is a comprehensive test of the pure Telegram bot functionality.

**Features Tested:**
🔹 Task Management
🔹 Campaign Creation
🔹 User Balance
🔹 Admin Panel
🔹 Profile Management

**All features run directly in Telegram - no web app required!**
    `;

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
            { text: '🎯 Create Campaign', callback_data: 'create_campaign' },
            { text: '⚙️ Admin Panel', callback_data: 'admin_panel' }
          ],
          [
            { text: 'ℹ️ Help', callback_data: 'help' }
          ]
        ]
      }
    };

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: adminId,
        text: testMessage,
        parse_mode: 'Markdown',
        ...keyboard
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Pure bot test message sent successfully!');
      console.log('📱 Check your Telegram (@taskquer_bot) for the interactive message');
      console.log('🔘 Try clicking the buttons to test all functionality');
      console.log('🎯 Test campaign creation by clicking "Create Campaign"');
      console.log('📋 Test task completion by clicking "View Tasks"');
      console.log('💰 Test balance checking by clicking "My Balance"');
    } else {
      console.error('❌ Failed to send test message:', data.description);
    }

  } catch (error) {
    console.error('❌ Error sending test message:', error.message);
  }
}

// Run the test
testPureBot();
