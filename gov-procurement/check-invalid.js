/**
 * 分析异常URL的数据
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

console.log('========== 异常URL数据分析 ==========\n');

const invalidItems = db.prepare(`
  SELECT id, title, url, region, buyer, keyword, category 
  FROM procurement_items 
  WHERE url LIKE '%search.ccgp.gov.cn/detail%'
  LIMIT 15
`).all();

console.log(`异常URL记录数: ${invalidItems.length}\n`);

invalidItems.forEach((item, i) => {
  console.log(`--- 异常记录 ${i + 1} ---`);
  console.log(`ID: ${item.id}`);
  console.log(`标题: ${item.title}`);
  console.log(`URL: ${item.url}`);
  console.log(`地区: ${item.region}`);
  console.log(`采购人: ${item.buyer}`);
  console.log(`关键词: ${item.keyword}`);
  console.log(`类别: ${item.category}`);
  console.log('');
});

// 对比有效数据
console.log('========== 有效URL数据对比 ==========\n');

const validItems = db.prepare(`
  SELECT id, title, url, region, buyer, keyword, category 
  FROM procurement_items 
  WHERE url LIKE 'http://www.ccgp.gov.cn/%'
  LIMIT 5
`).all();

validItems.forEach((item, i) => {
  console.log(`--- 有效记录 ${i + 1} ---`);
  console.log(`标题: ${item.title}`);
  console.log(`URL: ${item.url}`);
  console.log(`采购人: ${item.buyer}`);
  console.log('');
});

db.close();