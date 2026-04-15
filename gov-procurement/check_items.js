const Database = require('better-sqlite3');
const db = new Database('./procurement.db');

// 查看procurement_items表结构
const schema = db.prepare("PRAGMA table_info(procurement_items)").all();
console.log('procurement_items schema:', JSON.stringify(schema, null, 2));

// 看一条样本数据
const sample = db.prepare('SELECT * FROM procurement_items LIMIT 1').get();
console.log('\nSample item:', JSON.stringify(sample, null, 2));

db.close();