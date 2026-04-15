/**
 * 政府采购信息采集脚本 v2
 * 
 * 改进点：
 * 1. 学校关键词过滤 - 只保留采购人包含学校关键词的记录
 * 2. URL完整性 - 必须是 http://www.ccgp.gov.cn/ 开头的真实地址
 * 3. 标题完整性 - 提取完整标题，不截取
 * 4. 地区准确性 - 正确提取省市信息
 */

const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const path = require('path');

const baseDir = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement');
const dbPath = path.join(baseDir, 'procurement.db');
const db = new Database(dbPath);

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

// 时间范围：最近30天
const getDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const formatDate = (d) => `${d.getFullYear()}:${String(d.getMonth() + 1).padStart(2, '0')}:${String(d.getDate()).padStart(2, '0')}`;
  
  return {
    start: formatDate(startDate),
    end: formatDate(endDate)
  };
};

// ==================== 数据库操作 ====================

const insertItem = db.prepare(`
  INSERT OR IGNORE INTO procurement_items 
  (title, url, keyword, region, category, publish_date, buyer, project_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertLog = db.prepare(`
  INSERT INTO search_logs (keyword, region, region_code, result_count, new_count, search_time)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// ==================== 核心解析函数 ====================

/**
 * 检查采购人是否包含学校关键词
 */
function isValidBuyer(buyer) {
  if (!buyer || buyer.length < 4) return false;
  return SCHOOL_KEYWORDS.some(kw => buyer.includes(kw));
}

/**
 * 验证URL是否有效
 */
function isValidUrl(url) {
  if (!url) return false;
  // 必须是政府采购网的真实链接
  if (!url.startsWith('http://www.ccgp.gov.cn/')) return false;
  // 必须包含具体的公告路径
  if (!url.includes('/t20')) return false;
  return true;
}

/**
 * 从页面快照解析搜索结果
 */
function parseSearchResults(snapshot, keyword, category) {
  const results = [];
  const lines = snapshot.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 匹配链接行 - link "标题" [ref=eN] ... /url: http://...
    const linkMatch = line.match(/link\s+"([^"]+)"\s+\[ref=e\d+\].*?\/url:\s+(http:\/\/www\.ccgp\.gov\.cn\/[^\s]+)/);
    
    if (linkMatch) {
      const title = linkMatch[1].trim();
      const url = linkMatch[2].trim();
      
      // 验证URL和标题
      if (isValidUrl(url) && title.length > 10) {
        const item = {
          title,
          url,
          keyword,
          category,
          region: '',
          buyer: '',
          date: '',
          type: ''
        };
        
        // 向后查找更多信息
        for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
          const nextLine = lines[j];
          
          // 提取日期
          const dateMatch = nextLine.match(/(\d{4})[.\-](\d{2})[.\-](\d{2})/);
          if (dateMatch && !item.date) {
            item.date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
          }
          
          // 提取采购人
          if (nextLine.includes('采购人') || nextLine.includes('采购单位')) {
            const buyerMatch = nextLine.match(/(?:采购人|采购单位)[：:]\s*([^\s|]+)/);
            if (buyerMatch) {
              item.buyer = buyerMatch[1].trim();
            }
          }
          
          // 提取地区
          const regionMatch = nextLine.match(/(四川|北京|上海|天津|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|贵州|云南|陕西|甘肃|青海|台湾|内蒙古|广西|西藏|宁夏|新疆|香港|澳门)/);
          if (regionMatch && !item.region) {
            item.region = regionMatch[1];
          }
          
          // 提取公告类型
          const typeMatch = nextLine.match(/strong\s+\[ref=e\d+\]:\s*([^|\s]+)/);
          if (typeMatch && !item.type) {
            item.type = typeMatch[1].trim();
          }
        }
        
        // 验证采购人是否包含学校关键词
        if (isValidBuyer(item.buyer)) {
          results.push(item);
        }
      }
    }
  }
  
  return results;
}

// ==================== 采集函数 ====================

/**
 * 采集单个关键词
 */
async function crawlKeyword(keyword, category, dateRange) {
  console.log(`\n  关键词: ${keyword}`);
  
  const url = `https://search.ccgp.gov.cn/bxsearch?searchtype=1&kw=${encodeURIComponent(keyword)}&start_time=${dateRange.start}&end_time=${dateRange.end}&timeType=6`;
  
  try {
    // 1. 导航到搜索页面
    console.log(`    正在访问...`);
    execSync(`openclaw browser --browser-profile chrome navigate "${url}"`, { 
      encoding: 'utf-8', 
      timeout: 60000 
    });
    
    // 2. 等待页面加载
    await delay(5000);
    
    // 3. 获取页面快照
    const snapshot = execSync('openclaw browser --browser-profile chrome snapshot', { 
      encoding: 'utf-8', 
      timeout: 30000 
    });
    
    // 4. 解析结果
    const results = parseSearchResults(snapshot, keyword, category);
    
    // 5. 保存到数据库
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
        // 忽略重复URL
      }
    }
    
    // 6. 记录日志
    insertLog.run(keyword, null, null, results.length, newCount, new Date().toISOString());
    
    console.log(`    找到 ${results.length} 条，有效 ${results.filter(r => isValidBuyer(r.buyer)).length} 条，新增 ${newCount} 条`);
    return { found: results.length, new: newCount };
    
  } catch (err) {
    console.log(`    错误: ${err.message}`);
    return { found: 0, new: 0, error: err.message };
  }
}

// ==================== 主函数 ====================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           政府采购信息采集 v2                                   ║');
  console.log('║     改进：学校关键词过滤 + URL完整性校验                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  const dateRange = getDateRange();
  console.log(`\n时间范围: ${dateRange.start.replace(/:/g, '-')} 至 ${dateRange.end.replace(/:/g, '-')}`);
  console.log(`学校关键词过滤: ${SCHOOL_KEYWORDS.join(', ')}`);
  console.log(`开始时间: ${new Date().toLocaleString('zh-CN')}\n`);

  let totalFound = 0;
  let totalNew = 0;
  let errorCount = 0;
  const startTime = Date.now();

  for (const [category, keywords] of Object.entries(ALL_KEYWORDS)) {
    console.log(`\n【${category}】`);
    
    for (const keyword of keywords) {
      const result = await crawlKeyword(keyword, category, dateRange);
      totalFound += result.found;
      totalNew += result.new;
      if (result.error) errorCount++;
      
      // 间隔2-4秒
      await delay(2000 + Math.random() * 2000);
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

  db.close();
  console.log('\n✅ 采集完成！');
}

main().catch(err => {
  console.error('采集失败:', err);
  db.close();
  process.exit(1);
});