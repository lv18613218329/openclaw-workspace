using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using WpfMongoSync.Services;
using WpfMongoSync.Models;

namespace WpfMongoSync;

public partial class MainWindow : Window
{
    private MongoService _mongoService;
    private FeishuService _feishuService;
    private SyncService _syncService;
    private CozeService _cozeService;
    private List<Dictionary<string, object>> _currentData = new();
    private bool _isAutoSyncRunning = false;
    private AppConfig _config = new();

    public MainWindow()
    {
        InitializeComponent();
        InitializeServices();
        LoadConfig();
        UpdateSyncStateDisplay();
    }

    private void InitializeServices()
    {
        _mongoService = new MongoService();
        _feishuService = new FeishuService();
        _syncService = new SyncService(_mongoService, _feishuService);
        _cozeService = new CozeService();
        _syncService.OnStatusChanged += OnSyncStatusChanged;
        _syncService.OnSyncCompleted += OnSyncCompleted;
        _syncService.OnSyncAttempted += OnSyncAttempted;
        _syncService.OnHistoryUpdated += OnHistoryUpdated;
    }

    private void LoadConfig()
    {
        var configPath = GetConfigPath();
        if (File.Exists(configPath))
        {
            try
            {
                var json = File.ReadAllText(configPath);
                _config = JsonSerializer.Deserialize<AppConfig>(json) ?? new AppConfig();
            }
            catch
            {
                _config = new AppConfig();
            }
        }
        else
        {
            _config = new AppConfig();
        }

        // 加载到界面
        TxtMongoUrl.Text = _config.MongoUrl;
        TxtDatabase.Text = _config.Database;
        TxtCollection.Text = _config.Collection;
        TxtEvent.Text = _config.EventFilter;
        TxtTenantCode.Text = _config.TenantCode;
        TxtAppId.Text = _config.FeishuAppId;
        TxtAppSecret.Password = _config.FeishuAppSecret;
        TxtAppToken.Text = _config.FeishuAppToken;
        TxtTableId.Text = _config.FeishuTableId;
        
        // Coze 配置
        TxtCozeToken.Password = _config.CozeAccessToken;
        TxtCozeBotId.Text = _config.CozeBotId;
        TxtCozeQuery.Text = _config.CozeQueryTemplate;
    }

    private void SaveConfig()
    {
        _config.MongoUrl = TxtMongoUrl.Text;
        _config.Database = TxtDatabase.Text;
        _config.Collection = TxtCollection.Text;
        _config.EventFilter = TxtEvent.Text;
        _config.TenantCode = TxtTenantCode.Text;
        _config.FeishuAppId = TxtAppId.Text;
        _config.FeishuAppSecret = TxtAppSecret.Password;
        _config.FeishuAppToken = TxtAppToken.Text;
        _config.FeishuTableId = TxtTableId.Text;
        
        // Coze 配置
        _config.CozeAccessToken = TxtCozeToken.Password;
        _config.CozeBotId = TxtCozeBotId.Text;
        _config.CozeQueryTemplate = TxtCozeQuery.Text;

        var configPath = GetConfigPath();
        Directory.CreateDirectory(Path.GetDirectoryName(configPath)!);
        var json = JsonSerializer.Serialize(_config, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(configPath, json);
    }

    private string GetConfigPath()
    {
        return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), 
            "WpfMongoSync", "config.json");
    }

    private void UpdateSyncStateDisplay()
    {
        var state = _syncService.GetSyncState();
        if (state.LastSyncTimestamp > 0)
        {
            TxtSyncState.Text = $"上次同步: {state.LastSyncTime} | 累计: {state.TotalSyncCount} 条";
        }
        else
        {
            TxtSyncState.Text = "尚未同步";
        }
    }

    private async void BtnQuery_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            SetStatus("正在连接MongoDB...");
            SaveConfig();

            var mongoUrl = TxtMongoUrl.Text;
            var database = TxtDatabase.Text;
            var collection = TxtCollection.Text;
            var eventFilter = TxtEvent.Text;
            var tenantCode = TxtTenantCode.Text;

            await Task.Run(() =>
            {
                _currentData = _mongoService.QueryData(
                    mongoUrl, database, collection, eventFilter, tenantCode);
            });

            // 显示数据
            DisplayData(_currentData);
            TxtRecordCount.Text = $"({_currentData.Count} 条记录)";
            SetStatus($"查询完成，共 {_currentData.Count} 条数据");
        }
        catch (Exception ex)
        {
            MessageBox.Show($"查询失败：{ex.Message}", "错误", 
                MessageBoxButton.OK, MessageBoxImage.Error);
            SetStatus("查询失败");
        }
    }

    private async void BtnQueryRecent_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            SetStatus("正在查询最近24小时数据...");
            SaveConfig();

            var mongoUrl = TxtMongoUrl.Text;
            var database = TxtDatabase.Text;
            var collection = TxtCollection.Text;
            var eventFilter = TxtEvent.Text;
            var tenantCode = TxtTenantCode.Text;

            await Task.Run(() =>
            {
                _currentData = _mongoService.QueryRecentData(
                    mongoUrl, database, collection, eventFilter, tenantCode, 24);
            });

            // 显示数据
            DisplayData(_currentData);
            TxtRecordCount.Text = $"({_currentData.Count} 条记录 - 最近24小时)";
            SetStatus($"查询完成，共 {_currentData.Count} 条数据（最近24小时）");
        }
        catch (Exception ex)
        {
            MessageBox.Show($"查询失败：{ex.Message}", "错误", 
                MessageBoxButton.OK, MessageBoxImage.Error);
            SetStatus("查询失败");
        }
    }

    private async void BtnSync_Click(object sender, RoutedEventArgs e)
    {
        if (_currentData == null || _currentData.Count == 0)
        {
            MessageBox.Show("请先查询数据", "提示", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (string.IsNullOrEmpty(TxtAppId.Text) || string.IsNullOrEmpty(TxtAppSecret.Password))
        {
            MessageBox.Show("请配置飞书App ID和App Secret", "提示", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (string.IsNullOrEmpty(TxtAppToken.Text) || string.IsNullOrEmpty(TxtTableId.Text))
        {
            MessageBox.Show("请配置飞书多维表格App Token和Table ID", "提示", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        try
        {
            SaveConfig();

            var result = MessageBox.Show(
                $"确定要将 {_currentData.Count} 条数据全量同步到飞书多维表格吗？\n\n注意：将会清空目标表格后重新写入。",
                "确认全量同步", 
                MessageBoxButton.YesNo, 
                MessageBoxImage.Question);

            if (result != MessageBoxResult.Yes) return;

            SetStatus("正在全量同步到飞书...");
            IsEnabled = false;

            var feishuConfig = new FeishuConfig
            {
                AppId = TxtAppId.Text,
                AppSecret = TxtAppSecret.Password,
                AppToken = TxtAppToken.Text,
                TableId = TxtTableId.Text
            };

            var success = await _syncService.SyncToFeishuAsync(_currentData, feishuConfig, TxtEvent.Text);

            IsEnabled = true;

            if (success)
            {
                MessageBox.Show($"全量同步成功！共同步 {_currentData.Count} 条数据", 
                    "成功", MessageBoxButton.OK, MessageBoxImage.Information);
                SetStatus($"全量同步完成，共 {_currentData.Count} 条数据");
            }
            else
            {
                MessageBox.Show("同步失败，请检查配置和网络", 
                    "失败", MessageBoxButton.OK, MessageBoxImage.Error);
                SetStatus("同步失败");
            }
        }
        catch (Exception ex)
        {
            IsEnabled = true;
            MessageBox.Show($"同步失败：{ex.Message}", "错误", 
                MessageBoxButton.OK, MessageBoxImage.Error);
            SetStatus("同步失败");
        }
    }

    private async void BtnIncrementalSync_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrEmpty(TxtAppId.Text) || string.IsNullOrEmpty(TxtAppSecret.Password))
        {
            MessageBox.Show("请配置飞书App ID和App Secret", "提示", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (string.IsNullOrEmpty(TxtAppToken.Text) || string.IsNullOrEmpty(TxtTableId.Text))
        {
            MessageBox.Show("请配置飞书多维表格App Token和Table ID", "提示", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        try
        {
            SaveConfig();

            SetStatus("正在执行增量同步...");
            IsEnabled = false;

            var mongoConfig = new MongoConfig
            {
                Url = TxtMongoUrl.Text,
                Database = TxtDatabase.Text,
                Collection = TxtCollection.Text,
                EventFilter = TxtEvent.Text,
                TenantCode = TxtTenantCode.Text
            };

            var feishuConfig = new FeishuConfig
            {
                AppId = TxtAppId.Text,
                AppSecret = TxtAppSecret.Password,
                AppToken = TxtAppToken.Text,
                TableId = TxtTableId.Text
            };

            var count = await _syncService.IncrementalSyncAsync(mongoConfig, feishuConfig);

            IsEnabled = true;
            UpdateSyncStateDisplay();

            MessageBox.Show($"增量同步完成！本次同步 {count} 条数据", 
                "完成", MessageBoxButton.OK, MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            IsEnabled = true;
            MessageBox.Show($"增量同步失败：{ex.Message}", "错误", 
                MessageBoxButton.OK, MessageBoxImage.Error);
            SetStatus("增量同步失败");
        }
    }

    private void BtnAutoSync_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrEmpty(TxtAppId.Text) || string.IsNullOrEmpty(TxtAppSecret.Password) ||
            string.IsNullOrEmpty(TxtAppToken.Text) || string.IsNullOrEmpty(TxtTableId.Text))
        {
            MessageBox.Show("请先完成飞书配置", "提示", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        // 弹出设置窗口 - 默认6点
        var inputDialog = new Window
        {
            Title = "设置定时增量同步",
            Width = 320,
            Height = 220,
            WindowStartupLocation = WindowStartupLocation.CenterOwner,
            Owner = this,
            ResizeMode = ResizeMode.NoResize
        };

        var stackPanel = new StackPanel { Margin = new Thickness(20) };
        
        stackPanel.Children.Add(new TextBlock 
        { 
            Text = "每天定时执行增量同步（追加数据）", 
            Margin = new Thickness(0, 0, 0, 15),
            Foreground = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(0x66, 0x66, 0x66))
        });
        
        stackPanel.Children.Add(new TextBlock { Text = "执行时间（24小时制）：" });
        
        var timePanel = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 5, 0, 15) };
        var txtHour = new TextBox { Text = "6", Width = 50, Padding = new Thickness(5), TextAlignment = TextAlignment.Center };
        timePanel.Children.Add(txtHour);
        timePanel.Children.Add(new TextBlock { Text = " :", Margin = new Thickness(5, 0, 5, 0), VerticalAlignment = VerticalAlignment.Center });
        var txtMinute = new TextBox { Text = "0", Width = 50, Padding = new Thickness(5), TextAlignment = TextAlignment.Center };
        timePanel.Children.Add(txtMinute);
        stackPanel.Children.Add(timePanel);

        var btnConfirm = new Button { Content = "确认启动", Width = 100, HorizontalAlignment = HorizontalAlignment.Center, Margin = new Thickness(0, 10, 0, 0) };
        stackPanel.Children.Add(btnConfirm);

        inputDialog.Content = stackPanel;

        btnConfirm.Click += (s, args) =>
        {
            if (int.TryParse(txtHour.Text, out int hour) && 
                int.TryParse(txtMinute.Text, out int minute) &&
                hour >= 0 && hour < 24 && minute >= 0 && minute < 60)
            {
                SaveConfig();
                
                var mongoConfig = new MongoConfig
                {
                    Url = TxtMongoUrl.Text,
                    Database = TxtDatabase.Text,
                    Collection = TxtCollection.Text,
                    EventFilter = TxtEvent.Text,
                    TenantCode = TxtTenantCode.Text
                };

                var feishuConfig = new FeishuConfig
                {
                    AppId = TxtAppId.Text,
                    AppSecret = TxtAppSecret.Password,
                    AppToken = TxtAppToken.Text,
                    TableId = TxtTableId.Text
                };

                _syncService.StartAutoSync(mongoConfig, feishuConfig, hour, minute);
                _isAutoSyncRunning = true;

                BtnAutoSync.IsEnabled = false;
                BtnStopAuto.IsEnabled = true;
                SetStatus($"定时增量同步已启动，每天 {hour:D2}:{minute:D2} 执行");

                inputDialog.DialogResult = true;
                inputDialog.Close();
            }
            else
            {
                MessageBox.Show("请输入有效的时间（小时0-23，分钟0-59）", "错误", 
                    MessageBoxButton.OK, MessageBoxImage.Error);
            }
        };

        inputDialog.ShowDialog();
    }

    private void BtnStopAuto_Click(object sender, RoutedEventArgs e)
    {
        _syncService.StopAutoSync();
        _isAutoSyncRunning = false;

        BtnAutoSync.IsEnabled = true;
        BtnStopAuto.IsEnabled = false;
        SetStatus("定时同步已停止");
    }

    private void BtnResetSync_Click(object sender, RoutedEventArgs e)
    {
        var result = MessageBox.Show(
            "确定要重置同步状态吗？\n\n重置后下次同步将查询所有数据（首次同步模式）",
            "确认重置",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question);

        if (result == MessageBoxResult.Yes)
        {
            _syncService.ResetSyncState();
            UpdateSyncStateDisplay();
            SetStatus("同步状态已重置，下次将查询所有数据");
        }
    }

    private void DisplayData(List<Dictionary<string, object>> data)
    {
        if (data == null || data.Count == 0)
        {
            DataGrid.ItemsSource = null;
            return;
        }

        var dataTable = new DataTable();

        // 获取所有列
        var columns = new HashSet<string>();
        foreach (var row in data)
        {
            foreach (var key in row.Keys)
            {
                columns.Add(key);
            }
        }

        // 创建列
        foreach (var col in columns)
        {
            dataTable.Columns.Add(col);
        }

        // 填充数据
        foreach (var row in data)
        {
            var dataRow = dataTable.NewRow();
            foreach (var col in columns)
            {
                if (row.ContainsKey(col) && row[col] != null)
                {
                    dataRow[col] = row[col].ToString();
                }
                else
                {
                    dataRow[col] = "";
                }
            }
            dataTable.Rows.Add(dataRow);
        }

        DataGrid.ItemsSource = dataTable.DefaultView;
    }

    private void OnSyncStatusChanged(string status)
    {
        Dispatcher.Invoke(() => SetStatus(status));
    }

    private void OnSyncCompleted(int count)
    {
        Dispatcher.Invoke(() => UpdateSyncStateDisplay());
    }

    /// <summary>
    /// 同步尝试完成事件处理（无论成功/失败/无数据都会触发）
    /// </summary>
    private void OnSyncAttempted(int syncCount)
    {
        Dispatcher.Invoke(() => 
        {
            UpdateSyncStateDisplay();
            SetStatus($"同步完成，准备调用 Coze... (syncCount={syncCount})");
        });
        
        // 在所有情况下都调用 Coze 智能体
        _ = CallCozeAfterSyncAsync(syncCount);
    }

    /// <summary>
    /// 同步历史更新事件处理
    /// </summary>
    private void OnHistoryUpdated(List<SyncRecord> history)
    {
        Dispatcher.Invoke(() =>
        {
            // 只显示最近10条
            LstSyncHistory.ItemsSource = history.Take(10).ToList();
        });
    }

    /// <summary>
    /// 同步完成后调用 Coze 智能体
    /// </summary>
    /// <param name="syncCount">同步数量，-1表示失败，0表示无数据，>0表示成功</param>
    private async Task CallCozeAfterSyncAsync(int syncCount)
    {
        string token = "";
        string botId = "";
        string query = "";
        
        // 必须在 UI 线程读取控件值
        await Dispatcher.InvokeAsync(() =>
        {
            token = TxtCozeToken.Password;
            botId = TxtCozeBotId.Text;
            query = TxtCozeQuery.Text;
        });

        try
        {
            Dispatcher.Invoke(() => SetStatus($"检查 Coze 配置: Token={(string.IsNullOrEmpty(token) ? "空" : "已填写")}, BotId={(string.IsNullOrEmpty(botId) ? "空" : botId)}"));

            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(botId))
            {
                Dispatcher.Invoke(() => SetStatus("Coze 配置不完整，跳过调用"));
                return;
            }

            string statusText = syncCount switch
            {
                -1 => "失败",
                0 => "无新数据",
                _ => $"成功({syncCount}条)"
            };

            Dispatcher.Invoke(() => SetStatus($"同步{statusText}，正在调用 Coze 智能体... BotId={botId}"));

            // 调用 Coze API（使用配置的查询内容）
            var success = await _cozeService.CallAgentAsync(token, botId, query);

            if (success)
            {
                Dispatcher.Invoke(() => SetStatus($"✅ 同步{statusText}，Coze 智能体调用成功"));
            }
            else
            {
                Dispatcher.Invoke(() => SetStatus($"❌ 同步{statusText}，Coze 智能体调用失败"));
            }
        }
        catch (Exception ex)
        {
            Dispatcher.Invoke(() => SetStatus($"❌ Coze 调用异常: {ex.Message}"));
        }
    }

    private void SetStatus(string status)
    {
        TxtStatus.Text = $"[{DateTime.Now:HH:mm:ss}] {status}";
    }

    protected override void OnClosed(EventArgs e)
    {
        _syncService?.StopAutoSync();
        base.OnClosed(e);
    }
}

public class AppConfig
{
    public string MongoUrl { get; set; } = "mongodb://readonly:5QDZ4SaF5Pias@frp.aixiaoyuan.cn:47017/";
    public string Database { get; set; } = "yn_collect";
    public string Collection { get; set; } = "wjs_track_data";
    public string EventFilter { get; set; } = "MQConfigError";
    public string TenantCode { get; set; } = "";
    public string FeishuAppId { get; set; } = "";
    public string FeishuAppSecret { get; set; } = "";
    public string FeishuAppToken { get; set; } = "";
    public string FeishuTableId { get; set; } = "";
    
    // Coze 智能体配置
    public string CozeAccessToken { get; set; } = "";
    public string CozeBotId { get; set; } = "";
    public string CozeQueryTemplate { get; set; } = "查询 2026-01-01MQ 异常事件数量";
}