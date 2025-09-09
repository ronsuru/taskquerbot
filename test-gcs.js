#!/usr/bin/env node

/**
 * Google Cloud Storage Test Script
 * Run this to verify your GCS setup is working correctly
 */

import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGoogleCloudStorage() {
  console.log('🧪 Testing Google Cloud Storage Setup...\n');

  try {
    // Initialize Storage client
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      // If using service account JSON in environment variable
      ...(process.env.GOOGLE_SERVICE_ACCOUNT_KEY && {
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      }),
    });

    console.log('✅ Storage client initialized successfully');

    // Test 1: List buckets
    console.log('\n📁 Testing bucket access...');
    const [buckets] = await storage.getBuckets();
    console.log(`✅ Found ${buckets.length} bucket(s):`);
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name}`);
    });

    // Test 2: Test file upload (if buckets exist)
    if (buckets.length > 0) {
      const bucketName = buckets[0].name;
      const fileName = `test-${Date.now()}.txt`;
      const fileContent = 'Hello from TaskBot! This is a test file.';

      console.log(`\n📤 Testing file upload to bucket: ${bucketName}`);
      
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(fileName);
      
      await file.save(fileContent, {
        metadata: {
          contentType: 'text/plain',
        },
      });

      console.log(`✅ File uploaded successfully: ${fileName}`);

      // Test 3: Test file download
      console.log('\n📥 Testing file download...');
      const [contents] = await file.download();
      console.log(`✅ File downloaded successfully. Content: "${contents.toString()}"`);

      // Test 4: Clean up test file
      console.log('\n🧹 Cleaning up test file...');
      await file.delete();
      console.log(`✅ Test file deleted: ${fileName}`);
    }

    console.log('\n🎉 All tests passed! Google Cloud Storage is configured correctly.');
    console.log('\n📋 Next steps:');
    console.log('   1. Make sure your .env file has all required variables');
    console.log('   2. Run "npm run dev" to start your application');
    console.log('   3. Test file uploads through the TaskBot interface');

  } catch (error) {
    console.error('\n❌ Google Cloud Storage test failed:');
    console.error(`   Error: ${error.message}`);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your .env file has correct values');
    console.log('   2. Verify GOOGLE_CLOUD_PROJECT_ID is correct');
    console.log('   3. Ensure service account has Storage Admin permissions');
    console.log('   4. Check that the service account key file exists and is valid');
    
    if (error.code === 'ENOENT') {
      console.log('   5. Make sure GOOGLE_APPLICATION_CREDENTIALS path is correct');
    }
    
    process.exit(1);
  }
}

// Run the test
testGoogleCloudStorage();
