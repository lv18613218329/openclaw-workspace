# 黑板中函数方案研究 - 开源项目调研报告 (C#/WPF版)

**调研日期**: 2026-03-13  
**调研目的**: 为黑板软件寻找合适的数学函数绘图解决方案  
**关联任务**: SP6迭代 - 【技术研究】黑板中函数方案研究【L】  
**技术栈**: C# + WPF

---

## 一、技术方案对比

有两种可行方案：

| 方案 | 优点 | 缺点 |
|------|------|------|
| **方案一：.NET 原生库** | 性能好、集成简单、无浏览器依赖 | 几何作图库较少 |
| **方案二：嵌入 HTML 控件** | 前端生态丰富、功能全面 | 需要嵌入浏览器、性能稍差 |

---

## 二、.NET 原生开源项目调研

### 1. ScottPlot ⭐⭐⭐⭐⭐ (函数绘图)

**项目地址**: https://github.com/ScottPlot/ScottPlot  
**官网**: https://scottplot.net/

**简介**:
ScottPlot 是一个免费开源的 .NET 绘图库，可以轻松交互式显示大型数据集。支持 WPF、WinForms、Console、Avalonia 等多种平台。

**核心特性**:
- ✅ 原生 WPF 控件 (WpfPlot)
- ✅ 散点图、折线图、柱状图、饼图
- ✅ 函数绘图支持
- ✅ 高性能，可处理大数据
- ✅ 支持缩放、平移交互
- ✅ MVVM 友好

**许可证**: MIT

**WPF 快速示例**:
```xml
<!-- XAML -->
<ScottPlot:WpfPlot x:Name="WpfPlot1" />
```
```csharp
// C#
double[] dataX = { 1, 2, 3, 4, 5 };
double[] dataY = { 1, 4, 9, 16, 25 };
WpfPlot1.Plot.Add.Scatter(dataX, dataY);
WpfPlot1.Refresh();
```

**NuGet 安装**:
```
Install-Package ScottPlot.WPF
```

**推荐指数**: ⭐⭐⭐⭐⭐ (强烈推荐用于函数绘图)

---

### 2. OxyPlot ⭐⭐⭐⭐⭐ (图表绑定)

**项目地址**: https://github.com/oxyplot/oxyplot  
**官网**: https://oxyplot.github.io/

**简介**:
OxyPlot 是一个跨平台的 .NET 绘图库，支持 WPF、Windows Forms、Silverlight、Xamarin 等多种平台。

**核心特性**:
- ✅ 原生 WPF 控件
- ✅ PlotModel 绑定模式（MVVM友好）
- ✅ 多种图表类型
- ✅ 高度可定制
- ✅ 导出图片支持

**许可证**: MIT

**WPF 使用方式**:
```xml
<oxy:PlotView Model="{Binding MyPlotModel}" />
```
```csharp
var plotModel = new PlotModel { Title = "函数图像" };
plotModel.Series.Add(new FunctionSeries(Math.Sin, 0, 10, 0.1, "sin(x)"));
```

**NuGet 安装**:
```
Install-Package OxyPlot.Wpf
```

**推荐指数**: ⭐⭐⭐⭐⭐ (强烈推荐，MVVM友好)

---

### 3. NCalc ⭐⭐⭐⭐⭐ (表达式解析)

**项目地址**: https://github.com/ncalc/ncalc  
**文档**: https://ncalc.github.io/ncalc

**简介**:
NCalc 是一个快速、轻量级的 .NET 表达式求值库，支持数学和逻辑运算，可解析字符串表达式并计算结果。

**核心特性**:
- ✅ 数学表达式解析
- ✅ 支持自定义函数
- ✅ 支持变量参数
- ✅ 可编译为 Lambda 表达式（高性能）
- ✅ 支持 async 异步求值

**许可证**: MIT

**使用示例**:
```csharp
// 简单表达式
var expr = new Expression("2 + 3 * 5");
var result = expr.Evaluate(); // 17

// 数学函数
var sinExpr = new Expression("Sin(0)");
var sinResult = sinExpr.Evaluate(); // 0

// 变量参数
var expr2 = new Expression("x * x + 2 * x + 1");
expr2.Parameters["x"] = 3;
var result2 = expr2.Evaluate(); // 16

// 自定义函数
var customExpr = new Expression("MyFunc(3, 4)");
customExpr.Functions["MyFunc"] = args => (int)args[0] + (int)args[1];
```

**NuGet 安装**:
```
Install-Package NCalcSync
```

**性能**: Lambda 编译模式下性能提升可达 3000%-35000%

**推荐指数**: ⭐⭐⭐⭐⭐ (强烈推荐作为表达式解析引擎)

---

### 4. Math.NET Numerics ⭐⭐⭐⭐⭐ (数学计算)

**项目地址**: https://github.com/mathnet/mathnet-numerics  
**官网**: https://numerics.mathdotnet.com/

**简介**:
Math.NET Numerics 是 .NET 最强大的数值计算库，提供线性代数、概率统计、特殊函数、插值、积分、FFT 等功能。

**核心特性**:
- ✅ 线性代数（矩阵、向量）
- ✅ 特殊函数（Gamma、Beta、Bessel等）
- ✅ 概率分布
- ✅ 统计分析
- ✅ 插值与拟合
- ✅ 积分变换（FFT）
- ✅ 微分方程

**许可证**: MIT

**NuGet 安装**:
```
Install-Package MathNet.Numerics
```

**推荐指数**: ⭐⭐⭐⭐⭐ (强烈推荐作为数学计算引擎)

---

## 三、HTML 嵌入方案调研

如果选择嵌入 HTML 控件，可以使用之前调研的 JavaScript 库：

### 嵌入方式

**方式一：WPF 内置 WebBrowser**
```xml
<WebBrowser x:Name="webBrowser" />
```
- 优点：无需额外依赖
- 缺点：使用 IE 内核，兼容性差

**方式二：CefSharp（推荐）**
```xml
<cefSharp:ChromiumWebBrowser Address="local.html" />
```
- 优点：Chrome 内核，兼容性好
- 缺点：需要安装 NuGet 包，体积较大

**方式三：Microsoft WebView2**
- 优点：Edge 内核，微软官方支持
- 缺点：需要 Edge 运行时

### JavaScript 库推荐（嵌入方案）

| 库 | 特点 | 许可证 |
|---|---|---|
| **JSXGraph** | 几何+函数+图表，功能最全 | LGPL/MIT |
| **function-plot** | 专注函数绘图，简单易用 | MIT |
| **Math.js** | 数学表达式解析 | Apache 2.0 |

---

## 四、推荐方案

### 🎯 方案一：.NET 原生方案（推荐）

**组合**: ScottPlot + NCalc + Math.NET Numerics

**架构**:
```
用户输入表达式 → NCalc 解析求值 → ScottPlot 绑定绘制
                                    ↓
                            Math.NET 复杂数学计算
```

**优势**:
- ✅ 纯 .NET，性能最优
- ✅ 无浏览器依赖
- ✅ WPF 原生控件，集成简单
- ✅ MIT 许可证，无商业限制
- ✅ 全部支持 NuGet 安装

**NuGet 依赖**:
```
Install-Package ScottPlot.WPF
Install-Package NCalcSync
Install-Package MathNet.Numerics
```

---

### 🔄 方案二：HTML 嵌入方案

**组合**: CefSharp + JSXGraph + Math.js

**架构**:
```
WPF CefSharp 控件 → 加载 HTML 页面 → JSXGraph 绘图
                                    ↓
                                Math.js 表达式解析
```

**优势**:
- ✅ 几何作图功能更丰富
- ✅ 前端生态完善
- ✅ 可以复用现有前端代码

**劣势**:
- ❌ 需要嵌入浏览器
- ❌ 性能不如原生
- ❌ 调试相对复杂

---

## 五、功能对比

| 功能需求 | 方案一 (.NET原生) | 方案二 (HTML嵌入) |
|---------|-----------------|-----------------|
| 函数绘图 | ✅ ScottPlot | ✅ JSXGraph/function-plot |
| 表达式解析 | ✅ NCalc | ✅ Math.js |
| 几何作图 | ⚠️ 需自己实现 | ✅ JSXGraph 内置 |
| 尺规作图 | ⚠️ 需自己实现 | ✅ JSXGraph 内置 |
| 性能 | ✅✅✅ 最优 | ✅✅ 良好 |
| 集成难度 | ✅✅✅ 简单 | ✅✅ 中等 |
| 文档完善度 | ✅✅✅ 完善 | ✅✅✅ 完善 |
| 许可证 | ✅ 全MIT | ⚠️ JSXGraph LGPL/MIT |

---

## 六、结论建议

### 如果主要需求是函数绘图：
**推荐方案一**（ScottPlot + NCalc）
- 纯 .NET 原生，性能最佳
- 集成简单，维护方便
- MIT 许可证，无商业风险

### 如果需要几何作图/尺规作图：
**推荐方案二**（CefSharp + JSXGraph）
- JSXGraph 内置几何作图功能
- 功能更全面

### 混合方案：
也可以考虑：
- 用 **ScottPlot + NCalc** 实现函数绘图（高性能）
- 用 **CefSharp + JSXGraph** 实现几何作图（功能全）

---

## 七、下一步行动

- [ ] 确认具体需求（是否需要几何/尺规作图）
- [ ] 搭建 Demo 环境
- [ ] 性能测试
- [ ] 许可证审核
- [ ] 与现有系统集成评估

---

## 附录：NuGet 安装命令

```powershell
# 方案一 (.NET原生)
Install-Package ScottPlot.WPF
Install-Package NCalcSync
Install-Package MathNet.Numerics

# 方案二 (HTML嵌入)
Install-Package CefSharp.Wpf
```

---

*本报告由 OpenClaw 小爪生成*