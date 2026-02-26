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
    this.credsPath = process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json';
    this.credentials = null;
  }

  async loadCredentials() {
    if (this.credentials) return this.credentials;
    const data = await fs.readFile(this.credsPath, 'utf8');
    const json = JSON.parse(data);
    this.credentials = json.web || json.installed;
    return this.credentials;
  }

  async getClient() {
    const creds = await this.loadCredentials();
    return new OAuth2Client(
      creds.client_id,
      creds.client_secret,
      creds.redirect_uris[0]
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

    const client = await this.getClient();
    client.setCredentials(tokens);
    
    // Check if token expires in less than 5 minutes
    const expiryDate = tokens.expiry_date;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiryDate && expiryDate - now < fiveMinutes) {
      console.log('🔄 Token expiring soon, refreshing...');
      
      const { credentials } = await client.refreshAccessToken();
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
