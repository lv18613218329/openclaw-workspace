const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

// 添加采集进度表 - 记录每个关键词+省市的最后采集时间
db.exec(`
  CREATE TABLE IF NOT EXISTS crawl_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    region_code TEXT NOT NULL,
    last_page INTEGER DEFAULT 0,
    last_count INTEGER DEFAULT 0,
    last_crawl_time DATETIME,
    UNIQUE(keyword, region_code)
  );
  
  CREATE INDEX IF NOT EXISTS idx_crawl_progress ON crawl_progress(keyword, region_code);
`);

console.log('增量更新表创建成功');

// 验证
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('当前表:', tables.map(t => t.name).join(', '));

db.close();