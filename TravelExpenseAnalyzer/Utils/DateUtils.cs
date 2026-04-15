using System.Globalization;

namespace TravelExpenseAnalyzer.Utils;

/// <summary>
/// 日期处理工具类
/// </summary>
public static class DateUtils
{
    /// <summary>
    /// 尝试解析日期（支持多种格式）
    /// </summary>
    public static DateTime? TryParseDate(object? value)
    {
        if (value == null) return null;
        
        // 处理 DateTime 类型
        if (value is DateTime dt)
        {
            return dt;
        }
        
        // 处理 double 类型（Excel 序列号）
        if (value is double d)
        {
            try
            {
                // Excel 日期序列号转换
                if (d > 0 && d < 100000)
                {
                    return DateTime.FromOADate(d);
                }
            }
            catch
            {
                // 忽略转换错误
            }
        }
        
        // 处理字符串类型
        if (value is string s)
        {
            if (string.IsNullOrWhiteSpace(s)) return null;
            
            // 尝试多种日期格式
            var formats = new[]
            {
                "yyyy-MM-dd HH:mm:ss",
                "yyyy-MM-dd",
                "yyyy/MM/dd HH:mm:ss",
                "yyyy/MM/dd",
                "yyyy年MM月dd日"
            };
            
            foreach (var format in formats)
            {
                if (DateTime.TryParseExact(s, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var result))
                {
                    return result;
                }
            }
            
            // 尝试自动解析
            if (DateTime.TryParse(s, out var parsed))
            {
                return parsed;
            }
        }
        
        return null;
    }
    
    /// <summary>
    /// 尝试解析日期时间（包含时分秒）
    /// </summary>
    public static DateTime? TryParseDateTime(object? value)
    {
        return TryParseDate(value);
    }
    
    /// <summary>
    /// 格式化为日期字符串（不含时间）
    /// </summary>
    public static string? FormatDate(DateTime? date)
    {
        return date?.ToString("yyyy-MM-dd");
    }
    
    /// <summary>
    /// 格式化为日期时间字符串
    /// </summary>
    public static string? FormatDateTime(DateTime? date)
    {
        return date?.ToString("yyyy-MM-dd HH:mm:ss");
    }
    
    /// <summary>
    /// 检查两个时间区间是否重叠
    /// </summary>
    public static bool IsTimeOverlap(DateTime? start1, DateTime? end1, DateTime? start2, DateTime? end2)
    {
        if (!start1.HasValue || !start2.HasValue) return false;
        
        // 如果没有结束时间，使用开始时间作为结束时间（当天）
        var e1 = end1 ?? start1.Value;
        var e2 = end2 ?? start2.Value;
        
        // 时间区间重叠条件：start1 < end2 && start2 < end1
        return start1.Value < e2 && start2.Value < e1;
    }
    
    /// <summary>
    /// 检查两个时间是否在同一小时
    /// </summary>
    public static bool IsSameHour(DateTime? time1, DateTime? time2)
    {
        if (!time1.HasValue || !time2.HasValue) return false;
        
        return time1.Value.Year == time2.Value.Year
            && time1.Value.Month == time2.Value.Month
            && time1.Value.Day == time2.Value.Day
            && time1.Value.Hour == time2.Value.Hour;
    }
    
    /// <summary>
    /// 获取日期的小时精度时间键（用于分组）
    /// </summary>
    public static string GetHourKey(DateTime? time)
    {
        if (!time.HasValue) return "";
        return time.Value.ToString("yyyy-MM-dd HH:00");
    }
    
    /// <summary>
    /// 获取日期键（用于分组）
    /// </summary>
    public static string GetDateKey(DateTime? time)
    {
        if (!time.HasValue) return "";
        return time.Value.ToString("yyyy-MM-dd");
    }
}