const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

// 清空所有表
db.exec('DELETE FROM procurement_items');
db.exec('DELETE FROM search_logs');
db.exec('DELETE FROM crawl_progress');

console.log('数据库已清空');

const count = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
console.log('当前记录数:', count.count);

db.close();