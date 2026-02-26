// notification-batcher.js - Simple batching for Telegram
class NotificationBatcher {
  constructor() {
    this.queue = [];
    this.lastFlush = Date.now();
    this.windows = {
      critical: 0,      // Immediate
      high: 5 * 60 * 1000,      // 5 min  
      normal: 30 * 60 * 1000,   // 30 min
      low: 24 * 60 * 60 * 1000  // 24 hours
    };
    this.flushInterval = setInterval(() => this.processQueue(), 60000); // Check every minute
  }

  async queue(notification) {
    this.queue.push({
      ...notification,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    });

    // Immediate send for critical
    if (notification.priority === 'critical') {
      await this.flushPriority('critical');
    }
  }

  async processQueue() {
    const now = Date.now();
    
    for (const priority of ['high', 'normal', 'low']) {
      const window = this.windows[priority];
      const items = this.queue.filter(i => i.priority === priority);
      
      if (items.length === 0) continue;
      
      const oldest = Math.min(...items.map(i => i.timestamp));
      
      if (now - oldest >= window) {
        await this.sendBatch(priority, items);
        this.queue = this.queue.filter(i => !items.includes(i));
      }
    }
  }

  async sendBatch(priority, items) {
    const emojiMap = {
      meetings: '🗓️',
      pipeline: '💼',
      alerts: '⚠️',
      research: '🔍',
      wellness: '🧘',
      system: '🔧'
    };

    let text = `📬 Clawd Digest — ${priority.toUpperCase()}\n\n`;
    
    // Group by category
    const byCategory = {};
    for (const item of items) {
      const cat = item.category || 'general';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(item);
    }

    for (const [category, messages] of Object.entries(byCategory)) {
      const emoji = emojiMap[category] || '📌';
      text += `${emoji} ${category.toUpperCase()}\n`;
      for (const msg of messages.slice(0, 5)) { // Max 5 per category
        text += `   • ${msg.text}\n`;
      }
      if (messages.length > 5) {
        text += `   ... and ${messages.length - 5} more\n`;
      }
      text += '\n';
    }

    // Send via Telegram
    await this.sendToTelegram(text.trim());
  }

  async sendToTelegram(text) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!token || !chatId) {
      console.log('[BATCHER] Would send:', text.substring(0, 100) + '...');
      return;
    }

    try {
      const fetch = require('node-fetch');
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        })
      });
    } catch (err) {
      console.error('[BATCHER] Failed to send:', err.message);
    }
  }

  async flush() {
    for (const priority of ['critical', 'high', 'normal', 'low']) {
      await this.flushPriority(priority);
    }
  }

  async flushPriority(priority) {
    const items = this.queue.filter(i => i.priority === priority);
    if (items.length > 0) {
      await this.sendBatch(priority, items);
      this.queue = this.queue.filter(i => !items.includes(i));
    }
  }
}

// Singleton instance
let instance = null;
module.exports = function getBatcher() {
  if (!instance) instance = new NotificationBatcher();
  return instance;
};
