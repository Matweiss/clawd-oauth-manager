#!/bin/bash
# Setup script for Work Agent v5 with OAuth + Batching

echo "🦞 Setting up Work Agent v5..."
echo "================================"

# Install dependencies
echo "Installing dependencies..."
cd /root/.openclaw/workspace/clawd-oauth-manager
npm install 2>/dev/null || echo "Dependencies already installed"

# Create log directory
mkdir -p /var/log/clawd

# Setup cron jobs
echo ""
echo "Setting up cron jobs..."

# Remove old work-agent cron jobs
crontab -l 2>/dev/null | grep -v "work-agent" | grep -v "morning-briefing" | grep -v "pre-meeting" > /tmp/crontab.tmp

# Add new cron jobs with OAuth refresh
cat >> /tmp/crontab.tmp <> /dev/null 2>&1

# 12:00 PM PT - Pre-Meeting Prep
echo "0 12 * * 1-5 cd /root/.openclaw/workspace/clawd-oauth-manager && node work-agent.js pre-meeting >> /var/log/clawd/work-agent.log 2>&1" >> /tmp/crontab.tmp

# 4:00 PM PT - Pipeline Check  
echo "0 16 * * 1-5 cd /root/.openclaw/workspace/clawd-oauth-manager && node work-agent.js pipeline >> /var/log/clawd/work-agent.log 2>&1" >> /tmp/crontab.tmp

# OAuth refresh every 30 minutes
echo "*/30 * * * * cd /root/.openclaw/workspace/clawd-oauth-manager && node refresh.js >> /var/log/clawd/oauth.log 2>&1" >> /tmp/crontab.tmp

# Install new crontab
crontab /tmp/crontab.tmp
rm /tmp/crontab.tmp

echo ""
echo "✅ Setup complete!"
echo ""
echo "Cron jobs installed:"
crontab -l | grep -E "work-agent|refresh" | nl
echo ""
echo "Logs will be written to:"
echo "  /var/log/clawd/work-agent.log"
echo "  /var/log/clawd/oauth.log"
echo ""
echo "To test manually:"
echo "  cd /root/.openclaw/workspace/clawd-oauth-manager"
echo "  node work-agent.js briefing"
