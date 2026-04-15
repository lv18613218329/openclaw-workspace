using SkiaSharp;

namespace DiagramEditor.Core.Models;

/// <summary>
/// 连接器
/// </summary>
public class Connection
{
    public Connection()
    {
        Id = Guid.NewGuid();
        Style = ConnectionStyle.Straight;
    }
    
    public Guid Id { get; }
    
    /// <summary>
    /// 源锚点
    /// </summary>
    public AnchorPoint? Source { get; set; }
    
    /// <summary>
    /// 目标锚点
    /// </summary>
    public AnchorPoint? Target { get; set; }
    
    /// <summary>
    /// 连接样式
    /// </summary>
    public ConnectionStyle Style { get; set; }
    
    /// <summary>
    /// 线条颜色
    /// </summary>
    public SKColor Color { get; set; } = SKColors.Black;
    
    /// <summary>
    /// 线条宽度
    /// </summary>
    public float StrokeWidth { get; set; } = 2f;
    
    /// <summary>
    /// 计算连接路径
    /// </summary>
    public SKPath CalculatePath()
    {
        if (Source == null || Target == null)
            return new SKPath();
        
        var start = Source.Position;
        var end = Target.Position;
        
        return Style switch
        {
            ConnectionStyle.Straight => CreateStraightPath(start, end),
            ConnectionStyle.Orthogonal => CreateOrthogonalPath(start, end),
            ConnectionStyle.Curved => CreateCurvedPath(start, end),
            ConnectionStyle.Polyline => CreatePolylinePath(start, end),
            _ => CreateStraightPath(start, end)
        };
    }
    
    private static SKPath CreateStraightPath(SKPoint start, SKPoint end)
    {
        var path = new SKPath();
        path.MoveTo(start.X, start.Y);
        path.LineTo(end.X, end.Y);
        return path;
    }
    
    private static SKPath CreateOrthogonalPath(SKPoint start, SKPoint end)
    {
        var path = new SKPath();
        path.MoveTo(start.X, start.Y);
        
        // 水平-垂直-水平 路径
        var midX = (start.X + end.X) / 2;
        path.LineTo(midX, start.Y);
        path.LineTo(midX, end.Y);
        path.LineTo(end.X, end.Y);
        
        return path;
    }
    
    private static SKPath CreateCurvedPath(SKPoint start, SKPoint end)
    {
        var path = new SKPath();
        path.MoveTo(start.X, start.Y);
        
        // 贝塞尔曲线
        var dx = end.X - start.X;
        var controlOffset = Math.Abs(dx) * 0.5f;
        
        path.CubicTo(
            start.X + controlOffset, start.Y,
            end.X - controlOffset, end.Y,
            end.X, end.Y);
        
        return path;
    }
    
    private static SKPath CreatePolylinePath(SKPoint start, SKPoint end)
    {
        var path = new SKPath();
        path.MoveTo(start.X, start.Y);
        
        // Z字形折线
        var midY = (start.Y + end.Y) / 2;
        var quaterX = start.X + (end.X - start.X) / 4;
        var threeQuaterX = start.X + (end.X - start.X) * 3 / 4;
        
        path.LineTo(quaterX, midY);
        path.LineTo(threeQuaterX, midY);
        path.LineTo(end.X, end.Y);
        
        return path;
    }
    
    /// <summary>
    /// 渲染连接器
    /// </summary>
    public void Render(SKCanvas canvas)
    {
        using var path = CalculatePath();
        using var paint = new SKPaint
        {
            Color = Color,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = StrokeWidth,
            IsAntialias = true
        };
        
        canvas.DrawPath(path, paint);
        
        // 绘制箭头
        DrawArrow(canvas, paint);
    }
    
    private void DrawArrow(SKCanvas canvas, SKPaint paint)
    {
        if (Source == null || Target == null)
            return;
        
        var end = Target.Position;
        var start = Source.Position;
        
        // 计算箭头方向
        var dx = end.X - start.X;
        var dy = end.Y - start.Y;
        var length = (float)Math.Sqrt(dx * dx + dy * dy);
        
        if (length < 1) return;
        
        var unitX = dx / length;
        var unitY = dy / length;
        
        // 箭头大小
        var arrowSize = 10f;
        
        // 箭头顶点
        var tipX = end.X;
        var tipY = end.Y;
        
        // 箭头两翼
        var leftX = end.X - arrowSize * (unitX + unitY * 0.5f);
        var leftY = end.Y - arrowSize * (unitY - unitX * 0.5f);
        var rightX = end.X - arrowSize * (unitX - unitY * 0.5f);
        var rightY = end.Y - arrowSize * (unitY + unitX * 0.5f);
        
        using var arrowPath = new SKPath();
        arrowPath.MoveTo(tipX, tipY);
        arrowPath.LineTo(leftX, leftY);
        arrowPath.LineTo(rightX, rightY);
        arrowPath.Close();
        
        using var fillPaint = new SKPaint
        {
            Color = Color,
            Style = SKPaintStyle.Fill,
            IsAntialias = true
        };
        
        canvas.DrawPath(arrowPath, fillPaint);
    }
}

/// <summary>
/// 连接样式
/// </summary>
public enum ConnectionStyle
{
    /// <summary>
    /// 直线
    /// </summary>
    Straight,
    
    /// <summary>
    /// 正交线（折线）
    /// </summary>
    Orthogonal,
    
    /// <summary>
    /// 曲线
    /// </summary>
    Curved,
    
    /// <summary>
    /// 多段线
    /// </summary>
    Polyline
}