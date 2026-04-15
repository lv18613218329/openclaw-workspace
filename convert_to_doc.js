const fs = require('fs');
const path = require('path');

// 读取HTML内容
const htmlContent = fs.readFileSync(path.join(__dirname, 'feishu_content.html'), 'utf8');

// 提取纯文本内容
const textContent = [];
const regex = /<span data-string="true"[^>]*>([^<]*)<\/span>/g;
let match;
while ((match = regex.exec(htmlContent)) !== null) {
    const text = match[1].trim();
    if (text && text !== '&ZeroWidthSpace;') {
        textContent.push(text);
    }
}

// 创建简单的Word文档（RTF格式）
const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\viewkind4\\uc1\\pard\\f0\\fs24
${textContent.join('\\par\\n')}
\\par
}`;

fs.writeFileSync(path.join(__dirname, 'feishu_doc.rtf'), rtfContent);
console.log('RTF文件已生成: feishu_doc.rtf');