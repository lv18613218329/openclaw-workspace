using SkiaSharp;

namespace DiagramEditor.Core.Models;

/// <summary>
/// 图形接口
/// </summary>
public interface IShape
{
    /// <summary>
    /// 唯一标识
    /// </summary>
    Guid Id { get; }
    
    /// <summary>
    /// 图形类型
    /// </summary>
    string Type { get; }
    
    /// <summary>
    /// 边界框（未应用变换）
    /// </summary>
    SKRect Bounds { get; }
    
    /// <summary>
    /// 变换信息
    /// </summary>
    Transform Transform { get; set; }
    
    /// <summary>
    /// 锚点列表（连接点）
    /// </summary>
    List<AnchorPoint> Anchors { get; }
    
    /// <summary>
    /// 父图形（用于分割后的子图形）
    /// </summary>
    IShape? Parent { get; set; }
    
    /// <summary>
    /// 子图形列表
    /// </summary>
    List<IShape> Children { get; }
    
    /// <summary>
    /// 渲染图形
    /// </summary>
    void Render(SKCanvas canvas);
    
    /// <summary>
    /// 点击测试
    /// </summary>
    bool HitTest(SKPoint point);
    
    /// <summary>
    /// 获取图形路径
    /// </summary>
    SKPath GetPath();
    
    /// <summary>
    /// 克隆图形
    /// </summary>
    IShape Clone();
}