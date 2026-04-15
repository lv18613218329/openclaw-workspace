const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

const insertItem = db.prepare(`
  INSERT OR IGNORE INTO procurement_items 
  (title, url, keyword, region, category, publish_date, buyer, project_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// 教师档案袋 - 一年内搜索结果 (14条)
const items = [
  { title: '枣庄职业学院数字校园标杆校建设（二期）教师档案袋等模块采购项目中标（成交）公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202601/t20260101_26028171.htm', date: '2026-01-01', buyer: '枣庄职业学院', region: '山东', type: '中标公告' },
  { title: '四川财经职业学院教师队伍建设-教师档案袋中标（成交）结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202512/t20251224_25981514.htm', date: '2025-12-24', buyer: '四川财经职业学院', region: '四川', type: '中标公告' },
  { title: '学校专任教师绩效评价系统（教师档案袋系统）成交公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/cjgg/202512/t20251223_25976603.htm', date: '2025-12-23', buyer: '苏州职业技术大学', region: '江苏', type: '成交公告' },
  { title: '学校专任教师绩效评价系统（教师档案袋系统）采购公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/jzxcs/202512/t20251210_25898033.htm', date: '2025-12-10', buyer: '苏州职业技术大学', region: '江苏', type: '竞争性磋商公告' },
  { title: '枣庄职业学院数字校园标杆校建设（二期）教师档案袋等模块采购项目公开招标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gkzb/202512/t20251206_25874820.htm', date: '2025-12-06', buyer: '枣庄职业学院', region: '山东', type: '公开招标公告' },
  { title: '四川财经职业学院教师队伍建设-教师档案袋招标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gkzb/202512/t20251202_25834403.htm', date: '2025-12-02', buyer: '四川财经职业学院', region: '四川', type: '公开招标公告' },
  { title: '武汉铁路职业技术学院教师发展智慧平台—教师档案袋管理系统项目第二次成交结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202511/t20251125_25760958.htm', date: '2025-11-25', buyer: '武汉铁路职业技术学院', region: '湖北', type: '中标公告' },
  { title: '天津渤海职业技术学院教师管理平台（教师档案袋及教师画像系统）项目成交公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/cjgg/202511/t20251121_25746776.htm', date: '2025-11-21', buyer: '天津渤海职业技术学院', region: '天津', type: '成交公告' },
  { title: '武汉铁路职业技术学院教师发展智慧平台—教师档案袋管理系统项目第二次竞争性磋商公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/jzxcs/202511/t20251112_25683829.htm', date: '2025-11-12', buyer: '武汉铁路职业技术学院', region: '湖北', type: '竞争性磋商公告' },
  { title: '武汉铁路职业技术学院教师发展智慧平台—教师档案袋管理系统项目终止公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/qtgg/202511/t20251112_25679814.htm', date: '2025-11-12', buyer: '武汉铁路职业技术学院', region: '湖北', type: '其他公告' },
  { title: '天津渤海职业技术学院教师管理平台（教师档案袋及教师画像系统）项目竞争性磋商公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/jzxcs/202511/t20251106_25649839.htm', date: '2025-11-06', buyer: '天津渤海职业技术学院', region: '天津', type: '竞争性磋商公告' },
  { title: '武汉铁路职业技术学院教师发展智慧平台—教师档案袋管理系统项目更正公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gzgg/202511/t20251106_25644989.htm', date: '2025-11-06', buyer: '武汉铁路职业技术学院', region: '湖北', type: '更正公告' },
  { title: '武汉铁路职业技术学院教师发展智慧平台—教师档案袋管理系统项目竞争性磋商公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/jzxcs/202510/t20251029_25595780.htm', date: '2025-10-29', buyer: '武汉铁路职业技术学院', region: '湖北', type: '竞争性磋商公告' }
];

let newCount = 0;
for (const item of items) {
  const result = insertItem.run(item.title, item.url, '教师档案袋', item.region, '政策项目类', item.date, item.buyer, item.type);
  if (result.changes > 0) newCount++;
}

console.log('教师档案袋: 提取 ' + items.length + ' 条，新增 ' + newCount + ' 条');

const total = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
console.log('数据库总记录:', total.count);

db.close();