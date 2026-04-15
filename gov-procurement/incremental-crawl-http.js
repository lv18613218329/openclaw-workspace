/**
 * 政府采购信息增量采集脚本
 * 使用 HTTP 请求方式采集数据
 */

const https = require('https');
const http = require('http');
const Database = require('better-sqlite3');
const path = require('path');
const { URL } = require('url');

const baseDir = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement');
const dbPath = path.join(baseDir, 'procurement.db');
const db = new Database(dbPath);

// 创建采集进度表
try {
  const tableInfo = db.prepare('PRAGMA table_info(crawl_progress)').all();
  if (tableInfo.length > 0) {
    db.exec('DROP TABLE IF EXISTS crawl_progress');
  }
} catch (e) { }

db.exec(`
  CREATE TABLE IF NOT EXISTS crawl_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT UNIQUE,
    last_crawl_time DATETIME,
    last_publish_date DATE
  )
`);

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
startDate.setDate(startDate.getDate() - 30);
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

// HTTP 请求函数
function fetch(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Connection': 'keep-alive'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // 跟随重定向
          fetch(res.headers.location).then(resolve).catch(reject);
        } else {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

// 解析HTML结果
function parseResults(html, keyword, category) {
  const results = [];
  
  // 匹配搜索结果项
  // 政府采购网的搜索结果格式
  const itemRegex = /<li[^>]*class="[^"]*lists-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  const linkRegex = /<a[^>]*href="([^"]+)"[^>]*title="([^"]+)"[^>]*>/i;
  const dateRegex = /(\d{4})-(\d{2})-(\d{2})/g;
  const buyerRegex = /采购人[：:]\s*([^<\s]+)/;
  const regionRegex = /地区[：:]\s*([^<\s]+)/;
  
  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const itemHtml = match[1];
    
    // 提取链接和标题
    const linkMatch = linkRegex.exec(itemHtml);
    if (linkMatch) {
      const url = linkMatch[1];
      const title = linkMatch[2];
      
      // 提取日期
      const dateMatch = dateRegex.exec(itemHtml);
      const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : '';
      
      // 提取采购人
      const buyerMatch = buyerRegex.exec(itemHtml);
      const buyer = buyerMatch ? buyerMatch[1].trim() : '';
      
      // 提取地区
      const regionMatch = regionRegex.exec(itemHtml);
      const region = regionMatch ? regionMatch[1].trim() : '';
      
      if (title && title.length > 10 && !title.includes('首页')) {
        results.push({
          title: title.trim(),
          url: url.trim(),
          region,
          date,
          buyer,
          keyword,
          category
        });
      }
    }
    
    // 重置正则的lastIndex以匹配下一个日期
    dateRegex.lastIndex = 0;
  }
  
  // 备用解析：尝试另一种格式
  if (results.length === 0) {
    // 尝试匹配 div 或其他结构
    const divRegex = /<div[^>]*class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    while ((match = divRegex.exec(html)) !== null) {
      const divHtml = match[1];
      const hrefMatch = /href="([^"]+)"[^>]*>([^<]+)</.exec(divHtml);
      if (hrefMatch && hrefMatch[2].length > 10) {
        results.push({
          title: hrefMatch[2].trim(),
          url: hrefMatch[1].trim(),
          keyword,
          category,
          date: '',
          buyer: '',
          region: ''
        });
      }
    }
  }
  
  return results;
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 采集单个关键词
async function crawlKeyword(keyword, category) {
  console.log(`\n  关键词: ${keyword}`);
  
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://search.ccgp.gov.cn/bxsearch?searchtype=1&kw=${encodedKeyword}&start_time=${startDateStr}&end_time=${endDateStr}&timeType=6`;
  
  try {
    const response = await fetch(url);
    
    if (response.status !== 200) {
      console.log(`    HTTP状态: ${response.status}`);
      return { found: 0, new: 0, error: `HTTP ${response.status}` };
    }
    
    // 解析结果
    const results = parseResults(response.data, keyword, category);
    
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
          item.project_type || ''
        );
        if (result.changes > 0) newCount++;
      } catch (e) {
        // 忽略重复URL错误
      }
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
  console.log('║           政府采购信息增量采集 (HTTP模式)                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n时间范围: ${startDateStr.replace(/:/g, '-')} 至 ${endDateStr.replace(/:/g, '-')}`);
  console.log(`开始时间: ${new Date().toLocaleString('zh-CN')}\n`);

  let totalFound = 0;
  let totalNew = 0;
  let errorCount = 0;
  const startTime = Date.now();
  const errors = [];

  for (const [category, keywords] of Object.entries(allKeywords)) {
    console.log(`\n【${category}】`);
    
    for (const keyword of keywords) {
      const result = await crawlKeyword(keyword, category);
      totalFound += result.found;
      totalNew += result.new;
      if (result.error) {
        errorCount++;
        errors.push({ keyword, error: result.error });
      }
      
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

  if (errors.length > 0 && errors.length <= 5) {
    console.log('\n错误详情:');
    errors.forEach(e => console.log(`  - ${e.keyword}: ${e.error}`));
  }

  const total = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
  console.log(`\n数据库总量: ${total.count}`);

  // 按关键词统计
  console.log('\n按关键词统计:');
  const stats = db.prepare('SELECT keyword, COUNT(*) as count FROM procurement_items GROUP BY keyword ORDER BY count DESC LIMIT 10').all();
  stats.forEach(s => console.log(`  ${s.keyword}: ${s.count}条`));

  db.close();

  console.log('\n✅ 增量采集完成！');

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