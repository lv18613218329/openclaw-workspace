using SkiaSharp;

namespace DiagramEditor.Core.Models;

/// <summary>
/// 变换信息
/// </summary>
public class Transform
{
    public Transform()
    {
        Position = new SKPoint(0, 0);
        Rotation = 0f;
        RotationCenter = new SKPoint(0, 0);
        Scale = new SKSize(1f, 1f);
    }
    
    /// <summary>
    /// 位置
    /// </summary>
    public SKPoint Position { get; set; }
    
    /// <summary>
    /// 旋转角度（度）
    /// </summary>
    public float Rotation { get; set; }
    
    /// <summary>
    /// 旋转中心点（相对于图形原点）
    /// </summary>
    public SKPoint RotationCenter { get; set; }
    
    /// <summary>
    /// 缩放比例
    /// </summary>
    public SKSize Scale { get; set; }
    
    /// <summary>
    /// 创建深拷贝
    /// </summary>
    public Transform Clone()
    {
        return new Transform
        {
            Position = new SKPoint(Position.X, Position.Y),
            Rotation = Rotation,
            RotationCenter = new SKPoint(RotationCenter.X, RotationCenter.Y),
            Scale = new SKSize(Scale.Width, Scale.Height)
        };
    }
}