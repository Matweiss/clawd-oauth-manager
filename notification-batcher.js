// notification-batcher.js - Simple batching for Telegram
class NotificationBatcher {
  constructor() {
    this.queue = [];
    this.windows = {
      critical: 0,
      high: 5 * 60 * 1000,
      normal: 30 * 60 * 1000,
      low: 24 * 60 * 60 * 1000
    };
  }

  async add(notification) {
    this.queue.push({
      ...notification,
      timestamp: Date.now()
    });

    if (notification.priority === 'critical') {
      await this.flushPriority('critical');
    }
  }

  async flush() {
    for (const priority of ['critical', 'high', 'normal', 'low']) {
      await this.flushPriority(priority);
    }
  }

  async flushPriority(priority) {
    const items = this.queue.filter(i => i.priority === priority);
    if (items.length === 0) return;

    const emojiMap = {
      meetings: '🗓️',
      pipeline: '💼',
      alerts: '⚠️',
      research: '🔍',
      wellness: '🧘'
    };

    let text = `📬 Clawd ${priority.toUpperCase()}\n\n`;
    
    const byCategory = {};
    for (const item of items) {
      const cat = item.category || 'general';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(item);
    }

    for (const [category, messages] of Object.entries(byCategory)) {
      const emoji = emojiMap[category] || '📌';
      text += `${emoji} ${category.toUpperCase()}\n`;
      for (const msg of messages) {
        text += `   • ${msg.text}\n`;
      }
      text += '\n';
    }

    await this.send(text.trim());
    this.queue = this.queue.filter(i => !items.includes(i));
  }

  async send(text) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!token || !chatId) {
      console.log('[BATCHER] Would send:', text.substring(0, 100));
      return;
    }

    try {
      const fetch = require('node-fetch');
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text })
      });
    } catch (err) {
      console.error('[BATCHER] Send failed:', err.message);
    }
  }
}

module.exports = new NotificationBatcher();
