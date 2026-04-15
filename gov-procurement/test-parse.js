/**
 * 测试解析函数 - 调试版
 */

const { execSync } = require('child_process');

// 获取快照
console.log('获取页面快照...\n');
const snapshot = execSync('openclaw browser --browser-profile chrome snapshot', { 
  encoding: 'utf-8', 
  timeout: 30000 
});

// 学校关键词
const SCHOOL_KEYWORDS = ['学校', '中心', '学院', '中学', '高中', '集团', '大学', '小学'];

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

// 解析函数 - 调试版
function parseSearchResults(snapshot, keyword, category) {
  const results = [];
  const lines = snapshot.split('\n');
  
  console.log(`总行数: ${lines.length}\n`);
  
  // 新的解析逻辑：基于树形结构
  // 每个结果是一个 listitem 块
  let currentItem = null;
  let lastLinkTitle = null;
  let lastLinkUrl = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // 1. 找到 link 行（标题在引号里）
    const linkMatch = trimmedLine.match(/^link\s+"([^"]+)"/);
    if (linkMatch) {
      lastLinkTitle = linkMatch[1];
      console.log(`[行${i}] 找到标题: ${lastLinkTitle}`);
    }
    
    // 2. 找到 URL 行（/url: 开头）
    const urlMatch = trimmedLine.match(/^\/url:\s+(http:\/\/www\.ccgp\.gov\.cn\/[^\s]+)/);
    if (urlMatch && lastLinkTitle) {
      lastLinkUrl = urlMatch[1];
      console.log(`[行${i}] 找到URL: ${lastLinkUrl}`);
      
      // 创建新记录
      if (isValidUrl(lastLinkUrl) && lastLinkTitle.length > 10) {
        currentItem = {
          title: lastLinkTitle,
          url: lastLinkUrl,
          keyword,
          category,
          region: '',
          buyer: '',
          date: '',
          type: ''
        };
        console.log(`[行${i}] 创建新记录: ${lastLinkTitle.substring(0, 30)}...`);
      }
    }
    
    // 3. 找到包含采购人信息的行
    if (currentItem && trimmedLine.includes('采购人')) {
      console.log(`[行${i}] 找到采购人信息: ${trimmedLine}`);
      
      // 提取日期: 2026.03.18 19:50:46
      const dateMatch = trimmedLine.match(/(\d{4})\.(\d{2})\.(\d{2})/);
      if (dateMatch) {
        currentItem.date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }
      
      // 提取采购人: 采购人：XXX |
      const buyerMatch = trimmedLine.match(/采购人[：:]\s*([^|]+)/);
      if (buyerMatch) {
        currentItem.buyer = buyerMatch[1].trim();
        console.log(`    采购人: ${currentItem.buyer}`);
      }
      
      // 提取地区: | 青海 |
      const regionMatch = trimmedLine.match(/\|\s*(四川|北京|上海|天津|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|贵州|云南|陕西|甘肃|青海|台湾|内蒙古|广西|西藏|宁夏|新疆|香港|澳门)\s*\|/);
      if (regionMatch) {
        currentItem.region = regionMatch[1];
        console.log(`    地区: ${currentItem.region}`);
      }
      
      // 验证采购人是否包含学校关键词
      if (isValidBuyer(currentItem.buyer)) {
        console.log(`    ✅ 有效记录（采购人包含学校关键词）`);
        results.push(currentItem);
      } else {
        console.log(`    ❌ 无效记录（采购人不包含学校关键词: ${currentItem.buyer}）`);
      }
      
      currentItem = null;
      lastLinkTitle = null;
      lastLinkUrl = null;
    }
    
    // 4. 找到公告类型
    if (currentItem && trimmedLine.startsWith('strong') && trimmedLine.includes(':')) {
      const typeMatch = trimmedLine.match(/strong\s+\[ref=e\d+\]:\s*([^|\s]+)/);
      if (typeMatch) {
        currentItem.type = typeMatch[1].trim();
      }
    }
  }
  
  console.log(`\n共解析出 ${results.length} 条有效记录`);
  return results;
}

const results = parseSearchResults(snapshot, '智慧校园', '测试');

console.log('\n========== 解析结果 ==========');
results.slice(0, 5).forEach((r, i) => {
  console.log(`\n${i + 1}. ${r.title}`);
  console.log(`   URL: ${r.url}`);
  console.log(`   采购人: ${r.buyer}`);
  console.log(`   地区: ${r.region}`);
  console.log(`   日期: ${r.date}`);
});