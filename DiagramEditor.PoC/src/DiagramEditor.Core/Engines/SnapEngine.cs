using SkiaSharp;
using DiagramEditor.Core.Models;

namespace DiagramEditor.Core.Engines;

/// <summary>
/// 吸附引擎
/// </summary>
public class SnapEngine
{
    /// <summary>
    /// 吸附阈值（像素）
    /// </summary>
    public float SnapThreshold { get; set; } = 5f;
    
    /// <summary>
    /// 是否启用吸附
    /// </summary>
    public bool IsEnabled { get; set; } = true;
    
    /// <summary>
    /// 吸附类型
    /// </summary>
    public SnapMode SnapMode { get; set; } = SnapMode.All;
    
    /// <summary>
    /// 计算吸附位置
    /// </summary>
    /// <param name="movingShape">正在移动的图形</param>
    /// <param name="otherShapes">其他图形列表</param>
    /// <param name="targetPosition">目标位置</param>
    /// <returns>吸附结果</returns>
    public SnapResult CalculateSnap(IShape movingShape, IEnumerable<IShape> otherShapes, SKPoint targetPosition)
    {
        var result = new SnapResult
        {
            Position = targetPosition,
            SnappedX = false,
            SnappedY = false
        };
        
        if (!IsEnabled)
            return result;
        
        var candidates = otherShapes.Where(s => s.Id != movingShape.Id).ToList();
        
        // 边界吸附
        if (SnapMode.HasFlag(SnapMode.Bounds))
        {
            CalculateBoundsSnap(movingShape, candidates, result);
        }
        
        // 中心对齐
        if (SnapMode.HasFlag(SnapMode.Center))
        {
            CalculateCenterSnap(movingShape, candidates, result);
        }
        
        // 锚点吸附
        if (SnapMode.HasFlag(SnapMode.Anchor))
        {
            CalculateAnchorSnap(movingShape, candidates, result);
        }
        
        return result;
    }
    
    /// <summary>
    /// 计算边界吸附
    /// </summary>
    private void CalculateBoundsSnap(IShape movingShape, List<IShape> otherShapes, SnapResult result)
    {
        var movingBounds = movingShape.Bounds;
        var movingRight = result.Position.X + movingBounds.Right;
        var movingBottom = result.Position.Y + movingBounds.Bottom;
        var movingCenterX = result.Position.X + movingBounds.MidX;
        var movingCenterY = result.Position.Y + movingBounds.MidY;
        
        foreach (var shape in otherShapes)
        {
            var bounds = shape.Bounds;
            var shapeX = shape.Transform.Position.X;
            var shapeY = shape.Transform.Position.Y;
            
            // 左边对齐
            if (TrySnap(result.Position.X, shapeX + bounds.Left, out var snapX))
            {
                result.Position = new SKPoint(snapX, result.Position.Y);
                result.SnappedX = true;
                result.SnapLines.Add(new SnapLine(SnapLineType.Vertical, shapeX + bounds.Left));
            }
            
            // 右边对齐
            if (TrySnap(movingRight, shapeX + bounds.Right, out var snapRight))
            {
                result.Position = new SKPoint(snapRight - movingBounds.Right, result.Position.Y);
                result.SnappedX = true;
                result.SnapLines.Add(new SnapLine(SnapLineType.Vertical, shapeX + bounds.Right));
            }
            
            // 顶边对齐
            if (TrySnap(result.Position.Y, shapeY + bounds.Top, out var snapY))
            {
                result.Position = new SKPoint(result.Position.X, snapY);
                result.SnappedY = true;
                result.SnapLines.Add(new SnapLine(SnapLineType.Horizontal, shapeY + bounds.Top));
            }
            
            // 底边对齐
            if (TrySnap(movingBottom, shapeY + bounds.Bottom, out var snapBottom))
            {
                result.Position = new SKPoint(result.Position.X, snapBottom - movingBounds.Bottom);
                result.SnappedY = true;
                result.SnapLines.Add(new SnapLine(SnapLineType.Horizontal, shapeY + bounds.Bottom));
            }
        }
    }
    
    /// <summary>
    /// 计算中心对齐吸附
    /// </summary>
    private void CalculateCenterSnap(IShape movingShape, List<IShape> otherShapes, SnapResult result)
    {
        var movingBounds = movingShape.Bounds;
        var movingCenterX = result.Position.X + movingBounds.MidX;
        var movingCenterY = result.Position.Y + movingBounds.MidY;
        
        foreach (var shape in otherShapes)
        {
            var bounds = shape.Bounds;
            var shapeCenterX = shape.Transform.Position.X + bounds.MidX;
            var shapeCenterY = shape.Transform.Position.Y + bounds.MidY;
            
            // 水平中心对齐
            if (TrySnap(movingCenterX, shapeCenterX, out var snapCenterX))
            {
                result.Position = new SKPoint(snapCenterX - movingBounds.MidX, result.Position.Y);
                result.SnappedX = true;
                result.SnapLines.Add(new SnapLine(SnapLineType.Vertical, shapeCenterX));
            }
            
            // 垂直中心对齐
            if (TrySnap(movingCenterY, shapeCenterY, out var snapCenterY))
            {
                result.Position = new SKPoint(result.Position.X, snapCenterY - movingBounds.MidY);
                result.SnappedY = true;
                result.SnapLines.Add(new SnapLine(SnapLineType.Horizontal, shapeCenterY));
            }
        }
    }
    
    /// <summary>
    /// 计算锚点吸附
    /// </summary>
    private void CalculateAnchorSnap(IShape movingShape, List<IShape> otherShapes, SnapResult result)
    {
        foreach (var movingAnchor in movingShape.Anchors)
        {
            var movingAnchorPos = new SKPoint(
                result.Position.X + movingAnchor.Position.X,
                result.Position.Y + movingAnchor.Position.Y);
            
            foreach (var shape in otherShapes)
            {
                foreach (var anchor in shape.Anchors)
                {
                    var anchorPos = new SKPoint(
                        shape.Transform.Position.X + anchor.Position.X,
                        shape.Transform.Position.Y + anchor.Position.Y);
                    
                    // 锚点吸附
                    var dx = Math.Abs(movingAnchorPos.X - anchorPos.X);
                    var dy = Math.Abs(movingAnchorPos.Y - anchorPos.Y);
                    
                    if (dx < SnapThreshold && dy < SnapThreshold)
                    {
                        result.Position = new SKPoint(
                            anchorPos.X - movingAnchor.Position.X,
                            anchorPos.Y - movingAnchor.Position.Y);
                        result.SnappedX = true;
                        result.SnappedY = true;
                        result.SnapLines.Add(new SnapLine(SnapLineType.Anchor, anchorPos));
                    }
                }
            }
        }
    }
    
    /// <summary>
    /// 尝试吸附
    /// </summary>
    private bool TrySnap(float value, float target, out float snappedValue)
    {
        var distance = Math.Abs(value - target);
        
        if (distance < SnapThreshold)
        {
            snappedValue = target;
            return true;
        }
        
        snappedValue = value;
        return false;
    }
}

/// <summary>
/// 吸附结果
/// </summary>
public class SnapResult
{
    /// <summary>
    /// 吸附后的位置
    /// </summary>
    public SKPoint Position { get; set; }
    
    /// <summary>
    /// 是否在 X 方向吸附
    /// </summary>
    public bool SnappedX { get; set; }
    
    /// <summary>
    /// 是否在 Y 方向吸附
    /// </summary>
    public bool SnappedY { get; set; }
    
    /// <summary>
    /// 吸附辅助线
    /// </summary>
    public List<SnapLine> SnapLines { get; set; } = new();
}

/// <summary>
/// 吸附辅助线
/// </summary>
public class SnapLine
{
    public SnapLine(SnapLineType type, float position)
    {
        Type = type;
        Position = position;
    }
    
    public SnapLine(SnapLineType type, SKPoint point)
    {
        Type = type;
        Point = point;
    }
    
    /// <summary>
    /// 辅助线类型
    /// </summary>
    public SnapLineType Type { get; }
    
    /// <summary>
    /// 线的位置（水平线的Y坐标或垂直线的X坐标）
    /// </summary>
    public float Position { get; }
    
    /// <summary>
    /// 锚点位置
    /// </summary>
    public SKPoint? Point { get; }
}

/// <summary>
/// 吸附辅助线类型
/// </summary>
public enum SnapLineType
{
    Horizontal,
    Vertical,
    Anchor
}

/// <summary>
/// 吸附模式
/// </summary>
[Flags]
public enum SnapMode
{
    None = 0,
    Bounds = 1,
    Center = 2,
    Anchor = 4,
    Grid = 8,
    All = Bounds | Center | Anchor | Grid
}