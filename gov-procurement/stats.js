const Database = require('better-sqlite3');
const db = new Database('./procurement.db');

console.log('=== 数据库统计 ===\n');

// 总量
const total = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
console.log(`总记录数: ${total.count}`);

// 按关键词统计
console.log('\n按关键词统计:');
const kwStats = db.prepare('SELECT keyword, COUNT(*) as count FROM procurement_items GROUP BY keyword ORDER BY count DESC').all();
kwStats.forEach(s => console.log(`  ${s.keyword}: ${s.count}条`));

// 按类别统计
console.log('\n按类别统计:');
const catStats = db.prepare('SELECT category, COUNT(*) as count FROM procurement_items GROUP BY category ORDER BY count DESC').all();
catStats.forEach(s => console.log(`  ${s.category || '未分类'}: ${s.count}条`));

// 最近的数据
console.log('\n最近10条记录:');
const recent = db.prepare('SELECT title, keyword, publish_date, buyer FROM procurement_items ORDER BY created_at DESC LIMIT 10').all();
recent.forEach((r, i) => {
  const date = r.publish_date || '无日期';
  const buyer = r.buyer ? r.buyer.substring(0, 20) : '未知';
  console.log(`  ${i+1}. [${date}] ${r.title.substring(0, 30)}... (${r.keyword})`);
});

// 搜索日志统计
console.log('\n最近搜索日志:');
const logs = db.prepare('SELECT keyword, result_count, new_count, search_time FROM search_logs ORDER BY id DESC LIMIT 5').all();
logs.forEach(l => {
  console.log(`  ${l.keyword}: 找到${l.result_count}条, 新增${l.new_count}条 (${l.search_time})`);
});

db.close();