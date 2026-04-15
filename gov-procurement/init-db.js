const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库路径
const dbDir = path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw', 'workspace', 'gov-procurement');
const dbPath = path.join(dbDir, 'procurement.db');

// 确保目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(dbPath);

// 初始化表结构
const initSql = `
-- 政府采购信息表
CREATE TABLE IF NOT EXISTS procurement_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT UNIQUE,
    project_id TEXT,
    publish_date DATE,
    region TEXT,
    region_code TEXT,
    keyword TEXT,
    category TEXT,
    buyer TEXT,
    buyer_contact TEXT,
    agent TEXT,
    agent_contact TEXT,
    budget REAL,
    project_type TEXT,
    status TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_keyword ON procurement_items(keyword);
CREATE INDEX IF NOT EXISTS idx_region ON procurement_items(region);
CREATE INDEX IF NOT EXISTS idx_publish_date ON procurement_items(publish_date);
CREATE INDEX IF NOT EXISTS idx_category ON procurement_items(category);

-- 搜索日志表
CREATE TABLE IF NOT EXISTS search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT,
    region TEXT,
    region_code TEXT,
    result_count INTEGER,
    new_count INTEGER,
    search_time DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

db.exec(initSql);

console.log('数据库初始化完成:', dbPath);

// 测试插入
const testInsert = db.prepare(`
  INSERT OR IGNORE INTO procurement_items (title, url, keyword, region)
  VALUES (?, ?, ?, ?)
`);

testInsert.run('测试项目', 'https://example.com/test/1', '测试关键词', '北京');

// 查询测试
const count = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
console.log('当前记录数:', count.count);

db.close();