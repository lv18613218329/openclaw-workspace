using System;
using System.Collections.Generic;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Linq;
using System.Threading.Tasks;

namespace WpfMongoSync.Services;

/// <summary>
/// MongoDB服务 - 负责数据库连接和查询
/// </summary>
public class MongoService
{
    private MongoClient? _client;
    private IMongoDatabase? _database;

    // 默认查询超时时间（5分钟）
    private const int DefaultQueryTimeoutSeconds = 300;

    /// <summary>
    /// 查询MongoDB数据（原有方法，无时间过滤）
    /// </summary>
    public List<Dictionary<string, object>> QueryData(
        string connectionString,
        string databaseName,
        string collectionName,
        string eventFilter,
        string tenantCode,
        int timeoutSeconds = DefaultQueryTimeoutSeconds)
    {
        return QueryData(connectionString, databaseName, collectionName, eventFilter, tenantCode, null, timeoutSeconds);
    }

    /// <summary>
    /// 查询MongoDB数据（支持时间范围过滤）
    /// </summary>
    /// <param name="connectionString">连接字符串</param>
    /// <param name="databaseName">数据库名</param>
    /// <param name="collectionName">集合名</param>
    /// <param name="eventFilter">事件类型过滤</param>
    /// <param name="tenantCode">租户代码</param>
    /// <param name="startTime">开始时间（时间戳毫秒），null表示不过滤</param>
    /// <param name="timeoutSeconds">查询超时时间（秒）</param>
    public List<Dictionary<string, object>> QueryData(
        string connectionString,
        string databaseName,
        string collectionName,
        string eventFilter,
        string tenantCode,
        long? startTime,
        int timeoutSeconds = DefaultQueryTimeoutSeconds)
    {
        try
        {
            // 创建MongoClient
            var settings = MongoClientSettings.FromConnectionString(connectionString);
            settings.ServerSelectionTimeout = TimeSpan.FromSeconds(60);
            settings.SocketTimeout = TimeSpan.FromSeconds(timeoutSeconds);
            settings.ConnectTimeout = TimeSpan.FromSeconds(60);
            _client = new MongoClient(settings);
            _database = _client.GetDatabase(databaseName);
            var collection = _database.GetCollection<BsonDocument>(collectionName);

            // 先测试连接
            try
            {
                _database.RunCommand<BsonDocument>(new BsonDocument("ping", 1));
            }
            catch (Exception pingEx)
            {
                throw new Exception($"MongoDB连接失败: {pingEx.Message}");
            }

            // 构建查询条件
            var filterBuilder = Builders<BsonDocument>.Filter;
            var filter = filterBuilder.Empty;

            // 添加事件过滤条件 - events.event = eventFilter (events是数组，MongoDB会自动匹配数组元素)
            if (!string.IsNullOrEmpty(eventFilter))
            {
                filter &= filterBuilder.Eq("events.event", eventFilter);
            }

            // 添加租户代码过滤条件 - header.custom.tenantCode
            if (!string.IsNullOrEmpty(tenantCode))
            {
                filter &= filterBuilder.Eq("header.custom.tenantCode", tenantCode);
            }

            // 添加时间范围过滤 - events.local_time_ms > startTime
            // 注意：只有当 startTime > 0 时才添加时间过滤
            // 如果 startTime = 0（首次同步），不过滤时间，查询所有数据
            if (startTime.HasValue && startTime.Value > 0)
            {
                filter &= filterBuilder.Gt("events.local_time_ms", startTime.Value);
            }

            // 直接执行查询，限制条数（不先统计，大表统计很慢）
            var documents = collection.Find(filter)
                .Limit(10000)
                .Sort(Builders<BsonDocument>.Sort.Descending("_id"))
                .ToList();

            // 转换为字典列表
            var result = new List<Dictionary<string, object>>();
            foreach (var doc in documents)
            {
                var dict = BsonDocumentToDictionary(doc);
                result.Add(dict);
            }

            return result;
        }
        catch (Exception ex)
        {
            throw new Exception($"MongoDB查询失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 异步查询MongoDB数据
    /// </summary>
    public async Task<List<Dictionary<string, object>>> QueryDataAsync(
        string connectionString,
        string databaseName,
        string collectionName,
        string eventFilter,
        string tenantCode,
        long? startTime = null,
        int timeoutSeconds = DefaultQueryTimeoutSeconds,
        IProgress<string>? progress = null)
    {
        return await Task.Run(() =>
        {
            progress?.Report("正在连接MongoDB...");
            var result = QueryData(connectionString, databaseName, collectionName, eventFilter, tenantCode, startTime, timeoutSeconds);
            progress?.Report($"查询完成，共 {result.Count} 条记录");
            return result;
        });
    }

    /// <summary>
    /// 增量查询 - 查询最近24小时的数据
    /// </summary>
    public List<Dictionary<string, object>> QueryRecentData(
        string connectionString,
        string databaseName,
        string collectionName,
        string eventFilter,
        string tenantCode,
        int hoursAgo = 24)
    {
        var startTime = DateTimeOffset.UtcNow.AddHours(-hoursAgo).ToUnixTimeMilliseconds();
        return QueryData(connectionString, databaseName, collectionName, eventFilter, tenantCode, startTime);
    }

    /// <summary>
    /// 增量查询 - 从指定时间戳开始查询
    /// </summary>
    public List<Dictionary<string, object>> QueryIncrementalData(
        string connectionString,
        string databaseName,
        string collectionName,
        string eventFilter,
        string tenantCode,
        long lastSyncTimestamp)
    {
        return QueryData(connectionString, databaseName, collectionName, eventFilter, tenantCode, lastSyncTimestamp);
    }

    /// <summary>
    /// 测试连接
    /// </summary>
    public bool TestConnection(string connectionString, string databaseName)
    {
        try
        {
            var settings = MongoClientSettings.FromConnectionString(connectionString);
            settings.ServerSelectionTimeout = TimeSpan.FromSeconds(10);
            var client = new MongoClient(settings);
            var db = client.GetDatabase(databaseName);
            db.RunCommand<BsonDocument>(new BsonDocument("ping", 1));
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// 将BsonDocument转换为Dictionary
    /// </summary>
    private Dictionary<string, object> BsonDocumentToDictionary(BsonDocument doc)
    {
        var result = new Dictionary<string, object>();
        
        foreach (var element in doc.Elements)
        {
            var key = element.Name;
            var value = BsonValueToObject(element.Value);
            
            // 展开嵌套对象
            if (value is Dictionary<string, object> nestedDict)
            {
                FlattenDictionary(result, key, nestedDict);
            }
            else
            {
                result[key] = value ?? "";
            }
        }

        return result;
    }

    /// <summary>
    /// 展开嵌套字典
    /// </summary>
    private void FlattenDictionary(Dictionary<string, object> result, string prefix, Dictionary<string, object> nested)
    {
        foreach (var kvp in nested)
        {
            var newKey = $"{prefix}.{kvp.Key}";
            
            if (kvp.Value is Dictionary<string, object> deeperNested)
            {
                FlattenDictionary(result, newKey, deeperNested);
            }
            else
            {
                result[newKey] = kvp.Value ?? "";
            }
        }
    }

    /// <summary>
    /// 将BsonValue转换为普通对象
    /// </summary>
    private object? BsonValueToObject(BsonValue value)
    {
        if (value == null || value.IsBsonNull)
            return null;

        var bsonType = value.BsonType;
        
        switch (bsonType)
        {
            case BsonType.String:
                return value.AsString;
            case BsonType.Int32:
                return value.AsInt32;
            case BsonType.Int64:
                return value.AsInt64;
            case BsonType.Double:
                return value.AsDouble;
            case BsonType.Boolean:
                return value.AsBoolean;
            case BsonType.DateTime:
                return value.ToUniversalTime();
            case BsonType.Document:
                {
                    var dict = new Dictionary<string, object>();
                    foreach (var element in value.AsBsonDocument.Elements)
                    {
                        dict[element.Name] = BsonValueToObject(element.Value) ?? "";
                    }
                    return dict;
                }
            case BsonType.Array:
                return value.AsBsonArray.Select(BsonValueToObject).ToList();
            case BsonType.ObjectId:
                return value.AsObjectId.ToString();
            default:
                return value.ToString();
        }
    }
}