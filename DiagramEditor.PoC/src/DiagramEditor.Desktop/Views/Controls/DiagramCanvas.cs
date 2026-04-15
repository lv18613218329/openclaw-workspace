using System;
using System.Collections.Generic;
using System.Linq;
using DiagramEditor.Core.Models;
using SkiaSharp;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Media;
using Avalonia.Media.Immutable;

namespace DiagramEditor.Desktop.Views.Controls;

/// <summary>
/// 图形画布控件
/// </summary>
public class DiagramCanvas : Control
{
    public static readonly StyledProperty<IEnumerable<IShape>?> ShapesProperty = 
        AvaloniaProperty.Register<DiagramCanvas, IEnumerable<IShape>?>(nameof(Shapes));
    
    public static readonly StyledProperty<IEnumerable<Connection>?> ConnectionsProperty = 
        AvaloniaProperty.Register<DiagramCanvas, IEnumerable<Connection>?>(nameof(Connections));
    
    public IEnumerable<IShape>? Shapes
    {
        get => GetValue(ShapesProperty);
        set => SetValue(ShapesProperty, value);
    }
    
    public IEnumerable<Connection>? Connections
    {
        get => GetValue(ConnectionsProperty);
        set => SetValue(ConnectionsProperty, value);
    }
    
    private static readonly IPen GridPen = new ImmutablePen(new ImmutableSolidColorBrush(Color.FromUInt32(0x30CCCCCC)), 0.5);
    
    public DiagramCanvas()
    {
        ClipToBounds = true;
    }
    
    public override void Render(DrawingContext context)
    {
        base.Render(context);
        
        context.FillRectangle(Brushes.White, new Rect(0, 0, Bounds.Width, Bounds.Height));
        DrawGrid(context);
        DrawShapes(context);
    }
    
    private void DrawGrid(DrawingContext context)
    {
        const double gridSize = 20;
        
        for (double x = 0; x < Bounds.Width; x += gridSize)
            context.DrawLine(GridPen, new Point(x, 0), new Point(x, Bounds.Height));
        
        for (double y = 0; y < Bounds.Height; y += gridSize)
            context.DrawLine(GridPen, new Point(0, y), new Point(Bounds.Width, y));
    }
    
    private void DrawShapes(DrawingContext context)
    {
        if (Shapes == null) return;
        
        foreach (var shape in Shapes)
        {
            if (shape is ShapeBase shapeBase)
            {
                var x = shape.Transform.Position.X;
                var y = shape.Transform.Position.Y;
                var width = shape.Bounds.Width;
                var height = shape.Bounds.Height;
                
                if (width > 0 && height > 0)
                {
                    var rect = new Rect(x, y, width, height);
                    var brush = new ImmutableSolidColorBrush(ToAvaloniaColor(shapeBase.FillColor));
                    var pen = new ImmutablePen(new ImmutableSolidColorBrush(ToAvaloniaColor(shapeBase.StrokeColor)), shapeBase.StrokeWidth);
                    
                    context.FillRectangle(brush, rect, 4);
                    context.DrawRectangle(pen, rect, 4);
                    
                    // 绘制锚点
                    foreach (var anchor in shape.Anchors)
                    {
                        var anchorPoint = new Point(x + anchor.Position.X, y + anchor.Position.Y);
                        context.FillRectangle(Brushes.Orange, new Rect(anchorPoint.X - 5, anchorPoint.Y - 5, 10, 10));
                    }
                }
            }
        }
        
        // 绘制状态信息矩形
        var infoRect = new Rect(10, 10, 400, 30);
        context.FillRectangle(new ImmutableSolidColorBrush(Color.FromArgb(200, 255, 255, 255)), infoRect);
        context.DrawRectangle(new ImmutablePen(Brushes.Gray), infoRect);
    }
    
    private static Color ToAvaloniaColor(SKColor skColor)
    {
        return Color.FromArgb(skColor.Alpha, skColor.Red, skColor.Green, skColor.Blue);
    }
    
    protected override void OnPropertyChanged(AvaloniaPropertyChangedEventArgs change)
    {
        base.OnPropertyChanged(change);
        
        if (change.Property == ShapesProperty || change.Property == ConnectionsProperty)
        {
            InvalidateVisual();
        }
    }
}