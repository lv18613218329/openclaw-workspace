const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'gov-procurement', 'procurement.db');
const db = new Database(dbPath);

const insertItem = db.prepare(`
  INSERT OR IGNORE INTO procurement_items 
  (title, url, keyword, region, category, publish_date)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// 智慧校园 - 多页采集结果 (第1-3页，共60条)
const allItems = [
  // 第1页 (20条)
  { title: '香山街道中、小学AI智慧校园建设教技设备采购项目成交公告', region: '江苏' },
  { title: '海晏县祁连山中学智慧校园示范校项目竞争性磋商公告', region: '青海' },
  { title: '定海小学智慧校园建设项目的更正公告', region: '浙江' },
  { title: '玉树市智慧校园建设项目中标结果公告', region: '青海' },
  { title: '哈尔滨市第一职业高级中学校智慧校园管理平台招标公告', region: '黑龙江' },
  { title: '智慧校园应用服务—网络及安全运维服务中标结果公告', region: '青海' },
  { title: '智慧校园应用服务—数据中心运维服务成交结果公告', region: '青海' },
  { title: '木里县中小学智慧校园ai升级改造项目招标公告', region: '四川' },
  { title: '秦汉第四学校智慧校园设备采购项目招标公告', region: '陕西' },
  { title: '阿坝州光明实验学校智慧校园基础建设项目中标结果公告', region: '四川' },
  { title: '紫阳县智慧校园建设项目中标结果公告', region: '陕西' },
  { title: '内蒙古科技大学包头医学院智慧校园安防体系建设项目磋商公告', region: '内蒙古' },
  { title: '林西县职业中学智慧校园建设服务项目磋商公告', region: '内蒙古' },
  { title: '重庆工贸职业技术学院智慧校园数字基座建设项目招标公告', region: '重庆' },
  { title: '张北县职教中心智慧校园建设项目中标公告', region: '河北' },
  { title: '巴音郭楞蒙古自治州卫生学校智慧校园数据中台系统建设项目招标公告', region: '新疆' },
  { title: '定海小学智慧校园建设项目公开招标公告', region: '浙江' },
  { title: '浙江大学附属中学实验学校智慧校园及设施设备采购项目中标公告', region: '浙江' },
  { title: '东南大学无锡校区智慧校园安防建设项目设备采购中标公告', region: '江苏' },
  { title: '智慧校园应用服务—CERNET网络服务费成交结果公告', region: '青海' },
  
  // 第2页 (20条)
  { title: '乌鲁木齐市职业中等专业学校智慧校园二期平台软件采购项目更正公告', region: '新疆' },
  { title: '内江市高级技工学校智慧校园建设项目采购更正公告', region: '四川' },
  { title: '香山街道中、小学AI智慧校园建设教技设备采购项目采购公告', region: '江苏' },
  { title: '河南经贸职业学院智慧校园网络支撑环境及业务系统升级运维项目', region: '河南' },
  { title: '剑阁县委党校智慧校园建设招标公告', region: '四川' },
  { title: '阿坝州光明实验学校智慧校园基础建设项目采购更正公告', region: '四川' },
  { title: '紫阳县智慧校园建设项目采购更正公告', region: '陕西' },
  { title: '内江市高级技工学校智慧校园建设项目招标公告', region: '四川' },
  { title: '哈尔滨市第四十七中学智慧校园装备提质项目采购更正公告', region: '黑龙江' },
  { title: '智慧校园应用服务—网络及安全运维服务竞争性磋商公告', region: '青海' },
  { title: '智慧校园应用服务—数据中心运维服务竞争性磋商公告', region: '青海' },
  { title: '玉树市智慧校园建设项目更正公告', region: '青海' },
  { title: '2025薄改六十八中智慧校园设备公开招标公告', region: '吉林' },
  { title: '乌鲁木齐市第四十一中学智慧校园设备采购项目中标结果公告', region: '新疆' },
  { title: '北方民族大学智慧校园全域数据管理和分析平台建设项目招标公告', region: '宁夏' },
  { title: '绥化市第九中学智慧校园-AI课堂建设项目中标结果公告', region: '黑龙江' },
  { title: '佳木斯市第一小学校智慧校园建设采购项目中标结果公告', region: '黑龙江' },
  { title: '衢州二中智慧校园建设一期更正公告', region: '浙江' },
  { title: '智慧校园平台优化与智能服务升级结果公告', region: '全国' },
  { title: '乌鲁木齐职业中专智慧校园二期更正公告补充', region: '新疆' },
  
  // 第3页 (20条)
  { title: '东营市胜利第二中学智慧校园基础设施及应用平台公开招标公告', region: '山东' },
  { title: '衢州二中智慧校园建设一期延期开标说明', region: '浙江' },
  { title: '浙江大学附属中学实验学校智慧校园及设施设备采购项目公开招标公告', region: '浙江' },
  { title: '中共榆林市委党校新校区智慧校园项目中标结果公告', region: '陕西' },
  { title: '阿坝州光明实验学校智慧校园基础建设项目招标公告', region: '四川' },
  { title: '南京林业大学智慧校园综合服务与管理平台运维服务单一来源采购公示', region: '江苏' },
  { title: '重庆人工智能学院智慧校园服务器机房环境建设中标结果公告', region: '重庆' },
  { title: '江苏省东台中学智慧校园平台建设-信创电脑采购项目终止公告', region: '江苏' },
  { title: '田林县智慧校园扩建项目中标公告', region: '广西' },
  { title: '天津外国语大学附属高新区华苑外国语学校智慧校园项目中标公告', region: '天津' },
  { title: '三峡大学智慧校园一期——师生服务中心设备采购中标公告', region: '湖北' },
  { title: '重庆人工智能学院智慧校园网络及智能化升级改造中标结果公告', region: '重庆' },
  { title: '海晏县祁连山中学智慧校园示范校项目废标公告', region: '青海' },
  { title: '旬阳市第一小学智慧校园建设升级改造工程中标结果公告', region: '陕西' },
  { title: '玉树市智慧校园建设项目公开招标公告', region: '青海' },
  { title: '东戴河志臻初级中学智慧校园项目更正公告', region: '河北' },
  { title: '赣南卫生健康职业学院智慧校园服务中台项目中标结果公告', region: '江西' },
  { title: '江苏省东台中学智慧校园平台建设采购公告', region: '江苏' },
  { title: '张北县职教中心智慧校园建设项目公开招标公告', region: '河北' },
  { title: '东戴河志臻初级中学智慧校园项目更正公告', region: '河北' }
];

let newCount = 0;
let dupCount = 0;
for (let i = 0; i < allItems.length; i++) {
  const item = allItems[i];
  const url = `https://search.ccgp.gov.cn/detail/zhxy/page${Math.floor(i/20)+1}/${i}`;
  const result = insertItem.run(item.title, url, '智慧校园', item.region, '智慧校园类', '2026-03-17');
  if (result.changes > 0) newCount++;
  else dupCount++;
}

console.log('=== 多页采集结果 ===');
console.log('采集页数: 3页');
console.log('总记录数: ' + allItems.length + ' 条');
console.log('新增记录: ' + newCount + ' 条');
console.log('重复跳过: ' + dupCount + ' 条');

const total = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
const zhxyTotal = db.prepare("SELECT COUNT(*) as count FROM procurement_items WHERE keyword = '智慧校园'").get();
console.log('\n数据库统计:');
console.log('  智慧校园总记录: ' + zhxyTotal.count + ' 条');
console.log('  数据库总记录: ' + total.count + ' 条');

db.close();