using System;
using System.Collections.ObjectModel;
using System.Linq;
using DiagramEditor.Core.Models;
using DiagramEditor.Core.Models.Shapes;
using DiagramEditor.Core.Engines;
using SkiaSharp;
using ReactiveUI;
using System.Reactive;

namespace DiagramEditor.Desktop.ViewModels;

public class MainViewModel : ReactiveObject
{
    private readonly BooleanEngine _booleanEngine = new();
    private readonly SnapEngine _snapEngine = new();
    private readonly GuideEngine _guideEngine = new();
    private readonly TransformEngine _transformEngine = new();
    
    public MainViewModel()
    {
        Shapes = new ObservableCollection<IShape>();
        Connections = new ObservableCollection<Connection>();
        
        AddRectangleCommand = ReactiveCommand.Create(AddRectangle);
        AddCircleCommand = ReactiveCommand.Create(AddCircle);
        AddPolygonCommand = ReactiveCommand.Create(AddPolygon);
        TestSplitCommand = ReactiveCommand.Create(TestSplit);
        TestRotationCommand = ReactiveCommand.Create(TestRotation);
        ClearCommand = ReactiveCommand.Create(Clear);
        
        AddTestShapes();
    }
    
    public ObservableCollection<IShape> Shapes { get; }
    public ObservableCollection<Connection> Connections { get; }
    
    public ReactiveCommand<Unit, Unit> AddRectangleCommand { get; }
    public ReactiveCommand<Unit, Unit> AddCircleCommand { get; }
    public ReactiveCommand<Unit, Unit> AddPolygonCommand { get; }
    public ReactiveCommand<Unit, Unit> TestSplitCommand { get; }
    public ReactiveCommand<Unit, Unit> TestRotationCommand { get; }
    public ReactiveCommand<Unit, Unit> ClearCommand { get; }
    
    private void AddTestShapes()
    {
        var rect = new RectangleShape(100, 100, 150, 100)
        {
            FillColor = SKColors.LightBlue
        };
        Shapes.Add(rect);
        
        var circle = new CircleShape(350, 150, 50)
        {
            FillColor = SKColors.LightGreen
        };
        Shapes.Add(circle);
        
        var hex = new PolygonShape(500, 150, 60, 6)
        {
            FillColor = SKColors.LightCoral
        };
        Shapes.Add(hex);
    }
    
    private void AddRectangle()
    {
        var random = new Random();
        var rect = new RectangleShape(
            random.Next(50, 400),
            random.Next(50, 300),
            random.Next(50, 150),
            random.Next(50, 100))
        {
            FillColor = new SKColor(
                (byte)random.Next(100, 255),
                (byte)random.Next(100, 255),
                (byte)random.Next(100, 255))
        };
        Shapes.Add(rect);
    }
    
    private void AddCircle()
    {
        var random = new Random();
        var circle = new CircleShape(
            random.Next(100, 500),
            random.Next(100, 400),
            random.Next(30, 80))
        {
            FillColor = new SKColor(
                (byte)random.Next(100, 255),
                (byte)random.Next(100, 255),
                (byte)random.Next(100, 255))
        };
        Shapes.Add(circle);
    }
    
    private void AddPolygon()
    {
        var random = new Random();
        var polygon = new PolygonShape(
            random.Next(100, 500),
            random.Next(100, 400),
            random.Next(40, 70),
            random.Next(3, 8))
        {
            FillColor = new SKColor(
                (byte)random.Next(100, 255),
                (byte)random.Next(100, 255),
                (byte)random.Next(100, 255))
        };
        Shapes.Add(polygon);
    }
    
    private void TestSplit()
    {
        if (Shapes.Count < 2) return;
        
        var shape1 = Shapes[0];
        var shape2 = Shapes[1];
        
        using var path1 = shape1.GetPath();
        using var path2 = shape2.GetPath();
        
        var splitResults = _booleanEngine.Execute(path1, path2, BooleanOperation.Split);
        
        if (splitResults.Count > 0)
        {
            System.Diagnostics.Debug.WriteLine($"分割完成，产生 {splitResults.Count} 个区域");
            
            var random = new Random();
            foreach (var _ in splitResults)
            {
                var marker = new CircleShape(
                    random.Next(100, 500),
                    random.Next(100, 400),
                    20)
                {
                    FillColor = SKColors.Orange
                };
                Shapes.Add(marker);
            }
        }
    }
    
    private void TestRotation()
    {
        if (Shapes.Count == 0) return;
        
        var shape = Shapes[0];
        _transformEngine.RotateAroundCenter(shape, 45);
        
        this.RaisePropertyChanged(nameof(Shapes));
    }
    
    private void Clear()
    {
        Shapes.Clear();
        Connections.Clear();
    }
}