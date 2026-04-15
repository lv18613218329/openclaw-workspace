const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

console.log('=== 数据库结构调整 ===\n');

// 1. 重命名 content 字段为 detail_url（更清晰）
try {
  db.exec('ALTER TABLE procurement_items RENAME COLUMN content TO detail_url');
  console.log('✓ 已将 content 字段重命名为 detail_url');
} catch (e) {
  if (e.message.includes('no such column')) {
    console.log('✓ detail_url 字段已存在，无需修改');
  } else {
    console.log('注意: ' + e.message);
  }
}

// 2. 检查调整后的表结构
console.log('\n调整后的表结构:\n');
const tableInfo = db.prepare('PRAGMA table_info(procurement_items)').all();
console.log('┌──────────────────────┬─────────────────┐');
console.log('│ 字段名               │ 类型            │');
console.log('├──────────────────────┼─────────────────┤');
for (const col of tableInfo) {
  console.log('│ ' + col.name.padEnd(20) + ' │ ' + (col.type || 'TEXT').padEnd(15) + ' │');
}
console.log('└──────────────────────┴─────────────────┘');

// 3. 更新 init-db.sql 文件
console.log('\n字段说明:');
console.log('  url         - 公告详情页链接（搜索结果中的链接）');
console.log('  detail_url  - 预留字段，可存储额外的详情页地址');

db.close();