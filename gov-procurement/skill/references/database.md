# 数据库表结构

## procurement_items（采购信息表）

```sql
CREATE TABLE procurement_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,           -- 公告标题
  url TEXT UNIQUE,               -- 详情页URL
  project_id TEXT,               -- 项目编号
  publish_date DATE,             -- 发布日期
  region TEXT,                   -- 地区（省/市）
  region_code TEXT,              -- 地区代码
  keyword TEXT,                  -- 搜索关键词
  category TEXT,                 -- 关键词类别
  buyer TEXT,                    -- 采购人
  buyer_contact TEXT,            -- 采购人联系方式
  agent TEXT,                    -- 代理机构
  agent_contact TEXT,            -- 代理机构联系方式
  budget REAL,                   -- 预算金额
  project_type TEXT,             -- 公告类型
  status TEXT,                   -- 状态
  created_at DATETIME,
  updated_at DATETIME
);
```

## 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| title | TEXT | 公告标题（完整） | 赤峰建筑工程学校双优校建设... |
| url | TEXT | 详情页URL | http://www.ccgp.gov.cn/cggg/... |
| buyer | TEXT | 采购人 | 赤峰建筑工程学校 |
| region | TEXT | 地区 | 内蒙古 |
| publish_date | DATE | 发布日期 | 2026-03-18 |
| keyword | TEXT | 搜索关键词 | 双优校建设 |
| category | TEXT | 关键词类别 | 政策项目类 |
| project_type | TEXT | 公告类型 | 竞争性磋商公告 |

## 常用查询

```sql
-- 查看总数
SELECT COUNT(*) FROM procurement_items;

-- 按关键词统计
SELECT keyword, COUNT(*) as count 
FROM procurement_items 
GROUP BY keyword ORDER BY count DESC;

-- 按地区统计
SELECT region, COUNT(*) as count 
FROM procurement_items 
WHERE region IS NOT NULL
GROUP BY region ORDER BY count DESC;

-- 最近采集的数据
SELECT * FROM procurement_items 
ORDER BY created_at DESC LIMIT 10;

-- 按采购人搜索
SELECT * FROM procurement_items 
WHERE buyer LIKE '%学校%';

-- 导出CSV
.headers on
.mode csv
.output data.csv
SELECT * FROM procurement_items;
```

## search_logs（采集日志表）

```sql
CREATE TABLE search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT,              -- 搜索关键词
  region TEXT,               -- 地区
  region_code TEXT,          -- 地区代码
  result_count INTEGER,      -- 找到的记录数
  new_count INTEGER,         -- 新增的记录数
  search_time DATETIME       -- 采集时间
);
```