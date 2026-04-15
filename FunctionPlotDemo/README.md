# 函数绘图 Demo

基于 **ScottPlot + NCalc** 的 WPF 函数绘图演示程序。

![.NET](https://img.shields.io/badge/.NET-8.0-512BD4)
![WPF](https://img.shields.io/badge/WPF-Desktop-68217A)
![ScottPlot](https://img.shields.io/badge/ScottPlot-5.0.47-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 功能特性

### 核心功能

- ✅ 输入数学表达式，实时绘制函数图像
- ✅ 支持变量 `x`
- ✅ 支持常用数学函数：sin, cos, tan, sqrt, log, exp 等
- ✅ 支持常量：pi, e
- ✅ 交互式图表（缩放、平移）

### v1.1 新增

- ✅ **左右布局** - 左侧预制函数面板，右侧图表区
- ✅ **预制函数** - 6 大类 35+ 个常用函数快速选择
- ✅ **多函数叠加** - 同时绘制多条曲线
- ✅ **颜色区分** - 8 种预设颜色自动分配
- ✅ **函数管理** - 已绘制函数列表，支持单独删除

---

## 界面预览

```
┌────────────────────┬─────────────────────────────────────┐
│ 📋 预制函数        │  表达式: [        ] [绘制] [清除]  │
│                    ├─────────────────────────────────────┤
│ 📐 一次函数        │  📊 已绘制函数:                    │
│   • y = x          │  ──── y = x²      [✕]              │
│   • y = 2x + 1     │  ──── y = sin(x)  [✕]              │
│                    ├─────────────────────────────────────┤
│ 📈 二次函数        │                                     │
│   • y = x²         │                                     │
│   • y = -x²        │         函 数 图 像                │
│                    │        （多曲线叠加显示）          │
│ 🔢 幂函数          │                                     │
│   • y = x³         │                                     │
│   • y = 1/x        │                                     │
│                    │                                     │
│ 📊 指数函数        │                                     │
│ 📝 对数函数        │                                     │
│ 📐 三角函数        │                                     │
└────────────────────┴─────────────────────────────────────┘
```

---

## 快速开始

### 方式一：直接运行

```bash
# 进入项目目录
cd FunctionPlotDemo

# 运行
dotnet run
```

### 方式二：Visual Studio

1. 安装 [Visual Studio 2022](https://visualstudio.microsoft.com/) (包含 .NET 桌面开发工作负载)
2. 双击打开 `FunctionPlotDemo.sln`
3. 还原 NuGet 包（右键解决方案 → 还原 NuGet 包）
4. 按 F5 运行

### 方式三：编译后运行

```bash
# 编译
dotnet build -c Release

# 运行
.\bin\Release\net8.0-windows\FunctionPlotDemo.exe
```

---

## 预制函数列表

| 分类 | 函数示例 |
|------|----------|
| **一次函数** | y = x, y = 2x + 1, y = -x + 3, y = 3x - 2 |
| **二次函数** | y = x², y = x² + 1, y = 2x² - 3x + 1, y = -x² |
| **幂函数** | y = x³, y = x⁴, y = 1/x, y = √x |
| **指数函数** | y = eˣ, y = 2ˣ, y = 3ˣ, y = e⁻ˣ |
| **对数函数** | y = ln(x), y = log₁₀(x), y = ln(x+1) |
| **三角函数** | y = sin(x), y = cos(x), y = tan(x), y = sin(2x) |

---

## 支持的函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `Sin`, `Cos`, `Tan` | 三角函数 | `Sin(x)` |
| `Asin`, `Acos`, `Atan` | 反三角函数 | `Asin(x)` |
| `Sqrt` | 平方根 | `Sqrt(x)` |
| `Log` | 自然对数 | `Log(x)` |
| `Log10` | 常用对数 | `Log10(x)` |
| `Exp` | 指数函数 | `Exp(x)` |
| `Abs` | 绝对值 | `Abs(x)` |
| `Pow` | 幂函数 | `Pow(x, 3)` |
| `Min`, `Max` | 最值函数 | `Min(x, 5)` |
| `Floor`, `Ceil`, `Round` | 取整函数 | `Floor(x)` |

**常量：** `pi` (π), `e` (自然常数)

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| .NET | 8.0 | 运行时框架 |
| WPF | - | Windows 桌面 UI |
| ScottPlot | 5.0.47 | 高性能绘图库 |
| NCalcSync | 5.2.1 | 表达式解析 |

---

## 项目文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 项目说明（本文件） |
| [CHANGELOG.md](CHANGELOG.md) | 更新日志 |
| [REQUIREMENTS.md](REQUIREMENTS.md) | 需求文档 |
| [TECHNICAL.md](TECHNICAL.md) | 技术文档 |

---

## 项目结构

```
FunctionPlotDemo/
├── FunctionPlotDemo.sln        # 解决方案文件
├── FunctionPlotDemo.csproj     # 项目配置
├── App.xaml                    # 应用程序定义
├── App.xaml.cs
├── MainWindow.xaml             # 主界面 UI
├── MainWindow.xaml.cs          # 主逻辑
├── README.md                   # 项目说明
├── CHANGELOG.md                # 更新日志
├── REQUIREMENTS.md             # 需求文档
└── TECHNICAL.md                # 技术文档
```

---

## 系统要求

- **操作系统：** Windows 10 / Windows 11
- **运行时：** .NET 8.0 Runtime
- **开发工具：** Visual Studio 2022 (可选)

---

## 许可证

本项目使用 MIT 许可证。

---

## 参考资料

- [ScottPlot 官方文档](https://scottplot.net/)
- [NCalc 官方文档](https://ncalc.github.io/ncalc)
- [WPF 官方文档](https://docs.microsoft.com/dotnet/desktop/wpf/)
- [Math.NET Numerics](https://numerics.mathdotnet.com/) (备选数学库)