using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;

namespace FunctionPlotDemo
{
    /// <summary>
    /// 已绘制的函数信息
    /// </summary>
    public class PlottedFunction : INotifyPropertyChanged
    {
        private string _displayName = "";
        private string _expression = "";
        private Brush _colorBrush = Brushes.Blue;

        public string DisplayName
        {
            get => _displayName;
            set { _displayName = value; OnPropertyChanged(nameof(DisplayName)); }
        }

        public string Expression
        {
            get => _expression;
            set { _expression = value; OnPropertyChanged(nameof(Expression)); }
        }

        public Brush ColorBrush
        {
            get => _colorBrush;
            set { _colorBrush = value; OnPropertyChanged(nameof(ColorBrush)); }
        }

        public ScottPlot.Color PlotColor { get; set; }

        public event PropertyChangedEventHandler? PropertyChanged;
        protected void OnPropertyChanged(string name) => 
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
    }

    public partial class MainWindow : Window
    {
        // 绘图参数
        private const double XMin = -10;
        private const double XMax = 10;
        private const int Points = 500;

        // 预设颜色（8种）
        private static readonly ScottPlot.Color[] PlotColors = new[]
        {
            ScottPlot.Color.FromHex("#2196F3"), // 蓝色
            ScottPlot.Color.FromHex("#4CAF50"), // 绿色
            ScottPlot.Color.FromHex("#F44336"), // 红色
            ScottPlot.Color.FromHex("#FF9800"), // 橙色
            ScottPlot.Color.FromHex("#9C27B0"), // 紫色
            ScottPlot.Color.FromHex("#795548"), // 棕色
            ScottPlot.Color.FromHex("#333333"), // 黑色
            ScottPlot.Color.FromHex("#00BCD4"), // 青色
        };

        private static readonly Brush[] ColorBrushes = new[]
        {
            Brushes.DodgerBlue,
            Brushes.ForestGreen,
            Brushes.Crimson,
            Brushes.Orange,
            Brushes.MediumPurple,
            Brushes.SaddleBrown,
            Brushes.DarkGray,
            Brushes.DarkTurquoise,
        };

        // 已绘制函数列表
        private ObservableCollection<PlottedFunction> _plottedFunctions = new();
        private int _colorIndex = 0;

        public MainWindow()
        {
            InitializeComponent();
            InitializePlot();
            PlottedFunctionsList.ItemsSource = _plottedFunctions;
            UpdateFunctionsListDisplay();
        }

        /// <summary>
        /// 初始化图表
        /// </summary>
        private void InitializePlot()
        {
            PlotControl.Plot.Title("函数图像（支持多函数叠加）");
            PlotControl.Plot.XLabel("x");
            PlotControl.Plot.YLabel("y");

            // 设置坐标轴范围
            PlotControl.Plot.Axes.SetLimits(XMin, XMax, -10, 10);

            // 显示网格
            PlotControl.Plot.Grid.MajorLineColor = ScottPlot.Colors.Gray.WithAlpha(0.5);
            PlotControl.Plot.Grid.MinorLineColor = ScottPlot.Colors.Gray.WithAlpha(0.2);

            PlotControl.Refresh();
        }

        /// <summary>
        /// 绘制按钮点击事件
        /// </summary>
        private void PlotButton_Click(object sender, RoutedEventArgs e)
        {
            PlotFunction(FunctionInput.Text.Trim());
        }

        /// <summary>
        /// 输入框回车事件
        /// </summary>
        private void FunctionInput_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                PlotFunction(FunctionInput.Text.Trim());
            }
        }

        /// <summary>
        /// 预制函数点击事件
        /// </summary>
        private void PresetFunction_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button button && button.Tag is string expression)
            {
                FunctionInput.Text = expression;
                PlotFunction(expression);
            }
        }

        /// <summary>
        /// 全部清除按钮
        /// </summary>
        private void ClearAllButton_Click(object sender, RoutedEventArgs e)
        {
            ClearAllFunctions();
        }

        /// <summary>
        /// 移除单个函数
        /// </summary>
        private void RemoveFunction_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button button && button.Tag is PlottedFunction func)
            {
                _plottedFunctions.Remove(func);
                RedrawAllFunctions();
                UpdateFunctionsListDisplay();
                StatusText.Text = $"已移除函数: {func.DisplayName}";
            }
        }

        /// <summary>
        /// 绘制函数
        /// </summary>
        private void PlotFunction(string expressionText)
        {
            if (string.IsNullOrEmpty(expressionText))
            {
                MessageBox.Show("请输入函数表达式！", "提示", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            try
            {
                StatusText.Text = "正在计算...";

                // 检查是否已存在相同表达式
                foreach (var f in _plottedFunctions)
                {
                    if (f.Expression.Equals(expressionText, StringComparison.OrdinalIgnoreCase))
                    {
                        MessageBox.Show($"函数 {f.DisplayName} 已存在！", "提示", MessageBoxButton.OK, MessageBoxImage.Information);
                        StatusText.Text = "该函数已绘制";
                        return;
                    }
                }

                // 计算函数值
                var (xValues, yValues) = CalculateFunction(expressionText);

                // 获取颜色
                var plotColor = PlotColors[_colorIndex % PlotColors.Length];
                var colorBrush = ColorBrushes[_colorIndex % ColorBrushes.Length];
                _colorIndex++;

                // 添加曲线
                var scatter = PlotControl.Plot.Add.Scatter(xValues, yValues);
                scatter.LineWidth = 2;
                scatter.Color = plotColor;

                // 添加到列表
                var displayName = GenerateDisplayName(expressionText);
                _plottedFunctions.Add(new PlottedFunction
                {
                    DisplayName = displayName,
                    Expression = expressionText,
                    ColorBrush = colorBrush,
                    PlotColor = plotColor
                });

                // 刷新图表
                PlotControl.Refresh();

                UpdateFunctionsListDisplay();
                StatusText.Text = $"已添加: {displayName} | 当前共 {_plottedFunctions.Count} 条曲线";
            }
            catch (Exception ex)
            {
                MessageBox.Show($"表达式错误: {ex.Message}", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
                StatusText.Text = "表达式解析失败";
            }
        }

        /// <summary>
        /// 生成显示名称
        /// </summary>
        private string GenerateDisplayName(string expression)
        {
            // 简化显示
            string display = expression
                .Replace(" * ", "")
                .Replace(" ", "")
                .Replace("Sin", "sin")
                .Replace("Cos", "cos")
                .Replace("Tan", "tan")
                .Replace("Exp", "e^")
                .Replace("Log10", "log₁₀")
                .Replace("Log", "ln")
                .Replace("Sqrt", "√")
                .Replace("Pow", "");

            if (display.Length > 20)
                display = display.Substring(0, 20) + "...";

            return $"y = {display}";
        }

        /// <summary>
        /// 重新绘制所有函数
        /// </summary>
        private void RedrawAllFunctions()
        {
            // 清除图表
            PlotControl.Plot.Clear();
            InitializePlot();

            // 重新绘制所有函数
            foreach (var func in _plottedFunctions)
            {
                try
                {
                    var (xValues, yValues) = CalculateFunction(func.Expression);
                    var scatter = PlotControl.Plot.Add.Scatter(xValues, yValues);
                    scatter.LineWidth = 2;
                    scatter.Color = func.PlotColor;
                }
                catch
                {
                    // 忽略错误
                }
            }

            PlotControl.Refresh();
        }

        /// <summary>
        /// 清除所有函数
        /// </summary>
        private void ClearAllFunctions()
        {
            _plottedFunctions.Clear();
            _colorIndex = 0;

            PlotControl.Plot.Clear();
            InitializePlot();
            PlotControl.Refresh();

            UpdateFunctionsListDisplay();
            StatusText.Text = "已清除所有函数";
        }

        /// <summary>
        /// 更新函数列表显示
        /// </summary>
        private void UpdateFunctionsListDisplay()
        {
            NoFunctionsText.Visibility = _plottedFunctions.Count == 0 
                ? Visibility.Visible 
                : Visibility.Collapsed;
        }

        /// <summary>
        /// 计算函数值
        /// </summary>
        private (double[] xValues, double[] yValues) CalculateFunction(string expressionText)
        {
            var xList = new System.Collections.Generic.List<double>();
            var yList = new System.Collections.Generic.List<double>();

            double step = (XMax - XMin) / Points;

            for (int i = 0; i <= Points; i++)
            {
                double x = XMin + i * step;

                try
                {
                    // 创建表达式
                    var expression = new NCalc.Expression(expressionText);
                    expression.Parameters["x"] = x;

                    // 添加常用数学函数
                    expression.EvaluateFunction += (name, args) =>
                    {
                        if (args.Parameters.Length == 1 && args.Parameters[0].Evaluate() is double arg)
                        {
                            args.Result = name.ToLower() switch
                            {
                                "sin" => Math.Sin(arg),
                                "cos" => Math.Cos(arg),
                                "tan" => Math.Tan(arg),
                                "asin" => Math.Asin(arg),
                                "acos" => Math.Acos(arg),
                                "atan" => Math.Atan(arg),
                                "sqrt" => Math.Sqrt(arg),
                                "log" => Math.Log(arg),
                                "log10" => Math.Log10(arg),
                                "exp" => Math.Exp(arg),
                                "abs" => Math.Abs(arg),
                                "ceil" => Math.Ceiling(arg),
                                "floor" => Math.Floor(arg),
                                "round" => Math.Round(arg),
                                _ => args.Result
                            };
                        }
                        else if (args.Parameters.Length == 2 &&
                                 args.Parameters[0].Evaluate() is double a &&
                                 args.Parameters[1].Evaluate() is double b)
                        {
                            args.Result = name.ToLower() switch
                            {
                                "pow" => Math.Pow(a, b),
                                "min" => Math.Min(a, b),
                                "max" => Math.Max(a, b),
                                _ => args.Result
                            };
                        }
                    };

                    // 添加常量
                    expression.Parameters["pi"] = Math.PI;
                    expression.Parameters["e"] = Math.E;

                    // 计算结果
                    var result = expression.Evaluate();

                    if (result is double y && !double.IsNaN(y) && !double.IsInfinity(y))
                    {
                        xList.Add(x);
                        yList.Add(y);
                    }
                }
                catch
                {
                    // 某些点可能无法计算（如 log(0)），跳过
                }
            }

            if (xList.Count == 0)
            {
                throw new Exception("无法计算任何有效点，请检查表达式");
            }

            return (xList.ToArray(), yList.ToArray());
        }
    }
}