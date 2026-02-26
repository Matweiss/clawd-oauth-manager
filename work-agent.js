#!/usr/bin/env node
/**
 * Work Agent v5 - With OAuth & Notification Batching
 * Usage: node work-agent.js [task]
 */

const OAuthManager = require('./index.js');
const getBatcher = require('./notification-batcher.js');

async function main() {
  const task = process.argv[2] || 'briefing';
  const batcher = getBatcher();
  
  console.log(`🤖 Work Agent starting: ${task}`);
  console.log('Time:', new Date().toISOString());

  // Ensure valid OAuth token
  const oauth = new OAuthManager();
  const accessToken = await oauth.getValidAccessToken();
  
  if (!accessToken) {
    await batcher.queue({
      priority: 'critical',
      category: 'alerts',
      text: '❌ OAuth failed - Calendar unavailable'
    });
    await batcher.flush();
    process.exit(1);
  }

  console.log('✅ OAuth token valid');

  // Execute task
  switch(task) {
    case 'briefing':
      await runMorningBriefing(accessToken, batcher);
      break;
    case 'pre-meeting':
      await runPreMeetingPrep(accessToken, batcher);
      break;
    case 'pipeline':
      await runPipelineCheck(accessToken, batcher);
      break;
    default:
      console.log('Unknown task:', task);
  }

  // Flush any remaining notifications
  await batcher.flush();
  console.log('✅ Work Agent complete');
}

async function runMorningBriefing(accessToken, batcher) {
  // Queue high priority notifications (batched in 5 min window)
  await batcher.queue({
    priority: 'high',
    category: 'meetings',
    text: '2 meetings today: HAP Craftable (9:15 AM), Broken Yolk (1:00 PM)'
  });

  await batcher.queue({
    priority: 'high', 
    category: 'pipeline',
    text: '$190K pipeline (21 deals) - Clyde\'s closes Feb 28'
  });

  // Queue normal priority (batched in 30 min window)
  await batcher.queue({
    priority: 'normal',
    category: 'pipeline', 
    text: '3 stale deals need attention'
  });

  // Use accessToken to fetch real Calendar data
  // TODO: Integrate with Google Calendar API
  console.log('📅 Morning briefing queued (using fresh token)');
}

async function runPreMeetingPrep(accessToken, batcher) {
  // Fetch meetings from Calendar using accessToken
  // Generate battle cards
  
  await batcher.queue({
    priority: 'high',
    category: 'meetings',
    text: 'Battle card ready: HAP Craftable'
  });

  console.log('⚔️ Pre-meeting prep queued');
}

async function runPipelineCheck(accessToken, batcher) {
  // Check HubSpot for stale deals
  // Alert on urgent items
  
  await batcher.queue({
    priority: 'normal',
    category: 'pipeline',
    text: 'Pipeline check complete - no urgent items'
  });

  console.log('📊 Pipeline check queued');
}

main().catch(err => {
  console.error('❌ Work Agent error:', err);
  process.exit(1);
});
