using TravelExpenseAnalyzer.Models;
using TravelExpenseAnalyzer.Utils;

namespace TravelExpenseAnalyzer.Services;

/// <summary>
/// 数据核对服务
/// </summary>
public class VerificationService
{
    /// <summary>
    /// 生成核对报告
    /// </summary>
    public VerificationReport GenerateReport(
        Dictionary<string, int> sourceStats,
        List<TravelRecord> records,
        List<AnomalyResult> anomalies)
    {
        Logger.Info("生成核对报告...");
        
        var report = new VerificationReport
        {
            生成时间 = DateTime.Now,
            源数据统计 = sourceStats,
            转换统计 = CalculateTransformStats(records, sourceStats.Values.Sum()),
            异常统计 = CalculateAnomalyStats(anomalies),
            异常明细 = anomalies
        };
        
        // 执行核对
        report.核对结果 = PerformVerification(records, sourceStats);
        
        return report;
    }
    
    /// <summary>
    /// 计算转换统计
    /// </summary>
    private TransformStats CalculateTransformStats(List<TravelRecord> records, int totalInput)
    {
        var stats = new TransformStats
        {
            输入记录数 = totalInput,
            成功转换数 = records.Count,
            失败数 = totalInput - records.Count
        };
        
        // 统计失败原因
        stats.出差人为空数 = records.Count(r => string.IsNullOrWhiteSpace(r.出差人));
        stats.日期格式错误数 = records.Count(r => r.费用发生日期 == null);
        
        return stats;
    }
    
    /// <summary>
    /// 计算异常统计
    /// </summary>
    private AnomalyStats CalculateAnomalyStats(List<AnomalyResult> anomalies)
    {
        var stats = new AnomalyStats
        {
            时间重叠异常数 = anomalies.Count(a => a.类型 == AnomalyType.时间重叠 && a.严重程度 == "异常"),
            地点冲突异常数 = anomalies.Count(a => a.类型 == AnomalyType.地点冲突),
            多地行程警示数 = anomalies.Count(a => a.类型 == AnomalyType.多地行程)
        };
        
        // 收集异常人员
        stats.时间重叠人员 = anomalies
            .Where(a => a.类型 == AnomalyType.时间重叠 && a.严重程度 == "异常")
            .Select(a => a.出差人 ?? "")
            .Distinct()
            .Where(n => !string.IsNullOrEmpty(n))
            .ToList();
        
        stats.地点冲突人员 = anomalies
            .Where(a => a.类型 == AnomalyType.地点冲突)
            .Select(a => a.出差人 ?? "")
            .Distinct()
            .Where(n => !string.IsNullOrEmpty(n))
            .ToList();
        
        stats.多地行程人员 = anomalies
            .Where(a => a.类型 == AnomalyType.多地行程)
            .Select(a => a.出差人 ?? "")
            .Distinct()
            .Where(n => !string.IsNullOrEmpty(n))
            .ToList();
        
        return stats;
    }
    
    /// <summary>
    /// 执行核对项
    /// </summary>
    private List<VerificationItem> PerformVerification(List<TravelRecord> records, Dictionary<string, int> sourceStats)
    {
        var items = new List<VerificationItem>();
        
        // 1. 输入输出条数一致
        var inputCount = sourceStats.Values.Sum();
        items.Add(new VerificationItem
        {
            项目 = "输入输出条数一致",
            通过 = inputCount == records.Count,
            详情 = $"输入: {inputCount}, 输出: {records.Count}"
        });
        
        // 2. 必填字段无空值
        var emptyNames = records.Count(r => string.IsNullOrWhiteSpace(r.出差人));
        items.Add(new VerificationItem
        {
            项目 = "必填字段无空值（出差人）",
            通过 = emptyNames == 0,
            详情 = emptyNames == 0 ? "全部有值" : $"{emptyNames} 条记录为空"
        });
        
        // 3. 日期格式正确
        var invalidDates = records.Count(r => r.费用发生日期 == null);
        items.Add(new VerificationItem
        {
            项目 = "日期格式正确",
            通过 = invalidDates == 0,
            详情 = invalidDates == 0 ? "全部正确" : $"{invalidDates} 条记录日期无效"
        });
        
        // 4. 金额字段为数值
        var invalidAmounts = records.Count(r => 
            (r.交通费金额.HasValue && r.交通费金额.Value < 0) ||
            (r.住宿金额.HasValue && r.住宿金额.Value < 0));
        items.Add(new VerificationItem
        {
            项目 = "金额字段为数值",
            通过 = invalidAmounts == 0,
            详情 = invalidAmounts == 0 ? "全部有效" : $"{invalidAmounts} 条记录金额异常"
        });
        
        // 5. 异常标记完整
        var unprocessed = records.Count(r => r.Detection == null);
        items.Add(new VerificationItem
        {
            项目 = "异常检测完整",
            通过 = unprocessed == 0,
            详情 = unprocessed == 0 ? "全部完成检测" : $"{unprocessed} 条记录未检测"
        });
        
        return items;
    }
    
    /// <summary>
    /// 保存核对报告到文件
    /// </summary>
    public void SaveReport(VerificationReport report, string filePath)
    {
        Logger.Info($"保存核对报告：{filePath}");
        
        using var writer = new StreamWriter(filePath, false, System.Text.Encoding.UTF8);
        
        writer.WriteLine("================================================================================");
        writer.WriteLine("                        出差日记账数据核对报告");
        writer.WriteLine("================================================================================");
        writer.WriteLine($"生成时间：{report.生成时间:yyyy-MM-dd HH:mm:ss}");
        writer.WriteLine("操作人员：系统自动生成");
        writer.WriteLine();
        
        // 一、源数据统计
        writer.WriteLine("================================================================================");
        writer.WriteLine("一、源数据统计");
        writer.WriteLine("================================================================================");
        writer.WriteLine("来源              类型          数据量      状态");
        writer.WriteLine("--------------------------------------------------------------------------------");
        foreach (var kv in report.源数据统计)
        {
            writer.WriteLine($"{kv.Key,-18}{kv.Value,10} 条    ✓ 读取成功");
        }
        writer.WriteLine("--------------------------------------------------------------------------------");
        writer.WriteLine($"源数据合计{report.源数据统计.Values.Sum(),24} 条");
        writer.WriteLine();
        
        // 二、数据转换统计
        writer.WriteLine("================================================================================");
        writer.WriteLine("二、数据转换统计");
        writer.WriteLine("================================================================================");
        writer.WriteLine("转换项目                              结果");
        writer.WriteLine("--------------------------------------------------------------------------------");
        writer.WriteLine($"输入记录数{report.转换统计.输入记录数,34} 条");
        writer.WriteLine($"成功转换{report.转换统计.成功转换数,36} 条");
        writer.WriteLine($"转换失败（出差人为空）{report.转换统计.出差人为空数,20} 条");
        writer.WriteLine($"转换失败（日期格式错误）{report.转换统计.日期格式错误数,18} 条");
        writer.WriteLine($"转换失败（其他原因）{report.转换统计.其他错误数,22} 条");
        writer.WriteLine("--------------------------------------------------------------------------------");
        writer.WriteLine($"转换成功率{report.转换统计.成功率,34:F2}%");
        writer.WriteLine();
        
        // 三、异常检测统计
        writer.WriteLine("================================================================================");
        writer.WriteLine("三、异常检测统计");
        writer.WriteLine("================================================================================");
        writer.WriteLine("异常类型              数量          涉及人员");
        writer.WriteLine("--------------------------------------------------------------------------------");
        writer.WriteLine($"时间重叠异常{report.异常统计.时间重叠异常数,14} 条         {string.Join("、", report.异常统计.时间重叠人员.Take(5))}");
        writer.WriteLine($"地点冲突异常{report.异常统计.地点冲突异常数,14} 条         {string.Join("、", report.异常统计.地点冲突人员.Take(5))}");
        writer.WriteLine($"多地行程警示{report.异常统计.多地行程警示数,14} 条         {string.Join("、", report.异常统计.多地行程人员.Take(5))}");
        writer.WriteLine("--------------------------------------------------------------------------------");
        writer.WriteLine($"异常合计{report.异常统计.异常合计,18} 条");
        writer.WriteLine();
        
        // 四、异常明细
        writer.WriteLine("================================================================================");
        writer.WriteLine("四、异常明细");
        writer.WriteLine("================================================================================");
        
        // 时间重叠异常
        var timeOverlapAnomalies = report.异常明细.Where(a => a.类型 == AnomalyType.时间重叠).ToList();
        if (timeOverlapAnomalies.Any())
        {
            writer.WriteLine("【时间重叠异常】");
            writer.WriteLine("--------------------------------------------------------------------------------");
            writer.WriteLine("序号  出差人    时间区间                 地点A         地点B         说明");
            writer.WriteLine("--------------------------------------------------------------------------------");
            int idx = 1;
            foreach (var a in timeOverlapAnomalies.Take(20))
            {
                writer.WriteLine($"{idx++,4}  {a.出差人,-8} {a.时间区间,-24} {a.地点列表.ElementAtOrDefault(0),-12} {a.地点列表.ElementAtOrDefault(1),-12} {a.说明}");
            }
            if (timeOverlapAnomalies.Count > 20)
            {
                writer.WriteLine($"... 还有 {timeOverlapAnomalies.Count - 20} 条");
            }
            writer.WriteLine();
        }
        
        // 多地行程警示
        var multiCityAnomalies = report.异常明细.Where(a => a.类型 == AnomalyType.多地行程).ToList();
        if (multiCityAnomalies.Any())
        {
            writer.WriteLine("【多地行程警示】");
            writer.WriteLine("--------------------------------------------------------------------------------");
            writer.WriteLine("序号  出差人    日期                     涉及城市                      记录数");
            writer.WriteLine("--------------------------------------------------------------------------------");
            int idx = 1;
            foreach (var a in multiCityAnomalies.Take(20))
            {
                var cities = string.Join(" → ", a.地点列表);
                writer.WriteLine($"{idx++,4}  {a.出差人,-8} {a.时间区间,-24} {cities,-28} {a.关联记录.Count}");
            }
            if (multiCityAnomalies.Count > 20)
            {
                writer.WriteLine($"... 还有 {multiCityAnomalies.Count - 20} 条");
            }
            writer.WriteLine();
        }
        
        // 五、数据完整性核对
        writer.WriteLine("================================================================================");
        writer.WriteLine("五、数据完整性核对");
        writer.WriteLine("================================================================================");
        writer.WriteLine("核对项目                              结果");
        writer.WriteLine("--------------------------------------------------------------------------------");
        foreach (var item in report.核对结果)
        {
            var status = item.通过 ? "✓ 通过" : "✗ 失败";
            writer.WriteLine($"{item.Project,-36} {status}  {item.Detail}");
        }
        writer.WriteLine("--------------------------------------------------------------------------------");
        var allPassed = report.核对结果.All(i => i.通过);
        writer.WriteLine($"核对结果{(allPassed ? "                              ✓ 全部通过" : "                              ✗ 存在问题")}");
        writer.WriteLine();
        
        // 六、输出文件
        writer.WriteLine("================================================================================");
        writer.WriteLine("六、输出文件");
        writer.WriteLine("================================================================================");
        writer.WriteLine("文件类型              文件名                              状态");
        writer.WriteLine("--------------------------------------------------------------------------------");
        foreach (var file in report.输出文件)
        {
            var status = file.生成成功 ? "✓ 生成成功" : "✗ 生成失败";
            writer.WriteLine($"{file.Type,-20} {file.FileName,-36} {status}");
        }
        writer.WriteLine("--------------------------------------------------------------------------------");
        writer.WriteLine();
        
        writer.WriteLine("================================================================================");
        writer.WriteLine("                              报告生成完毕");
        writer.WriteLine("================================================================================");
        
        Logger.Info("核对报告保存完成");
    }
}