const fs = require('fs');
const path = require('path');

// 使用 playwright-core
const playwrightPath = 'C:\\Users\\Administrator\\AppData\\Roaming\\npm\\node_modules\\openclaw\\node_modules\\playwright-core';
const { chromium } = require(playwrightPath);

async function convertToPdf() {
  const htmlPath = 'C:\\Users\\Administrator\\.openclaw\\workspace\\自动方案.html';
  const pdfPath = 'C:\\Users\\Administrator\\.openclaw\\workspace\\自动方案.pdf';
  
  // 读取 HTML 内容
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  
  // 启动浏览器
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 设置页面内容
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  
  // 生成 PDF
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    printBackground: true
  });
  
  console.log('PDF 生成成功:', pdfPath);
  
  await browser.close();
}

convertToPdf().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});