const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

const insertItem = db.prepare(`
  INSERT OR IGNORE INTO procurement_items 
  (title, url, keyword, region, category, publish_date, buyer, project_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// 双优校建设 - 一年内搜索结果 (14条)
const items = [
  { title: '赤峰建筑工程学校双优校建设-青年教师专业能力提升培训项目(二次)竞争性磋商公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/jzxcs/202603/t20260316_26274722.htm', date: '2026-03-16', buyer: '赤峰建筑工程学校', region: '内蒙古', type: '竞争性磋商公告' },
  { title: '赤峰建筑工程学校双优校建设-青年教师专业能力提升培训项目废标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/qtgg/202602/t20260210_26165744.htm', date: '2026-02-10', buyer: '赤峰建筑工程学校', region: '内蒙古', type: '其他公告' },
  { title: '赤峰建筑工程学校双优校建设-青年教师专业能力提升培训项目竞争性磋商公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/jzxcs/202601/t20260130_26137510.htm', date: '2026-01-30', buyer: '赤峰建筑工程学校', region: '内蒙古', type: '竞争性磋商公告' },
  { title: '当阳市2025年现代职业教育质量提升计划奖补资金采购项目（包一双优校建设项目）教师队伍建设服务中标成交公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202510/t20251017_25524046.htm', date: '2025-10-17', buyer: '当阳市职业技术教育中心', region: '湖北', type: '中标公告' },
  { title: '当阳市2025年现代职业教育质量提升计划奖补资金采购项目（包一双优校建设项目）设备采购中标成交公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202510/t20251017_25523910.htm', date: '2025-10-17', buyer: '当阳市职业技术教育中心', region: '湖北', type: '中标公告' },
  { title: '当阳市2025年现代职业教育质量提升计划奖补资金采购项目（包一双优校建设项目）设备采购更正公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gzgg/202509/t20250926_25426304.htm', date: '2025-09-26', buyer: '当阳市职业技术教育中心', region: '湖北', type: '更正公告' },
  { title: '当阳市2025年现代职业教育质量提升计划奖补资金采购项目（包一双优校建设项目）教师队伍建设服务招标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gkzb/202509/t20250925_25413951.htm', date: '2025-09-25', buyer: '当阳市职业技术教育中心', region: '湖北', type: '公开招标公告' },
  { title: '当阳市2025年现代职业教育质量提升计划奖补资金采购项目（包一双优校建设项目）设备采购公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gkzb/202509/t20250925_25413880.htm', date: '2025-09-25', buyer: '当阳市职业技术教育中心', region: '湖北', type: '公开招标公告' },
  { title: '昭平县职业技术学校优质学校和专业建设项目：校企共建国家双优校建设专业咨询服务方案编制服务采购的成交公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/cjgg/202508/t20250828_25250859.htm', date: '2025-08-28', buyer: '昭平县职业技术学校', region: '广西', type: '成交公告' },
  { title: '双优校建设--通用机电设备安装与调试赛项设备采购项目中标结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202508/t20250826_25236937.htm', date: '2025-08-26', buyer: '黄冈市中等职业学校（集团）', region: '湖北', type: '中标公告' },
  { title: '黄冈市中等职业学校（集团）维修改造和设备采购项目（双优校建设-计算机实训室建设）中标(成交)结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202508/t20250822_25215977.htm', date: '2025-08-22', buyer: '黄冈市中等职业学校（集团）', region: '湖北', type: '中标公告' },
  { title: '昭平县职业技术学校优质学校和专业建设项目：校企共建国家双优校建设专业咨询服务方案编制服务采购的竞争性磋商公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/jzxcs/202508/t20250815_25172699.htm', date: '2025-08-15', buyer: '昭平县职业技术学校', region: '广西', type: '竞争性磋商公告' },
  { title: '双优校建设--通用机电设备安装与调试赛项设备采购项目竞争性磋商公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/jzxcs/202508/t20250814_25164890.htm', date: '2025-08-14', buyer: '黄冈市中等职业学校（集团）', region: '湖北', type: '竞争性磋商公告' },
  { title: '黄冈市中等职业学校（集团）维修改造和设备采购项目（双优校建设-计算机实训室建设）招标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gkzb/202507/t20250731_25078375.htm', date: '2025-07-31', buyer: '黄冈市中等职业学校（集团）', region: '湖北', type: '公开招标公告' }
];

let newCount = 0;
for (const item of items) {
  const result = insertItem.run(item.title, item.url, '双优校建设', item.region, '政策项目类', item.date, item.buyer, item.type);
  if (result.changes > 0) newCount++;
}

console.log('双优校建设: 提取 ' + items.length + ' 条，新增 ' + newCount + ' 条');

const total = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
console.log('数据库总记录:', total.count);

db.close();