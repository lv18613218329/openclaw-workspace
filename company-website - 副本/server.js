const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const COZE_TOKEN = "pat_iTZYL67lEmWkaTODMfRlegntBpqjTZ2AtqjdTvdW6si2SNZhvwMZY1F5da1fipyR";

const server = http.createServer((req, res) => {
  console.log('收到请求:', req.method, req.url);
  
  // 处理 CORS 预检请求 - 优先处理 OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('处理 OPTIONS 预检请求');
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }
  
  // 测试 CORS
  if (req.url === '/api/test-cors') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    res.end(JSON.stringify({ ok: true, message: 'CORS works!' }));
    return;
  }
  
  // 代理 Coze API 请求，解决 CORS 问题
  if (req.url.startsWith('/api/coze')) {
    // 处理 CORS 预检请求
    if (req.method === 'OPTIONS') {
      console.log('处理 OPTIONS 预检请求 (代理)');
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400'
      });
      res.end();
      return;
    }
    
    const url = new URL(req.url, 'http://localhost');
    const conversation_id = url.searchParams.get('conversation_id');
    const bot_id = url.searchParams.get('bot_id');
    
    console.log('收到请求 conversation_id:', conversation_id, 'bot_id:', bot_id);
    
    // 需要 bot_id 参数
    const botId = bot_id || '7613384266394894370';
    
    // POST /v1/conversation/message/list?conversation_id=xxx (获取聊天记录)
    const targetPath = `/v1/conversation/message/list?conversation_id=${conversation_id}`;
    
    const options = {
      hostname: 'api.coze.cn',
      path: targetPath,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + COZE_TOKEN,
        'Content-Type': 'application/json'
      }
    };
    
    // 请求 body（获取消息列表）
    const postData = JSON.stringify({
      order: 'asc',
      limit: 50
    });
    
    console.log('发送请求到 Coze (HTTPS):', options.path);
    
    // 使用 https.request 而不是 http.request
    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        console.log('Coze响应状态:', proxyRes.statusCode);
        console.log('Coze响应:', data.substring(0, 300));
        res.writeHead(proxyRes.statusCode, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        });
        res.end(data);
      });
    });
    
    proxyReq.on('error', (e) => {
      console.error('代理错误:', e.message);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      });
      res.end(JSON.stringify({ code: 500, msg: e.message }));
    });
    
    proxyReq.write(postData);
    proxyReq.end();
    return;
  }
  
  // 静态文件服务
  const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg'
    };
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(8888, () => {
  console.log('Server running on http://localhost:8888');
  console.log('Coze API 代理 (HTTPS): POST http://localhost:8888/api/coze/retrieve');
});