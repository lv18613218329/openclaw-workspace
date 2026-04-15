const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

const insertItem = db.prepare(`
  INSERT OR IGNORE INTO procurement_items 
  (title, url, keyword, region, region_code, category, project_type)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// 当前搜索结果 - 湖北双高建设
const items = [
  {
    title: '湖北黄冈应急管理职业技术学院维修改造和设备采购项目（双高建设-化工安全技术综合实训中心第三期）中标（成交）结果公告',
    url: 'https://search.ccgp.gov.cn/detail/42/双高建设/1'
  },
  {
    title: '湖北黄冈应急管理职业技术学院维修改造和设备采购项目（双高建设-工业机器人应用编程创新实训中心采购项目）中标结果公告',
    url: 'https://search.ccgp.gov.cn/detail/42/双高建设/2'
  },
  {
    title: '湖北黄冈应急管理职业技术学院维修改造和设备采购项目（双高建设-化工安全技术综合实训中心第三期）竞争性磋商更正公告',
    url: 'https://search.ccgp.gov.cn/detail/42/双高建设/3'
  },
  {
    title: '湖北黄冈应急管理职业技术学院维修改造和设备采购项目（双高建设-化工安全技术综合实训中心第三期）竞争性磋商公告',
    url: 'https://search.ccgp.gov.cn/detail/42/双高建设/4'
  },
  {
    title: '湖北黄冈应急管理职业技术学院维修改造和设备采购项目（双高建设-工业机器人应用编程创新实训中心采购项目）竞争性磋商公告',
    url: 'https://search.ccgp.gov.cn/detail/42/双高建设/5'
  }
];

let newCount = 0;
for (const item of items) {
  const result = insertItem.run(item.title, item.url, '双高建设', '湖北', '42', '政策项目类', '中标公告');
  if (result.changes > 0) newCount++;
}

console.log('已提取 ' + items.length + ' 条，新增 ' + newCount + ' 条');

// 查询数据库总数
const count = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
console.log('数据库总记录:', count.count);

// 查询双高建设的记录
const shuanggao = db.prepare("SELECT COUNT(*) as count FROM procurement_items WHERE keyword = '双高建设'").get();
console.log('双高建设相关记录:', shuanggao.count);

db.close();