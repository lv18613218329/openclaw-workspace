using SkiaSharp;

namespace DiagramEditor.Core.Models.Shapes;

/// <summary>
/// 多边形图形
/// </summary>
public class PolygonShape : ShapeBase
{
    public PolygonShape(float x, float y, float radius, int sides)
    {
        _radius = radius;
        _sides = sides;
        Transform.Position = new SKPoint(x, y);
        Transform.RotationCenter = new SKPoint(radius, radius);
        
        UpdateAnchors();
    }
    
    private readonly float _radius;
    private readonly int _sides;
    
    public override string Type => "Polygon";
    
    public float Radius => _radius;
    
    public int Sides => _sides;
    
    public override SKRect Bounds => new SKRect(0, 0, _radius * 2, _radius * 2);
    
    public override SKPath GetPath()
    {
        var path = new SKPath();
        var center = new SKPoint(_radius, _radius);
        
        for (int i = 0; i < _sides; i++)
        {
            var angle = (float)(2 * Math.PI * i / _sides - Math.PI / 2);
            var px = center.X + _radius * (float)Math.Cos(angle);
            var py = center.Y + _radius * (float)Math.Sin(angle);
            
            if (i == 0)
                path.MoveTo(px, py);
            else
                path.LineTo(px, py);
        }
        
        path.Close();
        return path;
    }
    
    private void UpdateAnchors()
    {
        Anchors.Clear();
        
        var center = new SKPoint(_radius, _radius);
        Anchors.Add(new AnchorPoint("center", center, AnchorType.Center));
        
        for (int i = 0; i < _sides; i++)
        {
            var angle = (float)(2 * Math.PI * i / _sides - Math.PI / 2);
            var px = center.X + _radius * (float)Math.Cos(angle);
            var py = center.Y + _radius * (float)Math.Sin(angle);
            Anchors.Add(new AnchorPoint($"vertex_{i}", new SKPoint(px, py), AnchorType.Edge));
        }
    }
    
    public override IShape Clone()
    {
        var clone = new PolygonShape(
            Transform.Position.X,
            Transform.Position.Y,
            _radius,
            _sides)
        {
            FillColor = FillColor,
            StrokeColor = StrokeColor,
            StrokeWidth = StrokeWidth,
            Transform = Transform.Clone()
        };
        
        return clone;
    }
}