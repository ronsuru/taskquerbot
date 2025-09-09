#!/usr/bin/env node

/**
 * Environment Variables Test Script
 * Run this to check if your .env file is being loaded correctly
 */

import dotenv from 'dotenv';

console.log('🧪 Testing Environment Variables...\n');

// Load environment variables
const result = dotenv.config();

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  process.exit(1);
}

console.log('✅ .env file loaded successfully');

// Check critical environment variables
const criticalVars = [
  'DATABASE_URL',
  'NODE_ENV',
  'GOOGLE_CLOUD_PROJECT_ID',
  'TELEGRAM_BOT_TOKEN',
  'TON_API_KEY',
  'MNEMONIC_WALLET_KEY'
];

console.log('\n📋 Environment Variables Status:');
criticalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

// Check if DATABASE_URL is properly formatted
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  if (databaseUrl.startsWith('postgresql://')) {
    console.log('\n✅ DATABASE_URL format looks correct');
  } else {
    console.log('\n⚠️  DATABASE_URL format might be incorrect (should start with postgresql://)');
  }
} else {
  console.log('\n❌ DATABASE_URL is missing - this will cause the app to fail');
}

console.log('\n📁 Current working directory:', process.cwd());
console.log('📄 .env file path:', process.cwd() + '\\.env');
