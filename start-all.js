#!/usr/bin/env node

/**
 * Start All Services Script
 * This will start the web server and bot separately to avoid conflicts
 */

import { spawn } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 Starting TaskBot Services...\n');

// Check if required environment variables are set
const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'DATABASE_URL',
  'GOOGLE_CLOUD_PROJECT_ID',
  'ADMIN_TELEGRAM_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease check your .env file');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('🌐 Starting web server...\n');

// Start the web server
const webServer = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true
});

webServer.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('serving on port')) {
    console.log('✅ Web server started successfully!');
    console.log('📱 Starting Telegram bot...\n');
    
    // Start the bot after web server is ready
    setTimeout(() => {
      const bot = spawn('npm', ['run', 'bot'], {
        stdio: 'pipe',
        shell: true
      });
      
      bot.stdout.on('data', (data) => {
        console.log(`🤖 Bot: ${data.toString().trim()}`);
      });
      
      bot.stderr.on('data', (data) => {
        console.error(`🤖 Bot Error: ${data.toString().trim()}`);
      });
      
      bot.on('close', (code) => {
        console.log(`🤖 Bot process exited with code ${code}`);
      });
      
      // Handle Ctrl+C
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down services...');
        webServer.kill();
        bot.kill();
        process.exit(0);
      });
      
    }, 3000);
  }
});

webServer.stderr.on('data', (data) => {
  console.error(`Web Server Error: ${data.toString().trim()}`);
});

webServer.on('close', (code) => {
  console.log(`Web server process exited with code ${code}`);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down services...');
  webServer.kill();
  process.exit(0);
});

console.log('📋 Services starting...');
console.log('   - Web Server: http://localhost:5000');
console.log('   - Telegram Bot: @taskquer_bot');
console.log('\n🛑 Press Ctrl+C to stop all services\n');
