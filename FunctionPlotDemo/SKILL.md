---
name: function-plot-demo
description: WPF 数学函数绘图工具，基于 ScottPlot + NCalc。支持多函数叠加、颜色区分、预制函数快速选择。适用于：(1) 修改或扩展绘图功能；(2) 添加新的预制函数；(3) 调整界面布局；(4) 修复表达式解析问题；(5) 添加新的数学函数支持。
---

# FunctionPlotDemo - WPF 函数绘图工具

## 项目概览

基于 .NET 8.0 + WPF 的数学函数可视化工具，使用 ScottPlot 绑制曲线，NCalc 解析表达式。

## 关键文件

| 文件 | 职责 |
|------|------|
| `MainWindow.xaml` | 主界面 UI（左右布局） |
| `MainWindow.xaml.cs` | 核心逻辑：表达式解析、曲线管理 |
| `FunctionPlotDemo.csproj` | 项目配置、NuGet 依赖 |

## 核心类

### MainWindow

```csharp
// 绘图参数
const double XMin = -10;      // X轴范围
const double XMax = 10;
const int Points = 500;       // 采样点数

// 多曲线管理
ObservableCollection<PlottedFunction> _plottedFunctions;  // 已绘制函数
int _colorIndex;  // 颜色索引（8色循环）

// 核心方法
void PlotFunction(string expression);           // 添加曲线
void RedrawAllFunctions();                      // 重绘所有
void ClearAllFunctions();                       // 清除所有
(double[], double[]) CalculateFunction(string); // 计算坐标
```

### PlottedFunction

```csharp
class PlottedFunction {
    string DisplayName;      // 显示名 "y = x²"
    string Expression;       // 表达式 "x * x"
    Brush ColorBrush;        // WPF 颜色
    ScottPlot.Color PlotColor;
}
```

## 常见修改

### 添加预制函数

在 `MainWindow.xaml` 左侧面板添加按钮：

```xml
<Button Content="y = 新函数" 
        Style="{StaticResource FunctionItemButton}" 
        Tag="新表达式" 
        Click="PresetFunction_Click"/>
```

### 添加数学函数

在 `MainWindow.xaml.cs` 的 `CalculateFunction` 方法中，找到 `EvaluateFunction` 回调，添加：

```csharp
"newfunc" => Math.NewFunc(arg),
```

### 修改颜色方案

修改 `PlotColors` 和 `ColorBrushes` 数组（8种颜色）。

### 调整坐标范围

修改 `XMin`, `XMax` 常量。

## 数据流

```
用户输入 → NCalc.Parse → 遍历 x 计算 y → ScottPlot.Scatter → 图表刷新
```

## 运行命令

```bash
# 编译
dotnet build -c Release

# 运行
dotnet run

# 或直接运行
.\bin\Release\net8.0-windows\FunctionPlotDemo.exe
```

## NuGet 依赖

- `ScottPlot.WPF` 5.0.47 - 绑图库
- `NCalcSync` 5.2.1 - 表达式解析

## 注意事项

- NCalc 函数名不区分大小写（已转为小写匹配）
- 无效点（如 `log(0)`）自动跳过，不中断绑制
- 重复表达式会提示，不重复添加
- 颜色索引自动循环，添加时递增