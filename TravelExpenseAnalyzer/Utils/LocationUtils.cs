using System.Text.RegularExpressions;

namespace TravelExpenseAnalyzer.Utils;

/// <summary>
/// 地点解析工具类
/// </summary>
public static class LocationUtils
{
    #region 在途订单摘要解析
    
    /// <summary>
    /// 在途酒店订单摘要正则
    /// 格式：{城市} {酒店名称}-{房型} {入住日期} ~ {离店日期} {出行人姓名}
    /// 示例：平顶山 维也纳酒店(平顶山卫东区万达广场店)-标准大床房 2026-01-30 ~ 2026-01-31 舒锐
    /// </summary>
    private static readonly Regex ZaituHotelRegex = new(
        @"^(.+?)\s+(.+?)-(.+?)\s+(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})\s+(.+)$",
        RegexOptions.Compiled);
    
    /// <summary>
    /// 在途机票订单摘要正则
    /// 格式：{出发地}-{目的地} {日期} {时间}起飞 {航班信息} {出行人}
    /// 示例：济南-成都 2026-02-05 16:50起飞 SC8831经济舱2.6折  王齐
    /// </summary>
    private static readonly Regex ZaituFlightRegex = new(
        @"^(.+?)-(.+?)\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})起飞\s+(.+?)\s{2,}(.+)$",
        RegexOptions.Compiled);
    
    /// <summary>
    /// 在途火车票订单摘要正则
    /// 格式：{出发地}-{目的地} {车次}{座位类型}{日期} {时间}出发 {出行人}
    /// 示例：遂宁-成都东 D631无座2026-01-30 15:14出发  冉崇洋
    /// </summary>
    private static readonly Regex ZaituTrainRegex = new(
        @"^(.+?)-(.+?)\s+([A-Z]\d+\S*?)\s*(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})出发\s+(.+)$",
        RegexOptions.Compiled);
    
    /// <summary>
    /// 在途用车订单摘要正则
    /// 格式：{起点}-{终点} {车型} {日期} {时间}出发 {出行人}
    /// 示例：湘潭站(出站口)西南侧-湘潭生物机电学校  经济型 2026-01-27 09:42出发 宋宝峰
    /// </summary>
    private static readonly Regex ZaituCarRegex = new(
        @"^(.+?)-(.+?)\s+(\S+?)\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})出发\s+(.+)$",
        RegexOptions.Compiled);
    
    /// <summary>
    /// 解析在途酒店订单摘要
    /// </summary>
    public static ZaituHotelInfo? ParseZaituHotelSummary(string? summary)
    {
        if (string.IsNullOrWhiteSpace(summary)) return null;
        
        var match = ZaituHotelRegex.Match(summary);
        if (!match.Success) return null;
        
        return new ZaituHotelInfo
        {
            城市 = match.Groups[1].Value.Trim(),
            酒店名称 = match.Groups[2].Value.Trim(),
            房型 = match.Groups[3].Value.Trim(),
            入住日期 = DateUtils.TryParseDate(match.Groups[4].Value),
            离店日期 = DateUtils.TryParseDate(match.Groups[5].Value),
            出行人姓名 = match.Groups[6].Value.Trim()
        };
    }
    
    /// <summary>
    /// 解析在途机票订单摘要
    /// </summary>
    public static ZaituFlightInfo? ParseZaituFlightSummary(string? summary)
    {
        if (string.IsNullOrWhiteSpace(summary)) return null;
        
        var match = ZaituFlightRegex.Match(summary);
        if (!match.Success) return null;
        
        return new ZaituFlightInfo
        {
            出发地 = match.Groups[1].Value.Trim(),
            目的地 = match.Groups[2].Value.Trim(),
            日期 = match.Groups[3].Value,
            时间 = match.Groups[4].Value,
            航班信息 = match.Groups[5].Value.Trim(),
            出行人姓名 = match.Groups[6].Value.Trim()
        };
    }
    
    /// <summary>
    /// 解析在途火车票订单摘要
    /// </summary>
    public static ZaituTrainInfo? ParseZaituTrainSummary(string? summary)
    {
        if (string.IsNullOrWhiteSpace(summary)) return null;
        
        var match = ZaituTrainRegex.Match(summary);
        if (!match.Success) return null;
        
        return new ZaituTrainInfo
        {
            出发地 = match.Groups[1].Value.Trim(),
            目的地 = match.Groups[2].Value.Trim(),
            车次 = match.Groups[3].Value.Trim(),
            日期 = match.Groups[4].Value,
            时间 = match.Groups[5].Value,
            出行人姓名 = match.Groups[6].Value.Trim()
        };
    }
    
    /// <summary>
    /// 解析在途用车订单摘要
    /// </summary>
    public static ZaituCarInfo? ParseZaituCarSummary(string? summary)
    {
        if (string.IsNullOrWhiteSpace(summary)) return null;
        
        var match = ZaituCarRegex.Match(summary);
        if (!match.Success) return null;
        
        return new ZaituCarInfo
        {
            起点 = match.Groups[1].Value.Trim(),
            终点 = match.Groups[2].Value.Trim(),
            车型 = match.Groups[3].Value.Trim(),
            日期 = match.Groups[4].Value,
            时间 = match.Groups[5].Value,
            出行人姓名 = match.Groups[6].Value.Trim()
        };
    }
    
    #endregion
    
    #region 地址解析
    
    /// <summary>
    /// 从地址中提取城市
    /// </summary>
    public static string? ExtractCity(string? address)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;
        
        // 常见城市后缀
        var citySuffixes = new[] { "市", "地区", "自治州" };
        
        // 尝试匹配省份+城市
        var provinceCityPattern = @"(.+?省|.+?自治区)(.+?(市|地区|自治州))";
        var match = Regex.Match(address, provinceCityPattern);
        if (match.Success)
        {
            return match.Groups[2].Value;
        }
        
        // 尝试匹配城市名
        foreach (var suffix in citySuffixes)
        {
            var idx = address.IndexOf(suffix);
            if (idx > 0)
            {
                // 找到城市后，尝试截取城市名
                var cityPart = address.Substring(0, idx + 1);
                // 去掉省份前缀
                var provIdx = cityPart.IndexOf("省");
                if (provIdx >= 0)
                {
                    return cityPart.Substring(provIdx + 1);
                }
                return cityPart;
            }
        }
        
        return null;
    }
    
    /// <summary>
    /// 从地址中提取区县
    /// </summary>
    public static string? ExtractDistrict(string? address)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;
        
        // 区县后缀
        var districtSuffixes = new[] { "区", "县", "市" };
        
        foreach (var suffix in districtSuffixes)
        {
            var pattern = $@"(.+?(?:{string.Join("|", districtSuffixes)}))(.+?{suffix})";
            var match = Regex.Match(address, pattern);
            if (match.Success)
            {
                return match.Groups[2].Value;
            }
        }
        
        return null;
    }
    
    /// <summary>
    /// 比较两个地点是否相同（城市级别）
    /// </summary>
    public static bool IsSameCity(string? location1, string? location2)
    {
        if (string.IsNullOrWhiteSpace(location1) || string.IsNullOrWhiteSpace(location2)) 
            return false;
        
        var city1 = ExtractCity(location1) ?? location1;
        var city2 = ExtractCity(location2) ?? location2;
        
        return string.Equals(city1, city2, StringComparison.OrdinalIgnoreCase);
    }
    
    /// <summary>
    /// 比较两个地点是否相同（区县级别）
    /// </summary>
    public static bool IsSameDistrict(string? location1, string? location2)
    {
        if (string.IsNullOrWhiteSpace(location1) || string.IsNullOrWhiteSpace(location2)) 
            return false;
        
        var district1 = ExtractDistrict(location1) ?? location1;
        var district2 = ExtractDistrict(location2) ?? location2;
        
        return string.Equals(district1, district2, StringComparison.OrdinalIgnoreCase);
    }
    
    #endregion
}

#region 在途订单摘要解析结果类

public class ZaituHotelInfo
{
    public string? 城市 { get; set; }
    public string? 酒店名称 { get; set; }
    public string? 房型 { get; set; }
    public DateTime? 入住日期 { get; set; }
    public DateTime? 离店日期 { get; set; }
    public string? 出行人姓名 { get; set; }
}

public class ZaituFlightInfo
{
    public string? 出发地 { get; set; }
    public string? 目的地 { get; set; }
    public string? 日期 { get; set; }
    public string? 时间 { get; set; }
    public string? 航班信息 { get; set; }
    public string? 出行人姓名 { get; set; }
}

public class ZaituTrainInfo
{
    public string? 出发地 { get; set; }
    public string? 目的地 { get; set; }
    public string? 车次 { get; set; }
    public string? 日期 { get; set; }
    public string? 时间 { get; set; }
    public string? 出行人姓名 { get; set; }
}

public class ZaituCarInfo
{
    public string? 起点 { get; set; }
    public string? 终点 { get; set; }
    public string? 车型 { get; set; }
    public string? 日期 { get; set; }
    public string? 时间 { get; set; }
    public string? 出行人姓名 { get; set; }
}

#endregion