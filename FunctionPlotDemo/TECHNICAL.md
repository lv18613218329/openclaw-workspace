# 技术文档 (TECHNICAL)

本文档描述 FunctionPlotDemo 项目的技术架构和实现细节。

---

## 1. 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| .NET | 8.0 | 运行时框架 |
| WPF | - | Windows 桌面 UI 框架 |
| ScottPlot | 5.0.47 | 高性能 .NET 绑定库 |
| NCalcSync | 5.2.1 | 数学表达式解析库 |
| C# | 12 | 编程语言 |

---

## 2. 项目结构

```
FunctionPlotDemo/
├── FunctionPlotDemo.sln           # Visual Studio 解决方案
├── FunctionPlotDemo.csproj        # 项目配置文件
├── App.xaml                       # 应用程序定义
├── App.xaml.cs                    # 应用程序入口
├── MainWindow.xaml                # 主窗口 UI
├── MainWindow.xaml.cs             # 主窗口逻辑
├── README.md                      # 项目说明
├── CHANGELOG.md                   # 更新日志
├── REQUIREMENTS.md                # 需求文档
├── TECHNICAL.md                   # 技术文档（本文件）
├── bin/                           # 编译输出
│   └── Release/net8.0-windows/
│       └── FunctionPlotDemo.exe   # 可执行文件
└── obj/                           # 编译中间文件
```

---

## 3. 核心类设计

### 3.1 MainWindow (主窗口)

**职责：** 界面交互和图表控制

**关键成员：**

```csharp
// 常量
private const double XMin = -10;      // X轴最小值
private const double XMax = 10;       // X轴最大值
private const int Points = 500;       // 采样点数

// 颜色配置
private static readonly ScottPlot.Color[] PlotColors;  // 绘图颜色数组
private static readonly Brush[] ColorBrushes;          // WPF画刷数组

// 状态
private ObservableCollection<PlottedFunction> _plottedFunctions;  // 已绘制函数列表
private int _colorIndex;  // 当前颜色索引

// 方法
void PlotFunction(string expression);           // 绘制函数
void RedrawAllFunctions();                      // 重绘所有函数
void ClearAllFunctions();                       // 清除所有函数
(double[], double[]) CalculateFunction(string); // 计算函数值
```

### 3.2 PlottedFunction (已绘制函数)

**职责：** 存储已绘制函数的信息

```csharp
public class PlottedFunction : INotifyPropertyChanged
{
    public string DisplayName { get; set; }    // 显示名称 "y = x²"
    public string Expression { get; set; }     // 表达式 "x * x"
    public Brush ColorBrush { get; set; }      // WPF 颜色画刷
    public ScottPlot.Color PlotColor { get; set; }  // ScottPlot 颜色
}
```

---

## 4. 数据流

```
用户输入表达式
      ↓
[表达式验证]
      ↓
[NCalc 解析表达式]
      ↓
[遍历 x 值计算 y]
      ↓
[生成坐标数组]
      ↓
[ScottPlot 绑制曲线]
      ↓
[添加到函数列表]
      ↓
[刷新图表显示]
```

---

## 5. 关键算法

### 5.1 表达式求值

使用 NCalc 库解析和计算数学表达式：

```csharp
var expression = new NCalc.Expression("Sin(x) + Cos(x)");
expression.Parameters["x"] = 1.0;

// 注册自定义函数
expression.EvaluateFunction += (name, args) =>
{
    args.Result = name.ToLower() switch
    {
        "sin" => Math.Sin(arg),
        "cos" => Math.Cos(arg),
        // ...
    };
};

var result = expression.Evaluate();  // 返回计算结果
```

### 5.2 曲线绘制

使用 ScottPlot 绑制曲线：

```csharp
var scatter = PlotControl.Plot.Add.Scatter(xValues, yValues);
scatter.LineWidth = 2;
scatter.Color = ScottPlot.Colors.Blue;
PlotControl.Refresh();
```

### 5.3 多曲线管理

```csharp
// 添加新曲线
_plottedFunctions.Add(new PlottedFunction { ... });

// 移除曲线
_plottedFunctions.Remove(func);
RedrawAllFunctions();  // 重新绘制剩余曲线
```

---

## 6. NuGet 依赖

```xml
<PackageReference Include="ScottPlot.WPF" Version="5.0.47" />
<PackageReference Include="NCalcSync" Version="5.2.1" />
```

### 6.1 ScottPlot.WPF

- **用途：** 高性能数据可视化
- **特点：**
  - 纯 C# 实现，无原生依赖
  - 支持 WPF 控件
  - 交互式图表（缩放、平移）
  - 高性能渲染

### 6.2 NCalcSync

- **用途：** 数学表达式解析
- **特点：**
  - 支持数学运算符
  - 支持自定义函数
  - 支持参数和变量
  - 同步版本，适合简单场景

---

## 7. 颜色方案

预设 8 种颜色，循环分配：

| 索引 | 颜色 | HEX | 说明 |
|------|------|-----|------|
| 0 | 蓝色 | #2196F3 | Material Blue |
| 1 | 绿色 | #4CAF50 | Material Green |
| 2 | 红色 | #F44336 | Material Red |
| 3 | 橙色 | #FF9800 | Material Orange |
| 4 | 紫色 | #9C27B0 | Material Purple |
| 5 | 棕色 | #795548 | Material Brown |
| 6 | 黑色 | #333333 | Dark Gray |
| 7 | 青色 | #00BCD4 | Material Cyan |

---

## 8. 性能优化

### 8.1 采样点控制

- 默认采样 500 个点
- 平衡精度和性能
- 可根据需要调整 `Points` 常量

### 8.2 异常点跳过

- 无效点（如 `log(0)`）自动跳过
- 使用 `try-catch` 处理单点计算错误
- 确保部分有效点仍能绘制

### 8.3 增量刷新

- 添加新曲线时不重新计算已有曲线
- 删除曲线时才重新绘制

---

## 9. 扩展指南

### 9.1 添加新的预制函数

在 `MainWindow.xaml` 中添加按钮：

```xml
<Button Content="y = 新函数" 
        Style="{StaticResource FunctionItemButton}" 
        Tag="新表达式" 
        Click="PresetFunction_Click"/>
```

### 9.2 添加新的数学函数

在 `CalculateFunction` 方法的 `EvaluateFunction` 回调中添加：

```csharp
"newfunc" => Math.NewFunc(arg),
```

### 9.3 修改坐标轴范围

修改 `XMin`, `XMax` 常量或添加运行时配置。

---

## 10. 调试技巧

### 10.1 表达式调试

```csharp
// 在 CalculateFunction 中添加日志
Console.WriteLine($"x = {x}, result = {result}");
```

### 10.2 图表调试

```csharp
// 查看当前曲线数量
Console.WriteLine($"曲线数: {PlotControl.Plot.GetPlottables().Count()}");
```

---

## 11. 已知限制

1. **坐标轴范围固定** - 暂不支持运行时调整
2. **无参数方程支持** - 仅支持 y = f(x) 形式
3. **无极坐标支持** - 仅支持直角坐标系
4. **无 3D 绑制** - 仅支持 2D 图表

---

## 12. 参考资源

- [ScottPlot 官方文档](https://scottplot.net/)
- [NCalc 官方文档](https://ncalc.github.io/ncalc)
- [WPF 官方文档](https://docs.microsoft.com/dotnet/desktop/wpf/)
- [.NET 8.0 文档](https://docs.microsoft.com/dotnet/)