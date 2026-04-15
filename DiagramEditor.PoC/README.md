# DiagramEditor.PoC - 技术验证项目

图形编辑器技术验证项目，验证 Avalonia + SkiaSharp 的核心功能。

## ✅ 技术方案确认

| 层级 | 技术选型 | 说明 |
|-----|---------|------|
| **语言** | C# 12 / .NET 8 | 跨平台统一语言 |
| **UI 框架** | Avalonia 11 | 跨平台 MVVM 框架 |
| **渲染引擎** | SkiaSharp 2.88 | Google Skia 的 .NET 绑定 |
| **图形分割** | SKPath.Op() | 原生布尔运算支持 |

## ✅ 已验证功能

### 1. 图形分割 (BooleanEngine)
```csharp
var booleanEngine = new BooleanEngine();
var results = booleanEngine.Execute(pathA, pathB, BooleanOperation.Split);
// 返回: 交集部分 + pathA独有部分 + pathB独有部分
```

### 2. 任意点旋转 (TransformEngine)
```csharp
var transformEngine = new TransformEngine();
transformEngine.RotateAroundCenter(shape, 45);  // 围绕中心旋转
transformEngine.RotateAroundAnchor(shape, "left", 90);  // 围绕锚点旋转
```

### 3. 吸附对齐 (SnapEngine)
- 边界吸附
- 中心对齐
- 锚点吸附

### 4. 连接器 (Connection)
- 直线连接
- 正交连接
- 曲线连接

### 5. 物理/化学符号库
- 物理符号：力矢量、电阻、电容、凸透镜
- 化学符号：化学键（单键/双键/三键）、苯环、原子符号

## 📁 项目结构

```
DiagramEditor.PoC/
├── DiagramEditor.sln
├── README.md
└── src/
    ├── DiagramEditor.Core/           # 核心引擎 ✅
    │   ├── Models/                   # 图形对象模型
    │   │   ├── IShape.cs
    │   │   ├── ShapeBase.cs
    │   │   ├── Transform.cs
    │   │   ├── AnchorPoint.cs
    │   │   ├── Connection.cs
    │   │   └── Shapes/
    │   │       ├── RectangleShape.cs
    │   │       ├── CircleShape.cs
    │   │       └── PolygonShape.cs
    │   ├── Engines/                  # 核心引擎
    │   │   ├── BooleanEngine.cs      # 布尔运算/分割 ✅
    │   │   ├── SnapEngine.cs         # 吸附
    │   │   ├── GuideEngine.cs        # 辅助线
    │   │   └── TransformEngine.cs    # 变换
    │   └── Symbols/
    │       ├── Physics/              # 物理符号库 ✅
    │       └── Chemistry/            # 化学符号库 ✅
    │
    └── DiagramEditor.Desktop/        # 桌面应用 ✅
        ├── Program.cs
        ├── App.axaml
        ├── ViewModels/
        │   └── MainViewModel.cs
        └── Views/
            ├── MainWindow.axaml
            └── Controls/
                └── DiagramCanvas.cs
```

## 🚀 构建与运行

### 构建
```bash
cd DiagramEditor.PoC
dotnet build
```

### 运行
```bash
cd src/DiagramEditor.Desktop
dotnet run
```

### 发布（跨平台）
```bash
# Windows
dotnet publish -c Release -r win-x64 --self-contained

# macOS
dotnet publish -c Release -r osx-x64 --self-contained

# Linux
dotnet publish -c Release -r linux-x64 --self-contained
```

## 核心代码示例

### 图形分割
```csharp
// 创建两个图形路径
var rect = new SKPath();
rect.AddRect(new SKRect(0, 0, 100, 100));

var circle = new SKPath();
circle.AddCircle(75, 75, 50);

// 执行分割
var booleanEngine = new BooleanEngine();
var results = booleanEngine.Execute(rect, circle, BooleanOperation.Split);
// results[0] = 交集部分
// results[1] = 矩形独有部分  
// results[2] = 圆形独有部分
```

### 任意点旋转
```csharp
var transformEngine = new TransformEngine();
var shape = new RectangleShape(100, 100, 150, 100);

// 围绕中心旋转 45 度
transformEngine.RotateAroundCenter(shape, 45);

// 围绕左上角锚点旋转 90 度
transformEngine.RotateAroundAnchor(shape, "left", 90);
```

## 下一步开发

- [ ] 完善鼠标交互（选择、拖动、缩放）
- [ ] 实现撤销重做系统
- [ ] 添加更多物理/化学符号
- [ ] 实现公式渲染（WebView + KaTeX）
- [ ] 添加导出功能（SVG/PNG/PDF）
- [ ] 移动端适配

## 许可证

MIT License