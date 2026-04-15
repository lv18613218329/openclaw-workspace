using SkiaSharp;

namespace DiagramEditor.Core.Models;

/// <summary>
/// 图形基类
/// </summary>
public abstract class ShapeBase : IShape
{
    protected ShapeBase()
    {
        Id = Guid.NewGuid();
        Transform = new Transform();
        Anchors = new List<AnchorPoint>();
        Children = new List<IShape>();
        FillColor = SKColors.LightBlue;
        StrokeColor = SKColors.Black;
        StrokeWidth = 2f;
    }

    public Guid Id { get; }
    
    public abstract string Type { get; }
    
    public Transform Transform { get; set; }
    
    public SKColor FillColor { get; set; }
    
    public SKColor StrokeColor { get; set; }
    
    public float StrokeWidth { get; set; }
    
    public List<AnchorPoint> Anchors { get; protected set; }
    
    public IShape? Parent { get; set; }
    
    public List<IShape> Children { get; }
    
    public abstract SKRect Bounds { get; }
    
    public abstract SKPath GetPath();
    
    public virtual void Render(SKCanvas canvas)
    {
        canvas.Save();
        
        canvas.Translate(Transform.Position.X, Transform.Position.Y);
        canvas.RotateDegrees(Transform.Rotation, Transform.RotationCenter.X, Transform.RotationCenter.Y);
        canvas.Scale(Transform.Scale.Width, Transform.Scale.Height);
        
        using var path = GetPath();
        using var fillPaint = new SKPaint
        {
            Color = FillColor,
            Style = SKPaintStyle.Fill,
            IsAntialias = true
        };
        using var strokePaint = new SKPaint
        {
            Color = StrokeColor,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = StrokeWidth,
            IsAntialias = true
        };
        
        canvas.DrawPath(path, fillPaint);
        canvas.DrawPath(path, strokePaint);
        
        RenderAnchors(canvas);
        
        foreach (var child in Children)
        {
            child.Render(canvas);
        }
        
        canvas.Restore();
    }
    
    protected virtual void RenderAnchors(SKCanvas canvas)
    {
        using var paint = new SKPaint
        {
            Color = SKColors.Orange,
            Style = SKPaintStyle.Fill,
            IsAntialias = true
        };
        
        foreach (var anchor in Anchors)
        {
            canvas.DrawCircle(anchor.Position, 5f, paint);
        }
    }
    
    public virtual bool HitTest(SKPoint point)
    {
        using var path = GetPath();
        return path.Contains(point.X, point.Y);
    }
    
    public abstract IShape Clone();
}