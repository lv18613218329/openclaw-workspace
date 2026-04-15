/**
 * 清理异常数据
 * 删除 URL 不正确的记录
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

console.log('========== 清理异常数据 ==========\n');

// 统计清理前
const beforeCount = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
console.log(`清理前总记录数: ${beforeCount.count}`);

// 统计异常记录
const invalidCount = db.prepare(`
  SELECT COUNT(*) as count FROM procurement_items 
  WHERE url NOT LIKE 'http://www.ccgp.gov.cn/%'
`).get();
console.log(`异常记录数: ${invalidCount.count}`);

// 删除异常记录
const result = db.prepare(`
  DELETE FROM procurement_items 
  WHERE url NOT LIKE 'http://www.ccgp.gov.cn/%'
`).run();

console.log(`已删除: ${result.changes} 条异常记录`);

// 统计清理后
const afterCount = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
console.log(`清理后总记录数: ${afterCount.count}`);

// 显示剩余数据统计
console.log('\n========== 剩余数据统计 ==========\n');

const stats = db.prepare(`
  SELECT keyword, COUNT(*) as count 
  FROM procurement_items 
  GROUP BY keyword 
  ORDER BY count DESC
`).all();

stats.forEach(s => console.log(`  ${s.keyword}: ${s.count}条`));

db.close();

console.log('\n✅ 清理完成！');