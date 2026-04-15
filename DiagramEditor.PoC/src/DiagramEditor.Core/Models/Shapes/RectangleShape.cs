using SkiaSharp;

namespace DiagramEditor.Core.Models.Shapes;

/// <summary>
/// 矩形图形
/// </summary>
public class RectangleShape : ShapeBase
{
    public RectangleShape(float x, float y, float width, float height)
    {
        _bounds = new SKRect(0, 0, width, height);
        Transform.Position = new SKPoint(x, y);
        Transform.RotationCenter = new SKPoint(width / 2, height / 2);
        
        // 添加默认锚点（四边中点 + 中心）
        Anchors.Add(new AnchorPoint("top", new SKPoint(width / 2, 0), AnchorType.Edge));
        Anchors.Add(new AnchorPoint("right", new SKPoint(width, height / 2), AnchorType.Edge));
        Anchors.Add(new AnchorPoint("bottom", new SKPoint(width / 2, height), AnchorType.Edge));
        Anchors.Add(new AnchorPoint("left", new SKPoint(0, height / 2), AnchorType.Edge));
        Anchors.Add(new AnchorPoint("center", new SKPoint(width / 2, height / 2), AnchorType.Center));
    }
    
    private readonly SKRect _bounds;
    
    public override string Type => "Rectangle";
    
    public override SKRect Bounds => _bounds;
    
    public float Width => _bounds.Width;
    
    public float Height => _bounds.Height;
    
    public override SKPath GetPath()
    {
        var path = new SKPath();
        path.AddRect(_bounds);
        return path;
    }
    
    public override IShape Clone()
    {
        var clone = new RectangleShape(
            Transform.Position.X,
            Transform.Position.Y,
            Width,
            Height)
        {
            FillColor = FillColor,
            StrokeColor = StrokeColor,
            StrokeWidth = StrokeWidth,
            Transform = Transform.Clone()
        };
        
        return clone;
    }
}