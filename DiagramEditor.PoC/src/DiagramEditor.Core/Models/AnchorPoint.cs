using SkiaSharp;

namespace DiagramEditor.Core.Models;

/// <summary>
/// 锚点（连接点）
/// </summary>
public class AnchorPoint
{
    public AnchorPoint(string id, SKPoint position, AnchorType type = AnchorType.Edge)
    {
        Id = id;
        Position = position;
        Type = type;
        Connections = new List<Connection>();
    }
    
    /// <summary>
    /// 锚点唯一标识
    /// </summary>
    public string Id { get; set; }
    
    /// <summary>
    /// 相对于图形的位置
    /// </summary>
    public SKPoint Position { get; set; }
    
    /// <summary>
    /// 锚点类型
    /// </summary>
    public AnchorType Type { get; set; }
    
    /// <summary>
    /// 连接到此锚点的连接器列表
    /// </summary>
    public List<Connection> Connections { get; set; }
    
    /// <summary>
    /// 所属图形
    /// </summary>
    public IShape? Owner { get; set; }
}

/// <summary>
/// 锚点类型
/// </summary>
public enum AnchorType
{
    /// <summary>
    /// 输入锚点
    /// </summary>
    Input,
    
    /// <summary>
    /// 输出锚点
    /// </summary>
    Output,
    
    /// <summary>
    /// 边缘锚点
    /// </summary>
    Edge,
    
    /// <summary>
    /// 中心锚点
    /// </summary>
    Center
}