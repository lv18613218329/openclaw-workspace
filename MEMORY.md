# MEMORY.md - 长期记忆

## 项目索引

### 商旅溯源 (TravelExpenseAnalyzer)
- **位置**: `C:\Users\Administrator\.openclaw\workspace\TravelExpenseAnalyzer`
- **用途**: 差旅数据整合与异常检测工具
- **技术栈**: .NET 8.0 / C# 12 / EPPlus 7.x
- **功能**:
  1. 整合滴滴、美团、在途三个平台差旅数据
  2. 异常检测：时间重叠（红色）、地点冲突（红色）、多地行程（黄色）
  3. 生成核对报告
- **输出格式**: 14列（出差人、日期、交通工具、起点、终点、交通费、税额、补助、酒店、住宿费、发票类型、税额、填报日期、数据来源）
- **排序规则**: 一级按出差人、二级按日期
- **数据量**: 滴滴246条 + 美团490条 + 在途389条 = 1125条
- **文档**: `需求规格说明书.md`、`技术设计文档.md`、`对比分析报告.md`、`技术可行性验证报告.md`

### WpfMongoSync
- **位置**: `C:\Users\Administrator\.openclaw\workspace\WpfMongoSync`
- **用途**: MongoDB → 飞书多维表格 同步工具
- **技术栈**: .NET 8.0 WPF, MongoDB Driver, Newtonsoft.Json
- **关键字段映射**: 异常名称、时间、内容
- **配置存储**: `%APPDATA%\WpfMongoSync\`

### GeometryUnfolding
- **位置**: `C:\Users\Administrator\.openclaw\workspace\GeometryUnfolding`
- **用途**: 3D几何形状展开动画演示
- **技术栈**: .NET 8.0 WPF, HelixToolkit.Wpf
- **功能**: 5种几何体展开/折叠动画，支持拖拽控制

### 电子黑板 (graphic-whiteboard)
- **位置**: `C:\Users\Administrator\.openclaw\workspace\graphic-whiteboard`
- **用途**: 教学用电子白板/黑板工具
- **技术栈**: Electron 28 + Vue 3 + Vite 5 + TypeScript
- **运行端口**: http://localhost:5174
- **功能**:
  - 悬浮窗口主界面（1280x720，透明置顶）
  - 全屏黑板模式（黑板绿背景）
  - 绘图工具：画笔、荧光笔、板擦、图形
  - 左侧工具面板：基础图形、尺规、数学、物理、化学
  - 窗口控制：最小化、最大化、关闭
  - 自动保存：每30秒自动保存到 localStorage，支持7天恢复
  - 系统托盘：支持最小化到托盘、右键菜单
- **文档**: `开发进度文档.md`

## 文哥偏好
- 使用飞书与机器人沟通
- 重视电脑安全
- 运行在家里个人电脑上，Windows 系统
- 时区: Asia/Shanghai (GMT+8)
- 生活、工作在成都

## 开发环境
- .NET 8.0
- Windows 10/11
- PowerShell