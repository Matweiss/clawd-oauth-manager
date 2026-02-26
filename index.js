/**
 * Clawd OAuth Manager
 * Automatically refreshes Google OAuth tokens before expiry
 */

const { OAuth2Client } = require('google-auth-library');
const fs = require('fs').promises;
const path = require('path');

class OAuthManager {
  constructor() {
    this.tokensPath = process.env.OAUTH_TOKENS_PATH || './tokens.json';
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async loadTokens() {
    try {
      const data = await fs.readFile(this.tokensPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('No tokens file found. Run initial auth first.');
      return null;
    }
  }

  async saveTokens(tokens) {
    await fs.writeFile(this.tokensPath, JSON.stringify(tokens, null, 2));
    console.log('✅ Tokens saved:', new Date().toISOString());
  }

  async refreshIfNeeded() {
    const tokens = await this.loadTokens();
    if (!tokens) return null;

    this.client.setCredentials(tokens);
    
    // Check if token expires in less than 5 minutes
    const expiryDate = tokens.expiry_date;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiryDate && expiryDate - now < fiveMinutes) {
      console.log('🔄 Token expiring soon, refreshing...');
      
      const { credentials } = await this.client.refreshAccessToken();
      await this.saveTokens(credentials);
      
      return credentials;
    }

    console.log('✅ Token still valid');
    return tokens;
  }

  async getValidAccessToken() {
    const tokens = await this.refreshIfNeeded();
    return tokens?.access_token;
  }

  // For use in cron jobs
  static async refresh() {
    const manager = new OAuthManager();
    return await manager.refreshIfNeeded();
  }
}

module.exports = OAuthManager;

// CLI usage
if (require.main === module) {
  OAuthManager.refresh()
    .then(tokens => {
      if (tokens) {
        console.log('✅ OAuth refresh complete');
        process.exit(0);
      } else {
        console.error('❌ No tokens to refresh');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('❌ Refresh failed:', err.message);
      process.exit(1);
    });
}
