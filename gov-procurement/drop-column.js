const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

console.log('=== 删除 detail_url 字段 ===\n');

// SQLite 不支持 DROP COLUMN，需要重建表
db.exec(`
  -- 创建新表（不包含 detail_url）
  CREATE TABLE procurement_items_new (
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  -- 复制数据
  INSERT INTO procurement_items_new 
  SELECT id, title, url, project_id, publish_date, region, region_code, 
         keyword, category, buyer, buyer_contact, agent, agent_contact, 
         budget, project_type, status, created_at, updated_at
  FROM procurement_items;
  
  -- 删除旧表
  DROP TABLE procurement_items;
  
  -- 重命名新表
  ALTER TABLE procurement_items_new RENAME TO procurement_items;
  
  -- 重建索引
  CREATE INDEX IF NOT EXISTS idx_keyword ON procurement_items(keyword);
  CREATE INDEX IF NOT EXISTS idx_region ON procurement_items(region);
  CREATE INDEX IF NOT EXISTS idx_publish_date ON procurement_items(publish_date);
  CREATE INDEX IF NOT EXISTS idx_category ON procurement_items(category);
`);

console.log('✓ 已删除 detail_url 字段\n');

// 验证数据
const count = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
console.log('数据验证: ' + count.count + ' 条记录已保留');

// 显示新表结构
console.log('\n新表结构:\n');
const tableInfo = db.prepare('PRAGMA table_info(procurement_items)').all();
console.log('┌──────────────────────┬─────────────────┐');
console.log('│ 字段名               │ 类型            │');
console.log('├──────────────────────┼─────────────────┤');
for (const col of tableInfo) {
  console.log('│ ' + col.name.padEnd(20) + ' │ ' + (col.type || 'TEXT').padEnd(15) + ' │');
}
console.log('└──────────────────────┴─────────────────┘');

db.close();