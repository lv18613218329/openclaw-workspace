-- 政府采购信息数据库
CREATE TABLE IF NOT EXISTS procurement_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT UNIQUE,
    project_id TEXT,
    publish_date DATE,
    region TEXT,
    region_code TEXT,
    keyword TEXT,
    category TEXT,
    buyer TEXT,
    buyer_contact TEXT,
    agent TEXT,
    agent_contact TEXT,
    budget DECIMAL(15,2),
    project_type TEXT,
    status TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_keyword ON procurement_items(keyword);
CREATE INDEX IF NOT EXISTS idx_region ON procurement_items(region);
CREATE INDEX IF NOT EXISTS idx_publish_date ON procurement_items(publish_date);
CREATE INDEX IF NOT EXISTS idx_category ON procurement_items(category);

-- 搜索日志表
CREATE TABLE IF NOT EXISTS search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT,
    region TEXT,
    region_code TEXT,
    result_count INTEGER,
    new_count INTEGER,
    search_time DATETIME DEFAULT CURRENT_TIMESTAMP
);