#!/usr/bin/env node

/**
 * TON API Test Script
 * Run this to verify your TON API key is working
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testTonApi() {
  console.log('🧪 Testing TON API Key...\n');

  const apiKey = process.env.TON_API_KEY;
  
  if (!apiKey) {
    console.error('❌ TON_API_KEY not found in .env file');
    console.log('📝 Please add TON_API_KEY=your-key-here to your .env file');
    process.exit(1);
  }

  console.log(`✅ TON API Key found: ${apiKey.substring(0, 8)}...`);

  try {
    // Test 1: Get account info (this is a simple API call)
    console.log('\n🔍 Testing API connection...');
    
    const response = await fetch('https://tonapi.io/v2/accounts/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Invalid API key - please check your TON_API_KEY');
        process.exit(1);
      } else if (response.status === 429) {
        console.error('❌ Rate limit exceeded - your API key may have reached its limit');
        process.exit(1);
      } else {
        console.error(`❌ API request failed with status: ${response.status}`);
        process.exit(1);
      }
    }

    const data = await response.json();
    console.log('✅ TON API connection successful!');
    console.log(`📊 Account info retrieved for: ${data.address}`);

    // Test 2: Get blockchain info
    console.log('\n⛓️ Testing blockchain info...');
    const blockchainResponse = await fetch('https://tonapi.io/v2/blockchain/info', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (blockchainResponse.ok) {
      const blockchainData = await blockchainResponse.json();
      console.log('✅ Blockchain info retrieved successfully!');
      console.log(`📈 Current block: ${blockchainData.last_block?.seqno || 'Unknown'}`);
    }

    console.log('\n🎉 TON API key is working correctly!');
    console.log('\n📋 Next steps:');
    console.log('   1. Your TON API key is configured correctly');
    console.log('   2. You can now run "npm run dev" to start your application');
    console.log('   3. The TaskBot will be able to verify TON transactions');

  } catch (error) {
    console.error('\n❌ TON API test failed:');
    console.error(`   Error: ${error.message}`);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check that TON_API_KEY is correct in your .env file');
    console.log('   2. Verify you have internet connection');
    console.log('   3. Make sure your API key is active and not expired');
    console.log('   4. Check if you have reached your API rate limits');
    
    process.exit(1);
  }
}

// Run the test
testTonApi();
