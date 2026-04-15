/**
 * 政府采购信息采集脚本
 * 
 * 使用方法：
 * 1. 确保 OpenClaw Browser Relay 扩展已激活
 * 2. 运行: node scripts/crawl.js
 */

const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== 配置 ====================

// 学校关键词（用于过滤有效数据）
const SCHOOL_KEYWORDS = ['学校', '中心', '学院', '中学', '高中', '集团', '大学', '小学'];

// 采集关键词配置
const ALL_KEYWORDS = {
  "政策项目类": ["双优校建设", "双高建设", "教师档案袋"],
  "智慧校园类": ["职业教育SaaS", "软件平台", "云服务", "智慧校园", "教务系统", "信息化标杆校", "学工系统", "数据中台"],
  "领讲产品类": ["智慧教室", "智能讲台", "教学软件", "教学平台", "多媒体教室", "教室改造"],
  "课程资源类": ["资源", "精品课程", "开放课程", "微课资源", "数字人课程", "数字人视频", "教学视频"],
  "师资培训类": ["AI", "数智化素养", "数字素养", "师资培训", "人工智能培训", "赋能培训"]
};

// ==================== 数据库 ====================

const baseDir = path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw', 'workspace', 'gov-procurement');
const dbPath = path.join(baseDir, 'procurement.db');

// 确保目录存在
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

const db = new Database(dbPath);

// 初始化表结构
db.exec(`
  CREATE TABLE IF NOT EXISTS procurement_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT UNIQUE,
    project_id TEXT,
    publish_date DATE,
    region TEXT,
    region_code TEXT,
    keyword TEXT,
    category TEXT,
    buyer TEXT,
    buyer_contact TEXT,
    agent TEXT,
    agent_contact TEXT,
    budget REAL,
    project_type TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT,
    region TEXT,
    region_code TEXT,
    result_count INTEGER,
    new_count INTEGER,
    search_time DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const insertItem = db.prepare(`
  INSERT OR IGNORE INTO procurement_items 
  (title, url, keyword, region, category, publish_date, buyer, project_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// ==================== 核心函数 ====================

function isValidBuyer(buyer) {
  if (!buyer || buyer.length < 4) return false;
  return SCHOOL_KEYWORDS.some(kw => buyer.includes(kw));
}

function isValidUrl(url) {
  if (!url) return false;
  if (!url.startsWith('http://www.ccgp.gov.cn/')) return false;
  if (!url.includes('/t20')) return false;
  return true;
}

function buildSearchUrl(keyword, startDate, endDate) {
  const formatParam = (d) => `${d.getFullYear()}:${String(d.getMonth() + 1).padStart(2, '0')}:${String(d.getDate()).padStart(2, '0')}`;
  
  const params = new URLSearchParams({
    searchtype: '1',
    page_index: '1',
    bidSort: '',
    buyerName: '',
    projectId: '',
    pinMu: '',
    bidType: '',
    dbselect: 'bidx',
    kw: keyword,
    start_time: formatParam(startDate),
    end_time: formatParam(endDate),
    timeType: '3',
    displayZone: '',
    zoneId: '',
    pppStatus: '0',
    agentName: ''
  });
  
  return `https://search.ccgp.gov.cn/bxsearch?${params.toString()}`;
}

function parseSearchResults(snapshot, keyword, category) {
  const results = [];
  const lines = snapshot.split('\n');
  
  let currentTitle = null;
  let currentUrl = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const linkMatch = line.match(/link\s+"([^"]+)"\s+\[ref=e\d+\]/);
    if (linkMatch) {
      currentTitle = linkMatch[1].trim();
      currentUrl = null;
      continue;
    }
    
    const urlMatch = line.match(/\/url:\s+(http:\/\/www\.ccgp\.gov\.cn\/[^\s]+)/);
    if (urlMatch && currentTitle) {
      currentUrl = urlMatch[1].trim();
      
      if (isValidUrl(currentUrl) && currentTitle.length > 10) {
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const searchLine = lines[j];
          
          if (searchLine.includes('采购人')) {
            const dateMatch = searchLine.match(/(\d{4})\.(\d{2})\.(\d{2})/);
            const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : '';
            
            const buyerMatch = searchLine.match(/采购人[：:]\s*([^|]+)/);
            const buyer = buyerMatch ? buyerMatch[1].trim() : '';
            
            const regionMatch = searchLine.match(/\|\s*(四川|北京|上海|天津|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|贵州|云南|陕西|甘肃|青海|台湾|内蒙古|广西|西藏|宁夏|新疆|香港|澳门)\s*\|/);
            const region = regionMatch ? regionMatch[1] : '';
            
            let type = '';
            if (j + 1 < lines.length) {
              const typeMatch = lines[j + 1].match(/strong\s+\[ref=e\d+\]:\s*([^|\s]+)/);
              if (typeMatch) {
                type = typeMatch[1].trim();
              }
            }
            
            if (isValidBuyer(buyer)) {
              results.push({
                title: currentTitle,
                url: currentUrl,
                keyword,
                category,
                region,
                buyer,
                date,
                type
              });
            }
            
            break;
          }
        }
      }
      
      currentTitle = null;
      currentUrl = null;
    }
  }
  
  return results;
}

// ==================== 采集函数 ====================

async function crawlKeyword(keyword, category, startDate, endDate) {
  console.log(`\n  关键词: ${keyword}`);
  
  const url = buildSearchUrl(keyword, startDate, endDate);
  
  try {
    console.log(`    正在访问...`);
    execSync(`openclaw browser --browser-profile chrome navigate "${url}"`, { 
      encoding: 'utf-8', 
      timeout: 60000,
      stdio: 'pipe'
    });
    
    await delay(5000);
    
    const snapshot = execSync('openclaw browser --browser-profile chrome snapshot', { 
      encoding: 'utf-8', 
      timeout: 30000,
      stdio: 'pipe'
    });
    
    const results = parseSearchResults(snapshot, keyword, category);
    
    let newCount = 0;
    for (const item of results) {
      try {
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
      } catch (e) {}
    }
    
    console.log(`    找到 ${results.length} 条，新增 ${newCount} 条`);
    return { found: results.length, new: newCount };
    
  } catch (err) {
    console.log(`    错误: ${err.message}`);
    return { found: 0, new: 0, error: err.message };
  }
}

// ==================== 主函数 ====================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           政府采购信息采集                                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  console.log(`\n时间范围: ${formatDate(startDate)} 至 ${formatDate(endDate)}`);
  console.log(`学校关键词过滤: ${SCHOOL_KEYWORDS.join(', ')}`);
  console.log(`开始时间: ${new Date().toLocaleString('zh-CN')}\n`);

  let totalFound = 0;
  let totalNew = 0;
  const startTime = Date.now();

  for (const [category, keywords] of Object.entries(ALL_KEYWORDS)) {
    console.log(`\n【${category}】`);
    
    for (const keyword of keywords) {
      const result = await crawlKeyword(keyword, category, startDate, endDate);
      totalFound += result.found;
      totalNew += result.new;
      
      await delay(2000 + Math.random() * 2000);
    }
  }

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    采集报告                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`耗时: ${Math.floor(duration / 60)}分${duration % 60}秒`);
  console.log(`找到记录: ${totalFound}`);
  console.log(`新增记录: ${totalNew}`);

  const total = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
  console.log(`\n数据库总量: ${total.count}`);

  db.close();
  console.log('\n✅ 采集完成！');
}

main().catch(err => {
  console.error('采集失败:', err);
  try { db.close(); } catch(e) {}
  process.exit(1);
});