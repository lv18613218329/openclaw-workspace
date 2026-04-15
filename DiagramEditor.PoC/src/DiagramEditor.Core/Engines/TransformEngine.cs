using SkiaSharp;
using DiagramEditor.Core.Models;

namespace DiagramEditor.Core.Engines;

/// <summary>
/// 变换引擎
/// </summary>
public class TransformEngine
{
    public void RotateAroundPoint(IShape shape, SKPoint rotationCenter, float angleDegrees)
    {
        shape.Transform.Rotation += angleDegrees;
        
        var shapeCenter = new SKPoint(
            shape.Transform.Position.X + shape.Bounds.MidX,
            shape.Transform.Position.Y + shape.Bounds.MidY);
        
        var newCenter = RotatePoint(shapeCenter, rotationCenter, angleDegrees);
        
        shape.Transform.Position = new SKPoint(
            newCenter.X - shape.Bounds.MidX,
            newCenter.Y - shape.Bounds.MidY);
    }
    
    public void RotateAroundCenter(IShape shape, float angleDegrees)
    {
        shape.Transform.Rotation += angleDegrees;
    }
    
    public void RotateAroundAnchor(IShape shape, string anchorId, float angleDegrees)
    {
        var anchor = shape.Anchors.FirstOrDefault(a => a.Id == anchorId);
        if (anchor == null) return;
        
        var anchorCanvasPos = new SKPoint(
            shape.Transform.Position.X + anchor.Position.X,
            shape.Transform.Position.Y + anchor.Position.Y);
        
        RotateAroundPoint(shape, anchorCanvasPos, angleDegrees);
    }
    
    public void Scale(IShape shape, float scaleX, float scaleY, SKPoint? scaleCenter = null)
    {
        if (scaleCenter.HasValue)
        {
            var center = scaleCenter.Value;
            var shapePos = shape.Transform.Position;
            
            var newX = center.X + (shapePos.X - center.X) * scaleX;
            var newY = center.Y + (shapePos.Y - center.Y) * scaleY;
            
            shape.Transform.Position = new SKPoint(newX, newY);
            shape.Transform.Scale = new SKSize(
                shape.Transform.Scale.Width * scaleX,
                shape.Transform.Scale.Height * scaleY);
        }
        else
        {
            shape.Transform.Scale = new SKSize(
                shape.Transform.Scale.Width * scaleX,
                shape.Transform.Scale.Height * scaleY);
        }
    }
    
    public void TransformMultiple(IEnumerable<IShape> shapes, Action<IShape> transformAction)
    {
        foreach (var shape in shapes)
        {
            transformAction(shape);
        }
    }
    
    private static SKPoint RotatePoint(SKPoint point, SKPoint center, float angleDegrees)
    {
        var angleRadians = angleDegrees * (float)Math.PI / 180f;
        var cos = (float)Math.Cos(angleRadians);
        var sin = (float)Math.Sin(angleRadians);
        
        var dx = point.X - center.X;
        var dy = point.Y - center.Y;
        
        return new SKPoint(
            center.X + dx * cos - dy * sin,
            center.Y + dx * sin + dy * cos);
    }
}