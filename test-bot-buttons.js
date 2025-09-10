#!/usr/bin/env node

/**
 * Test Bot Buttons
 * Send a test message with buttons to verify interactive features
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testBotButtons() {
  console.log('🔘 Testing Telegram Bot Buttons...\n');

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  
  if (!botToken || !adminId) {
    console.error('❌ Missing TELEGRAM_BOT_TOKEN or ADMIN_TELEGRAM_ID');
    process.exit(1);
  }

  try {
    const testMessage = `
🔘 **Button Test**

This message tests the interactive buttons functionality.

Click the buttons below to test:
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
            { text: '🌐 Web App', url: 'http://localhost:5000' }
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
      console.log('✅ Test message with buttons sent successfully!');
      console.log('📱 Check your Telegram (@taskquer_bot) for the interactive message');
      console.log('🔘 Try clicking the buttons to test functionality');
    } else {
      console.error('❌ Failed to send test message:', data.description);
    }

  } catch (error) {
    console.error('❌ Error sending test message:', error.message);
  }
}

// Run the test
testBotButtons();
