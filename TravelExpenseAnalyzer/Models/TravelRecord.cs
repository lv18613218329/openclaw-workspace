namespace TravelExpenseAnalyzer.Models;

/// <summary>
/// 出差记录统一数据模型
/// </summary>
public class TravelRecord
{
    // ========== 目标字段（输出到Excel）==========
    
    /// <summary>出差人姓名</summary>
    public string? 出差人 { get; set; }
    
    /// <summary>费用发生日期</summary>
    public DateTime? 费用发生日期 { get; set; }
    
    /// <summary>交通工具（打车/飞机/火车）</summary>
    public string? 交通工具 { get; set; }
    
    /// <summary>出发地点</summary>
    public string? 起点 { get; set; }
    
    /// <summary>到达地点</summary>
    public string? 终点 { get; set; }
    
    /// <summary>交通费金额</summary>
    public decimal? 交通费金额 { get; set; }
    
    /// <summary>交通费税额</summary>
    public decimal? 交通费税额 { get; set; }
    
    /// <summary>出差补助</summary>
    public decimal? 出差补助 { get; set; }
    
    /// <summary>住宿酒店名称</summary>
    public string? 住宿酒店名称 { get; set; }
    
    /// <summary>住宿金额</summary>
    public decimal? 住宿金额 { get; set; }
    
    /// <summary>住宿发票类型</summary>
    public string? 住宿发票类型 { get; set; }
    
    /// <summary>住宿费税额</summary>
    public decimal? 住宿费税额 { get; set; }
    
    /// <summary>填报日期</summary>
    public DateTime? 填报日期 { get; set; }
    
    // ========== 扩展字段（用于异常检测，不输出到Excel）==========
    
    /// <summary>检测用扩展信息</summary>
    public DetectionInfo? Detection { get; set; }
    
    // ========== 异常标记 ==========
    
    /// <summary>异常信息</summary>
    public AnomalyInfo? Anomaly { get; set; }
    
    /// <summary>原始行号（用于定位）</summary>
    public int SourceRowNumber { get; set; }
}

/// <summary>
/// 检测用扩展信息
/// </summary>
public class DetectionInfo
{
    /// <summary>行程开始时间</summary>
    public DateTime? 开始时间 { get; set; }
    
    /// <summary>行程结束时间</summary>
    public DateTime? 结束时间 { get; set; }
    
    /// <summary>所在城市</summary>
    public string? 城市 { get; set; }
    
    /// <summary>所在区县</summary>
    public string? 区县 { get; set; }
    
    /// <summary>数据来源</summary>
    public DataSourceType 数据来源 { get; set; }
    
    /// <summary>记录类型</summary>
    public RecordType 记录类型 { get; set; }
}

/// <summary>
/// 异常信息
/// </summary>
public class AnomalyInfo
{
    /// <summary>异常类型</summary>
    public AnomalyType? 类型 { get; set; }
    
    /// <summary>异常说明</summary>
    public string? 说明 { get; set; }
    
    /// <summary>关联记录索引</summary>
    public List<int> 关联记录索引 { get; set; } = new();
}