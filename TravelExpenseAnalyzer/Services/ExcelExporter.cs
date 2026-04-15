using OfficeOpenXml;
using OfficeOpenXml.Style;
using TravelExpenseAnalyzer.Models;
using TravelExpenseAnalyzer.Utils;

namespace TravelExpenseAnalyzer.Services;

/// <summary>
/// Excel导出服务
/// </summary>
public class ExcelExporter
{
    public ExcelExporter()
    {
        // 设置 EPPlus 许可证上下文
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }
    
    /// <summary>
    /// 导出数据到Excel
    /// </summary>
    public void Export(List<TravelRecord> records, string filePath)
    {
        Logger.Info($"导出Excel文件：{filePath}");
        
        // 确保输出目录存在
        var dir = Path.GetDirectoryName(filePath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
        {
            Directory.CreateDirectory(dir);
        }
        
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("出差日记账");
        
        // 写入表头
        WriteHeaders(worksheet);
        
        // 写入数据
        WriteData(worksheet, records);
        
        // 应用样式
        ApplyStyles(worksheet, records);
        
        // 设置列宽
        SetColumnWidths(worksheet);
        
        // 保存文件
        package.SaveAs(new FileInfo(filePath));
        
        Logger.Info($"Excel导出完成：{records.Count} 条记录");
    }
    
    /// <summary>
    /// 写入表头
    /// </summary>
    private void WriteHeaders(ExcelWorksheet worksheet)
    {
        var headers = AppConfig.TargetHeaders;
        
        for (int col = 0; col < headers.Length; col++)
        {
            var cell = worksheet.Cells[1, col + 1];
            cell.Value = headers[col];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        }
    }
    
    /// <summary>
    /// 写入数据
    /// </summary>
    private void WriteData(ExcelWorksheet worksheet, List<TravelRecord> records)
    {
        for (int i = 0; i < records.Count; i++)
        {
            var record = records[i];
            var row = i + 2; // Excel 行号从1开始，第1行是表头
            
            // 按照模板字段顺序写入
            worksheet.Cells[row, 1].Value = record.出差人;
            worksheet.Cells[row, 2].Value = DateUtils.FormatDate(record.费用发生日期);
            worksheet.Cells[row, 3].Value = record.交通工具;
            worksheet.Cells[row, 4].Value = record.起点;
            worksheet.Cells[row, 5].Value = record.终点;
            worksheet.Cells[row, 6].Value = record.交通费金额;
            worksheet.Cells[row, 7].Value = record.交通费税额;
            worksheet.Cells[row, 8].Value = record.出差补助;
            worksheet.Cells[row, 9].Value = record.住宿酒店名称;
            worksheet.Cells[row, 10].Value = record.住宿金额;
            worksheet.Cells[row, 11].Value = record.住宿发票类型;
            worksheet.Cells[row, 12].Value = record.住宿费税额;
            worksheet.Cells[row, 13].Value = DateUtils.FormatDate(record.填报日期);
            
            // 第14列：数据来源
            worksheet.Cells[row, 14].Value = record.Detection?.数据来源.ToString() ?? "";
        }
    }
    
    /// <summary>
    /// 应用样式（异常标红、警示标黄）
    /// </summary>
    private void ApplyStyles(ExcelWorksheet worksheet, List<TravelRecord> records)
    {
        for (int i = 0; i < records.Count; i++)
        {
            var record = records[i];
            var row = i + 2;
            
            // 判断异常类型
            var anomalyType = record.Anomaly?.类型;
            
            if (anomalyType == AnomalyType.时间重叠 || anomalyType == AnomalyType.地点冲突)
            {
                // 红色 - 严重异常
                for (int col = 1; col <= 14; col++)
                {
                    var cell = worksheet.Cells[row, col];
                    cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    cell.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.Red);
                    cell.Style.Font.Color.SetColor(System.Drawing.Color.White);
                }
            }
            else if (anomalyType == AnomalyType.多地行程)
            {
                // 黄色 - 警示
                for (int col = 1; col <= 14; col++)
                {
                    var cell = worksheet.Cells[row, col];
                    cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    cell.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.Yellow);
                }
            }
        }
    }
    
    /// <summary>
    /// 设置列宽
    /// </summary>
    private void SetColumnWidths(ExcelWorksheet worksheet)
    {
        // 根据内容设置合适的列宽
        worksheet.Column(1).Width = 10;  // 出差人
        worksheet.Column(2).Width = 14;  // 费用发生日期
        worksheet.Column(3).Width = 10;  // 交通工具
        worksheet.Column(4).Width = 25;  // 起点
        worksheet.Column(5).Width = 25;  // 终点
        worksheet.Column(6).Width = 12;  // 交通费金额
        worksheet.Column(7).Width = 12;  // 交通费税额
        worksheet.Column(8).Width = 10;  // 出差补助
        worksheet.Column(9).Width = 30;  // 住宿酒店名称
        worksheet.Column(10).Width = 12; // 住宿金额
        worksheet.Column(11).Width = 12; // 住宿发票类型
        worksheet.Column(12).Width = 12; // 住宿费税额
        worksheet.Column(13).Width = 14; // 填报日期
        worksheet.Column(14).Width = 12; // 数据来源
    }
}