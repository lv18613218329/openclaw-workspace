const { chromium } = require('playwright');
const Database = require('better-sqlite3');
const fs = require('fs');

// 加载配置
const keywords = JSON.parse(fs.readFileSync('./keywords.json', 'utf-8'));
const regions = JSON.parse(fs.readFileSync('./regions.json', 'utf-8'));
const db = new Database('./procurement.db');

// 统计
let stats = {
  startTime: new Date(),
  totalSearches: 0,
  totalResults: 0,
  totalNew: 0,
  errors: [],
  byCategory: {}
};

// 获取所有关键词列表
function getAllKeywords() {
  const allKeywords = [];
  for (const [category, kwList] of Object.entries(keywords)) {
    for (const kw of kwList) {
      allKeywords.push({ keyword: kw, category });
    }
  }
  return allKeywords;
}

// 睡眠函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 随机延迟 2-4 秒
function randomDelay() {
  const delay = 2000 + Math.random() * 2000;
  return sleep(delay);
}

// 搜索单个关键词
async function searchKeyword(page, keyword, category, regionCode = null, regionName = null) {
  const results = [];
  
  try {
    // 构建搜索URL
    let url = `https://search.ccgp.gov.cn/bxsearch?searchtype=1&bidSort=0&buyerName=&projectId=&pinMu=0&bidType=0&dbselect=bidx&kw=${encodeURIComponent(keyword)}&start_time=&end_time=&page_index=1`;
    
    if (regionCode) {
      url += `&zoneId=${regionCode}`;
    }
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(1000);
    
    // 检查是否有结果
    const noResult = await page.$('.no-result, .empty-result, .no-data');
    if (noResult) {
      return { results: [], count: 0 };
    }
    
    // 提取搜索结果
    const items = await page.$$eval('.list-con .List1, .result-list li, .search-result-item', elements => {
      return elements.map(el => {
        const link = el.querySelector('a');
        const dateEl = el.querySelector('.date, .time, span');
        const text = el.innerText || '';
        
        // 解析日期
        let publishDate = null;
        const dateMatch = text.match(/(\d{4}[-\/年]\d{1,2}[-\/月]\d{1,2})/);
        if (dateMatch) {
          publishDate = dateMatch[1].replace(/[年月]/g, '-').replace(/[日号]/g, '');
        }
        
        return {
          title: link ? link.innerText.trim() : '',
          url: link ? link.href : '',
          publishDate
        };
      }).filter(item => item.title && item.url);
    });
    
    return { results: items, count: items.length };
    
  } catch (error) {
    stats.errors.push({
      keyword,
      region: regionName,
      error: error.message
    });
    return { results: [], count: 0, error: error.message };
  }
}

// 保存结果到数据库
function saveResults(items, keyword, category, regionName, regionCode) {
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO procurement_items 
    (title, url, publish_date, region, region_code, keyword, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  let newCount = 0;
  for (const item of items) {
    const result = insertStmt.run(
      item.title,
      item.url,
      item.publishDate,
      regionName,
      regionCode,
      keyword,
      category
    );
    if (result.changes > 0) newCount++;
  }
  
  return newCount;
}

// 记录搜索日志
function logSearch(keyword, regionName, regionCode, resultCount, newCount) {
  const stmt = db.prepare(`
    INSERT INTO search_logs (keyword, region, region_code, result_count, new_count)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(keyword, regionName, regionCode, resultCount, newCount);
}

// 更新进度
function updateProgress(keyword) {
  const stmt = db.prepare(`
    INSERT INTO crawl_progress (keyword, last_crawl_time) 
    VALUES (?, datetime('now', 'localtime'))
    ON CONFLICT(keyword) DO UPDATE SET 
      last_crawl_time = datetime('now', 'localtime')
  `);
  
  // 先检查 keyword 列是否有唯一约束
  try {
    stmt.run(keyword);
  } catch (e) {
    // 如果冲突，使用 UPDATE
    const updateStmt = db.prepare(`
      UPDATE crawl_progress SET last_crawl_time = datetime('now', 'localtime') 
      WHERE keyword = ?
    `);
    updateStmt.run(keyword);
  }
}

// 主函数
async function main() {
  console.log('=== 政府采购信息增量采集 ===');
  console.log(`开始时间: ${stats.startTime.toLocaleString('zh-CN')}`);
  console.log('');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-gpu', '--no-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  const allKeywords = getAllKeywords();
  const regionList = Object.entries(regions);
  
  console.log(`关键词总数: ${allKeywords.length}`);
  console.log(`省市总数: ${regionList.length}`);
  console.log(`预计搜索次数: ${allKeywords.length * (regionList.length + 1)} (含全国搜索)`);
  console.log('');
  
  // 先做全国搜索（不指定省市）
  console.log('--- 全国搜索 ---');
  for (const { keyword, category } of allKeywords) {
    stats.totalSearches++;
    
    const { results, count, error } = await searchKeyword(page, keyword, category);
    const newCount = saveResults(results, keyword, category, null, null);
    
    stats.totalResults += count;
    stats.totalNew += newCount;
    
    logSearch(keyword, null, null, count, newCount);
    updateProgress(keyword);
    
    // 统计
    if (!stats.byCategory[category]) {
      stats.byCategory[category] = { searches: 0, results: 0, new: 0 };
    }
    stats.byCategory[category].searches++;
    stats.byCategory[category].results += count;
    stats.byCategory[category].new += newCount;
    
    console.log(`[${category}] ${keyword}: ${count} 条结果, ${newCount} 条新增`);
    
    await randomDelay();
  }
  
  // 遍历省市（只做重点关键词，减少请求量）
  // 取每个类别的前2个关键词做省市搜索
  const priorityKeywords = [];
  for (const [category, kwList] of Object.entries(keywords)) {
    priorityKeywords.push(...kwList.slice(0, 2).map(kw => ({ keyword: kw, category })));
  }
  
  console.log('');
  console.log('--- 省市搜索 (重点关键词) ---');
  
  for (const [regionName, regionCode] of regionList) {
    for (const { keyword, category } of priorityKeywords) {
      stats.totalSearches++;
      
      const { results, count, error } = await searchKeyword(page, keyword, category, regionCode, regionName);
      const newCount = saveResults(results, keyword, category, regionName, regionCode);
      
      stats.totalResults += count;
      stats.totalNew += newCount;
      
      logSearch(keyword, regionName, regionCode, count, newCount);
      
      console.log(`[${regionName}] ${keyword}: ${count} 条结果, ${newCount} 条新增`);
      
      await randomDelay();
    }
  }
  
  await browser.close();
  db.close();
  
  // 生成报告
  stats.endTime = new Date();
  const duration = Math.round((stats.endTime - stats.startTime) / 1000);
  
  console.log('');
  console.log('=== 采集报告 ===');
  console.log(`开始时间: ${stats.startTime.toLocaleString('zh-CN')}`);
  console.log(`结束时间: ${stats.endTime.toLocaleString('zh-CN')}`);
  console.log(`总耗时: ${Math.floor(duration / 60)} 分 ${duration % 60} 秒`);
  console.log(`搜索次数: ${stats.totalSearches}`);
  console.log(`结果总数: ${stats.totalResults}`);
  console.log(`新增条目: ${stats.totalNew}`);
  console.log('');
  console.log('按类别统计:');
  for (const [cat, data] of Object.entries(stats.byCategory)) {
    console.log(`  ${cat}: ${data.searches} 次搜索, ${data.results} 条结果, ${data.new} 条新增`);
  }
  
  if (stats.errors.length > 0) {
    console.log('');
    console.log(`错误数: ${stats.errors.length}`);
    stats.errors.slice(0, 5).forEach(e => {
      console.log(`  - ${e.keyword} (${e.region || '全国'}): ${e.error}`);
    });
  }
}

main().catch(console.error);