using SkiaSharp;

namespace DiagramEditor.Core.Symbols.Physics;

/// <summary>
/// 物理符号基类
/// </summary>
public abstract class PhysicsSymbolBase
{
    protected PhysicsSymbolBase(string name, string category)
    {
        Name = name;
        Category = category;
    }
    
    public string Name { get; }
    public string Category { get; }
    
    /// <summary>
    /// 获取符号路径
    /// </summary>
    public abstract SKPath GetPath();
    
    /// <summary>
    /// 获取锚点
    /// </summary>
    public abstract SKPoint[] GetAnchors();
}

/// <summary>
/// 力矢量符号
/// </summary>
public class ForceArrowSymbol : PhysicsSymbolBase
{
    private readonly SKPoint _start;
    private readonly SKPoint _end;
    private readonly float _arrowSize;
    
    public ForceArrowSymbol(SKPoint start, SKPoint end, float arrowSize = 10f)
        : base("力矢量", "力学")
    {
        _start = start;
        _end = end;
        _arrowSize = arrowSize;
    }
    
    public override SKPath GetPath()
    {
        var path = new SKPath();
        
        // 箭头主体
        path.MoveTo(_start.X, _start.Y);
        path.LineTo(_end.X, _end.Y);
        
        // 箭头头部
        var dx = _end.X - _start.X;
        var dy = _end.Y - _start.Y;
        var length = (float)Math.Sqrt(dx * dx + dy * dy);
        
        if (length > 0)
        {
            var unitX = dx / length;
            var unitY = dy / length;
            
            var tipX = _end.X;
            var tipY = _end.Y;
            
            var leftX = tipX - _arrowSize * (unitX + unitY * 0.5f);
            var leftY = tipY - _arrowSize * (unitY - unitX * 0.5f);
            
            var rightX = tipX - _arrowSize * (unitX - unitY * 0.5f);
            var rightY = tipY - _arrowSize * (unitY + unitX * 0.5f);
            
            path.MoveTo(tipX, tipY);
            path.LineTo(leftX, leftY);
            path.MoveTo(tipX, tipY);
            path.LineTo(rightX, rightY);
        }
        
        return path;
    }
    
    public override SKPoint[] GetAnchors()
    {
        return new[] { _start, _end };
    }
}

/// <summary>
/// 电阻符号
/// </summary>
public class ResistorSymbol : PhysicsSymbolBase
{
    private readonly SKPoint _position;
    private readonly float _width;
    private readonly float _height;
    
    public ResistorSymbol(SKPoint position, float width = 60f, float height = 20f)
        : base("电阻", "电学")
    {
        _position = position;
        _width = width;
        _height = height;
    }
    
    public override SKPath GetPath()
    {
        var path = new SKPath();
        
        var x = _position.X;
        var y = _position.Y;
        
        // 锯齿形电阻符号
        path.MoveTo(x, y);
        
        var segmentWidth = _width / 6;
        var zigzagHeight = _height / 2;
        
        path.LineTo(x + segmentWidth, y);
        
        for (int i = 0; i < 4; i++)
        {
            var startX = x + segmentWidth + i * segmentWidth;
            if (i % 2 == 0)
            {
                path.LineTo(startX, y - zigzagHeight);
                path.LineTo(startX + segmentWidth, y - zigzagHeight);
            }
            else
            {
                path.LineTo(startX, y + zigzagHeight);
                path.LineTo(startX + segmentWidth, y + zigzagHeight);
            }
        }
        
        path.LineTo(x + _width, y);
        
        return path;
    }
    
    public override SKPoint[] GetAnchors()
    {
        return new[] 
        { 
            new SKPoint(_position.X, _position.Y),
            new SKPoint(_position.X + _width, _position.Y)
        };
    }
}

/// <summary>
/// 电容符号
/// </summary>
public class CapacitorSymbol : PhysicsSymbolBase
{
    private readonly SKPoint _position;
    private readonly float _width;
    private readonly float _height;
    private readonly float _gap;
    
    public CapacitorSymbol(SKPoint position, float width = 40f, float height = 30f, float gap = 8f)
        : base("电容", "电学")
    {
        _position = position;
        _width = width;
        _height = height;
        _gap = gap;
    }
    
    public override SKPath GetPath()
    {
        var path = new SKPath();
        
        var x = _position.X;
        var y = _position.Y;
        var centerX = x + _width / 2;
        
        // 左边引线
        path.MoveTo(x, y);
        path.LineTo(centerX - _gap / 2, y);
        
        // 左极板
        path.MoveTo(centerX - _gap / 2, y - _height / 2);
        path.LineTo(centerX - _gap / 2, y + _height / 2);
        
        // 右极板
        path.MoveTo(centerX + _gap / 2, y - _height / 2);
        path.LineTo(centerX + _gap / 2, y + _height / 2);
        
        // 右边引线
        path.MoveTo(centerX + _gap / 2, y);
        path.LineTo(x + _width, y);
        
        return path;
    }
    
    public override SKPoint[] GetAnchors()
    {
        return new[] 
        { 
            new SKPoint(_position.X, _position.Y),
            new SKPoint(_position.X + _width, _position.Y)
        };
    }
}

/// <summary>
/// 凸透镜符号
/// </summary>
public class ConvexLensSymbol : PhysicsSymbolBase
{
    private readonly SKPoint _center;
    private readonly float _height;
    private readonly float _thickness;
    
    public ConvexLensSymbol(SKPoint center, float height = 60f, float thickness = 15f)
        : base("凸透镜", "光学")
    {
        _center = center;
        _height = height;
        _thickness = thickness;
    }
    
    public override SKPath GetPath()
    {
        var path = new SKPath();
        
        // 双凸透镜形状
        var leftX = _center.X - _thickness / 2;
        var rightX = _center.X + _thickness / 2;
        var topY = _center.Y - _height / 2;
        var bottomY = _center.Y + _height / 2;
        
        // 左曲面
        path.MoveTo(leftX, topY);
        path.QuadTo(leftX - _thickness, _center.Y, leftX, bottomY);
        
        // 底部
        path.LineTo(rightX, bottomY);
        
        // 右曲面
        path.QuadTo(rightX + _thickness, _center.Y, rightX, topY);
        
        // 顶部
        path.LineTo(leftX, topY);
        
        return path;
    }
    
    public override SKPoint[] GetAnchors()
    {
        return new[] 
        { 
            new SKPoint(_center.X, _center.Y - _height / 2),  // 顶部
            new SKPoint(_center.X, _center.Y + _height / 2),  // 底部
            new SKPoint(_center.X - _thickness, _center.Y),   // 左焦点
            new SKPoint(_center.X + _thickness, _center.Y)    // 右焦点
        };
    }
}