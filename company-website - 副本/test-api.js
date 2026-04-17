const https = require('https');

const COZE_TOKEN = "pat_pQIrwCjHqjxkx0j2CcP2cHhd9JCGxTFkcL0hWtSP6Sj7A2KRm3LnpOGXs9o5KMpN";
const conversation_id = "7628138019127558178";

// POST 请求
const postData = JSON.stringify({ conversation_id });

const options = {
  hostname: 'api.coze.cn',
  path: `/v1/conversation/retrieve?conversation_id=${conversation_id}`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${COZE_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

console.log('请求:', options.method, options.path);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应:', data);
  });
});

req.on('error', e => {
  console.error('请求错误:', e.message);
});

req.write(postData);
req.end();