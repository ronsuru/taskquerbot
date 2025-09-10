#!/usr/bin/env node

/**
 * Test Dashboard Buttons
 * Send a test message with dashboard buttons to verify interactive features
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDashboardButtons() {
  console.log('📊 Testing Dashboard Interactive Buttons...\n');

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  
  if (!botToken || !adminId) {
    console.error('❌ Missing TELEGRAM_BOT_TOKEN or ADMIN_TELEGRAM_ID');
    process.exit(1);
  }

  try {
    const testMessage = `
📊 **Dashboard Test**

This message tests the interactive dashboard buttons functionality.

Click the buttons below to explore the dashboard:
    `;

    const keyboard = {
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
      console.log('✅ Dashboard test message with buttons sent successfully!');
      console.log('📱 Check your Telegram (@taskquer_bot) for the interactive dashboard message');
      console.log('🔘 Try clicking the dashboard buttons to test functionality');
      console.log('📊 Each button should show more interactive options!');
    } else {
      console.error('❌ Failed to send test message:', data.description);
    }

  } catch (error) {
    console.error('❌ Error sending test message:', error.message);
  }
}

// Run the test
testDashboardButtons();
