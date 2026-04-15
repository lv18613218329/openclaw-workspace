// 自动滚动并打印PDF
(async () => {
    const CDP = require('cdp');
    
    // 连接浏览器
    const browser = await CDP();
    const page = browser.Page;
    
    // 启用 Page 域
    await page.enable();
    
    // 导航到飞书文档
    await page.navigate('https://o08w2nllqni.feishu.cn/wiki/WamWwuKhBiClHJknRkecRdQnnTc');
    await page.waitLoadEventFired();
    
    console.log('页面加载完成，开始滚动...');
    
    // 滚动加载
    let lastHeight = 0;
    for (let i = 0; i < 100; i++) {
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(r => setTimeout(r, 1000));
        
        const height = await page.evaluate(() => document.body.scrollHeight);
        console.log(`滚动 ${i+1}: 高度=${height}`);
        
        if (height === lastHeight) break;
        lastHeight = height;
    }
    
    console.log('滚动完成，打印PDF...');
    
    // 打印PDF
    const pdf = await page.printToPDF({
        printBackground: true,
        paperWidth: 8.27,
        paperHeight: 11.69
    });
    
    require('fs').writeFileSync('feishu_full.pdf', pdf);
    console.log('PDF已保存: feishu_full.pdf');
    
    await browser.close();
})();