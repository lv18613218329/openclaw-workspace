namespace TravelExpenseAnalyzer.Models;

/// <summary>
/// 异常检测结果
/// </summary>
public class AnomalyResult
{
    /// <summary>异常类型</summary>
    public AnomalyType 类型 { get; set; }
    
    /// <summary>严重程度（异常/警示）</summary>
    public string 严重程度 { get; set; } = "异常";
    
    /// <summary>出差人姓名</summary>
    public string? 出差人 { get; set; }
    
    /// <summary>异常发生的时间区间</summary>
    public string? 时间区间 { get; set; }
    
    /// <summary>涉及的地点列表</summary>
    public List<string> 地点列表 { get; set; } = new();
    
    /// <summary>涉及的数据来源</summary>
    public List<string> 数据来源 { get; set; } = new();
    
    /// <summary>关联的记录索引</summary>
    public List<int> 关联记录 { get; set; } = new();
    
    /// <summary>异常详细说明</summary>
    public string? 说明 { get; set; }
}

/// <summary>
/// 核对报告统计信息
/// </summary>
public class VerificationReport
{
    /// <summary>生成时间</summary>
    public DateTime 生成时间 { get; set; } = DateTime.Now;
    
    /// <summary>源数据统计</summary>
    public Dictionary<string, int> 源数据统计 { get; set; } = new();
    
    /// <summary>转换统计</summary>
    public TransformStats 转换统计 { get; set; } = new();
    
    /// <summary>异常检测统计</summary>
    public AnomalyStats 异常统计 { get; set; } = new();
    
    /// <summary>异常明细列表</summary>
    public List<AnomalyResult> 异常明细 { get; set; } = new();
    
    /// <summary>核对结果</summary>
    public List<VerificationItem> 核对结果 { get; set; } = new();
    
    /// <summary>输出文件列表</summary>
    public List<OutputFile> 输出文件 { get; set; } = new();
}

/// <summary>
/// 转换统计
/// </summary>
public class TransformStats
{
    public int 输入记录数 { get; set; }
    public int 成功转换数 { get; set; }
    public int 失败数 { get; set; }
    public int 出差人为空数 { get; set; }
    public int 日期格式错误数 { get; set; }
    public int 其他错误数 { get; set; }
    public double 成功率 => 输入记录数 > 0 ? (double)成功转换数 / 输入记录数 * 100 : 0;
}

/// <summary>
/// 异常统计
/// </summary>
public class AnomalyStats
{
    public int 时间重叠异常数 { get; set; }
    public int 地点冲突异常数 { get; set; }
    public int 多地行程警示数 { get; set; }
    public int 异常合计 => 时间重叠异常数 + 地点冲突异常数 + 多地行程警示数;
    public List<string> 时间重叠人员 { get; set; } = new();
    public List<string> 地点冲突人员 { get; set; } = new();
    public List<string> 多地行程人员 { get; set; } = new();
}

/// <summary>
/// 核对项
/// </summary>
public class VerificationItem
{
    public string 项目 { get; set; } = "";
    public bool 通过 { get; set; }
    public string? 详情 { get; set; }
    
    // 兼容英文名
    public string Project => 项目;
    public string Detail => 详情;
}

/// <summary>
/// 输出文件信息
/// </summary>
public class OutputFile
{
    public string 类型 { get; set; } = "";
    public string 文件名 { get; set; } = "";
    public bool 生成成功 { get; set; }
    
    // 兼容英文名
    public string Type => 类型;
    public string FileName => 文件名;
}