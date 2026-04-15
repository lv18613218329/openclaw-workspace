/**
 * 查看数据库中的URL格式
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

console.log('========== 现有数据URL分析 ==========\n');

const items = db.prepare('SELECT id, title, url, region, buyer FROM procurement_items LIMIT 10').all();

items.forEach((item, i) => {
  console.log(`--- 记录 ${i + 1} ---`);
  console.log(`ID: ${item.id}`);
  console.log(`标题: ${item.title}`);
  console.log(`标题长度: ${item.title?.length || 0}`);
  console.log(`URL: ${item.url}`);
  console.log(`URL长度: ${item.url?.length || 0}`);
  console.log(`地区: ${item.region}`);
  console.log(`采购人: ${item.buyer}`);
  console.log('');
});

// 检查URL格式
console.log('========== URL格式分析 ==========\n');
const allItems = db.prepare('SELECT url FROM procurement_items').all();

let validUrl = 0;
let invalidUrl = 0;
let shortUrl = 0;

allItems.forEach(item => {
  if (!item.url) {
    invalidUrl++;
  } else if (item.url.startsWith('http://www.ccgp.gov.cn/')) {
    validUrl++;
  } else {
    shortUrl++;
    console.log('异常URL:', item.url);
  }
});

console.log(`有效URL: ${validUrl}`);
console.log(`无效URL: ${invalidUrl}`);
console.log(`异常URL: ${shortUrl}`);

// 检查标题是否被截取
console.log('\n========== 标题分析 ==========\n');
const titles = db.prepare('SELECT title FROM procurement_items WHERE title LIKE "%..." OR title LIKE "%…"').all();
console.log(`标题被截取的记录数: ${titles.length}`);

if (titles.length > 0) {
  console.log('\n被截取的标题示例:');
  titles.slice(0, 5).forEach(t => console.log(' -', t.title));
}

db.close();