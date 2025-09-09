#!/usr/bin/env node

/**
 * Fix .env file script
 * This will help you add the missing DATABASE_URL to your .env file
 */

import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');

console.log('🔧 Fixing .env file...\n');

try {
  // Read current .env file
  const currentContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Current .env file read successfully');
  
  // Check if DATABASE_URL already exists
  if (currentContent.includes('DATABASE_URL=')) {
    console.log('⚠️  DATABASE_URL already exists in .env file');
    console.log('Current content:');
    console.log(currentContent);
  } else {
    console.log('❌ DATABASE_URL not found in .env file');
    
    // Create the DATABASE_URL line
    const databaseUrl = 'DATABASE_URL="postgresql://neondb_owner:npg_CT8toO0WMfhY@ep-dry-bar-adj6rand.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"';
    
    // Add DATABASE_URL at the beginning
    const newContent = databaseUrl + '\n' + currentContent;
    
    // Write the updated content
    fs.writeFileSync(envPath, newContent, 'utf8');
    
    console.log('✅ DATABASE_URL added to .env file');
    console.log('\n📋 Updated .env file content:');
    console.log(newContent);
  }
  
} catch (error) {
  console.error('❌ Error fixing .env file:', error.message);
  console.log('\n🔧 Manual fix required:');
  console.log('Add this line to the TOP of your .env file:');
  console.log('DATABASE_URL="postgresql://neondb_owner:npg_CT8toO0WMfhY@ep-dry-bar-adj6rand.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"');
}
