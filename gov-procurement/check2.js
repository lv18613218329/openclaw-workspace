const Database = require('better-sqlite3');
const db = new Database('./procurement.db');

try {
  const count = db.prepare('SELECT COUNT(*) as count FROM procurement_items').get();
  console.log('Total records:', count.count);
  
  const logs = db.prepare('SELECT * FROM search_logs ORDER BY id DESC LIMIT 3').all();
  console.log('Recent logs:', JSON.stringify(logs, null, 2));
  
  const progress = db.prepare('SELECT * FROM crawl_progress ORDER BY id DESC LIMIT 1').get();
  console.log('Last progress:', JSON.stringify(progress, null, 2));
} finally {
  db.close();
}