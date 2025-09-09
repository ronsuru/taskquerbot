#!/usr/bin/env node

/**
 * Test Bot Message
 * Send a test message to the bot to verify it's working
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testBotMessage() {
  console.log('📱 Testing Telegram Bot Message...\n');

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  
  if (!botToken || !adminId) {
    console.error('❌ Missing TELEGRAM_BOT_TOKEN or ADMIN_TELEGRAM_ID');
    process.exit(1);
  }

  try {
    const testMessage = `
🤖 Bot Test Message

✅ Bot is working correctly!
🌐 Web App: http://localhost:5000
⏰ Time: ${new Date().toLocaleString()}

This message confirms that:
- Bot is running without conflicts
- Polling is working properly
- Messages are being processed

🎉 Your TaskBot is fully operational!
    `;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: adminId,
        text: testMessage,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Test message sent successfully!');
      console.log(`📱 Check your Telegram (@taskquer_bot) for the test message`);
    } else {
      console.error('❌ Failed to send test message:', data.description);
    }

  } catch (error) {
    console.error('❌ Error sending test message:', error.message);
  }
}

// Run the test
testBotMessage();
