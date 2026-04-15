const Database = require('better-sqlite3');
const db = new Database('./procurement.db');

try {
  // Check tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("Tables:", JSON.stringify(tables, null, 2));
  
  // Check crawl_progress
  const progress = db.prepare("SELECT * FROM crawl_progress ORDER BY id DESC LIMIT 1").all();
  console.log("\nLast crawl progress:", JSON.stringify(progress, null, 2));
  
  // Check current data count
  const count = db.prepare("SELECT COUNT(*) as count FROM procurement").get();
  console.log("\nTotal records in procurement:", count.count);
  
  // Get search_logs
  const logs = db.prepare("SELECT * FROM search_logs ORDER BY id DESC LIMIT 5").all();
  console.log("\nRecent search logs:", JSON.stringify(logs, null, 2));
} finally {
  db.close();
}