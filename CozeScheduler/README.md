# Coze Scheduler - 扣子定时调度器

每天定时调用扣子（Coze）API 触发智能体的 WPF 桌面应用程序。

## 功能特性

- 🔧 **Coze API 配置** - 配置 Access Token 和 Bot ID
- ⏰ **定时任务** - 每天自动执行，可设置具体时间
- 🧪 **手动触发** - 随时手动调用智能体
- 📋 **执行历史** - 记录所有执行结果
- 💾 **配置持久化** - 配置保存在本地

## 技术栈

- .NET Framework 4.8
- WPF
- Newtonsoft.Json 13.0.3

## 项目结构

```
CozeScheduler/
├── App.xaml / App.xaml.cs     # 应用程序入口
├── MainWindow.xaml / .cs      # 主界面
├── Models/
│   └── AppConfig.cs           # 配置模型
├── Services/
│   └── CozeService.cs         # Coze API 服务
└── CozeScheduler.csproj       # 项目文件
```

## 使用说明

1. 运行 `CozeScheduler.exe`
2. 在界面中配置：
   - **Access Token**: 扣子平台的个人访问令牌
   - **Bot ID**: 要调用的智能体 ID
   - **查询内容**: 发送给智能体的消息内容
3. 设置每天的执行时间
4. 点击「启动定时任务」或「手动触发一次」

## 配置说明

- 配置文件位置：`%APPDATA%\CozeScheduler\config.json`
- 历史记录位置：`%APPDATA%\CozeScheduler\history.json`

## 构建

```bash
dotnet build -c Release
```

输出目录：`bin\Release\net48\CozeScheduler.exe`