using SkiaSharp;

namespace DiagramEditor.Core.Models.Shapes;

/// <summary>
/// 圆形图形
/// </summary>
public class CircleShape : ShapeBase
{
    public CircleShape(float x, float y, float radius)
    {
        _radius = radius;
        Transform.Position = new SKPoint(x, y);
        Transform.RotationCenter = new SKPoint(radius, radius);
        
        // 添加默认锚点
        Anchors.Add(new AnchorPoint("top", new SKPoint(radius, 0), AnchorType.Edge));
        Anchors.Add(new AnchorPoint("right", new SKPoint(radius * 2, radius), AnchorType.Edge));
        Anchors.Add(new AnchorPoint("bottom", new SKPoint(radius, radius * 2), AnchorType.Edge));
        Anchors.Add(new AnchorPoint("left", new SKPoint(0, radius), AnchorType.Edge));
        Anchors.Add(new AnchorPoint("center", new SKPoint(radius, radius), AnchorType.Center));
    }
    
    private readonly float _radius;
    
    public override string Type => "Circle";
    
    public float Radius => _radius;
    
    public override SKRect Bounds => new SKRect(0, 0, _radius * 2, _radius * 2);
    
    public override SKPath GetPath()
    {
        var path = new SKPath();
        path.AddCircle(_radius, _radius, _radius);
        return path;
    }
    
    public override IShape Clone()
    {
        var clone = new CircleShape(
            Transform.Position.X,
            Transform.Position.Y,
            _radius)
        {
            FillColor = FillColor,
            StrokeColor = StrokeColor,
            StrokeWidth = StrokeWidth,
            Transform = Transform.Clone()
        };
        
        return clone;
    }
}