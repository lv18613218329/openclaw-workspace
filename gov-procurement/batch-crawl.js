/**
 * 政府采购信息批量采集脚本
 * 通过 OpenClaw 浏览器扩展采集真实数据
 * 支持分页采集
 */

const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const path = require('path');

const baseDir = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement');
const dbPath = path.join(baseDir, 'procurement.db');
const db = new Database(dbPath);

// 关键词列表
const allKeywords = {
  "政策项目类": ["双优校建设", "双高建设", "教师档案袋"],
  "智慧校园类": ["职业教育SaaS", "软件平台", "云服务", "智慧校园", "教务系统", "信息化标杆校", "学工系统", "数据中台"],
  "领讲产品类": ["智慧教室", "智能讲台", "教学软件", "教学平台", "多媒体教室", "教室改造"],
  "课程资源类": ["资源", "精品课程", "开放课程", "微课资源", "数字人课程", "数字人视频", "教学视频"],
  "师资培训类": ["AI", "数智化素养", "数字素养", "师资培训", "人工智能培训", "赋能培训"]
};

// 时间范围：一年内
const endDate = new Date();
const startDate = new Date();
startDate.setFullYear(startDate.getFullYear() - 1);
const startDateStr = `${startDate.getFullYear()}:${String(startDate.getMonth() + 1).padStart(2, '0')}:${String(startDate.getDate()).padStart(2, '0')}`;
const endDateStr = `${endDate.getFullYear()}:${String(endDate.getMonth() + 1).padStart(2, '0')}:${String(endDate.getDate()).padStart(2, '0')}`;

// 数据库操作
const insertItem = db.prepare(`
  INSERT OR IGNORE INTO procurement_items 
  (title, url, keyword, region, category, publish_date, buyer, project_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
  console.log(`\n关键词: ${keyword}`);
  
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
    
    console.log(`  找到 ${results.length} 条，新增 ${newCount} 条`);
    return { found: results.length, new: newCount };
    
  } catch (err) {
    console.log(`  错误: ${err.message}`);
    return { found: 0, new: 0 };
  }
}

// 主函数
console.log('=== 政府采购信息全量采集 ===');
console.log(`时间范围: ${startDateStr} 至 ${endDateStr}`);
console.log(`开始时间: ${new Date().toLocaleString('zh-CN')}`);

let totalFound = 0;
let totalNew = 0;

for (const [category, keywords] of Object.entries(allKeywords)) {
  console.log(`\n【${category}】`);
  
  for (const keyword of keywords) {
    const result = crawlKeyword(keyword, category);
    totalFound += result.found;
    totalNew += result.new;
    
    // 间隔2秒
    execSync('timeout /t 2 /nobreak >nul 2>&1', { shell: true });
  }
}

console.log('\n=== 采集完成 ===');
console.log(`结束时间: ${new Date().toLocaleString('zh-CN')}`);
console.log(`找到记录: ${totalFound}`);
console.log(`新增记录: ${totalNew}`);

const total = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
console.log(`数据库总量: ${total.count}`);

db.close();