using SkiaSharp;

namespace DiagramEditor.Core.Symbols.Chemistry;

/// <summary>
/// 化学符号基类
/// </summary>
public abstract class ChemistrySymbolBase
{
    protected ChemistrySymbolBase(string name, string category)
    {
        Name = name;
        Category = category;
    }
    
    public string Name { get; }
    public string Category { get; }
    
    public abstract SKPath GetPath();
    public abstract SKPoint[] GetAnchors();
}

/// <summary>
/// 化学键类型
/// </summary>
public enum BondType
{
    Single,     // 单键
    Double,     // 双键
    Triple,     // 三键
    Wedge,      // 楔形键（立体向上）
    Dash        // 虚楔形键（立体向下）
}

/// <summary>
/// 化学键符号
/// </summary>
public class ChemicalBondSymbol : ChemistrySymbolBase
{
    private readonly SKPoint _start;
    private readonly SKPoint _end;
    private readonly BondType _bondType;
    private readonly float _bondSpacing;
    
    public ChemicalBondSymbol(SKPoint start, SKPoint end, BondType bondType = BondType.Single, float bondSpacing = 4f)
        : base(GetBondName(bondType), "化学键")
    {
        _start = start;
        _end = end;
        _bondType = bondType;
        _bondSpacing = bondSpacing;
    }
    
    private static string GetBondName(BondType type) => type switch
    {
        BondType.Single => "单键",
        BondType.Double => "双键",
        BondType.Triple => "三键",
        BondType.Wedge => "楔形键",
        BondType.Dash => "虚楔形键",
        _ => "化学键"
    };
    
    public override SKPath GetPath()
    {
        var path = new SKPath();
        
        var dx = _end.X - _start.X;
        var dy = _end.Y - _start.Y;
        var length = (float)Math.Sqrt(dx * dx + dy * dy);
        
        if (length < 1) return path;
        
        // 单位向量
        var unitX = dx / length;
        var unitY = dy / length;
        
        // 垂直方向
        var perpX = -unitY;
        var perpY = unitX;
        
        switch (_bondType)
        {
            case BondType.Single:
                path.MoveTo(_start.X, _start.Y);
                path.LineTo(_end.X, _end.Y);
                break;
                
            case BondType.Double:
                var offset = _bondSpacing;
                // 上线
                path.MoveTo(_start.X + perpX * offset, _start.Y + perpY * offset);
                path.LineTo(_end.X + perpX * offset, _end.Y + perpY * offset);
                // 下线
                path.MoveTo(_start.X - perpX * offset, _start.Y - perpY * offset);
                path.LineTo(_end.X - perpX * offset, _end.Y - perpY * offset);
                break;
                
            case BondType.Triple:
                var offset3 = _bondSpacing;
                // 中线
                path.MoveTo(_start.X, _start.Y);
                path.LineTo(_end.X, _end.Y);
                // 上线
                path.MoveTo(_start.X + perpX * offset3 * 2, _start.Y + perpY * offset3 * 2);
                path.LineTo(_end.X + perpX * offset3 * 2, _end.Y + perpY * offset3 * 2);
                // 下线
                path.MoveTo(_start.X - perpX * offset3 * 2, _start.Y - perpY * offset3 * 2);
                path.LineTo(_end.X - perpX * offset3 * 2, _end.Y - perpY * offset3 * 2);
                break;
                
            case BondType.Wedge:
                {
                    var wedgeWidth = 10f;
                    path.MoveTo(_start.X, _start.Y);
                    path.LineTo(_end.X + perpX * wedgeWidth / 2, _end.Y + perpY * wedgeWidth / 2);
                    path.LineTo(_end.X - perpX * wedgeWidth / 2, _end.Y - perpY * wedgeWidth / 2);
                    path.Close();
                }
                break;
                
            case BondType.Dash:
                {
                    // 虚线楔形
                    var wedgeWidth = 10f;
                    var dashCount = 5;
                    for (int i = 0; i <= dashCount; i++)
                    {
                        var t = (float)i / dashCount;
                        var px = _start.X + dx * t;
                        var py = _start.Y + dy * t;
                        var width = wedgeWidth * t / 2;
                        
                        path.MoveTo(px + perpX * width, py + perpY * width);
                        path.LineTo(px - perpX * width, py - perpY * width);
                    }
                }
                break;
        }
        
        return path;
    }
    
    public override SKPoint[] GetAnchors()
    {
        return new[] { _start, _end };
    }
}

/// <summary>
/// 苯环符号
/// </summary>
public class BenzeneRingSymbol : ChemistrySymbolBase
{
    private readonly SKPoint _center;
    private readonly float _radius;
    
    public BenzeneRingSymbol(SKPoint center, float radius = 40f)
        : base("苯环", "有机")
    {
        _center = center;
        _radius = radius;
    }
    
    public override SKPath GetPath()
    {
        var path = new SKPath();
        
        // 绘制六边形
        var vertices = new SKPoint[6];
        for (int i = 0; i < 6; i++)
        {
            var angle = (float)(Math.PI / 6 + i * Math.PI / 3); // 从30度开始
            vertices[i] = new SKPoint(
                _center.X + _radius * (float)Math.Cos(angle),
                _center.Y + _radius * (float)Math.Sin(angle));
        }
        
        // 外环
        path.MoveTo(vertices[0].X, vertices[0].Y);
        for (int i = 1; i < 6; i++)
        {
            path.LineTo(vertices[i].X, vertices[i].Y);
        }
        path.Close();
        
        // 内圆（表示共轭双键）
        var innerRadius = _radius * 0.6f;
        path.AddCircle(_center.X, _center.Y, innerRadius);
        
        return path;
    }
    
    public override SKPoint[] GetAnchors()
    {
        var anchors = new SKPoint[6];
        for (int i = 0; i < 6; i++)
        {
            var angle = (float)(Math.PI / 6 + i * Math.PI / 3);
            anchors[i] = new SKPoint(
                _center.X + _radius * (float)Math.Cos(angle),
                _center.Y + _radius * (float)Math.Sin(angle));
        }
        return anchors;
    }
}

/// <summary>
/// 原子符号（元素）
/// </summary>
public class AtomSymbol : ChemistrySymbolBase
{
    private readonly SKPoint _position;
    private readonly string _symbol;
    private readonly string _atomicNumber;
    private readonly float _fontSize;
    
    public AtomSymbol(SKPoint position, string symbol, string atomicNumber = "", float fontSize = 24f)
        : base(symbol, "元素")
    {
        _position = position;
        _symbol = symbol;
        _atomicNumber = atomicNumber;
        _fontSize = fontSize;
    }
    
    public string Symbol => _symbol;
    public string AtomicNumber => _atomicNumber;
    
    public override SKPath GetPath()
    {
        var path = new SKPath();
        // 原子符号主要是文本，这里返回空路径
        // 文本渲染需要在 Render 方法中处理
        return path;
    }
    
    public override SKPoint[] GetAnchors()
    {
        // 返回四个方向的连接点
        return new[]
        {
            new SKPoint(_position.X, _position.Y - 15),  // 上
            new SKPoint(_position.X + 15, _position.Y),  // 右
            new SKPoint(_position.X, _position.Y + 15),  // 下
            new SKPoint(_position.X - 15, _position.Y)   // 左
        };
    }
    
    /// <summary>
    /// 渲染原子符号
    /// </summary>
    public void Render(SKCanvas canvas, SKColor textColor)
    {
        using var paint = new SKPaint
        {
            Color = textColor,
            TextSize = _fontSize,
            IsAntialias = true,
            TextAlign = SKTextAlign.Center
        };
        
        // 绘制元素符号
        canvas.DrawText(_symbol, _position.X, _position.Y + _fontSize / 3, paint);
        
        // 绘制原子序数（下标）
        if (!string.IsNullOrEmpty(_atomicNumber))
        {
            using var subscriptPaint = new SKPaint
            {
                Color = textColor,
                TextSize = _fontSize * 0.6f,
                IsAntialias = true,
                TextAlign = SKTextAlign.Left
            };
            canvas.DrawText(_atomicNumber, _position.X + _fontSize / 2, _position.Y + _fontSize / 2, subscriptPaint);
        }
    }
}