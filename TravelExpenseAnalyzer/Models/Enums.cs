namespace TravelExpenseAnalyzer.Models;

/// <summary>
/// 数据来源类型
/// </summary>
public enum DataSourceType
{
    滴滴,
    美团打车,
    美团酒店,
    美团机票,
    在途酒店,
    在途机票,
    在途火车票,
    在途用车
}

/// <summary>
/// 记录类型
/// </summary>
public enum RecordType
{
    打车,
    酒店,
    机票,
    火车票
}

/// <summary>
/// 异常类型
/// </summary>
public enum AnomalyType
{
    时间重叠,
    地点冲突,
    多地行程
}