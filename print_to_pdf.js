/**
 * 将当前网页打印为PDF
 * 使用方法: node print_to_pdf.js [输出文件名]
 * 
 * 默认保存到: C:\Users\Administrator\Downloads\feishu_doc.pdf
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const outputFile = args[0] || path.join(process.env.USERPROFILE || '', 'Downloads', 'feishu_doc.pdf');

async function printToPdf() {
    console.log('🚀 启动浏览器...');
    
    const browser = await chromium.launch({
        headless: false,  // 显示浏览器，方便操作
        args: ['--start-maximized']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });
    
    const page = await context.newPage();
    
    // 导航到飞书文档页面
    const url = 'https://o08w2nllqni.feishu.cn/wiki/WamWwuKhBiClHJknRkecRdQnnTc';
    console.log(`📄 打开页面: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    
    console.log('⏳ 等待页面加载完成...');
    await page.waitForTimeout(5000);
    
    // 滚动加载所有内容
    console.log('📜 滚动加载所有内容...');
    await scrollToLoadAll(page);
    
    console.log('🖨️ 打印为PDF...');
    
    // 打印PDF
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,      // 打印背景色和图片
        margin: {
            top: '20px',
            bottom: '20px',
            left: '20px',
            right: '20px'
        },
        scale: 1.0
    });
    
    // 保存文件
    fs.writeFileSync(outputFile, pdfBuffer);
    console.log(`✅ PDF已保存到: ${outputFile}`);
    
    // 提示用户
    console.log('\n📌 提示:');
    console.log('1. 如果内容未完全加载，可以手动滚动后再运行此脚本');
    console.log('2. 或者修改URL变量来打印其他页面');
    
    await browser.close();
}

async function scrollToLoadAll(page) {
    let lastHeight = 0;
    let stableCount = 0;
    const maxAttempts = 50;
    
    for (let i = 0; i < maxAttempts; i++) {
        // 滚动到页面底部
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        
        // 尝试点击展开更多内容（如果有）
        try {
            await page.click('.bear-virtual-renderUnit-placeholder', { timeout: 1000 }).catch(() => {});
        } catch (e) {}
        
        const newHeight = await page.evaluate(() => document.body.scrollHeight);
        
        console.log(`  滚动 ${i + 1}: 页面高度 ${newHeight}`);
        
        if (newHeight === lastHeight) {
            stableCount++;
            if (stableCount >= 3) {
                console.log('✅ 内容加载完成');
                break;
            }
        } else {
            stableCount = 0;
        }
        lastHeight = newHeight;
    }
}

// 运行
printToPdf().catch(err => {
    console.error('❌ 错误:', err.message);
    process.exit(1);
});