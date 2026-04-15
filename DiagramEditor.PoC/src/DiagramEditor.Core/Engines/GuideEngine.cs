using SkiaSharp;
using DiagramEditor.Core.Models;

namespace DiagramEditor.Core.Engines;

/// <summary>
/// 辅助线引擎
/// </summary>
public class GuideEngine
{
    /// <summary>
    /// 辅助线颜色
    /// </summary>
    public SKColor GuideColor { get; set; } = SKColors.Red.WithAlpha(128);
    
    /// <summary>
    /// 辅助线样式
    /// </summary>
    public SKPathEffect? GuideDashPattern { get; set; } = SKPathEffect.CreateDash(new float[] { 5, 5 }, 0);
    
    /// <summary>
    /// 计算对齐辅助线
    /// </summary>
    /// <param name="target">目标图形</param>
    /// <param name="context">参考图形列表</param>
    /// <returns>辅助线列表</returns>
    public List<GuideLine> CalculateGuides(IShape target, IEnumerable<IShape> context)
    {
        var guides = new List<GuideLine>();
        var targetBounds = target.Bounds;
        var targetPos = target.Transform.Position;
        
        var targetLeft = targetPos.X + targetBounds.Left;
        var targetRight = targetPos.X + targetBounds.Right;
        var targetTop = targetPos.Y + targetBounds.Top;
        var targetBottom = targetPos.Y + targetBounds.Bottom;
        var targetCenterX = targetPos.X + targetBounds.MidX;
        var targetCenterY = targetPos.Y + targetBounds.MidY;
        
        foreach (var shape in context)
        {
            if (shape.Id == target.Id) continue;
            
            var bounds = shape.Bounds;
            var pos = shape.Transform.Position;
            
            var left = pos.X + bounds.Left;
            var right = pos.X + bounds.Right;
            var top = pos.Y + bounds.Top;
            var bottom = pos.Y + bounds.Bottom;
            var centerX = pos.X + bounds.MidX;
            var centerY = pos.Y + bounds.MidY;
            
            // 垂直辅助线（左边对齐）
            if (Math.Abs(targetLeft - left) < 1)
                guides.Add(new GuideLine(GuideType.Vertical, left));
            
            if (Math.Abs(targetLeft - right) < 1)
                guides.Add(new GuideLine(GuideType.Vertical, right));
            
            // 垂直辅助线（右边对齐）
            if (Math.Abs(targetRight - right) < 1)
                guides.Add(new GuideLine(GuideType.Vertical, right));
            
            if (Math.Abs(targetRight - left) < 1)
                guides.Add(new GuideLine(GuideType.Vertical, left));
            
            // 垂直辅助线（中心对齐）
            if (Math.Abs(targetCenterX - centerX) < 1)
                guides.Add(new GuideLine(GuideType.Vertical, centerX));
            
            // 水平辅助线（顶边对齐）
            if (Math.Abs(targetTop - top) < 1)
                guides.Add(new GuideLine(GuideType.Horizontal, top));
            
            if (Math.Abs(targetTop - bottom) < 1)
                guides.Add(new GuideLine(GuideType.Horizontal, bottom));
            
            // 水平辅助线（底边对齐）
            if (Math.Abs(targetBottom - bottom) < 1)
                guides.Add(new GuideLine(GuideType.Horizontal, bottom));
            
            if (Math.Abs(targetBottom - top) < 1)
                guides.Add(new GuideLine(GuideType.Horizontal, top));
            
            // 水平辅助线（中心对齐）
            if (Math.Abs(targetCenterY - centerY) < 1)
                guides.Add(new GuideLine(GuideType.Horizontal, centerY));
        }
        
        return guides;
    }
    
    /// <summary>
    /// 计算等距辅助线
    /// </summary>
    public List<GuideLine> CalculateSpacingGuides(IShape target, IEnumerable<IShape> context)
    {
        var guides = new List<GuideLine>();
        // TODO: 实现等距分布辅助线
        
        return guides;
    }
    
    /// <summary>
    /// 渲染辅助线
    /// </summary>
    public void RenderGuides(SKCanvas canvas, IEnumerable<GuideLine> guides, SKRect canvasBounds)
    {
        using var paint = new SKPaint
        {
            Color = GuideColor,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = 1f,
            PathEffect = GuideDashPattern,
            IsAntialias = true
        };
        
        foreach (var guide in guides)
        {
            using var path = new SKPath();
            
            if (guide.Type == GuideType.Horizontal)
            {
                path.MoveTo(canvasBounds.Left, guide.Position);
                path.LineTo(canvasBounds.Right, guide.Position);
            }
            else
            {
                path.MoveTo(guide.Position, canvasBounds.Top);
                path.LineTo(guide.Position, canvasBounds.Bottom);
            }
            
            canvas.DrawPath(path, paint);
        }
    }
}

/// <summary>
/// 辅助线
/// </summary>
public class GuideLine
{
    public GuideLine(GuideType type, float position)
    {
        Type = type;
        Position = position;
    }
    
    /// <summary>
    /// 辅助线类型
    /// </summary>
    public GuideType Type { get; }
    
    /// <summary>
    /// 线的位置
    /// </summary>
    public float Position { get; }
}

/// <summary>
/// 辅助线类型
/// </summary>
public enum GuideType
{
    Horizontal,
    Vertical,
    Spacing
}