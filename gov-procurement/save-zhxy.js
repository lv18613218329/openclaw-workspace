const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

const insertItem = db.prepare(`
  INSERT OR IGNORE INTO procurement_items 
  (title, url, keyword, region, category, publish_date, buyer, project_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// 智慧校园 - 一年内搜索结果第一页 (20条)
const items = [
  { title: '香山街道中、小学AI智慧校园建设教技设备采购项目成交公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/cjgg/202603/t20260317_26280407.htm', date: '2026-03-17', buyer: '苏州市吴中区人民政府香山街道办事处', region: '江苏', type: '成交公告' },
  { title: '海晏县祁连山中学智慧校园示范校项目的竞争性磋商公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/jzxcs/202603/t20260317_26278728.htm', date: '2026-03-17', buyer: '海晏县教育局', region: '青海', type: '竞争性磋商公告' },
  { title: '定海小学智慧校园建设项目的更正公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gzgg/202603/t20260317_26276876.htm', date: '2026-03-17', buyer: '舟山市定海区教育局', region: '浙江', type: '更正公告' },
  { title: '玉树市智慧校园建设项目中标(成交)结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202603/t20260316_26276038.htm', date: '2026-03-16', buyer: '玉树市教育局（本级）', region: '青海', type: '中标公告' },
  { title: '哈尔滨市第一职业高级中学校智慧校园（招生就业）管理平台等项目招标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gkzb/202603/t20260315_26272223.htm', date: '2026-03-15', buyer: '哈尔滨市第一职业高级中学校', region: '黑龙江', type: '公开招标公告' },
  { title: '智慧校园应用服务—网络及安全运维服务中标(成交)结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202603/t20260313_26268441.htm', date: '2026-03-13', buyer: '青海师范大学（本级）', region: '青海', type: '中标公告' },
  { title: '智慧校园应用服务—数据中心运维服务成交结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202603/t20260313_26268200.htm', date: '2026-03-13', buyer: '青海师范大学（本级）', region: '青海', type: '中标公告' },
  { title: '木里县中小学智慧校园ai升级改造项目招标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gkzb/202603/t20260312_26264651.htm', date: '2026-03-12', buyer: '木里藏族自治县教育体育和科学技术局', region: '四川', type: '公开招标公告' },
  { title: '秦汉第四学校(东校区)智慧校园设备采购项目招标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gkzb/202603/t20260312_26264472.htm', date: '2026-03-12', buyer: '西咸新区秦汉第四学校', region: '陕西', type: '公开招标公告' },
  { title: '阿坝州光明实验学校智慧校园基础建设项目中标（成交）结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202603/t20260312_26263599.htm', date: '2026-03-12', buyer: '茂县教育局', region: '四川', type: '中标公告' },
  { title: '紫阳县紧密型城乡教育共同体智慧校园建设项目(二次)中标（成交）结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202603/t20260311_26256502.htm', date: '2026-03-11', buyer: '紫阳县教育体育局', region: '陕西', type: '中标公告' },
  { title: '内蒙古科技大学包头医学院智慧校园安防体系建设项目竞争性磋商公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/jzxcs/202603/t20260310_26255173.htm', date: '2026-03-10', buyer: '内蒙古科技大学包头医学院', region: '内蒙古', type: '竞争性磋商公告' },
  { title: '林西县职业中学智慧校园建设服务项目竞争性磋商公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/jzxcs/202603/t20260309_26249103.htm', date: '2026-03-09', buyer: '林西县职业中学', region: '内蒙古', type: '竞争性磋商公告' },
  { title: '重庆工贸职业技术学院智慧校园数字基座与数据治理服务平台建设项目公开招标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gkzb/202603/t20260309_26247320.htm', date: '2026-03-09', buyer: '重庆工贸职业技术学院', region: '重庆', type: '公开招标公告' },
  { title: '张北县职教中心智慧校园建设（教务/学工/OA办公系统）项目政府采购公开招标中标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202603/t20260309_26246871.htm', date: '2026-03-09', buyer: '张北县职教中心', region: '河北', type: '中标公告' },
  { title: '巴音郭楞蒙古自治州卫生学校智慧校园数据中台系统建设项目公开招标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gkzb/202603/t20260307_26244266.htm', date: '2026-03-07', buyer: '新疆巴音郭楞蒙古自治州卫生学校', region: '新疆', type: '公开招标公告' },
  { title: '定海小学智慧校园建设项目的公开招标公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/gkzb/202603/t20260307_26241844.htm', date: '2026-03-07', buyer: '舟山市定海区教育局', region: '浙江', type: '公开招标公告' },
  { title: '浙江大学附属中学实验学校智慧校园及设施设备采购项目的中标(成交)结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202603/t20260307_26241351.htm', date: '2026-03-07', buyer: '浙江大学附属中学', region: '浙江', type: '中标公告' },
  { title: '东南大学无锡校区智慧校园安防建设项目设备采购中标公告', url: 'http://www.ccgp.gov.cn/cggg/zygg/zbgg/202603/t20260306_26239413.htm', date: '2026-03-06', buyer: '东南大学', region: '江苏', type: '中标公告' },
  { title: '智慧校园应用服务—中国教育和科研计算机网CERNET网络服务费成交结果公告', url: 'http://www.ccgp.gov.cn/cggg/dfgg/zbgg/202603/t20260306_26237483.htm', date: '2026-03-06', buyer: '青海师范大学（本级）', region: '青海', type: '中标公告' }
];

let newCount = 0;
for (const item of items) {
  const result = insertItem.run(item.title, item.url, '智慧校园', item.region, '智慧校园类', item.date, item.buyer, item.type);
  if (result.changes > 0) newCount++;
}

console.log('智慧校园: 提取 ' + items.length + ' 条，新增 ' + newCount + ' 条');
console.log('提示: 智慧校园共1951条，分98页，此为第1页');

const total = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
console.log('数据库总记录:', total.count);

db.close();