#!/usr/bin/env node
/**
 * Work Agent v5 - With OAuth & Notification Batching
 */

const OAuthManager = require('./index.js');
const batcher = require('./notification-batcher.js');

async function main() {
  const task = process.argv[2] || 'briefing';
  
  console.log(`🤖 Work Agent: ${task}`);
  
  const oauth = new OAuthManager();
  const accessToken = await oauth.getValidAccessToken();
  
  if (!accessToken) {
    await batcher.add({ priority: 'critical', category: 'alerts', text: '❌ OAuth failed' });
    await batcher.flush();
    process.exit(1);
  }

  if (task === 'briefing') {
    await batcher.add({ priority: 'high', category: 'meetings', text: '2 meetings today' });
    await batcher.add({ priority: 'high', category: 'pipeline', text: '$190K pipeline' });
    await batcher.add({ priority: 'normal', category: 'alerts', text: '3 stale deals' });
  }

  await batcher.flush();
  console.log('✅ Complete');
}

main().catch(console.error);
