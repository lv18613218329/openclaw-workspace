using TravelExpenseAnalyzer.Models;
using TravelExpenseAnalyzer.Utils;

namespace TravelExpenseAnalyzer.Services;

/// <summary>
/// 数据转换服务
/// </summary>
public class DataTransformService
{
    /// <summary>
    /// 转换所有数据
    /// </summary>
    public List<TravelRecord> TransformAll(
        List<Dictionary<string, object>> didiData,
        List<Dictionary<string, object>> meituanData,
        List<Dictionary<string, object>> zaituData)
    {
        Logger.Info("开始数据转换...");
        
        var result = new List<TravelRecord>();
        
        // 转换滴滴数据
        var didiRecords = TransformDidi(didiData);
        result.AddRange(didiRecords);
        Logger.Info($"  滴滴转换完成：{didiRecords.Count} 条");
        
        // 转换美团数据
        var meituanRecords = TransformMeituan(meituanData);
        result.AddRange(meituanRecords);
        Logger.Info($"  美团转换完成：{meituanRecords.Count} 条");
        
        // 转换在途数据
        var zaituRecords = TransformZaitu(zaituData);
        result.AddRange(zaituRecords);
        Logger.Info($"  在途转换完成：{zaituRecords.Count} 条");
        
        // 按出差人（一级排序）和费用发生日期（二级排序）排序
        result = result
            .OrderBy(r => r.出差人)
            .ThenBy(r => r.费用发生日期)
            .ToList();
        
        Logger.Info($"数据转换完成，共 {result.Count} 条记录");
        
        return result;
    }
    
    #region 滴滴数据转换
    
    /// <summary>
    /// 转换滴滴用车订单
    /// </summary>
    private List<TravelRecord> TransformDidi(List<Dictionary<string, object>> data)
    {
        var result = new List<TravelRecord>();
        
        foreach (var row in data)
        {
            // 过滤退款订单
            var orderStatus = GetValue(row, "订单状态");
            if (orderStatus == "退款") continue;
            
            var record = new TravelRecord
            {
                出差人 = GetValue(row, "乘车人姓名"),
                费用发生日期 = DateUtils.TryParseDate(GetValue(row, "下单时间")),
                交通工具 = "打车",
                起点 = GetValue(row, "实际出发地") ?? GetValue(row, "出发地地址"),
                终点 = GetValue(row, "实际目的地") ?? GetValue(row, "目的地地址"),
                交通费金额 = ParseDecimal(GetValue(row, "企业实付金额")) + ParseDecimal(GetValue(row, "个人实付金额")),
                填报日期 = DateUtils.TryParseDate(GetValue(row, "下单时间")),
                SourceRowNumber = GetInt(row, "_SourceRowNumber"),
                Detection = new DetectionInfo
                {
                    开始时间 = DateUtils.TryParseDateTime(GetValue(row, "开始计费时间")),
                    结束时间 = DateUtils.TryParseDateTime(GetValue(row, "结束计费时间")),
                    城市 = GetValue(row, "用车城市"),
                    区县 = GetValue(row, "出发区县") ?? GetValue(row, "到达区县"),
                    数据来源 = DataSourceType.滴滴,
                    记录类型 = RecordType.打车
                }
            };
            
            result.Add(record);
        }
        
        return result;
    }
    
    #endregion
    
    #region 美团数据转换
    
    /// <summary>
    /// 转换美团商旅订单
    /// </summary>
    private List<TravelRecord> TransformMeituan(List<Dictionary<string, object>> data)
    {
        var result = new List<TravelRecord>();
        
        foreach (var row in data)
        {
            var sheetType = GetValue(row, "_SheetType");
            
            TravelRecord? record = sheetType switch
            {
                "打车" => TransformMeituanCar(row),
                "酒店" => TransformMeituanHotel(row),
                "机票" => TransformMeituanFlight(row),
                _ => null
            };
            
            if (record != null)
            {
                record.SourceRowNumber = GetInt(row, "_SourceRowNumber");
                result.Add(record);
            }
        }
        
        return result;
    }
    
    /// <summary>
    /// 转换美团打车订单
    /// </summary>
    private TravelRecord TransformMeituanCar(Dictionary<string, object> row)
    {
        return new TravelRecord
        {
            出差人 = GetValue(row, "员工姓名"),
            费用发生日期 = DateUtils.TryParseDate(GetValue(row, "下单时间")),
            交通工具 = "打车",
            起点 = GetValue(row, "用户选择上车地点"),
            终点 = GetValue(row, "用户选择目的地"),
            交通费金额 = ParseDecimal(GetValue(row, "实付金额（元）")),
            填报日期 = DateUtils.TryParseDate(GetValue(row, "下单时间")),
            Detection = new DetectionInfo
            {
                开始时间 = DateUtils.TryParseDateTime(GetValue(row, "行程开始时间")),
                结束时间 = DateUtils.TryParseDateTime(GetValue(row, "行程到达时间")),
                城市 = GetValue(row, "用车城市"),
                区县 = null, // 美团打车无区县信息，需从地点解析
                数据来源 = DataSourceType.美团打车,
                记录类型 = RecordType.打车
            }
        };
    }
    
    /// <summary>
    /// 转换美团酒店订单
    /// </summary>
    private TravelRecord TransformMeituanHotel(Dictionary<string, object> row)
    {
        var hotelCity = GetValue(row, "酒店所在城市");
        return new TravelRecord
        {
            出差人 = GetValue(row, "入住人姓名") ?? GetValue(row, "员工姓名"),
            费用发生日期 = DateUtils.TryParseDate(GetValue(row, "入住时间")),
            交通工具 = null,
            起点 = hotelCity,
            终点 = null,
            住宿酒店名称 = GetValue(row, "酒店名称"),
            住宿金额 = ParseDecimal(GetValue(row, "实付金额（元）")),
            住宿发票类型 = GetValue(row, "发票类型"),
            填报日期 = DateUtils.TryParseDate(GetValue(row, "下单时间")),
            Detection = new DetectionInfo
            {
                开始时间 = DateUtils.TryParseDateTime(GetValue(row, "入住时间")),
                结束时间 = DateUtils.TryParseDateTime(GetValue(row, "离店时间")),
                城市 = hotelCity,
                区县 = LocationUtils.ExtractDistrict(GetValue(row, "酒店地址")),
                数据来源 = DataSourceType.美团酒店,
                记录类型 = RecordType.酒店
            }
        };
    }
    
    /// <summary>
    /// 转换美团机票订单
    /// </summary>
    private TravelRecord TransformMeituanFlight(Dictionary<string, object> row)
    {
        var departCity = GetValue(row, "出发城市名称");
        var arriveCity = GetValue(row, "到达城市名称");
        
        return new TravelRecord
        {
            出差人 = GetValue(row, "员工姓名"),
            费用发生日期 = DateUtils.TryParseDate(GetValue(row, "起飞时间")),
            交通工具 = "飞机",
            起点 = departCity,
            终点 = arriveCity,
            交通费金额 = ParseDecimal(GetValue(row, "实付金额（元）")),
            填报日期 = DateUtils.TryParseDate(GetValue(row, "下单时间")),
            Detection = new DetectionInfo
            {
                开始时间 = DateUtils.TryParseDateTime(GetValue(row, "起飞时间")),
                结束时间 = DateUtils.TryParseDateTime(GetValue(row, "到达时间")),
                城市 = departCity, // 使用出发城市
                区县 = departCity, // 机票只有城市级别
                数据来源 = DataSourceType.美团机票,
                记录类型 = RecordType.机票
            }
        };
    }
    
    #endregion
    
    #region 在途数据转换
    
    /// <summary>
    /// 转换在途差旅订单
    /// </summary>
    private List<TravelRecord> TransformZaitu(List<Dictionary<string, object>> data)
    {
        var result = new List<TravelRecord>();
        
        foreach (var row in data)
        {
            var businessType = GetValue(row, "业务类型");
            
            List<TravelRecord> records = businessType switch
            {
                "酒店" => TransformZaituHotel(row),
                "机票" => TransformZaituFlight(row),
                "火车票" => TransformZaituTrain(row),
                "用车" => TransformZaituCar(row),
                _ => new List<TravelRecord>()
            };
            
            foreach (var record in records)
            {
                record.SourceRowNumber = GetInt(row, "_SourceRowNumber");
                result.Add(record);
            }
        }
        
        return result;
    }
    
    /// <summary>
    /// 转换在途酒店订单
    /// </summary>
    private List<TravelRecord> TransformZaituHotel(Dictionary<string, object> row)
    {
        var result = new List<TravelRecord>();
        
        var summary = GetValue(row, "订单摘要");
        var hotelInfo = LocationUtils.ParseZaituHotelSummary(summary);
        
        if (hotelInfo == null)
        {
            // 解析失败，使用原始字段
            result.Add(new TravelRecord
            {
                出差人 = GetValue(row, "出行人") ?? GetValue(row, "预订人"),
                费用发生日期 = DateUtils.TryParseDate(GetValue(row, "行程开始时间")),
                起点 = GetValue(row, "目的地"),
                住宿金额 = ParseDecimal(GetValue(row, "企业应承担总额")),
                填报日期 = DateUtils.TryParseDate(GetValue(row, "预订时间")),
                Detection = new DetectionInfo
                {
                    开始时间 = DateUtils.TryParseDateTime(GetValue(row, "行程开始时间")),
                    城市 = GetValue(row, "目的地"),
                    数据来源 = DataSourceType.在途酒店,
                    记录类型 = RecordType.酒店
                }
            });
        }
        else
        {
            result.Add(new TravelRecord
            {
                出差人 = hotelInfo.出行人姓名 ?? GetValue(row, "出行人") ?? GetValue(row, "预订人"),
                费用发生日期 = hotelInfo.入住日期,
                起点 = hotelInfo.城市,
                住宿酒店名称 = hotelInfo.酒店名称,
                住宿金额 = ParseDecimal(GetValue(row, "企业应承担总额")),
                填报日期 = DateUtils.TryParseDate(GetValue(row, "预订时间")),
                Detection = new DetectionInfo
                {
                    开始时间 = hotelInfo.入住日期,
                    结束时间 = hotelInfo.离店日期,
                    城市 = hotelInfo.城市,
                    数据来源 = DataSourceType.在途酒店,
                    记录类型 = RecordType.酒店
                }
            });
        }
        
        return result;
    }
    
    /// <summary>
    /// 转换在途机票订单
    /// </summary>
    private List<TravelRecord> TransformZaituFlight(Dictionary<string, object> row)
    {
        var result = new List<TravelRecord>();
        
        var departCity = GetValue(row, "出发地");
        var arriveCity = GetValue(row, "目的地");
        
        result.Add(new TravelRecord
        {
            出差人 = GetValue(row, "出行人") ?? GetValue(row, "预订人"),
            费用发生日期 = DateUtils.TryParseDate(GetValue(row, "行程开始时间")),
            交通工具 = "飞机",
            起点 = departCity,
            终点 = arriveCity,
            交通费金额 = ParseDecimal(GetValue(row, "企业应承担总额")),
            填报日期 = DateUtils.TryParseDate(GetValue(row, "预订时间")),
            Detection = new DetectionInfo
            {
                开始时间 = DateUtils.TryParseDateTime(GetValue(row, "行程开始时间")),
                城市 = departCity,
                区县 = departCity, // 机票只有城市级别
                数据来源 = DataSourceType.在途机票,
                记录类型 = RecordType.机票
            }
        });
        
        return result;
    }
    
    /// <summary>
    /// 转换在途火车票订单
    /// </summary>
    private List<TravelRecord> TransformZaituTrain(Dictionary<string, object> row)
    {
        var result = new List<TravelRecord>();
        
        var departCity = GetValue(row, "出发地");
        var arriveCity = GetValue(row, "目的地");
        
        result.Add(new TravelRecord
        {
            出差人 = GetValue(row, "出行人") ?? GetValue(row, "预订人"),
            费用发生日期 = DateUtils.TryParseDate(GetValue(row, "行程开始时间")),
            交通工具 = "火车",
            起点 = departCity,
            终点 = arriveCity,
            交通费金额 = ParseDecimal(GetValue(row, "企业应承担总额")),
            填报日期 = DateUtils.TryParseDate(GetValue(row, "预订时间")),
            Detection = new DetectionInfo
            {
                开始时间 = DateUtils.TryParseDateTime(GetValue(row, "行程开始时间")),
                城市 = departCity,
                区县 = departCity,
                数据来源 = DataSourceType.在途火车票,
                记录类型 = RecordType.火车票
            }
        });
        
        return result;
    }
    
    /// <summary>
    /// 转换在途用车订单
    /// </summary>
    private List<TravelRecord> TransformZaituCar(Dictionary<string, object> row)
    {
        var result = new List<TravelRecord>();
        
        var summary = GetValue(row, "订单摘要");
        var carInfo = LocationUtils.ParseZaituCarSummary(summary);
        
        string? origin = GetValue(row, "出发地");
        string? destination = GetValue(row, "目的地");
        
        // 如果字段为空，从摘要解析
        if (string.IsNullOrEmpty(origin) && carInfo != null)
        {
            origin = carInfo.起点;
        }
        if (string.IsNullOrEmpty(destination) && carInfo != null)
        {
            destination = carInfo.终点;
        }
        
        result.Add(new TravelRecord
        {
            出差人 = GetValue(row, "出行人") ?? GetValue(row, "预订人"),
            费用发生日期 = DateUtils.TryParseDate(GetValue(row, "行程开始时间")),
            交通工具 = "打车",
            起点 = origin,
            终点 = destination,
            交通费金额 = ParseDecimal(GetValue(row, "企业应承担总额")),
            填报日期 = DateUtils.TryParseDate(GetValue(row, "预订时间")),
            Detection = new DetectionInfo
            {
                开始时间 = DateUtils.TryParseDateTime(GetValue(row, "行程开始时间")),
                城市 = origin, // 使用起点作为城市
                数据来源 = DataSourceType.在途用车,
                记录类型 = RecordType.打车
            }
        });
        
        return result;
    }
    
    #endregion
    
    #region 辅助方法
    
    /// <summary>
    /// 获取字典值
    /// </summary>
    private static string? GetValue(Dictionary<string, object> dict, string key)
    {
        if (dict.TryGetValue(key, out var value))
        {
            return value?.ToString()?.Trim();
        }
        return null;
    }
    
    /// <summary>
    /// 解析整数
    /// </summary>
    private static int GetInt(Dictionary<string, object> dict, string key)
    {
        if (dict.TryGetValue(key, out var value))
        {
            if (value is int i) return i;
            if (int.TryParse(value?.ToString(), out var result)) return result;
        }
        return 0;
    }
    
    /// <summary>
    /// 解析小数
    /// </summary>
    private static decimal ParseDecimal(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return 0;
        if (decimal.TryParse(value, out var result)) return result;
        return 0;
    }
    
    #endregion
}