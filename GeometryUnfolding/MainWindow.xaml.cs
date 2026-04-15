using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Media3D;
using HelixToolkit.Wpf;

namespace GeometryUnfolding;

public partial class MainWindow : Window
{
    private ModelVisual3D _modelVisual = new();
    private List<AnimatedFace> _faces = new();
    private bool _isUnfolded = false;
    private bool _isAnimating = false;
    
    // 拖拽相关
    private bool _isDragging = false;
    private AnimatedFace? _draggedFace = null;
    private double _dragStartAngle = 0;
    private Point _dragStartPoint;

    public MainWindow()
    {
        InitializeComponent();
        ShapeComboBox.SelectionChanged += (s, e) => CreateShape();
        Loaded += (s, e) => CreateShape();
        
        // 添加鼠标事件
        Viewport3D.MouseDown += Viewport3D_MouseDown;
        Viewport3D.MouseMove += Viewport3D_MouseMove;
        Viewport3D.MouseUp += Viewport3D_MouseUp;
    }

    private void Viewport3D_MouseDown(object sender, MouseButtonEventArgs e)
    {
        if (_isAnimating || e.LeftButton != MouseButtonState.Pressed) return;
        
        var hitTestResult = VisualTreeHelper.HitTest(Viewport3D, e.GetPosition(Viewport3D)) as RayMeshGeometry3DHitTestResult;
        
        if (hitTestResult != null)
        {
            // 找到被点击的面
            foreach (var face in _faces)
            {
                if (!face.ShouldAnimate) continue;
                
                if (face.Model.Geometry == hitTestResult.MeshHit)
                {
                    _isDragging = true;
                    _draggedFace = face;
                    _dragStartAngle = face.CurrentAngle;
                    _dragStartPoint = e.GetPosition(Viewport3D);
                    Viewport3D.CaptureMouse();
                    UpdateStatus($"拖拽中: {face.Name}");
                    e.Handled = true;
                    break;
                }
            }
        }
    }

    private void Viewport3D_MouseMove(object sender, MouseEventArgs e)
    {
        if (!_isDragging || _draggedFace == null) return;
        
        var currentPoint = e.GetPosition(Viewport3D);
        var deltaX = currentPoint.X - _dragStartPoint.X;
        
        // 根据水平拖拽距离计算角度变化
        var angleDelta = deltaX * 0.5; // 调整灵敏度
        
        var newAngle = Math.Max(0, Math.Min(_draggedFace.TargetAngle, _dragStartAngle + angleDelta));
        _draggedFace.CurrentAngle = newAngle;
        _draggedFace.Rotation.Angle = newAngle;
        
        UpdateStatus($"{_draggedFace.Name}: {newAngle:F1}°");
    }

    private void Viewport3D_MouseUp(object sender, MouseButtonEventArgs e)
    {
        if (_isDragging)
        {
            _isDragging = false;
            Viewport3D.ReleaseMouseCapture();
            
            if (_draggedFace != null)
            {
                // 检查是否接近目标角度
                if (Math.Abs(_draggedFace.CurrentAngle - _draggedFace.TargetAngle) < 5)
                {
                    // 吸附到目标角度
                    SnapToAngle(_draggedFace, _draggedFace.TargetAngle);
                }
                else if (_draggedFace.CurrentAngle < 10)
                {
                    // 吸附到0
                    SnapToAngle(_draggedFace, 0);
                }
            }
            
            _draggedFace = null;
            UpdateStatus("就绪");
        }
    }

    private void SnapToAngle(AnimatedFace face, double targetAngle)
    {
        var animation = new DoubleAnimation
        {
            From = face.CurrentAngle,
            To = targetAngle,
            Duration = TimeSpan.FromMilliseconds(200),
            EasingFunction = new QuadraticEase { EasingMode = EasingMode.EaseOut }
        };
        face.Rotation.BeginAnimation(AxisAngleRotation3D.AngleProperty, animation);
        face.CurrentAngle = targetAngle;
    }

    private void CreateShape()
    {
        Viewport3D.Children.Clear();
        Viewport3D.Children.Add(new SunLight());
        
        _faces.Clear();
        _isUnfolded = false;

        var selectedIndex = ShapeComboBox.SelectedIndex;
        GeometryShape shape = selectedIndex switch
        {
            0 => new CubeShape(),
            1 => new TetrahedronShape(),
            2 => new OctahedronShape(),
            3 => new DodecahedronShape(),
            4 => new IcosahedronShape(),
            _ => new CubeShape()
        };

        _faces = shape.CreateFaces();
        
        _modelVisual = new ModelVisual3D();
        var modelGroup = new Model3DGroup();
        
        foreach (var face in _faces)
        {
            modelGroup.Children.Add(face.Model);
        }
        
        _modelVisual.Content = modelGroup;
        Viewport3D.Children.Add(_modelVisual);
        
        Viewport3D.ZoomExtents();
        
        UpdateStatus($"已加载: {shape.Name} (可直接拖拽面)");
    }

    private void UnfoldButton_Click(object sender, RoutedEventArgs e)
    {
        if (_isAnimating) return;
        if (_isUnfolded)
        {
            UpdateStatus("已经展开啦！点击折叠恢复形状~");
            return;
        }
        AnimateUnfold();
    }

    private void FoldButton_Click(object sender, RoutedEventArgs e)
    {
        if (_isAnimating) return;
        if (!_isUnfolded)
        {
            UpdateStatus("已经是折叠状态啦！点击展开看效果~");
            return;
        }
        AnimateFold();
    }

    private void ResetViewButton_Click(object sender, RoutedEventArgs e)
    {
        Viewport3D.ZoomExtents();
        UpdateStatus("视角已重置");
    }

    private void AnimateUnfold()
    {
        _isAnimating = true;
        _isUnfolded = true;
        UpdateStatus("展开中...");

        var duration = TimeSpan.FromSeconds(1.5 / SpeedSlider.Value);
        int delay = 0;

        foreach (var face in _faces)
        {
            if (!face.ShouldAnimate) continue;

            var animation = new DoubleAnimation
            {
                From = face.CurrentAngle,
                To = face.TargetAngle,
                Duration = duration,
                BeginTime = TimeSpan.FromSeconds(delay * 0.15),
                EasingFunction = new CubicEase { EasingMode = EasingMode.EaseInOut }
            };

            var capturedFace = face;
            animation.Completed += (s, e) => 
            {
                capturedFace.CurrentAngle = capturedFace.TargetAngle;
                CheckAnimationComplete(true);
            };
            face.Rotation.BeginAnimation(AxisAngleRotation3D.AngleProperty, animation);
            delay++;
        }

        if (delay == 0) _isAnimating = false;
    }

    private void AnimateFold()
    {
        _isAnimating = true;
        _isUnfolded = false;
        UpdateStatus("折叠中...");

        var duration = TimeSpan.FromSeconds(1.5 / SpeedSlider.Value);
        int delay = 0;

        for (int i = _faces.Count - 1; i >= 0; i--)
        {
            var face = _faces[i];
            if (!face.ShouldAnimate) continue;

            var animation = new DoubleAnimation
            {
                From = face.CurrentAngle,
                To = 0,
                Duration = duration,
                BeginTime = TimeSpan.FromSeconds(delay * 0.15),
                EasingFunction = new CubicEase { EasingMode = EasingMode.EaseInOut }
            };

            var capturedFace = face;
            animation.Completed += (s, e) => 
            {
                capturedFace.CurrentAngle = 0;
                CheckAnimationComplete(false);
            };
            face.Rotation.BeginAnimation(AxisAngleRotation3D.AngleProperty, animation);
            delay++;
        }

        if (delay == 0) _isAnimating = false;
    }

    private int _completedCount = 0;
    private void CheckAnimationComplete(bool isUnfolding)
    {
        _completedCount++;
        if (_completedCount >= _faces.Count(f => f.ShouldAnimate))
        {
            _isAnimating = false;
            _completedCount = 0;
            UpdateStatus(isUnfolding ? "展开完成！✨" : "折叠完成！✨");
        }
    }

    private void UpdateStatus(string message)
    {
        StatusText.Text = message;
    }
}

// 动画面
public class AnimatedFace
{
    public string Name { get; set; } = "";
    public GeometryModel3D Model { get; set; } = null!;
    public AxisAngleRotation3D Rotation { get; set; } = null!;
    public double TargetAngle { get; set; }
    public double CurrentAngle { get; set; }
    public bool ShouldAnimate { get; set; } = true;
}

// 基础形状接口
public abstract class GeometryShape
{
    public abstract string Name { get; }
    public abstract List<AnimatedFace> CreateFaces();
    
    protected static Material CreateMaterial(Color color)
    {
        return new DiffuseMaterial(new SolidColorBrush(color));
    }
    
    protected static MeshGeometry3D CreateQuad(Point3D p1, Point3D p2, Point3D p3, Point3D p4)
    {
        var mesh = new MeshGeometry3D();
        mesh.Positions.Add(p1);
        mesh.Positions.Add(p2);
        mesh.Positions.Add(p3);
        mesh.Positions.Add(p4);
        
        mesh.TriangleIndices.Add(0);
        mesh.TriangleIndices.Add(1);
        mesh.TriangleIndices.Add(2);
        mesh.TriangleIndices.Add(0);
        mesh.TriangleIndices.Add(2);
        mesh.TriangleIndices.Add(3);
        
        var normal = CalculateNormal(p1, p2, p3);
        for (int i = 0; i < 4; i++)
            mesh.Normals.Add(normal);
        
        return mesh;
    }
    
    protected static Vector3D CalculateNormal(Point3D p1, Point3D p2, Point3D p3)
    {
        var v1 = p2 - p1;
        var v2 = p3 - p1;
        var normal = Vector3D.CrossProduct(v1, v2);
        normal.Normalize();
        return normal;
    }
}

// 立方体展开
public class CubeShape : GeometryShape
{
    public override string Name => "立方体 (Cube)";
    
    public override List<AnimatedFace> CreateFaces()
    {
        var faces = new List<AnimatedFace>();
        double s = 1.0;
        
        var colors = new[] { Colors.Red, Colors.Orange, Colors.Yellow, Colors.Green, Colors.Blue, Colors.Purple };
        var names = new[] { "前面", "后面", "顶面", "底面", "右面", "左面" };
        
        // 底面（基准面）
        var bottomMesh = CreateQuad(
            new Point3D(-s/2, -s/2, -s/2),
            new Point3D(s/2, -s/2, -s/2),
            new Point3D(s/2, -s/2, s/2),
            new Point3D(-s/2, -s/2, s/2)
        );
        faces.Add(new AnimatedFace
        {
            Name = "底面",
            Model = new GeometryModel3D { Geometry = bottomMesh, Material = CreateMaterial(colors[3]) },
            ShouldAnimate = false
        });
        
        // 前面
        var frontMesh = CreateQuad(
            new Point3D(-s/2, -s/2, s/2),
            new Point3D(s/2, -s/2, s/2),
            new Point3D(s/2, s/2, s/2),
            new Point3D(-s/2, s/2, s/2)
        );
        var frontModel = new GeometryModel3D { Geometry = frontMesh, Material = CreateMaterial(colors[0]) };
        var frontRotation = new AxisAngleRotation3D(new Vector3D(1, 0, 0), 0);
        frontModel.Transform = new RotateTransform3D(frontRotation, new Point3D(0, -s/2, s/2));
        faces.Add(new AnimatedFace { Name = "前面", Model = frontModel, Rotation = frontRotation, TargetAngle = -90 });
        
        // 后面
        var backMesh = CreateQuad(
            new Point3D(s/2, -s/2, -s/2),
            new Point3D(-s/2, -s/2, -s/2),
            new Point3D(-s/2, s/2, -s/2),
            new Point3D(s/2, s/2, -s/2)
        );
        var backModel = new GeometryModel3D { Geometry = backMesh, Material = CreateMaterial(colors[1]) };
        var backRotation = new AxisAngleRotation3D(new Vector3D(1, 0, 0), 0);
        backModel.Transform = new RotateTransform3D(backRotation, new Point3D(0, -s/2, -s/2));
        faces.Add(new AnimatedFace { Name = "后面", Model = backModel, Rotation = backRotation, TargetAngle = 90 });
        
        // 左面
        var leftMesh = CreateQuad(
            new Point3D(-s/2, -s/2, -s/2),
            new Point3D(-s/2, -s/2, s/2),
            new Point3D(-s/2, s/2, s/2),
            new Point3D(-s/2, s/2, -s/2)
        );
        var leftModel = new GeometryModel3D { Geometry = leftMesh, Material = CreateMaterial(colors[5]) };
        var leftRotation = new AxisAngleRotation3D(new Vector3D(0, 0, 1), 0);
        leftModel.Transform = new RotateTransform3D(leftRotation, new Point3D(-s/2, -s/2, 0));
        faces.Add(new AnimatedFace { Name = "左面", Model = leftModel, Rotation = leftRotation, TargetAngle = 90 });
        
        // 右面
        var rightMesh = CreateQuad(
            new Point3D(s/2, -s/2, s/2),
            new Point3D(s/2, -s/2, -s/2),
            new Point3D(s/2, s/2, -s/2),
            new Point3D(s/2, s/2, s/2)
        );
        var rightModel = new GeometryModel3D { Geometry = rightMesh, Material = CreateMaterial(colors[4]) };
        var rightRotation = new AxisAngleRotation3D(new Vector3D(0, 0, 1), 0);
        rightModel.Transform = new RotateTransform3D(rightRotation, new Point3D(s/2, -s/2, 0));
        faces.Add(new AnimatedFace { Name = "右面", Model = rightModel, Rotation = rightRotation, TargetAngle = -90 });
        
        // 顶面
        var topMesh = CreateQuad(
            new Point3D(-s/2, s/2, s/2),
            new Point3D(s/2, s/2, s/2),
            new Point3D(s/2, s/2, -s/2),
            new Point3D(-s/2, s/2, -s/2)
        );
        var topModel = new GeometryModel3D { Geometry = topMesh, Material = CreateMaterial(colors[2]) };
        var topRotation = new AxisAngleRotation3D(new Vector3D(1, 0, 0), 0);
        topModel.Transform = new RotateTransform3D(topRotation, new Point3D(0, s/2, s/2));
        faces.Add(new AnimatedFace { Name = "顶面", Model = topModel, Rotation = topRotation, TargetAngle = -90 });
        
        return faces;
    }
}

// 正四面体展开
public class TetrahedronShape : GeometryShape
{
    public override string Name => "正四面体 (Tetrahedron)";
    
    public override List<AnimatedFace> CreateFaces()
    {
        var faces = new List<AnimatedFace>();
        double s = 1.5;
        var h = Math.Sqrt(2.0/3.0) * s;
        var colors = new[] { Colors.Cyan, Colors.Magenta, Colors.Lime, Colors.Gold };
        var names = new[] { "底面", "侧面1", "侧面2", "侧面3" };
        
        var p1 = new Point3D(0, -h/2, s/Math.Sqrt(3));
        var p2 = new Point3D(-s/2, -h/2, -s/(2*Math.Sqrt(3)));
        var p3 = new Point3D(s/2, -h/2, -s/(2*Math.Sqrt(3)));
        var apex = new Point3D(0, h/2, 0);
        
        // 底面
        var bottomMesh = new MeshGeometry3D();
        bottomMesh.Positions.Add(p1);
        bottomMesh.Positions.Add(p2);
        bottomMesh.Positions.Add(p3);
        bottomMesh.TriangleIndices.Add(0);
        bottomMesh.TriangleIndices.Add(1);
        bottomMesh.TriangleIndices.Add(2);
        var normal = CalculateNormal(p1, p2, p3);
        bottomMesh.Normals.Add(normal);
        bottomMesh.Normals.Add(normal);
        bottomMesh.Normals.Add(normal);
        
        faces.Add(new AnimatedFace
        {
            Name = "底面",
            Model = new GeometryModel3D { Geometry = bottomMesh, Material = CreateMaterial(colors[0]) },
            ShouldAnimate = false
        });
        
        // 三个侧面
        var sideData = new[] { (p1, p3, apex, "侧面1"), (p2, p1, apex, "侧面2"), (p3, p2, apex, "侧面3") };
        
        for (int i = 0; i < 3; i++)
        {
            var (a, b, c, name) = sideData[i];
            var mesh = new MeshGeometry3D();
            mesh.Positions.Add(a);
            mesh.Positions.Add(b);
            mesh.Positions.Add(c);
            mesh.TriangleIndices.Add(0);
            mesh.TriangleIndices.Add(1);
            mesh.TriangleIndices.Add(2);
            var n = CalculateNormal(a, b, c);
            mesh.Normals.Add(n);
            mesh.Normals.Add(n);
            mesh.Normals.Add(n);
            
            var model = new GeometryModel3D { Geometry = mesh, Material = CreateMaterial(colors[i + 1]) };
            var rotation = new AxisAngleRotation3D(new Vector3D(0, 0, 1), 0);
            model.Transform = new RotateTransform3D(rotation);
            faces.Add(new AnimatedFace { Name = name, Model = model, Rotation = rotation, TargetAngle = 180 });
        }
        
        return faces;
    }
}

// 正八面体展开
public class OctahedronShape : GeometryShape
{
    public override string Name => "正八面体 (Octahedron)";
    
    public override List<AnimatedFace> CreateFaces()
    {
        var faces = new List<AnimatedFace>();
        double s = 1.2;
        var colors = new[] { Colors.Coral, Colors.Turquoise, Colors.Violet, Colors.Khaki, Colors.SkyBlue, Colors.Pink, Colors.LightGreen, Colors.Plum };
        
        // 中心三角形
        var c1 = new Point3D(0, 0, s/Math.Sqrt(3));
        var c2 = new Point3D(-s/2, 0, -s/(2*Math.Sqrt(3)));
        var c3 = new Point3D(s/2, 0, -s/(2*Math.Sqrt(3)));
        
        var centerMesh = new MeshGeometry3D();
        centerMesh.Positions.Add(c1);
        centerMesh.Positions.Add(c2);
        centerMesh.Positions.Add(c3);
        centerMesh.TriangleIndices.Add(0);
        centerMesh.TriangleIndices.Add(1);
        centerMesh.TriangleIndices.Add(2);
        var normal = new Vector3D(0, -1, 0);
        centerMesh.Normals.Add(normal);
        centerMesh.Normals.Add(normal);
        centerMesh.Normals.Add(normal);
        
        faces.Add(new AnimatedFace
        {
            Name = "中心面",
            Model = new GeometryModel3D { Geometry = centerMesh, Material = CreateMaterial(colors[0]) },
            ShouldAnimate = false
        });
        
        // 周围三角形
        for (int i = 0; i < 6; i++)
        {
            var angle = i * 60 * Math.PI / 180;
            var mesh = new MeshGeometry3D();
            var p1 = new Point3D(0, 0, 0);
            var p2 = new Point3D(s/2 * Math.Cos(angle), 0, s/2 * Math.Sin(angle));
            var p3 = new Point3D(s/2 * Math.Cos(angle + Math.PI/3), 0, s/2 * Math.Sin(angle + Math.PI/3));
            
            mesh.Positions.Add(p1);
            mesh.Positions.Add(p2);
            mesh.Positions.Add(p3);
            mesh.TriangleIndices.Add(0);
            mesh.TriangleIndices.Add(1);
            mesh.TriangleIndices.Add(2);
            var n = new Vector3D(0, 1, 0);
            mesh.Normals.Add(n);
            mesh.Normals.Add(n);
            mesh.Normals.Add(n);
            
            var model = new GeometryModel3D { Geometry = mesh, Material = CreateMaterial(colors[i + 1]) };
            var rotation = new AxisAngleRotation3D(new Vector3D(1, 0, 0), 0);
            model.Transform = new RotateTransform3D(rotation);
            faces.Add(new AnimatedFace { Name = $"面{i+1}", Model = model, Rotation = rotation, TargetAngle = -90 });
        }
        
        return faces;
    }
}

// 正十二面体展开
public class DodecahedronShape : GeometryShape
{
    public override string Name => "正十二面体 (Dodecahedron)";
    
    public override List<AnimatedFace> CreateFaces()
    {
        var faces = new List<AnimatedFace>();
        var colors = new[] { Colors.Goldenrod, Colors.Teal, Colors.Crimson, Colors.SeaGreen, Colors.RoyalBlue, Colors.OrangeRed };
        
        // 中心五边形
        var centerMesh = CreatePentagonMesh(0.8);
        faces.Add(new AnimatedFace
        {
            Name = "中心面",
            Model = new GeometryModel3D { Geometry = centerMesh, Material = CreateMaterial(Colors.Gold) },
            ShouldAnimate = false
        });
        
        // 周围五边形
        for (int i = 0; i < 5; i++)
        {
            var angle = i * 72 * Math.PI / 180;
            var mesh = CreatePentagonMesh(0.8);
            var model = new GeometryModel3D { Geometry = mesh, Material = CreateMaterial(colors[i]) };
            var rotation = new AxisAngleRotation3D(new Vector3D(Math.Cos(angle), 0, Math.Sin(angle)), 0);
            model.Transform = new RotateTransform3D(rotation);
            faces.Add(new AnimatedFace { Name = $"面{i+1}", Model = model, Rotation = rotation, TargetAngle = -116.565 });
        }
        
        return faces;
    }
    
    private MeshGeometry3D CreatePentagonMesh(double radius)
    {
        var mesh = new MeshGeometry3D();
        var center = new Point3D(0, 0, 0);
        mesh.Positions.Add(center);
        
        for (int i = 0; i < 5; i++)
        {
            var angle = i * 72 * Math.PI / 180 - Math.PI / 2;
            mesh.Positions.Add(new Point3D(radius * Math.Cos(angle), 0, radius * Math.Sin(angle)));
        }
        
        for (int i = 0; i < 5; i++)
        {
            mesh.TriangleIndices.Add(0);
            mesh.TriangleIndices.Add(i + 1);
            mesh.TriangleIndices.Add((i + 1) % 5 + 1);
        }
        
        var normal = new Vector3D(0, 1, 0);
        for (int i = 0; i <= 5; i++)
            mesh.Normals.Add(normal);
        
        return mesh;
    }
}

// 正二十面体展开
public class IcosahedronShape : GeometryShape
{
    public override string Name => "正二十面体 (Icosahedron)";
    
    public override List<AnimatedFace> CreateFaces()
    {
        var faces = new List<AnimatedFace>();
        var colors = new[] { Colors.Red, Colors.Orange, Colors.Yellow, Colors.Green, Colors.Blue, Colors.Indigo, Colors.Violet, Colors.Pink, Colors.Cyan, Colors.Magenta, Colors.Lime, Colors.Teal };
        
        double s = 0.6;
        double h = s * Math.Sqrt(3) / 2;
        
        // 中心三角形
        var centerMesh = new MeshGeometry3D();
        centerMesh.Positions.Add(new Point3D(0, 0, h * 2/3));
        centerMesh.Positions.Add(new Point3D(-s/2, 0, -h/3));
        centerMesh.Positions.Add(new Point3D(s/2, 0, -h/3));
        centerMesh.TriangleIndices.Add(0);
        centerMesh.TriangleIndices.Add(1);
        centerMesh.TriangleIndices.Add(2);
        var normal = new Vector3D(0, 1, 0);
        centerMesh.Normals.Add(normal);
        centerMesh.Normals.Add(normal);
        centerMesh.Normals.Add(normal);
        
        faces.Add(new AnimatedFace
        {
            Name = "中心面",
            Model = new GeometryModel3D { Geometry = centerMesh, Material = CreateMaterial(colors[0]) },
            ShouldAnimate = false
        });
        
        // 周围三角形
        for (int i = 0; i < 6; i++)
        {
            var angle = i * 60 * Math.PI / 180;
            var r = s / Math.Sqrt(3);
            var ox = r * Math.Cos(angle);
            var oz = r * Math.Sin(angle);
            
            var mesh = new MeshGeometry3D();
            mesh.Positions.Add(new Point3D(ox, 0, oz));
            mesh.Positions.Add(new Point3D(ox + s/2 * Math.Cos(angle + 120 * Math.PI/180), 0, oz + s/2 * Math.Sin(angle + 120 * Math.PI/180)));
            mesh.Positions.Add(new Point3D(ox + s/2 * Math.Cos(angle + 240 * Math.PI/180), 0, oz + s/2 * Math.Sin(angle + 240 * Math.PI/180)));
            mesh.TriangleIndices.Add(0);
            mesh.TriangleIndices.Add(1);
            mesh.TriangleIndices.Add(2);
            mesh.Normals.Add(normal);
            mesh.Normals.Add(normal);
            mesh.Normals.Add(normal);
            
            var model = new GeometryModel3D { Geometry = mesh, Material = CreateMaterial(colors[i + 1]) };
            var rotation = new AxisAngleRotation3D(new Vector3D(Math.Cos(angle + Math.PI/2), 0, Math.Sin(angle + Math.PI/2)), 0);
            model.Transform = new RotateTransform3D(rotation);
            faces.Add(new AnimatedFace { Name = $"面{i+1}", Model = model, Rotation = rotation, TargetAngle = -138.19 });
        }
        
        return faces;
    }
}