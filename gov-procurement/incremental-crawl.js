/**
 * 政府采购信息增量采集脚本
 * 只采集最近的数据，自动去重
 */

const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const path = require('path');

const baseDir = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement');
const dbPath = path.join(baseDir, 'procurement.db');
const db = new Database(dbPath);

// 检查并创建采集进度表
try {
  // 先删除旧表（如果结构不对）
  const tableInfo = db.prepare('PRAGMA table_info(crawl_progress)').all();
  if (tableInfo.length > 0) {
    // 表存在，删除重建
    db.exec('DROP TABLE IF EXISTS crawl_progress');
  }
} catch (e) {
  // 表不存在，忽略
}

// 创建正确的表结构
db.exec(`
  CREATE TABLE IF NOT EXISTS crawl_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT UNIQUE,
    last_crawl_time DATETIME,
    last_publish_date DATE
  )
`);

// 创建索引
db.exec(`CREATE INDEX IF NOT EXISTS idx_url ON procurement_items(url)`);

// 关键词列表
const allKeywords = {
  "政策项目类": ["双优校建设", "双高建设", "教师档案袋"],
  "智慧校园类": ["职业教育SaaS", "软件平台", "云服务", "智慧校园", "教务系统", "信息化标杆校", "学工系统", "数据中台"],
  "领讲产品类": ["智慧教室", "智能讲台", "教学软件", "教学平台", "多媒体教室", "教室改造"],
  "课程资源类": ["资源", "精品课程", "开放课程", "微课资源", "数字人课程", "数字人视频", "教学视频"],
  "师资培训类": ["AI", "数智化素养", "数字素养", "师资培训", "人工智能培训", "赋能培训"]
};

// 增量采集：只采集最近30天的数据
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30); // 最近30天
const startDateStr = `${startDate.getFullYear()}:${String(startDate.getMonth() + 1).padStart(2, '0')}:${String(startDate.getDate()).padStart(2, '0')}`;
const endDateStr = `${endDate.getFullYear()}:${String(endDate.getMonth() + 1).padStart(2, '0')}:${String(endDate.getDate()).padStart(2, '0')}`;

// 数据库操作
const insertItem = db.prepare(`
  INSERT OR IGNORE INTO procurement_items 
  (title, url, keyword, region, category, publish_date, buyer, project_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertLog = db.prepare(`
  INSERT INTO search_logs (keyword, region, region_code, result_count, new_count, search_time)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const updateProgress = db.prepare(`
  INSERT INTO crawl_progress (keyword, last_crawl_time)
  VALUES (?, datetime('now'))
  ON CONFLICT(keyword) DO UPDATE SET
    last_crawl_time = datetime('now')
`);

// 解析快照
function parseSnapshot(snapshot, keyword, category) {
  const lines = snapshot.split('\n');
  const results = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 匹配公告链接
    const linkMatch = line.match(/link "([^"]+)" \[ref=e\d+\].*\/url: (http[s]?:\/\/[^\s]+)/);
    if (linkMatch && linkMatch[1].length > 15 && !linkMatch[1].includes('首页')) {
      const title = linkMatch[1];
      const url = linkMatch[2];
      
      // 尝试从后续行提取信息
      let region = '';
      let date = '';
      let buyer = '';
      let type = '';
      
      // 向后查找相关信息
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const nextLine = lines[j];
        
        // 提取日期
        const dateMatch = nextLine.match(/(\d{4}\.\d{2}\.\d{2})/);
        if (dateMatch) date = dateMatch[1].replace(/\./g, '-');
        
        // 提取采购人
        if (nextLine.includes('采购人：')) {
          const buyerMatch = nextLine.match(/采购人：([^|]+)/);
          if (buyerMatch) buyer = buyerMatch[1].trim();
        }
        
        // 提取地区
        if (nextLine.includes('|') && nextLine.includes('强')) {
          const regionMatch = nextLine.match(/\| ([^|]+) \|$/);
          if (regionMatch) region = regionMatch[1].trim();
        }
        
        // 提取类型
        const typeMatch = nextLine.match(/strong \[ref=e\d+\]: ([^|]+)/);
        if (typeMatch) type = typeMatch[1].trim();
      }
      
      results.push({ title, url, region, date, buyer, type, keyword, category });
    }
  }
  
  return results;
}

// 采集单个关键词
function crawlKeyword(keyword, category) {
  console.log(`\n  关键词: ${keyword}`);
  
  // 构建搜索URL
  const url = `https://search.ccgp.gov.cn/bxsearch?searchtype=1&kw=${encodeURIComponent(keyword)}&start_time=${startDateStr}&end_time=${endDateStr}&timeType=6`;
  
  try {
    // 导航到搜索页面
    execSync(`openclaw browser --browser-profile chrome navigate "${url}"`, { encoding: 'utf-8', timeout: 60000 });
    
    // 等待页面加载
    execSync('timeout /t 3 /nobreak >nul 2>&1', { shell: true });
    
    // 获取页面快照
    const snapshot = execSync('openclaw browser --browser-profile chrome snapshot', { encoding: 'utf-8', timeout: 30000 });
    
    // 解析结果
    const results = parseSnapshot(snapshot, keyword, category);
    
    // 保存到数据库
    let newCount = 0;
    for (const item of results) {
      const result = insertItem.run(
        item.title,
        item.url,
        item.keyword,
        item.region,
        item.category,
        item.date || new Date().toISOString().split('T')[0],
        item.buyer,
        item.type
      );
      if (result.changes > 0) newCount++;
    }
    
    // 记录日志
    insertLog.run(keyword, null, null, results.length, newCount, new Date().toISOString());
    
    // 更新进度
    updateProgress.run(keyword);
    
    console.log(`    找到 ${results.length} 条，新增 ${newCount} 条`);
    return { found: results.length, new: newCount };
    
  } catch (err) {
    console.log(`    错误: ${err.message}`);
    return { found: 0, new: 0, error: err.message };
  }
}

// 主函数
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           政府采购信息增量采集                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n时间范围: ${startDateStr.replace(/:/g, '-')} 至 ${endDateStr.replace(/:/g, '-')}`);
  console.log(`开始时间: ${new Date().toLocaleString('zh-CN')}\n`);

  let totalFound = 0;
  let totalNew = 0;
  let errorCount = 0;
  const startTime = Date.now();

  for (const [category, keywords] of Object.entries(allKeywords)) {
    console.log(`\n【${category}】`);
    
    for (const keyword of keywords) {
      const result = crawlKeyword(keyword, category);
      totalFound += result.found;
      totalNew += result.new;
      if (result.error) errorCount++;
      
      // 间隔2-3秒
      const delay = 2000 + Math.random() * 1000;
      execSync(`timeout /t ${Math.floor(delay / 1000)} /nobreak >nul 2>&1`, { shell: true });
    }
  }

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    采集报告                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`结束时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`耗时: ${Math.floor(duration / 60)}分${duration % 60}秒`);
  console.log(`找到记录: ${totalFound}`);
  console.log(`新增记录: ${totalNew}`);
  console.log(`错误次数: ${errorCount}`);

  const total = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
  console.log(`数据库总量: ${total.count}`);

  db.close();

  console.log('\n增量采集完成！');

  // 返回摘要（用于报告）
  return {
    totalFound,
    totalNew,
    errorCount,
    duration,
    dbTotal: total.count
  };
}

main().catch(err => {
  console.error('采集失败:', err);
  db.close();
  process.exit(1);
});