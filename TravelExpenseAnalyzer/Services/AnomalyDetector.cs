using TravelExpenseAnalyzer.Models;
using TravelExpenseAnalyzer.Utils;

namespace TravelExpenseAnalyzer.Services;

/// <summary>
/// 异常检测服务
/// </summary>
public class AnomalyDetector
{
    /// <summary>
    /// 执行异常检测
    /// </summary>
    public List<AnomalyResult> Detect(List<TravelRecord> records)
    {
        Logger.Info("开始异常检测...");
        
        var anomalies = new List<AnomalyResult>();
        
        // 1. 时间重叠检测
        var timeOverlapAnomalies = DetectTimeOverlap(records);
        anomalies.AddRange(timeOverlapAnomalies);
        Logger.Info($"  时间重叠异常：{timeOverlapAnomalies.Count(a => a.严重程度 == "异常")} 条");
        
        // 2. 地点冲突检测（已包含在时间重叠中）
        
        // 3. 多地行程警示
        var multiCityAnomalies = DetectMultiCityTravel(records);
        anomalies.AddRange(multiCityAnomalies);
        Logger.Info($"  多地行程警示：{multiCityAnomalies.Count} 条");
        
        Logger.Info($"异常检测完成，共发现 {anomalies.Count} 个问题");
        
        return anomalies;
    }
    
    #region 时间重叠检测
    
    /// <summary>
    /// 检测时间重叠异常
    /// </summary>
    private List<AnomalyResult> DetectTimeOverlap(List<TravelRecord> records)
    {
        var anomalies = new List<AnomalyResult>();
        
        // 按出差人分组
        var groupedByPerson = records
            .Where(r => !string.IsNullOrEmpty(r.出差人))
            .GroupBy(r => r.出差人)
            .ToList();
        
        foreach (var group in groupedByPerson)
        {
            var personRecords = group.ToList();
            var personName = group.Key;
            
            // 按开始时间排序
            personRecords.Sort((a, b) => 
                (a.Detection?.开始时间 ?? DateTime.MinValue).CompareTo(b.Detection?.开始时间 ?? DateTime.MinValue));
            
            // 检查每对记录的时间重叠
            for (int i = 0; i < personRecords.Count; i++)
            {
                var recordA = personRecords[i];
                if (recordA.Detection?.开始时间 == null) continue;
                
                for (int j = i + 1; j < personRecords.Count; j++)
                {
                    var recordB = personRecords[j];
                    if (recordB.Detection?.开始时间 == null) continue;
                    
                    // 检查时间重叠
                    if (DateUtils.IsTimeOverlap(
                        recordA.Detection.开始时间, recordA.Detection.结束时间,
                        recordB.Detection.开始时间, recordB.Detection.结束时间))
                    {
                        // 检查地点是否不同
                        var locationA = GetLocation(recordA);
                        var locationB = GetLocation(recordB);
                        
                        if (!IsSameLocation(recordA, recordB))
                        {
                            // 发现时间重叠异常
                            var anomaly = new AnomalyResult
                            {
                                类型 = AnomalyType.时间重叠,
                                严重程度 = "异常",
                                出差人 = personName,
                                时间区间 = FormatTimeRange(recordA.Detection.开始时间, recordA.Detection.结束时间),
                                说明 = $"同一时间出现在不同地点：{locationA} 和 {locationB}",
                                关联记录 = new List<int> { records.IndexOf(recordA), records.IndexOf(recordB) }
                            };
                            anomaly.地点列表.Add(locationA);
                            anomaly.地点列表.Add(locationB);
                            anomaly.数据来源.Add(recordA.Detection?.数据来源.ToString() ?? "");
                            anomaly.数据来源.Add(recordB.Detection?.数据来源.ToString() ?? "");
                            
                            anomalies.Add(anomaly);
                            
                            // 标记记录
                            recordA.Anomaly ??= new AnomalyInfo();
                            recordA.Anomaly.类型 = AnomalyType.时间重叠;
                            recordA.Anomaly.说明 = $"与 {locationB} 时间重叠";
                            
                            recordB.Anomaly ??= new AnomalyInfo();
                            recordB.Anomaly.类型 = AnomalyType.时间重叠;
                            recordB.Anomaly.说明 = $"与 {locationA} 时间重叠";
                        }
                    }
                    else
                    {
                        // 时间不重叠，后面的更不可能重叠（已排序）
                        break;
                    }
                }
            }
        }
        
        return anomalies;
    }
    
    #endregion
    
    #region 多地行程检测
    
    /// <summary>
    /// 检测多地行程警示
    /// </summary>
    private List<AnomalyResult> DetectMultiCityTravel(List<TravelRecord> records)
    {
        var anomalies = new List<AnomalyResult>();
        
        // 按出差人和日期分组
        var groupedByPersonAndDate = records
            .Where(r => !string.IsNullOrEmpty(r.出差人) && r.费用发生日期.HasValue)
            .GroupBy(r => new { r.出差人, Date = r.费用发生日期!.Value.Date })
            .ToList();
        
        foreach (var group in groupedByPersonAndDate)
        {
            var personRecords = group.ToList();
            var personName = group.Key.出差人;
            var date = group.Key.Date;
            
            // 收集当天所有城市
            var cities = personRecords
                .Where(r => r.Detection?.城市 != null)
                .Select(r => r.Detection!.城市!)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            
            // 如果同一天出现在多个城市
            if (cities.Count > 1)
            {
                var anomaly = new AnomalyResult
                {
                    类型 = AnomalyType.多地行程,
                    严重程度 = "警示",
                    出差人 = personName,
                    时间区间 = date.ToString("yyyy-MM-dd"),
                    说明 = $"当天出现在多个城市：{string.Join(" → ", cities)}",
                    关联记录 = personRecords.Select(r => records.IndexOf(r)).ToList()
                };
                anomaly.地点列表.AddRange(cities);
                anomaly.数据来源.AddRange(personRecords
                    .Select(r => r.Detection?.数据来源.ToString() ?? "")
                    .Distinct());
                
                anomalies.Add(anomaly);
                
                // 标记记录（黄色警示）
                foreach (var record in personRecords)
                {
                    // 如果已经是红色异常，不覆盖
                    if (record.Anomaly?.类型 == AnomalyType.时间重叠 || 
                        record.Anomaly?.类型 == AnomalyType.地点冲突)
                        continue;
                    
                    record.Anomaly ??= new AnomalyInfo();
                    record.Anomaly.类型 = AnomalyType.多地行程;
                    record.Anomaly.说明 = $"当天出现在多个城市：{string.Join(" → ", cities)}";
                }
            }
        }
        
        return anomalies;
    }
    
    #endregion
    
    #region 辅助方法
    
    /// <summary>
    /// 获取记录的地点描述
    /// </summary>
    private static string GetLocation(TravelRecord record)
    {
        if (record.Detection == null) return "未知地点";
        
        // 优先使用区县，如果没有则使用城市
        var location = record.Detection.区县 ?? record.Detection.城市 ?? record.起点 ?? "未知地点";
        return location;
    }
    
    /// <summary>
    /// 判断两条记录是否在同一地点
    /// </summary>
    private static bool IsSameLocation(TravelRecord recordA, TravelRecord recordB)
    {
        var detectionA = recordA.Detection;
        var detectionB = recordB.Detection;
        
        if (detectionA == null || detectionB == null) return false;
        
        // 如果两条都是机票记录，比较城市
        if (detectionA.记录类型 == RecordType.机票 && detectionB.记录类型 == RecordType.机票)
        {
            return string.Equals(detectionA.城市, detectionB.城市, StringComparison.OrdinalIgnoreCase);
        }
        
        // 如果其中一条是机票（城市级别），比较城市
        if (detectionA.记录类型 == RecordType.机票 || detectionB.记录类型 == RecordType.机票)
        {
            return string.Equals(detectionA.城市, detectionB.城市, StringComparison.OrdinalIgnoreCase);
        }
        
        // 其他情况比较区县
        var districtA = detectionA.区县 ?? detectionA.城市;
        var districtB = detectionB.区县 ?? detectionB.城市;
        
        return string.Equals(districtA, districtB, StringComparison.OrdinalIgnoreCase);
    }
    
    /// <summary>
    /// 格式化时间区间
    /// </summary>
    private static string FormatTimeRange(DateTime? start, DateTime? end)
    {
        var startStr = start?.ToString("yyyy-MM-dd HH:mm") ?? "?";
        var endStr = end?.ToString("yyyy-MM-dd HH:mm") ?? "?";
        return $"{startStr} ~ {endStr}";
    }
    
    #endregion
}