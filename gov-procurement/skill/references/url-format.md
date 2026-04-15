# URL格式说明

## 正确的URL格式

```
https://search.ccgp.gov.cn/bxsearch?searchtype=1&page_index=1&bidSort=&buyerName=&projectId=&pinMu=&bidType=&dbselect=bidx&kw=智慧校园&start_time=2026:02:15&end_time=2026:03:18&timeType=3&displayZone=&zoneId=&pppStatus=0&agentName=
```

## 关键参数

| 参数 | 说明 | 示例值 |
|------|------|--------|
| `searchtype` | 搜索类型 | `1`（标题搜索） |
| `page_index` | 页码 | `1` |
| `dbselect` | 数据库选择 | `bidx` |
| `kw` | 关键词 | `智慧校园` |
| `start_time` | 开始时间 | `2026:02:15`（冒号分隔） |
| `end_time` | 结束时间 | `2026:03:18` |
| `timeType` | 时间类型 | `3` |

## 常见错误

### 错误1：缺少必要参数

```
# 错误
https://search.ccgp.gov.cn/bxsearch?kw=智慧校园

# 结果：500 Internal Server Error
```

### 错误2：时间格式错误

```
# 错误
start_time=2026-02-15

# 正确
start_time=2026:02:15
```

## URL构建代码

```javascript
function buildSearchUrl(keyword, startDate, endDate) {
  const formatParam = (d) => `${d.getFullYear()}:${String(d.getMonth() + 1).padStart(2, '0')}:${String(d.getDate()).padStart(2, '0')}`;
  
  const params = new URLSearchParams({
    searchtype: '1',
    page_index: '1',
    bidSort: '',
    buyerName: '',
    projectId: '',
    pinMu: '',
    bidType: '',
    dbselect: 'bidx',
    kw: keyword,
    start_time: formatParam(startDate),
    end_time: formatParam(endDate),
    timeType: '3',
    displayZone: '',
    zoneId: '',
    pppStatus: '0',
    agentName: ''
  });
  
  return `https://search.ccgp.gov.cn/bxsearch?${params.toString()}`;
}
```