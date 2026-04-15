/**
 * 政府采购信息增量采集脚本 v4
 * - 不删除进度表
 * - 只采集最近30天的数据
 * - 使用浏览器访问（更稳定）
 */

const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const path = require('path');

const baseDir = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement');
const dbPath = path.join(baseDir, 'procurement.db');
const db = new Database(dbPath);

// 创建索引（如果不存在）
db.exec(`CREATE INDEX IF NOT EXISTS idx_url ON procurement_items(url)`);

// 关键词列表
const ALL_KEYWORDS = {
  "政策项目类": ["双优校建设", "双高建设", "教师档案袋"],
  "智慧校园类": ["职业教育SaaS", "软件平台", "云服务", "智慧校园", "教务系统", "信息化标杆校", "学工系统", "数据中台"],
  "领讲产品类": ["智慧教室", "智能讲台", "教学软件", "教学平台", "多媒体教室", "教室改造"],
  "课程资源类": ["资源", "精品课程", "开放课程", "微课资源", "数字人课程", "数字人视频", "教学视频"],
  "师资培训类": ["AI", "数智化素养", "数字素养", "师资培训", "人工智能培训", "赋能培训"]
};

// 时间范围：最近30天
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);
const formatParam = (d) => `${d.getFullYear()}:${String(d.getMonth() + 1).padStart(2, '0')}:${String(d.getDate()).padStart(2, '0')}`;
const startDateStr = formatParam(startDate);
const endDateStr = formatParam(endDate);

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

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 检查 URL 是否有效
function isValidUrl(url) {
  if (!url) return false;
  if (!url.startsWith('http://www.ccgp.gov.cn/')) return false;
  if (!url.includes('/t20')) return false;
  return true;
}

// 检查采购人是否有效（学校相关）
function isValidBuyer(buyer) {
  if (!buyer || buyer.length < 4) return true; // 暂时允许所有
  const schoolKeywords = ['学校', '中心', '学院', '中学', '高中', '集团', '大学', '小学', '教育', '培训'];
  return schoolKeywords.some(kw => buyer.includes(kw));
}

// 构建搜索URL
function buildSearchUrl(keyword) {
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
    start_time: startDateStr,
    end_time: endDateStr,
    timeType: '3',
    displayZone: '',
    zoneId: '',
    pppStatus: '0',
    agentName: ''
  });
  return `https://search.ccgp.gov.cn/bxsearch?${params.toString()}`;
}

// 解析搜索结果
function parseSearchResults(snapshot, keyword, category) {
  const results = [];
  const lines = snapshot.split('\n');
  
  let currentTitle = null;
  let currentUrl = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 匹配标题
    const linkMatch = line.match(/link\s+"([^"]+)"\s+\[ref=e\d+\]/);
    if (linkMatch) {
      currentTitle = linkMatch[1].trim();
      currentUrl = null;
      continue;
    }
    
    // 匹配URL
    const urlMatch = line.match(/\/url:\s+(http:\/\/www\.ccgp\.gov\.cn\/[^\s]+)/);
    if (urlMatch && currentTitle) {
      currentUrl = urlMatch[1].trim();
      
      if (isValidUrl(currentUrl) && currentTitle.length > 10 && !currentTitle.includes('首页')) {
        // 向后查找日期、采购人等信息
        for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
          const searchLine = lines[j];
          
          if (searchLine.includes('采购人') || searchLine.match(/\d{4}\.\d{2}\.\d{2}/)) {
            // 提取日期
            const dateMatch = searchLine.match(/(\d{4})\.(\d{2})\.(\d{2})/);
            const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : '';
            
            // 提取采购人
            const buyerMatch = searchLine.match(/采购人[：:]\s*([^|]+)/);
            const buyer = buyerMatch ? buyerMatch[1].trim() : '';
            
            // 提取地区
            const regionMatch = searchLine.match(/\|\s*(四川|北京|上海|天津|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|贵州|云南|陕西|甘肃|青海|内蒙古|广西|西藏|宁夏|新疆)\s*\|/);
            const region = regionMatch ? regionMatch[1] : '';
            
            // 提取类型
            let type = '';
            const typeMatch = searchLine.match(/strong\s+\[ref=e\d+\]:\s*([^|\s]+)/);
            if (typeMatch) type = typeMatch[1].trim();
            
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

// 采集单个关键词
async function crawlKeyword(keyword, category) {
  console.log(`  [${keyword}]`);
  
  const url = buildSearchUrl(keyword);
  
  try {
    // 导航到搜索页面
    execSync(`openclaw browser navigate "${url}"`, { 
      encoding: 'utf-8', 
      timeout: 60000,
      stdio: 'pipe'
    });
    
    // 等待页面加载
    await delay(4000);
    
    // 获取页面快照
    const snapshot = execSync('openclaw browser snapshot', { 
      encoding: 'utf-8', 
      timeout: 30000,
      stdio: 'pipe'
    });
    
    // 解析结果
    const results = parseSearchResults(snapshot, keyword, category);
    
    // 保存到数据库
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
      } catch (e) {
        // 忽略重复
      }
    }
    
    // 记录日志
    insertLog.run(keyword, null, null, results.length, newCount, new Date().toISOString());
    
    // 更新进度
    updateProgress.run(keyword);
    
    if (results.length > 0 || newCount > 0) {
      console.log(`    找到 ${results.length} 条，新增 ${newCount} 条`);
    } else {
      console.log(`    无结果`);
    }
    
    return { found: results.length, new: newCount };
    
  } catch (err) {
    console.log(`    错误: ${err.message}`);
    return { found: 0, new: 0, error: err.message };
  }
}

// 主函数
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           政府采购信息增量采集 v4                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n时间范围: ${startDateStr.replace(/:/g, '-')} 至 ${endDateStr.replace(/:/g, '-')}`);
  console.log(`开始时间: ${new Date().toLocaleString('zh-CN')}\n`);

  let totalFound = 0;
  let totalNew = 0;
  let errorCount = 0;
  const startTime = Date.now();

  // 遍历所有类别和关键词
  const entries = Object.entries(ALL_KEYWORDS);
  for (let i = 0; i < entries.length; i++) {
    const [category, keywords] = entries[i];
    console.log(`\n【${category}】(${i + 1}/${entries.length})`);
    
    for (const keyword of keywords) {
      const result = await crawlKeyword(keyword, category);
      totalFound += result.found;
      totalNew += result.new;
      if (result.error) errorCount++;
      
      // 间隔2-3秒
      await delay(2000 + Math.random() * 1000);
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
  console.log(`\n数据库总量: ${total.count}`);

  // 按类别统计
  console.log('\n按类别统计:');
  const catStats = db.prepare('SELECT category, COUNT(*) as count FROM procurement_items GROUP BY category ORDER BY count DESC').all();
  catStats.forEach(s => console.log(`  ${s.category || '未分类'}: ${s.count}条`));

  db.close();

  console.log('\n✅ 增量采集完成！');

  // 返回摘要
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
  try { db.close(); } catch(e) {}
  process.exit(1);
});