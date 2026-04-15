const Database = require('better-sqlite3');
const db = new Database('./procurement.db');

// 检查表结构
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

// 检查进度表
try {
  const progress = db.prepare('SELECT * FROM crawl_progress ORDER BY last_crawl DESC LIMIT 10').all();
  console.log('\nRecent progress:', JSON.stringify(progress, null, 2));
} catch(e) {
  console.log('No progress table yet:', e.message);
}

// 检查数据统计
try {
  const count = db.prepare('SELECT COUNT(*) as total FROM procurement_items').get();
  console.log('\nTotal items:', count.total);
  
  // 最新和最旧的记录
  const latest = db.prepare('SELECT * FROM procurement_items ORDER BY publish_date DESC LIMIT 1').get();
  const oldest = db.prepare('SELECT * FROM procurement_items ORDER BY publish_date ASC LIMIT 1').get();
  console.log('Latest date:', latest?.publish_date);
  console.log('Oldest date:', oldest?.publish_date);
} catch(e) {
  console.log('No items table yet:', e.message);
}

db.close();