using OfficeOpenXml;
using TravelExpenseAnalyzer.Models;
using TravelExpenseAnalyzer.Utils;

namespace TravelExpenseAnalyzer.Services;

/// <summary>
/// 数据读取服务
/// </summary>
public class DataReaderService
{
    public DataReaderService()
    {
        // 设置 EPPlus 许可证上下文
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }
    
    /// <summary>
    /// 读取所有数据源
    /// </summary>
    public (List<Dictionary<string, object>> didi, List<Dictionary<string, object>> meituan, List<Dictionary<string, object>> zaitu) ReadAll()
    {
        Logger.Info("开始读取数据文件...");
        Logger.Separator();
        
        var didi = ReadDidi();
        var meituan = ReadMeituan();
        var zaitu = ReadZaitu();
        
        Logger.Separator();
        Logger.Info($"数据读取完成：滴滴 {didi.Count} 条，美团 {meituan.Count} 条，在途 {zaitu.Count} 条");
        
        return (didi, meituan, zaitu);
    }
    
    /// <summary>
    /// 读取滴滴用车订单
    /// </summary>
    public List<Dictionary<string, object>> ReadDidi()
    {
        var result = new List<Dictionary<string, object>>();
        
        if (!File.Exists(AppConfig.DidiFilePath))
        {
            Logger.Warn($"滴滴文件不存在：{AppConfig.DidiFilePath}");
            return result;
        }
        
        Logger.Info($"读取滴滴文件：{Path.GetFileName(AppConfig.DidiFilePath)}");
        
        using var package = new ExcelPackage(new FileInfo(AppConfig.DidiFilePath));
        var worksheet = package.Workbook.Worksheets[0];
        
        if (worksheet.Dimension == null)
        {
            Logger.Warn("滴滴文件无数据");
            return result;
        }
        
        var headers = GetHeaders(worksheet);
        var rowCount = worksheet.Dimension.Rows;
        
        for (int row = 2; row <= rowCount; row++)
        {
            var record = new Dictionary<string, object>();
            for (int col = 1; col <= headers.Length; col++)
            {
                var header = headers[col - 1];
                var value = worksheet.Cells[row, col].Text;
                record[header] = value;
            }
            record["_SourceRowNumber"] = row;
            result.Add(record);
        }
        
        Logger.Info($"  - 读取 {result.Count} 条记录");
        return result;
    }
    
    /// <summary>
    /// 读取美团商旅订单（合并有效Sheet）
    /// </summary>
    public List<Dictionary<string, object>> ReadMeituan()
    {
        var result = new List<Dictionary<string, object>>();
        
        if (!File.Exists(AppConfig.MeituanFilePath))
        {
            Logger.Warn($"美团文件不存在：{AppConfig.MeituanFilePath}");
            return result;
        }
        
        Logger.Info($"读取美团文件：{Path.GetFileName(AppConfig.MeituanFilePath)}");
        
        using var package = new ExcelPackage(new FileInfo(AppConfig.MeituanFilePath));
        
        foreach (var sheetConfig in AppConfig.MeituanSheets)
        {
            var sheetName = sheetConfig.Key;
            var (type, minRows) = sheetConfig.Value;
            
            var worksheet = package.Workbook.Worksheets[sheetName];
            if (worksheet == null)
            {
                Logger.Warn($"  - Sheet [{sheetName}] 不存在，跳过");
                continue;
            }
            
            if (worksheet.Dimension == null || worksheet.Dimension.Rows < minRows + 1)
            {
                Logger.Warn($"  - Sheet [{sheetName}] 数据不足，跳过");
                continue;
            }
            
            var headers = GetHeaders(worksheet);
            var rowCount = worksheet.Dimension.Rows;
            var sheetCount = 0;
            
            for (int row = 2; row <= rowCount; row++)
            {
                var record = new Dictionary<string, object>();
                for (int col = 1; col <= headers.Length; col++)
                {
                    var header = headers[col - 1];
                    var value = worksheet.Cells[row, col].Text;
                    record[header] = value;
                }
                record["_SourceRowNumber"] = row;
                record["_SheetName"] = sheetName;
                record["_SheetType"] = type;
                result.Add(record);
                sheetCount++;
            }
            
            Logger.Info($"  - Sheet [{sheetName}] 读取 {sheetCount} 条记录");
        }
        
        return result;
    }
    
    /// <summary>
    /// 读取在途差旅订单
    /// </summary>
    public List<Dictionary<string, object>> ReadZaitu()
    {
        var result = new List<Dictionary<string, object>>();
        
        if (!File.Exists(AppConfig.ZaituFilePath))
        {
            Logger.Warn($"在途文件不存在：{AppConfig.ZaituFilePath}");
            return result;
        }
        
        Logger.Info($"读取在途文件：{Path.GetFileName(AppConfig.ZaituFilePath)}");
        
        using var package = new ExcelPackage(new FileInfo(AppConfig.ZaituFilePath));
        var worksheet = package.Workbook.Worksheets[0];
        
        if (worksheet.Dimension == null)
        {
            Logger.Warn("在途文件无数据");
            return result;
        }
        
        var headers = GetHeaders(worksheet);
        var rowCount = worksheet.Dimension.Rows;
        
        // 统计各业务类型
        var typeCount = new Dictionary<string, int>();
        
        for (int row = 2; row <= rowCount; row++)
        {
            var record = new Dictionary<string, object>();
            for (int col = 1; col <= headers.Length; col++)
            {
                var header = headers[col - 1];
                var value = worksheet.Cells[row, col].Text;
                record[header] = value;
            }
            record["_SourceRowNumber"] = row;
            
            var businessType = record.GetValueOrDefault("业务类型", "")?.ToString() ?? "";
            record["_BusinessType"] = businessType;
            
            result.Add(record);
            
            // 统计
            if (!string.IsNullOrEmpty(businessType))
            {
                typeCount[businessType] = typeCount.GetValueOrDefault(businessType, 0) + 1;
            }
        }
        
        Logger.Info($"  - 读取 {result.Count} 条记录");
        foreach (var kv in typeCount)
        {
            Logger.Info($"    {kv.Key}: {kv.Value} 条");
        }
        
        return result;
    }
    
    /// <summary>
    /// 获取表头
    /// </summary>
    private static string[] GetHeaders(ExcelWorksheet worksheet)
    {
        var colCount = worksheet.Dimension.Columns;
        var headers = new string[colCount];
        
        for (int col = 1; col <= colCount; col++)
        {
            headers[col - 1] = worksheet.Cells[1, col].Text ?? $"Column{col}";
        }
        
        return headers;
    }
}