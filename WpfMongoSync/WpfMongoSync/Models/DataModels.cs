using System;

namespace WpfMongoSync.Models;

/// <summary>
/// MongoDB配置
/// </summary>
public class MongoConfig
{
    public string Url { get; set; } = "";
    public string Database { get; set; } = "";
    public string Collection { get; set; } = "";
    public string EventFilter { get; set; } = "";
    public string TenantCode { get; set; } = "";
}

/// <summary>
/// 飞书配置
/// </summary>
public class FeishuConfig
{
    public string AppId { get; set; } = "";
    public string AppSecret { get; set; } = "";
    public string AppToken { get; set; } = "";
    public string TableId { get; set; } = "";
}

/// <summary>
/// 同步状态 - 用于增量同步
/// </summary>
public class SyncState
{
    /// <summary>
    /// 最后同步时间（时间戳毫秒）
    /// </summary>
    public long LastSyncTimestamp { get; set; }
    
    /// <summary>
    /// 最后同步时间（可读格式）
    /// </summary>
    public string LastSyncTime { get; set; } = "";
    
    /// <summary>
    /// 累计同步记录数
    /// </summary>
    public int TotalSyncCount { get; set; }
}

/// <summary>
/// 同步记录 - 用于显示历史
/// </summary>
public class SyncRecord
{
    /// <summary>
    /// 同步时间
    /// </summary>
    public DateTime Time { get; set; }
    
    /// <summary>
    /// 同步类型（增量/全量/定时）
    /// </summary>
    public string Type { get; set; } = "";
    
    /// <summary>
    /// 同步结果（成功/失败/无数据）
    /// </summary>
    public string Result { get; set; } = "";
    
    /// <summary>
    /// 同步数量
    /// </summary>
    public int Count { get; set; }
    
    /// <summary>
    /// 备注/错误信息
    /// </summary>
    public string Message { get; set; } = "";
}