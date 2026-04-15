namespace TravelExpenseAnalyzer;

/// <summary>
/// 应用配置
/// </summary>
public static class AppConfig
{
    #region 输入文件路径
    
    /// <summary>滴滴用车订单文件</summary>
    public static string DidiFilePath { get; } = 
        @"C:\Users\Administrator\Desktop\商旅订单\商旅订单\用车订单导出1125995062986129_20260317（滴滴）.xlsx";
    
    /// <summary>美团商旅订单文件</summary>
    public static string MeituanFilePath { get; } = 
        @"C:\Users\Administrator\Desktop\商旅订单\商旅订单\商旅订单2026.1.1-2026.1.31（美团）.xlsx";
    
    /// <summary>在途差旅订单文件</summary>
    public static string ZaituFilePath { get; } = 
        @"C:\Users\Administrator\Desktop\商旅订单\商旅订单\差旅订单汇总订单导出 （在途）.xlsx";
    
    /// <summary>输出模板参考文件</summary>
    public static string TemplateFilePath { get; } = 
        @"C:\Users\Administrator\Desktop\商旅订单\商旅订单\出差日记账.xlsx";
    
    #endregion
    
    #region 输出配置
    
    /// <summary>输出目录</summary>
    public static string OutputDir { get; } = @"C:\Users\Administrator\Desktop\商旅订单\商旅订单\Output";
    
    /// <summary>获取数据输出文件名</summary>
    public static string GetDataOutputFileName() => 
        $"出差日记账_生成_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
    
    /// <summary>获取核对报告文件名</summary>
    public static string GetReportFileName() => 
        $"核对报告_{DateTime.Now:yyyyMMdd_HHmmss}.txt";
    
    #endregion
    
    #region 美团Sheet配置
    
    /// <summary>美团有效Sheet配置（Sheet名称 -> (类型, 最低行数阈值)）</summary>
    public static readonly Dictionary<string, (string type, int minRows)> MeituanSheets = new()
    {
        { "打车", ("打车", 1) },
        { "国内酒店", ("酒店", 1) },
        { "国内机票", ("机票", 1) }
        // 餐饮数据暂不处理
        // { "用券买单", ("餐饮", 1) },
        // { "买单", ("餐饮", 1) }
    };
    
    #endregion
    
    #region Excel表头定义
    
    /// <summary>目标Excel表头（含数据来源列）</summary>
    public static readonly string[] TargetHeaders = 
    {
        "出差人", "费用发生日期", "交通工具", "起点", "终点",
        "交通费金额", "交通费税额", "出差补助",
        "住宿酒店名称", "住宿金额", "住宿发票类型", "住宿费税额", "填报日期",
        "数据来源"  // 新增：标记数据来源
    };
    
    #endregion
}