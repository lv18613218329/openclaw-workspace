/**
 * 政府采购信息采集脚本
 * 支持：增量更新、去重、多关键词、多省市
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const baseDir = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement');
const dbPath = path.join(baseDir, 'procurement.db');
const db = new Database(dbPath);

// 加载配置
const keywords = JSON.parse(fs.readFileSync(path.join(baseDir, 'keywords.json'), 'utf-8'));
const regions = JSON.parse(fs.readFileSync(path.join(baseDir, 'regions.json'), 'utf-8'));

// 准备语句
const insertItem = db.prepare(`
  INSERT OR IGNORE INTO procurement_items 
  (title, url, project_id, publish_date, region, region_code, keyword, category, buyer, project_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateProgress = db.prepare(`
  INSERT INTO crawl_progress (keyword, region_code, last_count, last_crawl_time)
  VALUES (?, ?, ?, datetime('now'))
  ON CONFLICT(keyword, region_code) 
  DO UPDATE SET last_count = ?, last_crawl_time = datetime('now')
`);

const insertLog = db.prepare(`
  INSERT INTO search_logs (keyword, region, region_code, result_count, new_count)
  VALUES (?, ?, ?, ?, ?)
`);

const getProgress = db.prepare(`
  SELECT last_crawl_time FROM crawl_progress WHERE keyword = ? AND region_code = ?
`);

/**
 * 模拟搜索 - 实际使用时需要浏览器自动化
 * 这里返回模拟数据用于测试
 */
function mockSearch(keyword, regionName, regionCode) {
  // 实际实现需要通过浏览器扩展操作
  // 这里返回测试数据
  const mockData = [];
  const count = Math.floor(Math.random() * 5) + 1;
  
  for (let i = 0; i < count; i++) {
    mockData.push({
      title: `[${regionName}] ${keyword} 相关采购项目 ${Date.now()}`,
      url: `https://search.ccgp.gov.cn/detail/${regionCode}/${keyword}/${Date.now()}/${i}`,
      publishDate: new Date().toISOString().split('T')[0],
      buyer: `${regionName}教育局`,
      projectType: ['公开招标', '竞争性谈判', '询价'][Math.floor(Math.random() * 3)]
    });
  }
  
  return mockData;
}

/**
 * 采集单个关键词+省市
 */
function crawlKeywordRegion(keyword, category, regionName, regionCode) {
  console.log(`  搜索: ${keyword} @ ${regionName}`);
  
  // 检查上次采集时间
  const progress = getProgress.get(keyword, regionCode);
  if (progress) {
    console.log(`    上次采集: ${progress.last_crawl_time}`);
  }
  
  // 搜索数据（实际需要浏览器自动化）
  const items = mockSearch(keyword, regionName, regionCode);
  
  // 插入数据库（自动去重）
  let newCount = 0;
  for (const item of items) {
    const result = insertItem.run(
      item.title,
      item.url,
      null,
      item.publishDate,
      regionName,
      regionCode,
      keyword,
      category,
      item.buyer,
      item.projectType
    );
    if (result.changes > 0) newCount++;
  }
  
  // 更新进度
  updateProgress.run(keyword, regionCode, items.length, items.length);
  
  // 记录日志
  insertLog.run(keyword, regionName, regionCode, items.length, newCount);
  
  console.log(`    找到 ${items.length} 条，新增 ${newCount} 条`);
  
  return { total: items.length, newCount };
}

/**
 * 主采集流程
 */
function runCrawl() {
  console.log('=== 政府采购信息采集开始 ===');
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('');
  
  const stats = {
    totalKeywords: 0,
    totalRegions: 0,
    totalItems: 0,
    newItems: 0
  };
  
  // 遍历所有类别和关键词
  for (const [category, keywordList] of Object.entries(keywords)) {
    console.log(`\n【${category}】`);
    
    for (const keyword of keywordList) {
      stats.totalKeywords++;
      console.log(`\n关键词: ${keyword}`);
      
      // 遍历所有省市
      for (const [regionName, regionCode] of Object.entries(regions)) {
        stats.totalRegions++;
        
        try {
          const result = crawlKeywordRegion(keyword, category, regionName, regionCode);
          stats.totalItems += result.total;
          stats.newItems += result.newCount;
          
          // 间隔避免被封
          // 实际使用时需要 sleep
        } catch (err) {
          console.error(`    错误: ${err.message}`);
        }
      }
    }
  }
  
  console.log('\n=== 采集完成 ===');
  console.log(`关键词数: ${stats.totalKeywords}`);
  console.log(`省市数: ${Object.keys(regions).length}`);
  console.log(`总搜索次数: ${stats.totalKeywords * Object.keys(regions).length}`);
  console.log(`找到记录: ${stats.totalItems}`);
  console.log(`新增记录: ${stats.newItems}`);
  
  return stats;
}

// 导出
module.exports = { runCrawl, crawlKeywordRegion };

// 直接运行时执行采集
if (require.main === module) {
  runCrawl();
}