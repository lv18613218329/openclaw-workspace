using SkiaSharp;

namespace DiagramEditor.Core.Engines;

/// <summary>
/// 布尔运算引擎 - 图形分割核心
/// </summary>
public class BooleanEngine
{
    /// <summary>
    /// 执行布尔运算
    /// </summary>
    public List<SKPath> Execute(SKPath pathA, SKPath pathB, BooleanOperation operation)
    {
        var results = new List<SKPath>();
        
        switch (operation)
        {
            case BooleanOperation.Union:
                results.Add(ExecuteOp(pathA, pathB, SKPathOp.Union));
                break;
                
            case BooleanOperation.Intersection:
                results.Add(ExecuteOp(pathA, pathB, SKPathOp.Intersect));
                break;
                
            case BooleanOperation.Difference:
                results.Add(ExecuteOp(pathA, pathB, SKPathOp.Difference));
                break;
                
            case BooleanOperation.ReverseDifference:
                results.Add(ExecuteOp(pathB, pathA, SKPathOp.Difference));
                break;
                
            case BooleanOperation.Xor:
                var union = ExecuteOp(pathA, pathB, SKPathOp.Union);
                var intersection = ExecuteOp(pathA, pathB, SKPathOp.Intersect);
                var xorResult = new SKPath();
                xorResult.Op(union, SKPathOp.Difference);
                xorResult.Op(intersection, SKPathOp.Difference);
                results.Add(xorResult);
                break;
                
            case BooleanOperation.Split:
                results.AddRange(SplitPath(pathA, pathB));
                break;
        }
        
        return results;
    }
    
    private static SKPath ExecuteOp(SKPath pathA, SKPath pathB, SKPathOp op)
    {
        var result = new SKPath(pathA);
        result.Op(pathB, op);
        return result;
    }
    
    public List<SKPath> SplitPath(SKPath pathA, SKPath pathB)
    {
        var results = new List<SKPath>();
        
        var intersection = new SKPath(pathA);
        intersection.Op(pathB, SKPathOp.Intersect);
        if (!intersection.IsEmpty)
            results.Add(intersection);
        
        var onlyA = new SKPath(pathA);
        onlyA.Op(pathB, SKPathOp.Difference);
        if (!onlyA.IsEmpty)
            results.Add(onlyA);
        
        var onlyB = new SKPath(pathB);
        onlyB.Op(pathA, SKPathOp.Difference);
        if (!onlyB.IsEmpty)
            results.Add(onlyB);
        
        return results;
    }
    
    public List<SKPath> SplitByLine(SKPath sourcePath, SKPoint start, SKPoint end, float lineWidth = 2f)
    {
        var bounds = sourcePath.Bounds;
        var extendedLine = ExtendLineToBounds(start, end, bounds);
        var extendedLinePath = CreateLinePath(extendedLine.start, extendedLine.end, lineWidth);
        
        var results = new List<SKPath>();
        
        var side1 = new SKPath(sourcePath);
        side1.Op(extendedLinePath, SKPathOp.Difference);
        if (!side1.IsEmpty)
            results.Add(side1);
        
        var side2 = new SKPath(sourcePath);
        side2.Op(extendedLinePath, SKPathOp.Intersect);
        if (!side2.IsEmpty)
            results.Add(side2);
        
        return results;
    }
    
    private static SKPath CreateLinePath(SKPoint start, SKPoint end, float width)
    {
        var path = new SKPath();
        var dx = end.X - start.X;
        var dy = end.Y - start.Y;
        var length = (float)Math.Sqrt(dx * dx + dy * dy);
        
        if (length < 0.001f) return path;
        
        var perpX = -dy / length * width / 2;
        var perpY = dx / length * width / 2;
        
        path.MoveTo(start.X + perpX, start.Y + perpY);
        path.LineTo(start.X - perpX, start.Y - perpY);
        path.LineTo(end.X - perpX, end.Y - perpY);
        path.LineTo(end.X + perpX, end.Y + perpY);
        path.Close();
        
        return path;
    }
    
    private static (SKPoint start, SKPoint end) ExtendLineToBounds(SKPoint start, SKPoint end, SKRect bounds)
    {
        const float margin = 1000f;
        var dx = end.X - start.X;
        var dy = end.Y - start.Y;
        var length = (float)Math.Sqrt(dx * dx + dy * dy);
        
        if (length < 0.001f) return (start, end);
        
        var unitX = dx / length;
        var unitY = dy / length;
        
        return (
            new SKPoint(start.X - unitX * margin, start.Y - unitY * margin),
            new SKPoint(end.X + unitX * margin, end.Y + unitY * margin)
        );
    }
}

public enum BooleanOperation
{
    Union,
    Intersection,
    Difference,
    ReverseDifference,
    Xor,
    Split
}