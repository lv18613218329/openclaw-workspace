const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                    数据库表结构                               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// 获取表结构
const tableInfo = db.prepare('PRAGMA table_info(procurement_items)').all();
console.log('procurement_items 表字段:');
console.log('┌──────────────────────┬─────────────────┬──────────┐');
console.log('│ 字段名               │ 类型            │ 约束     │');
console.log('├──────────────────────┼─────────────────┼──────────┤');
for (const col of tableInfo) {
  const name = col.name.padEnd(20);
  const type = (col.type || 'TEXT').padEnd(15);
  const constraint = col.pk ? 'PRIMARY KEY' : (col.notnull ? 'NOT NULL' : 'NULL');
  console.log('│ ' + name + ' │ ' + type + ' │ ' + constraint.padEnd(8) + ' │');
}
console.log('└──────────────────────┴─────────────────┴──────────┘');

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                    示例数据 (前5条)                           ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const samples = db.prepare('SELECT * FROM procurement_items LIMIT 5').all();
for (let i = 0; i < samples.length; i++) {
  const row = samples[i];
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ 记录 ' + (i+1) + '                                                            │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│ 标题: ' + (row.title || '').substring(0, 50) + '...');
  console.log('│ URL:  ' + (row.url || '').substring(0, 50));
  console.log('│ 关键词: ' + (row.keyword || ''));
  console.log('│ 地区:   ' + (row.region || ''));
  console.log('│ 类别:   ' + (row.category || ''));
  console.log('│ 采购人: ' + (row.buyer || ''));
  console.log('│ 类型:   ' + (row.project_type || ''));
  console.log('│ 发布日期: ' + (row.publish_date || ''));
  console.log('└─────────────────────────────────────────────────────────────┘\n');
}

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                    数据统计                                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const total = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
console.log('  数据库总记录: ' + total.count + ' 条\n');

console.log('  按关键词统计:');
console.log('  ┌────────────────────────┬──────────┐');
console.log('  │ 关键词                 │ 记录数   │');
console.log('  ├────────────────────────┼──────────┤');
const stats = db.prepare('SELECT keyword, COUNT(*) as count FROM procurement_items GROUP BY keyword ORDER BY count DESC').all();
for (const s of stats) {
  console.log('  │ ' + (s.keyword || '').padEnd(22) + ' │ ' + String(s.count).padStart(8) + ' │');
}
console.log('  └────────────────────────┴──────────┘');

db.close();