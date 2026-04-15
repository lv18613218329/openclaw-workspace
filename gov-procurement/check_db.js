const Database = require('better-sqlite3');
const db = new Database('./procurement.db');

// 检查所有表
console.log('=== 所有表 ===');
const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => {
  console.log(`\n表名: ${t.name}`);
  console.log(t.sql);
});

// 检查 search_logs 表
console.log('\n\n=== search_logs 最近记录 ===');
try {
  const logs = db.prepare('SELECT * FROM search_logs ORDER BY id DESC LIMIT 5').all();
  console.log(JSON.stringify(logs, null, 2));
} catch (e) {
  console.log('search_logs 表不存在或查询失败:', e.message);
}

// 检查所有关键词的进度
console.log('\n\n=== 所有关键词采集进度 ===');
const allProgress = db.prepare('SELECT * FROM crawl_progress ORDER BY id').all();
console.log(`共 ${allProgress.length} 个关键词`);
allProgress.forEach(p => {
  console.log(`${p.keyword}: ${p.last_crawl_time || '从未采集'}`);
});

db.close();