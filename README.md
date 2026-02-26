# Clawd OAuth Manager

Automatic OAuth token refresh for Google services (Calendar, Gmail, etc.)

## Problem
Google OAuth access tokens expire every ~1 hour. This breaks cron jobs that need Calendar/Gmail access.

## Solution
Automatically refresh tokens before they expire. Run this every 30 minutes via cron.

## Setup

### 1. Initial Auth (One-time)
```bash
# Get initial tokens from Google OAuth flow
# Save to tokens.json:
{
  "access_token": "ya29...",
  "refresh_token": "1//...",
  "expiry_date": 1234567890000
}
```

### 2. Environment Variables
```bash
export GOOGLE_CLIENT_ID="your-client-id"
export GOOGLE_CLIENT_SECRET="your-secret"
export GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"
export OAUTH_TOKENS_PATH="./tokens.json"
```

### 3. Install
```bash
npm install
```

### 4. Cron Job (Every 30 min)
```bash
# Add to crontab
*/30 * * * * cd /path/to/clawd-oauth-manager && node refresh.js >> /var/log/oauth-refresh.log 2>&1
```

## Usage

### In Your Code
```javascript
const OAuthManager = require('./index.js');

const manager = new OAuthManager();
const accessToken = await manager.getValidAccessToken();

// Use token with Google APIs
const calendar = google.calendar({ version: 'v3', auth: accessToken });
```

### CLI
```bash
# Manual refresh
node refresh.js
```

## Integration with Work Agent

Work Agent automatically uses this to keep Calendar access alive:

```javascript
// Before making Calendar API calls
const OAuthManager = require('clawd-oauth-manager');
const tokens = await OAuthManager.refresh();

if (tokens) {
  // Proceed with Calendar API call
} else {
  // Alert: Token refresh failed
}
```

## Files

- `index.js` — OAuthManager class
- `refresh.js` — CLI script for cron jobs
- `tokens.json` — Token storage (gitignored)

---
*Part of the Clawd Agent Swarm*
