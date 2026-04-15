using System;
using System.Collections.Generic;

namespace CozeScheduler.Models;

public class AppConfig
{
    public string CozeAccessToken { get; set; } = "";
    public string CozeBotId { get; set; } = "";
    public string CozeQueryTemplate { get; set; } = "请汇总今天同步的数据情况";
    public int ScheduleHour { get; set; } = 8;
    public int ScheduleMinute { get; set; } = 0;
    public bool AutoStart { get; set; } = false;
}

public class ScheduleRecord
{
    public DateTime Time { get; set; }
    public string Type { get; set; } = "";
    public string Result { get; set; } = "";
    public string Message { get; set; } = "";
}