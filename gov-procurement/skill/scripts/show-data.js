/**
 * 查看采购数据
 */

const Database = require('better-sqlite3');
const path = require('path');

const baseDir = path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw', 'workspace', 'gov-procurement');
const dbPath = path.join(baseDir, 'procurement.db');

try {
  const db = new Database(dbPath);
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    数据统计                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const total = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
  console.log(`数据库总记录: ${total.count} 条\n`);

  console.log('按关键词统计:');
  console.log('┌────────────────────────┬──────────┐');
  console.log('│ 关键词                 │ 记录数   │');
  console.log('├────────────────────────┼──────────┤');
  
  const stats = db.prepare(`
    SELECT keyword, COUNT(*) as count 
    FROM procurement_items 
    GROUP BY keyword 
    ORDER BY count DESC
  `).all();
  
  stats.forEach(s => {
    const kw = s.keyword.padEnd(20, ' ');
    const cnt = String(s.count).padStart(8, ' ');
    console.log(`│ ${kw} │ ${cnt} │`);
  });
  
  console.log('└────────────────────────┴──────────┘');

  console.log('\n示例数据 (前3条):\n');
  
  const items = db.prepare('SELECT title, buyer, region, keyword FROM procurement_items LIMIT 3').all();
  
  items.forEach((item, i) => {
    console.log(`--- 记录 ${i + 1} ---`);
    console.log(`标题: ${item.title.substring(0, 50)}...`);
    console.log(`采购人: ${item.buyer}`);
    console.log(`地区: ${item.region || '未提取'}`);
    console.log(`关键词: ${item.keyword}`);
    console.log('');
  });

  db.close();
} catch (e) {
  console.log('数据库不存在或为空，请先运行采集脚本');
}