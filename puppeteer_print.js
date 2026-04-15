/**
 * 使用 Puppeteer 打印飞书文档为 PDF
 * 连接已有的浏览器（Edge）
 */

const puppeteer = require('puppeteer-core');

async function printFeishuDoc() {
    // 连接到已有的 Edge 浏览器
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:18800',  // OpenClaw 的 CDP 端口
        defaultViewport: null
    });

    // 获取所有页面
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('feishu.cn'));
    
    if (!page) {
        console.log('没有找到飞书页面，创建一个新标签...');
        page = await browser.newPage();
        await page.goto('https://o08w2nllqni.feishu.cn/wiki/WamWwuKhBiClHJknRkecRdQnnTc', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
    }

    console.log('页面加载完成，滚动加载所有内容...');

    // 自动滚动加载所有内容
    await autoScroll(page);

    console.log('打印PDF...');
    const pdf = await page.pdf({
        path: 'feishu_full.pdf',
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });

    console.log('✅ PDF已保存: feishu_full.pdf');
    await browser.disconnect();
}

async function autoScroll(page) {
    let lastHeight = 0;
    let sameCount = 0;
    
    while (sameCount < 5) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(r => setTimeout(r, 1500));
        
        const newHeight = await page.evaluate(() => document.body.scrollHeight);
        console.log(`  高度: ${newHeight}`);
        
        if (newHeight === lastHeight) {
            sameCount++;
        } else {
            sameCount = 0;
        }
        lastHeight = newHeight;
    }
}

printFeishuDoc().catch(err => {
    console.error('错误:', err.message);
});