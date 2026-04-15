const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

const insertItem = db.prepare(`
  INSERT OR IGNORE INTO procurement_items 
  (title, url, keyword, region, category, publish_date, buyer, project_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// 教务系统 - 一年内搜索结果 (20条)
const items = [
  { title: '山东交通学院综合教务系统二次开发服务采购项目中标（成交）公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202601/t20260128_26124798.htm', date: '2026-01-28', buyer: '山东交通学院', region: '山东', type: '中标公告' },
  { title: '湘潭大学研究生院智慧教务系统建设项目公开招标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gkzb/202601/t20260126_26113308.htm', date: '2026-01-26', buyer: '湘潭大学', region: '湖南', type: '公开招标公告' },
  { title: '云南林业职业技术学院教务系统微服务-校园智能打印系统中标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202601/t20260107_26045440.htm', date: '2026-01-07', buyer: '云南林业职业技术学院', region: '云南', type: '中标公告' },
  { title: '鸡东县教育局第二中学教务系统等项目中标（成交）结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/cjgg/202512/t20251231_26023122.htm', date: '2025-12-31', buyer: '鸡东县教育局', region: '黑龙江', type: '成交公告' },
  { title: '云南林业职业技术学院教务系统微服务-校园智能打印系统公开招标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gkzb/202512/t20251215_25929609.htm', date: '2025-12-15', buyer: '云南林业职业技术学院', region: '云南', type: '公开招标公告' },
  { title: '曲阜师范大学综合教务系统部分功能优化采购项目中标（成交）公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202511/t20251127_25776027.htm', date: '2025-11-27', buyer: '曲阜师范大学', region: '山东', type: '中标公告' },
  { title: '成都市现代制造职业技术学校智慧平台-教务系统采购项目中标（成交）结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202511/t20251124_25755383.htm', date: '2025-11-24', buyer: '成都市现代制造职业技术学校', region: '四川', type: '中标公告' },
  { title: '教务系统升级项目(成交)结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202511/t20251106_25642515.htm', date: '2025-11-06', buyer: '长春汽车职业技术大学', region: '吉林', type: '中标公告' },
  { title: '北海市中等职业技术学校智能数据融合平台及教务系统建设中标结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202511/t20251103_25622081.htm', date: '2025-11-03', buyer: '北海市中等职业技术学校', region: '广西', type: '中标公告' },
  { title: '合肥大学2025年教务系统虚拟平台服务器与存储升级项目中标（成交）结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202510/t20251025_25576903.htm', date: '2025-10-25', buyer: '合肥大学', region: '安徽', type: '中标公告' },
  { title: '大湾区大学本研一体化教务系统一期采购项目结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202510/t20251021_25548539.htm', date: '2025-10-21', buyer: '大湾区大学', region: '广东', type: '中标公告' },
  { title: '辽宁民族师范高等专科学校教务系统结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/cjgg/202510/t20251021_25541597.htm', date: '2025-10-21', buyer: '辽宁民族师范高等专科学校', region: '辽宁', type: '成交公告' }
];

let newCount = 0;
for (const item of items) {
  const result = insertItem.run(item.title, item.url, '教务系统', item.region, '智慧校园类', item.date, item.buyer, item.type);
  if (result.changes > 0) newCount++;
}

console.log('教务系统: 提取 ' + items.length + ' 条，新增 ' + newCount + ' 条');

const total = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
console.log('数据库总记录:', total.count);

db.close();