const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

console.log('=== content 字段检查 ===\n');

// 检查 content 字段是否有数据
const withContent = db.prepare("SELECT COUNT(*) as count FROM procurement_items WHERE content IS NOT NULL AND content != ''").get();
const withoutContent = db.prepare("SELECT COUNT(*) as count FROM procurement_items WHERE content IS NULL OR content = ''").get();

console.log('有 content 数据的记录: ' + withContent.count + ' 条');
console.log('无 content 数据的记录: ' + withoutContent.count + ' 条');

// 查看有 content 的记录
if (withContent.count > 0) {
  console.log('\n=== content 字段示例 ===\n');
  const sample = db.prepare("SELECT title, content FROM procurement_items WHERE content IS NOT NULL AND content != '' LIMIT 1").get();
  console.log('标题: ' + sample.title);
  console.log('内容: ' + sample.content);
} else {
  console.log('\n  当前所有记录的 content 字段都为空');
  console.log('  这个字段是预留的，用于存储公告详细内容');
  console.log('  需要进入详情页抓取才能填充此字段');
}

db.close();