using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Threading;
using CozeScheduler.Models;
using CozeScheduler.Services;
using Newtonsoft.Json;

namespace CozeScheduler;

public partial class MainWindow : Window
{
    private CozeService _cozeService;
    private AppConfig _config = new();
    private DispatcherTimer _timer;
    private bool _isRunning = false;
    private DateTime _nextRunTime;
    private List<ScheduleRecord> _history = new List<ScheduleRecord>();

    public MainWindow()
    {
        InitializeComponent();
        InitializeUI();
        InitializeTimer();
        LoadConfig();
        LoadHistory();
        UpdateUIState();
    }

    private void InitializeUI()
    {
        // 初始化小时下拉框 (0-23)
        for (int i = 0; i < 24; i++)
        {
            CmbHour.Items.Add(i.ToString("D2"));
        }

        // 初始化分钟下拉框 (0-59，每5分钟)
        for (int i = 0; i < 60; i += 5)
        {
            CmbMinute.Items.Add(i.ToString("D2"));
        }

        // 默认选择 08:00
        CmbHour.SelectedIndex = 8;
        CmbMinute.SelectedIndex = 0;
    }

    private void InitializeTimer()
    {
        _cozeService = new CozeService();
        
        // 创建定时器，每分钟检查一次
        _timer = new DispatcherTimer
        {
            Interval = TimeSpan.FromSeconds(30)
        };
        _timer.Tick += Timer_Tick;
    }

    private void Timer_Tick(object sender, EventArgs e)
    {
        if (!_isRunning) return;

        var now = DateTime.Now;
        
        // 检查是否到达执行时间
        if (now >= _nextRunTime && now < _nextRunTime.AddMinutes(1))
        {
            ExecuteTaskAsync();
        }

        // 更新下次执行时间显示
        UpdateNextRunDisplay();
    }

    private void LoadConfig()
    {
        var configPath = GetConfigPath();
        if (File.Exists(configPath))
        {
            try
            {
                var json = File.ReadAllText(configPath);
                _config = JsonConvert.DeserializeObject<AppConfig>(json) ?? new AppConfig();
            }
            catch
            {
                _config = new AppConfig();
            }
        }

        // 加载到界面
        TxtCozeToken.Password = _config.CozeAccessToken;
        TxtCozeBotId.Text = _config.CozeBotId;
        TxtCozeQuery.Text = _config.CozeQueryTemplate;
        CmbHour.SelectedIndex = _config.ScheduleHour;
        CmbMinute.SelectedIndex = _config.ScheduleMinute / 5;

        // 如果配置了自动启动
        if (_config.AutoStart && !string.IsNullOrEmpty(_config.CozeAccessToken) && 
            !string.IsNullOrEmpty(_config.CozeBotId))
        {
            StartTimer();
        }
    }

    private void SaveConfig()
    {
        _config.CozeAccessToken = TxtCozeToken.Password;
        _config.CozeBotId = TxtCozeBotId.Text;
        _config.CozeQueryTemplate = TxtCozeQuery.Text;
        _config.ScheduleHour = CmbHour.SelectedIndex;
        _config.ScheduleMinute = CmbMinute.SelectedIndex * 5;

        var configPath = GetConfigPath();
        Directory.CreateDirectory(Path.GetDirectoryName(configPath));
        var json = JsonConvert.SerializeObject(_config, Formatting.Indented);
        File.WriteAllText(configPath, json);
    }

    private string GetConfigPath()
    {
        return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), 
            "CozeScheduler", "config.json");
    }

    private string GetHistoryPath()
    {
        return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), 
            "CozeScheduler", "history.json");
    }

    private void LoadHistory()
    {
        var path = GetHistoryPath();
        if (File.Exists(path))
        {
            try
            {
                var json = File.ReadAllText(path);
                _history = JsonConvert.DeserializeObject<List<ScheduleRecord>>(json) ?? new List<ScheduleRecord>();
            }
            catch
            {
                _history = new List<ScheduleRecord>();
            }
        }
        LstHistory.ItemsSource = _history.Take(15).ToList();
    }

    private void SaveHistory()
    {
        var path = GetHistoryPath();
        Directory.CreateDirectory(Path.GetDirectoryName(path));
        
        // 只保留最近50条
        if (_history.Count > 50)
        {
            _history = _history.Take(50).ToList();
        }
        
        var json = JsonConvert.SerializeObject(_history, Formatting.Indented);
        File.WriteAllText(path, json);
    }

    private void UpdateNextRunDisplay()
    {
        if (_isRunning)
        {
            var now = DateTime.Now;
            var todayRun = new DateTime(now.Year, now.Month, now.Day, 
                CmbHour.SelectedIndex, CmbMinute.SelectedIndex * 5, 0);
            
            if (todayRun <= now)
            {
                todayRun = todayRun.AddDays(1);
            }
            
            _nextRunTime = todayRun;
            TxtNextExecute.Text = todayRun.ToString("yyyy-MM-dd HH:mm");
            TxtNextRun.Text = $"下次执行: {todayRun:HH:mm}";
        }
        else
        {
            TxtNextExecute.Text = "--";
            TxtNextRun.Text = "";
        }
    }

    private void UpdateUIState()
    {
        if (_isRunning)
        {
            BtnStart.IsEnabled = false;
            BtnStop.IsEnabled = true;
            TxtStatusBadge.Text = "✅ 运行中";
            StatusBadge.Background = new SolidColorBrush(Color.FromRgb(72, 187, 120));
            TxtStatusBadge.Foreground = Brushes.White;
            TxtCurrentStatus.Text = "定时任务运行中";
        }
        else
        {
            BtnStart.IsEnabled = true;
            BtnStop.IsEnabled = false;
            TxtStatusBadge.Text = "⏸ 已停止";
            StatusBadge.Background = new SolidColorBrush(Color.FromRgb(226, 232, 240));
            TxtStatusBadge.Foreground = new SolidColorBrush(Color.FromRgb(74, 85, 104));
            TxtCurrentStatus.Text = "已停止";
        }
        
        UpdateNextRunDisplay();
    }

    private void StartTimer()
    {
        _isRunning = true;
        _timer.Start();
        
        // 立即计算下次执行时间
        var now = DateTime.Now;
        var todayRun = new DateTime(now.Year, now.Month, now.Day, 
            CmbHour.SelectedIndex, CmbMinute.SelectedIndex * 5, 0);
        
        if (todayRun <= now)
        {
            todayRun = todayRun.AddDays(1);
        }
        
        _nextRunTime = todayRun;
        
        UpdateUIState();
        SetStatus($"定时任务已启动，每天 {CmbHour.SelectedIndex:D2}:{CmbMinute.SelectedIndex * 5:D2} 执行");
    }

    private void StopTimer()
    {
        _isRunning = false;
        _timer.Stop();
        UpdateUIState();
        SetStatus("定时任务已停止");
    }

    private async void ExecuteTaskAsync()
    {
        var token = TxtCozeToken.Password;
        var botId = TxtCozeBotId.Text;
        var query = TxtCozeQuery.Text;

        if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(botId))
        {
            var record = new ScheduleRecord
            {
                Time = DateTime.Now,
                Type = "定时",
                Result = "跳过",
                Message = "Coze 配置不完整"
            };
            _history.Insert(0, record);
            SaveHistory();
            LstHistory.ItemsSource = _history.Take(15).ToList();
            return;
        }

        try
        {
            SetStatus("正在执行定时任务...");
            TxtCurrentStatus.Text = "执行中...";
            TxtResponse.Text = "正在获取返回结果...";

            var response = await _cozeService.CallAgentWithResultAsync(token, botId, query);

            if (!string.IsNullOrEmpty(response))
            {
                var record = new ScheduleRecord
                {
                    Time = DateTime.Now,
                    Type = "定时",
                    Result = "成功",
                    Message = $"调用成功 - {query}"
                };
                _history.Insert(0, record);
                TxtResponse.Text = response;
                SetStatus("✅ 定时任务执行成功");
                TxtCurrentStatus.Text = "执行成功";
            }
        }
        catch (Exception ex)
        {
            var record = new ScheduleRecord
            {
                Time = DateTime.Now,
                Type = "定时",
                Result = "失败",
                Message = ex.Message
            };
            _history.Insert(0, record);
            SetStatus($"❌ 定时任务异常: {ex.Message}");
            TxtCurrentStatus.Text = "执行异常";
        }

        SaveHistory();
        LstHistory.ItemsSource = _history.Take(15).ToList();
    }

    private void SetStatus(string status)
    {
        TxtStatus.Text = $"[{DateTime.Now:HH:mm:ss}] {status}";
    }

    private void BtnStart_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrEmpty(TxtCozeToken.Password) || string.IsNullOrEmpty(TxtCozeBotId.Text))
        {
            MessageBox.Show("请先配置 Coze Access Token 和 Bot ID", "提示", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        SaveConfig();
        StartTimer();
    }

    private void BtnStop_Click(object sender, RoutedEventArgs e)
    {
        StopTimer();
    }

    private async void BtnTest_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrEmpty(TxtCozeToken.Password) || string.IsNullOrEmpty(TxtCozeBotId.Text))
        {
            MessageBox.Show("请先配置 Coze Access Token 和 Bot ID", "提示", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        SaveConfig();
        
        try
        {
            SetStatus("正在手动触发...");
            TxtCurrentStatus.Text = "手动执行中...";
            TxtResponse.Text = "正在获取返回结果...";
            BtnTest.IsEnabled = false;

            var token = TxtCozeToken.Password;
            var botId = TxtCozeBotId.Text;
            var query = TxtCozeQuery.Text;

            var response = await _cozeService.CallAgentWithResultAsync(token, botId, query);

            if (!string.IsNullOrEmpty(response))
            {
                var record = new ScheduleRecord
                {
                    Time = DateTime.Now,
                    Type = "手动",
                    Result = "成功",
                    Message = $"调用成功 - {query}"
                };
                _history.Insert(0, record);
                TxtResponse.Text = response;
                SetStatus("✅ 手动触发成功");
                TxtCurrentStatus.Text = "执行成功";
            }
            else
            {
                var record = new ScheduleRecord
                {
                    Time = DateTime.Now,
                    Type = "手动",
                    Result = "成功",
                    Message = "调用成功（无返回内容）"
                };
                _history.Insert(0, record);
                TxtResponse.Text = "（智能体未返回内容）";
                SetStatus("✅ 手动触发成功");
                TxtCurrentStatus.Text = "执行成功";
            }
        }
        catch (Exception ex)
        {
            var record = new ScheduleRecord
            {
                Time = DateTime.Now,
                Type = "手动",
                Result = "失败",
                Message = ex.Message
            };
            _history.Insert(0, record);
            SetStatus($"❌ 异常: {ex.Message}");
            TxtCurrentStatus.Text = "执行异常";
            MessageBox.Show($"❌ 调用异常: {ex.Message}", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
        }
        finally
        {
            BtnTest.IsEnabled = true;
        }

        SaveHistory();
        LstHistory.ItemsSource = _history.Take(15).ToList();
    }

    private void BtnSave_Click(object sender, RoutedEventArgs e)
    {
        SaveConfig();
        MessageBox.Show("✅ 配置已保存", "提示", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    private void TxtCozeToken_PasswordChanged(object sender, RoutedEventArgs e)
    {
        // 密码框变化时暂时不自动保存，等用户点击保存按钮
    }

    protected override void OnClosed(EventArgs e)
    {
        _timer?.Stop();
        base.OnClosed(e);
    }
}