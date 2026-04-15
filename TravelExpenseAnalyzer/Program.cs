using TravelExpenseAnalyzer.Models;
using TravelExpenseAnalyzer.Services;
using TravelExpenseAnalyzer.Utils;

namespace TravelExpenseAnalyzer;

/// <summary>
/// 出差日记账数据整合工具
/// </summary>
class Program
{
    static void Main(string[] args)
    {
        try
        {
            Run();
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"程序执行出错：{ex.Message}");
            Console.WriteLine(ex.StackTrace);
            Console.ResetColor();
        }
    }
    
    static void Run()
    {
        // 输出欢迎信息
        Console.WriteLine();
        Console.WriteLine("================================================================================");
        Console.WriteLine("                    出差日记账数据整合工具 v1.0");
        Console.WriteLine("================================================================================");
        Console.WriteLine();
        
        // 初始化日志
        Logger.Init(AppConfig.OutputDir);
        
        // 记录开始时间
        var startTime = DateTime.Now;
        Logger.Info($"程序启动，开始处理数据...");
        Logger.Separator('=');
        
        // 1. 读取数据
        var reader = new DataReaderService();
        var (didiData, meituanData, zaituData) = reader.ReadAll();
        
        // 统计源数据
        var sourceStats = new Dictionary<string, int>
        {
            { "滴滴用车", didiData.Count },
            { "美团商旅", meituanData.Count },
            { "在途差旅", zaituData.Count }
        };
        
        // 2. 数据转换
        Logger.Separator('=');
        var transformer = new DataTransformService();
        var records = transformer.TransformAll(didiData, meituanData, zaituData);
        
        // 3. 异常检测
        Logger.Separator('=');
        var detector = new AnomalyDetector();
        var anomalies = detector.Detect(records);
        
        // 4. 数据核对
        Logger.Separator('=');
        var verification = new VerificationService();
        var report = verification.GenerateReport(sourceStats, records, anomalies);
        
        // 5. 导出数据
        Logger.Separator('=');
        Logger.Info("开始导出数据...");
        
        // 确保输出目录存在
        if (!Directory.Exists(AppConfig.OutputDir))
        {
            Directory.CreateDirectory(AppConfig.OutputDir);
        }
        
        var dataFilePath = Path.Combine(AppConfig.OutputDir, AppConfig.GetDataOutputFileName());
        var reportFilePath = Path.Combine(AppConfig.OutputDir, AppConfig.GetReportFileName());
        
        // 导出Excel
        var exporter = new ExcelExporter();
        exporter.Export(records, dataFilePath);
        
        // 保存核对报告
        report.输出文件.Add(new OutputFile
        {
            类型 = "数据文件",
            文件名 = Path.GetFileName(dataFilePath),
            生成成功 = File.Exists(dataFilePath)
        });
        
        verification.SaveReport(report, reportFilePath);
        
        report.输出文件.Add(new OutputFile
        {
            类型 = "核对报告",
            文件名 = Path.GetFileName(reportFilePath),
            生成成功 = File.Exists(reportFilePath)
        });
        
        // 输出汇总
        Logger.Separator('=');
        var endTime = DateTime.Now;
        var duration = (endTime - startTime).TotalSeconds;
        
        Logger.Info("处理完成！");
        Logger.Info($"  - 总记录数：{records.Count} 条");
        Logger.Info($"  - 异常记录：{records.Count(r => r.Anomaly?.类型 == AnomalyType.时间重叠 || r.Anomaly?.类型 == AnomalyType.地点冲突)} 条");
        Logger.Info($"  - 警示记录：{records.Count(r => r.Anomaly?.类型 == AnomalyType.多地行程)} 条");
        Logger.Info($"  - 处理耗时：{duration:F2} 秒");
        Logger.Info($"  - 输出文件：{dataFilePath}");
        Logger.Info($"  - 核对报告：{reportFilePath}");
        Logger.Separator('=');
        
        Console.WriteLine();
        Console.WriteLine("按任意键退出...");
        Console.ReadKey();
    }
}