/**
 * 通过 CDP 直接调用 printToPDF，绕过页面JS
 */

const CDP = require('chrome-remote-interface');

async function printViaCDP() {
    const client = await CDP({ port: 18800 });
    
    const { Page } = client;
    
    // 启用 Domain
    await Page.enable();
    
    // 获取所有目标
    const { targetInfos } = await client.Target.getTargets();
    console.log('所有目标:', JSON.stringify(targetInfos.slice(0,5), null, 2));
    
    const pageTarget = targetInfos.find(t => t.type === 'page' && t.url.includes('feishu.cn'));
    
    if (!pageTarget) {
        console.log('没有找到飞书页面');
        await client.close();
        return;
    }
    
    console.log('找到飞书页面:', pageTarget.url);
    
    // 直接调用 printToPDF (不经过页面JS)
    console.log('调用 CDP printToPDF...');
    
    try {
        const { data } = await Page.printToPDF({
            printBackground: true,
            paperWidth: 8.27,
            paperHeight: 11.69,
            marginTop: 0.5,
            marginBottom: 0.5,
            marginLeft: 0.5,
            marginRight: 0.5,
            scale: 1
        });
        
        const fs = require('fs');
        fs.writeFileSync('feishu_cdp.pdf', Buffer.from(data, 'base64'));
        console.log('✅ PDF已保存: feishu_cdp.pdf');
        
    } catch (err) {
        console.error('打印失败:', err.message);
    }
    
    await client.close();
}

printViaCDP().catch(console.error);