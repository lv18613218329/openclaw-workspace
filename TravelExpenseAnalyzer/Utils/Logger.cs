namespace TravelExpenseAnalyzer.Utils;

/// <summary>
/// 日志工具类
/// </summary>
public static class Logger
{
    private static readonly object _lock = new();
    private static string? _logFilePath;
    
    /// <summary>
    /// 初始化日志文件
    /// </summary>
    public static void Init(string outputDir)
    {
        _logFilePath = Path.Combine(outputDir, $"处理日志_{DateTime.Now:yyyyMMdd_HHmmss}.txt");
        Directory.CreateDirectory(outputDir);
    }
    
    /// <summary>
    /// 记录信息日志
    /// </summary>
    public static void Info(string message)
    {
        Log("INFO", message);
    }
    
    /// <summary>
    /// 记录警告日志
    /// </summary>
    public static void Warn(string message)
    {
        Log("WARN", message);
    }
    
    /// <summary>
    /// 记录错误日志
    /// </summary>
    public static void Error(string message)
    {
        Log("ERROR", message);
    }
    
    /// <summary>
    /// 记录调试日志
    /// </summary>
    public static void Debug(string message)
    {
#if DEBUG
        Log("DEBUG", message);
#endif
    }
    
    private static void Log(string level, string message)
    {
        lock (_lock)
        {
            var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            var logLine = $"[{timestamp}] [{level}] {message}";
            
            // 控制台输出
            var originalColor = Console.ForegroundColor;
            Console.ForegroundColor = level switch
            {
                "ERROR" => ConsoleColor.Red,
                "WARN" => ConsoleColor.Yellow,
                "INFO" => ConsoleColor.Green,
                _ => ConsoleColor.Gray
            };
            Console.WriteLine(logLine);
            Console.ForegroundColor = originalColor;
            
            // 文件输出
            if (_logFilePath != null)
            {
                File.AppendAllText(_logFilePath, logLine + Environment.NewLine);
            }
        }
    }
    
    /// <summary>
    /// 记录分隔线
    /// </summary>
    public static void Separator(char c = '-', int length = 80)
    {
        var line = new string(c, length);
        Console.WriteLine(line);
        if (_logFilePath != null)
        {
            File.AppendAllText(_logFilePath, line + Environment.NewLine);
        }
    }
}