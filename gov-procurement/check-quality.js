/**
 * 检查数据质量
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

console.log('========== 数据质量检查 ==========\n');

// 1. 检查URL格式
const allItems = db.prepare('SELECT id, title, url, buyer, region FROM procurement_items').all();

let validUrl = 0;
let invalidUrl = 0;
let emptyBuyer = 0;
let emptyRegion = 0;

allItems.forEach(item => {
  if (item.url && item.url.startsWith('http://www.ccgp.gov.cn/') && item.url.includes('/t20')) {
    validUrl++;
  } else {
    invalidUrl++;
    console.log(`异常URL [${item.id}]: ${item.url}`);
  }
  
  if (!item.buyer || item.buyer.length < 4) {
    emptyBuyer++;
  }
  
  if (!item.region) {
    emptyRegion++;
  }
});

console.log(`\n总记录: ${allItems.length}`);
console.log(`有效URL: ${validUrl} (${Math.round(validUrl/allItems.length*100)}%)`);
console.log(`异常URL: ${invalidUrl}`);
console.log(`采购人为空: ${emptyBuyer}`);
console.log(`地区为空: ${emptyRegion}`);

// 2. 检查学校关键词
const SCHOOL_KEYWORDS = ['学校', '中心', '学院', '中学', '高中', '集团', '大学', '小学'];
let validBuyer = 0;

allItems.forEach(item => {
  if (item.buyer && SCHOOL_KEYWORDS.some(kw => item.buyer.includes(kw))) {
    validBuyer++;
  }
});

console.log(`\n采购人包含学校关键词: ${validBuyer} (${Math.round(validBuyer/allItems.length*100)}%)`);

// 3. 显示几条新数据
console.log('\n========== 最新采集的数据示例 ==========\n');
const newItems = db.prepare(`
  SELECT id, title, url, buyer, region, keyword 
  FROM procurement_items 
  WHERE id > 73
  LIMIT 5
`).all();

newItems.forEach((item, i) => {
  console.log(`--- 新记录 ${i + 1} ---`);
  console.log(`标题: ${item.title}`);
  console.log(`URL: ${item.url}`);
  console.log(`采购人: ${item.buyer}`);
  console.log(`地区: ${item.region}`);
  console.log(`关键词: ${item.keyword}`);
  console.log('');
});

db.close();