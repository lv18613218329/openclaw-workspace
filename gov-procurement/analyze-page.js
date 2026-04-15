/**
 * 分析政府采购网页面结构
 */

const https = require('https');

const keyword = '智慧校园';
const url = 'https://search.ccgp.gov.cn/bxsearch?searchtype=1&kw=' + encodeURIComponent(keyword) + '&timeType=6';

console.log('请求URL:', url);
console.log('\n正在获取页面...\n');

const req = https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'identity',
    'Connection': 'keep-alive',
    'Host': 'search.ccgp.gov.cn'
  }
}, (res) => {
  console.log('状态码:', res.statusCode);
  console.log('响应头:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.setEncoding('utf8');
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n页面长度:', data.length, '字符');
    
    // 检查是否需要重定向或有其他问题
    if (data.includes('登录') || data.includes('验证')) {
      console.log('\n页面可能需要登录或验证');
    }
    
    // 输出前2000字符
    console.log('\n========== 页面前2000字符 ==========\n');
    console.log(data.substring(0, 2000));
    
    // 搜索关键词
    if (data.includes(keyword)) {
      console.log('\n页面包含关键词:', keyword);
    } else {
      console.log('\n页面不包含关键词:', keyword);
    }
    
    // 查找任何链接
    const allLinks = data.match(/href="[^"]+"/g);
    if (allLinks) {
      console.log('\n找到', allLinks.length, '个链接');
      console.log('前10个链接:', allLinks.slice(0, 10));
    }
  });
});

req.on('error', e => {
  console.error('请求错误:', e.message);
});

req.setTimeout(30000, () => {
  console.error('请求超时');
  req.destroy();
});