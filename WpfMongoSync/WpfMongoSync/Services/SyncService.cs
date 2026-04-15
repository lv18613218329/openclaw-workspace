using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using WpfMongoSync.Models;

namespace WpfMongoSync.Services;

/// <summary>
/// 同步服务 - 负责定时同步逻辑（支持增量同步）
/// </summary>
public class SyncService
{
    private readonly MongoService _mongoService;
    private readonly FeishuService _feishuService;
    private CancellationTokenSource? _cancellationTokenSource;
    private Task? _syncTask;
    private SyncState _syncState = new();
    private readonly string _stateFilePath;
    
    // 同步历史记录
    private readonly List<SyncRecord> _syncHistory = new();
    private readonly int _maxHistoryCount = 50;

    public event Action<string>? OnStatusChanged;
    public event Action<int>? OnSyncCompleted;
    
    /// <summary>
    /// 同步尝试完成事件（无论成功/失败/无数据都会触发）
    /// 参数：syncCount (同步数量，-1表示失败)
    /// </summary>
    public event Action<int>? OnSyncAttempted;
    
    /// <summary>
    /// 同步记录更新事件
    /// </summary>
    public event Action<List<SyncRecord>>? OnHistoryUpdated;

    public SyncService(MongoService mongoService, FeishuService feishuService)
    {
        _mongoService = mongoService;
        _feishuService = feishuService;
        _stateFilePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), 
            "WpfMongoSync", "sync_state.json");
        LoadSyncState();
    }
    
    /// <summary>
    /// 获取同步历史记录
    /// </summary>
    public List<SyncRecord> GetSyncHistory() => _syncHistory.ToList();
    
    /// <summary>
    /// 添加同步记录
    /// </summary>
    private void AddSyncRecord(string type, string result, int count, string message = "")
    {
        var record = new SyncRecord
        {
            Time = DateTime.Now,
            Type = type,
            Result = result,
            Count = count,
            Message = message
        };
        
        _syncHistory.Insert(0, record);
        
        // 保留最近50条记录
        if (_syncHistory.Count > _maxHistoryCount)
        {
            _syncHistory.RemoveAt(_syncHistory.Count - 1);
        }
        
        OnHistoryUpdated?.Invoke(_syncHistory.ToList());
    }

    /// <summary>
    /// 获取当前同步状态
    /// </summary>
    public SyncState GetSyncState() => _syncState;

    /// <summary>
    /// 加载同步状态
    /// </summary>
    private void LoadSyncState()
    {
        try
        {
            if (File.Exists(_stateFilePath))
            {
                var json = File.ReadAllText(_stateFilePath);
                _syncState = JsonSerializer.Deserialize<SyncState>(json) ?? new SyncState();
            }
        }
        catch
        {
            _syncState = new SyncState();
        }
    }

    /// <summary>
    /// 保存同步状态
    /// </summary>
    private void SaveSyncState()
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(_stateFilePath)!);
            var json = JsonSerializer.Serialize(_syncState, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_stateFilePath, json);
        }
        catch (Exception ex)
        {
            OnStatusChanged?.Invoke($"保存同步状态失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 启动定时同步（每天指定时间执行）
    /// </summary>
    public void StartAutoSync(MongoConfig mongoConfig, FeishuConfig feishuConfig, int hour, int minute)
    {
        StopAutoSync();

        _cancellationTokenSource = new CancellationTokenSource();
        var token = _cancellationTokenSource.Token;

        _syncTask = Task.Run(async () =>
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    // 计算下次执行时间
                    var now = DateTime.Now;
                    var nextRun = new DateTime(now.Year, now.Month, now.Day, hour, minute, 0);

                    // 如果当前时间已过今天的执行时间，则设置为明天
                    if (now >= nextRun)
                    {
                        nextRun = nextRun.AddDays(1);
                    }

                    var delay = nextRun - now;
                    OnStatusChanged?.Invoke($"下次同步: {nextRun:yyyy-MM-dd HH:mm:ss}");

                    // 等待到执行时间
                    await Task.Delay(delay, token);

                    if (token.IsCancellationRequested) break;

                    // 执行增量同步
                    OnStatusChanged?.Invoke("开始增量同步...");
                    await DoIncrementalSyncAsync(mongoConfig, feishuConfig);
                }
                catch (TaskCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    OnStatusChanged?.Invoke($"同步失败: {ex.Message}");
                    // 出错后等待5分钟重试
                    await Task.Delay(TimeSpan.FromMinutes(5), token);
                }
            }
        }, token);
    }

    /// <summary>
    /// 停止定时同步
    /// </summary>
    public void StopAutoSync()
    {
        if (_cancellationTokenSource != null)
        {
            _cancellationTokenSource.Cancel();
            _cancellationTokenSource.Dispose();
            _cancellationTokenSource = null;
        }
    }

    /// <summary>
    /// 手动全量同步（清空表格后写入）
    /// </summary>
    public async Task<bool> SyncToFeishuAsync(List<Dictionary<string, object>> data, FeishuConfig config, string eventFilter)
    {
        try
        {
            OnStatusChanged?.Invoke("正在连接飞书...");
            
            // 转换数据格式
            var transformedData = TransformData(data, eventFilter);
            
            var result = await _feishuService.SyncDataAsync(config, transformedData);
            
            if (result)
            {
                OnStatusChanged?.Invoke($"全量同步成功，共 {data.Count} 条数据");
            }
            else
            {
                OnStatusChanged?.Invoke("同步失败");
            }

            return result;
        }
        catch (Exception ex)
        {
            OnStatusChanged?.Invoke($"同步失败: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// 手动增量同步（追加数据）
    /// </summary>
    public async Task<int> IncrementalSyncAsync(MongoConfig mongoConfig, FeishuConfig feishuConfig)
    {
        return await DoIncrementalSyncAsync(mongoConfig, feishuConfig);
    }

    /// <summary>
    /// 转换数据格式 - 异常名称、时间、内容三个字段
    /// </summary>
    private List<Dictionary<string, object>> TransformData(List<Dictionary<string, object>> data, string eventFilter)
    {
        var result = new List<Dictionary<string, object>>();
        
        foreach (var row in data)
        {
            var newRow = new Dictionary<string, object>();
            
            // 异常名称 = 事件类型
            newRow["异常名称"] = eventFilter;
            
            // 时间 = local_time 字段
            var localTime = GetFieldValue(row, "local_time") 
                         ?? GetFieldValue(row, "events.local_time")
                         ?? "";
            
            // 如果是时间戳毫秒，转换为可读格式
            if (long.TryParse(localTime?.ToString(), out long timestamp))
            {
                try
                {
                    // 尝试转换为日期时间
                    var dt = DateTimeOffset.FromUnixTimeMilliseconds(timestamp).LocalDateTime;
                    newRow["时间"] = dt.ToString("yyyy-MM-dd HH:mm:ss");
                }
                catch
                {
                    newRow["时间"] = localTime?.ToString() ?? "";
                }
            }
            else
            {
                newRow["时间"] = localTime?.ToString() ?? "";
            }
            
            // 内容 = 原始JSON数据
            newRow["内容"] = Newtonsoft.Json.JsonConvert.SerializeObject(row, Newtonsoft.Json.Formatting.Indented);
            
            result.Add(newRow);
        }
        
        return result;
    }

    /// <summary>
    /// 从字典中获取字段值（支持嵌套路径）
    /// </summary>
    private object? GetFieldValue(Dictionary<string, object> row, string fieldPath)
    {
        if (row.TryGetValue(fieldPath, out var value))
        {
            return value;
        }
        return null;
    }

    /// <summary>
    /// 执行增量同步（内部方法）
    /// </summary>
    private async Task<int> DoIncrementalSyncAsync(MongoConfig mongoConfig, FeishuConfig feishuConfig)
    {
        try
        {
            OnStatusChanged?.Invoke("正在查询MongoDB增量数据...");

            // 获取最后同步时间戳
            // 如果从未同步过（LastSyncTimestamp = 0），则查询所有数据（startTime = null）
            // 如果已同步过，则只查询该时间之后的新数据
            long? startTime = _syncState.LastSyncTimestamp > 0 
                ? _syncState.LastSyncTimestamp 
                : null;

            if (startTime.HasValue)
            {
                OnStatusChanged?.Invoke($"查询时间范围: 从 {DateTimeOffset.FromUnixTimeMilliseconds(startTime.Value).LocalDateTime:yyyy-MM-dd HH:mm:ss}");
            }
            else
            {
                OnStatusChanged?.Invoke("首次同步，查询所有数据（无时间限制）");
            }

            // 查询增量数据
            var data = await Task.Run(() => _mongoService.QueryIncrementalData(
                mongoConfig.Url,
                mongoConfig.Database,
                mongoConfig.Collection,
                mongoConfig.EventFilter,
                mongoConfig.TenantCode,
                startTime ?? 0));

            if (data == null || data.Count == 0)
            {
                OnStatusChanged?.Invoke("没有新增数据需要同步");
                // 无数据也触发事件，同步数量为 0
                AddSyncRecord("增量同步", "无新数据", 0);
                OnSyncAttempted?.Invoke(0);
                return 0;
            }

            OnStatusChanged?.Invoke($"查询到 {data.Count} 条增量数据，正在同步到飞书...");

            // 转换数据格式
            var transformedData = TransformData(data, mongoConfig.EventFilter);

            // 追加数据到飞书多维表格
            var success = await _feishuService.AppendDataAsync(feishuConfig, transformedData);

            if (success)
            {
                // 更新同步状态 - 使用当前时间作为新的同步时间点
                _syncState.LastSyncTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                _syncState.LastSyncTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                _syncState.TotalSyncCount += data.Count;
                SaveSyncState();

                OnStatusChanged?.Invoke($"增量同步完成，本次同步 {data.Count} 条，累计 {_syncState.TotalSyncCount} 条");
                AddSyncRecord("增量同步", "成功", data.Count, $"累计 {_syncState.TotalSyncCount} 条");
                OnSyncCompleted?.Invoke(data.Count);
                OnSyncAttempted?.Invoke(data.Count);
                return data.Count;
            }
            else
            {
                OnStatusChanged?.Invoke($"增量同步失败，时间: {DateTime.Now:HH:mm:ss}");
                // 失败也触发事件，同步数量为 -1
                AddSyncRecord("增量同步", "失败", 0, "飞书写入失败");
                OnSyncAttempted?.Invoke(-1);
                return 0;
            }
        }
        catch (Exception ex)
        {
            OnStatusChanged?.Invoke($"增量同步出错: {ex.Message}");
            // 出错也触发事件，同步数量为 -1
            AddSyncRecord("增量同步", "错误", 0, ex.Message);
            OnSyncAttempted?.Invoke(-1);
            return 0;
        }
    }

    /// <summary>
    /// 重置同步状态
    /// </summary>
    public void ResetSyncState()
    {
        _syncState = new SyncState();
        SaveSyncState();
        OnStatusChanged?.Invoke("同步状态已重置");
    }
}