const Database = require('better-sqlite3');
const db = new Database('./procurement.db');

// 查看crawl_progress表结构
const progressSchema = db.prepare("PRAGMA table_info(crawl_progress)").all();
console.log('crawl_progress schema:', JSON.stringify(progressSchema, null, 2));

// 查看数据
const progressData = db.prepare('SELECT * FROM crawl_progress LIMIT 10').all();
console.log('\ncrawl_progress data:', JSON.stringify(progressData, null, 2));

// 查看search_logs表结构
const logsSchema = db.prepare("PRAGMA table_info(search_logs)").all();
console.log('\nsearch_logs schema:', JSON.stringify(logsSchema, null, 2));

// 查看最近的搜索日志
const logsData = db.prepare('SELECT * FROM search_logs ORDER BY id DESC LIMIT 5').all();
console.log('\nRecent search_logs:', JSON.stringify(logsData, null, 2));

db.close();