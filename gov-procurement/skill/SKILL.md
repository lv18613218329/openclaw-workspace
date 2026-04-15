---
name: gov-procurement
description: 政府采购信息采集工具。从中国政府采购网（search.ccgp.gov.cn）自动采集招标公告信息。支持关键词过滤、学校关键词筛选、增量同步。触发场景：(1) 用户提到政府采购、招标信息采集；(2) 用户需要采集学校相关采购公告；(3) 用户提到 gov-procurement 项目；(4) 用户需要查看采购数据或运行采集任务。
---

# 政府采购信息采集

从中国政府采购网自动采集招标公告信息，过滤学校相关客户。

## 快速开始

```bash
# 1. 进入项目目录
cd ~/.openclaw/workspace/gov-procurement

# 2. 安装依赖（首次运行）
npm install better-sqlite3

# 3. 复制采集脚本到项目目录
# scripts/crawl.js -> crawl.js

# 4. 运行采集
node scripts/crawl.js
```

## 核心功能

1. **采集招标公告** - 按关键词搜索政府采购网
2. **学校关键词过滤** - 只保留学校客户数据
3. **增量同步** - 自动去重，避免重复采集

## 使用方法

### 运行采集

```bash
node scripts/crawl.js
```

### 查看数据

```bash
node scripts/show-data.js
```

### 检查数据质量

```bash
node scripts/check-quality.js
```

## 配置说明

### 关键词配置

编辑 `scripts/crawl.js` 中的 `ALL_KEYWORDS`：

```javascript
const ALL_KEYWORDS = {
  "政策项目类": ["双优校建设", "双高建设", "教师档案袋"],
  "智慧校园类": ["智慧校园", "教务系统", "学工系统"],
  // ...
};
```

### 学校关键词过滤

采购人必须包含以下关键词才会入库：

```javascript
const SCHOOL_KEYWORDS = ['学校', '中心', '学院', '中学', '高中', '集团', '大学', '小学'];
```

### 时间范围

默认采集最近30天数据，可在 `crawl.js` 中修改：

```javascript
startDate.setDate(startDate.getDate() - 30);  // 改为 -7 表示最近7天
```

## 数据字段

| 字段 | 说明 |
|------|------|
| title | 公告标题（完整） |
| url | 详情页URL（真实可访问） |
| buyer | 采购人 |
| region | 地区 |
| publish_date | 发布日期 |
| keyword | 搜索关键词 |
| category | 关键词类别 |
| project_type | 公告类型 |

## 数据库

位置：`procurement.db`（SQLite）

常用查询：

```sql
-- 查看总数
SELECT COUNT(*) FROM procurement_items;

-- 按关键词统计
SELECT keyword, COUNT(*) as count 
FROM procurement_items 
GROUP BY keyword ORDER BY count DESC;

-- 导出数据
.headers on
.mode csv
.output data.csv
SELECT * FROM procurement_items;
```

## 前置条件

1. **OpenClaw Browser Relay** 扩展已安装并激活
2. 浏览器已打开政府采购网页面
3. Node.js 已安装

## 常见问题

### 采集返回0条

1. 检查浏览器扩展是否激活（徽章绿色）
2. 手动访问政府采购网确认页面正常
3. 查看控制台错误信息

### URL格式错误

确保使用完整URL格式，包含所有必要参数。参考 `references/url-format.md`。

## 详细文档

- [需求背景](references/background.md) - 业务场景和采集目标
- [技术方案](references/technical.md) - URL格式和解析逻辑
- [实测记录](references/testing.md) - 测试场景和问题解决
- [待优化项](references/todo.md) - 已知问题和改进计划

---

*项目位置: ~/.openclaw/workspace/gov-procurement*