#!/usr/bin/env node
/**
 * Quick refresh script for cron jobs
 * Usage: node refresh.js
 */

const OAuthManager = require('./index.js');

async function main() {
  console.log('⏰ Running scheduled token refresh...');
  console.log('Time:', new Date().toISOString());
  
  try {
    const tokens = await OAuthManager.refresh();
    
    if (tokens) {
      console.log('✅ Success! Token valid until:', new Date(tokens.expiry_date).toISOString());
      
      // Output for cron job capture
      console.log('ACCESS_TOKEN=' + tokens.access_token);
      console.log('REFRESH_TOKEN=' + tokens.refresh_token);
      console.log('EXPIRY=' + tokens.expiry_date);
      
      process.exit(0);
    } else {
      console.error('❌ Failed: No tokens found');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

main();
