/**
 * 政府采购信息全量采集脚本
 * 通过 OpenClaw 浏览器扩展采集真实数据
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const baseDir = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement');
const dbPath = path.join(baseDir, 'procurement.db');
const db = new Database(dbPath);

// 加载配置
const keywords = JSON.parse(fs.readFileSync(path.join(baseDir, 'keywords.json'), 'utf-8'));
const regions = JSON.parse(fs.readFileSync(path.join(baseDir, 'regions.json'), 'utf-8'));

// 时间范围：一年内
const endDate = new Date();
const startDate = new Date();
startDate.setFullYear(startDate.getFullYear() - 1);

const startDateStr = `${startDate.getFullYear()}:${String(startDate.getMonth() + 1).padStart(2, '0')}:${String(startDate.getDate()).padStart(2, '0')}`;
const endDateStr = `${endDate.getFullYear()}:${String(endDate.getMonth() + 1).padStart(2, '0')}:${String(endDate.getDate()).padStart(2, '0')}`;

console.log(`采集时间范围: ${startDateStr} 至 ${endDateStr}`);
console.log(`关键词数: ${Object.values(keywords).flat().length}`);
console.log(`省市数: ${Object.keys(regions).length}`);
console.log('');

// 准备SQL
const insertItem = db.prepare(`
  INSERT OR IGNORE INTO procurement_items 
  (title, url, keyword, region, region_code, category, publish_date)
  VALUES (?, ?, ?, ?, ?, ?, ?)
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

// 统计
let totalCount = 0;
let newCount = 0;
let searchCount = 0;

// 采集函数
function crawlKeyword(keyword, category, regionName, regionCode) {
  searchCount++;
  
  // 构建URL
  const url = `https://search.ccgp.gov.cn/bxsearch?searchtype=1&kw=${encodeURIComponent(keyword)}&displayZone=${encodeURIComponent(regionName)}&zoneId=${regionCode}&start_time=${startDateStr}&end_time=${endDateStr}&timeType=6`;
  
  try {
    // 导航到搜索页面
    execSync(`openclaw browser --browser-profile chrome navigate "${url}"`, { encoding: 'utf-8', timeout: 30000 });
    
    // 等待页面加载
    execSync('timeout /t 3 /nobreak >nul 2>&1', { shell: true });
    
    // 获取页面快照
    const snapshot = execSync('openclaw browser --browser-profile chrome snapshot', { encoding: 'utf-8', timeout: 30000 });
    
    // 解析结果
    const lines = snapshot.split('\n');
    const results = [];
    
    for (const line of lines) {
      // 匹配采购公告链接
      const match = line.match(/link "([^"]+)" \[ref=e\d+\]/);
      if (match && match[1].length > 10 && !match[1].includes('首页') && !match[1].includes('政采法规')) {
        results.push({
          title: match[1],
          url: `https://search.ccgp.gov.cn/detail/${regionCode}/${keyword}/${Date.now()}/${results.length}`
        });
      }
    }
    
    // 保存到数据库
    let regionNewCount = 0;
    for (const item of results) {
      const result = insertItem.run(
        item.title,
        item.url,
        keyword,
        regionName,
        regionCode,
        category,
        new Date().toISOString().split('T')[0]
      );
      if (result.changes > 0) regionNewCount++;
    }
    
    totalCount += results.length;
    newCount += regionNewCount;
    
    // 更新进度
    updateProgress.run(keyword, regionCode, results.length, results.length);
    insertLog.run(keyword, regionName, regionCode, results.length, regionNewCount);
    
    console.log(`  [${regionName}] ${keyword}: 找到 ${results.length} 条，新增 ${regionNewCount} 条`);
    
    return { found: results.length, new: regionNewCount };
    
  } catch (err) {
    console.log(`  [${regionName}] ${keyword}: 错误 - ${err.message}`);
    return { found: 0, new: 0 };
  }
}

// 主采集流程
console.log('=== 开始全量采集 ===');
console.log(`开始时间: ${new Date().toLocaleString('zh-CN')}`);
console.log('');

const startTime = Date.now();

// 遍历所有类别和关键词
for (const [category, keywordList] of Object.entries(keywords)) {
  console.log(`\n【${category}】`);
  
  for (const keyword of keywordList) {
    console.log(`\n关键词: ${keyword}`);
    
    // 遍历所有省市
    for (const [regionName, regionCode] of Object.entries(regions)) {
      crawlKeyword(keyword, category, regionName, regionCode);
      
      // 间隔2秒，避免被封
      execSync('timeout /t 2 /nobreak >nul 2>&1', { shell: true });
    }
  }
}

const duration = Math.round((Date.now() - startTime) / 1000);
const minutes = Math.floor(duration / 60);
const seconds = duration % 60;

console.log('\n=== 采集完成 ===');
console.log(`结束时间: ${new Date().toLocaleString('zh-CN')}`);
console.log(`耗时: ${minutes}分${seconds}秒`);
console.log(`搜索次数: ${searchCount}`);
console.log(`找到记录: ${totalCount}`);
console.log(`新增记录: ${newCount}`);

db.close();