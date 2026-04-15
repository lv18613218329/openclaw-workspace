/**
 * 调试快照格式
 */

const { execSync } = require('child_process');

const snapshot = execSync('openclaw browser --browser-profile chrome snapshot', { 
  encoding: 'utf-8', 
  timeout: 30000 
});

const lines = snapshot.split('\n');

// 找到 listitem 行，然后看后面的行
console.log('========== 分析 listitem 结构 ==========\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 找到包含"采购项目"的 link 行
  if (line.includes('link') && line.includes('采购') && line.includes('"')) {
    console.log(`[行${i}] ${line}`);
    
    // 打印接下来5行
    for (let j = 1; j <= 5; j++) {
      if (i + j < lines.length) {
        console.log(`[行${i+j}] ${lines[i+j]}`);
      }
    }
    console.log('');
  }
}