# 电子白板项目结构（符合OpenSpec规范）

## 项目根目录
```
electronic-whiteboard/
├── main-process/            # Electron主进程代码（原electron目录）
│   ├── main.js             # 主进程入口文件
│   └── preload.js          # 预加载脚本
├── src/                    # 渲染进程代码
│   ├── main.ts             # Vue应用入口
│   ├── vite-env.d.ts       # Vite类型定义
│   ├── utils/              # 工具函数
│   │   └── polygon.ts      # 多边形工具和布尔运算
│   ├── viewModels/         # 视图模型（原store目录）
│   │   ├── advancedStore.ts # 高级功能状态管理
│   │   ├── fileService.ts  # 文件服务
│   │   ├── fileStore.ts    # 文件状态管理
│   │   ├── historyStore.ts # 历史记录状态管理
│   │   ├── pageStore.ts    # 页面状态管理
│   │   └── toolStore.ts    # 工具状态管理
│   ├── views/              # 视图组件（原components目录）
│   │   ├── App.vue         # 根组件
│   │   ├── TopBar.vue      # 顶部工具栏
│   │   ├── LeftPanel.vue   # 左侧工具面板
│   │   ├── RightPanel.vue  # 右侧属性面板
│   │   ├── CanvasArea.vue  # 画布区域
│   │   ├── BottomBar.vue   # 底部状态栏
│   │   ├── FormulaDialog.vue # 公式对话框
│   │   └── AdvancedPanel.vue # 高级功能面板
│   ├── models/             # 数据模型（预留）
│   ├── services/           # 服务层（预留）
│   └── styles/             # 全局样式（预留）
├── openspec/               # OpenSpec规范文档
│   ├── config.yaml         # OpenSpec配置
│   └── changes/            # 变更记录
│       └── add-shape-boolean-operations/ # 布尔运算功能变更
│           ├── .openspec.yaml
│           ├── design.md   # 设计文档
│           ├── proposal.md # 提案文档
│           ├── tasks.md    # 任务列表
│           └── specs/
│               └── shape-boolean-operations/
│                   └── spec.md # 功能规范
├── index.html              # HTML模板
├── package.json            # 项目配置
├── vite.config.ts          # Vite配置
└── README.md               # 项目说明
```

## 目录说明

### main-process/
Electron主进程代码，负责应用窗口管理、系统集成等底层功能。

### src/
渲染进程代码，基于Vue 3实现的前端界面和业务逻辑。

#### utils/
通用工具函数，包含多边形处理和布尔运算的核心逻辑。

#### viewModels/
视图模型层，使用Vue的响应式系统实现状态管理，对应WPF中的ViewModel概念。

#### views/
视图组件层，包含所有UI界面组件，对应WPF中的View概念。

#### models/ (预留)
数据模型层，用于定义应用的数据结构，对应WPF中的Model概念。

#### services/ (预留)
服务层，用于封装业务逻辑和外部接口调用。

#### styles/ (预留)
全局样式管理，用于统一应用的视觉风格。

### openspec/
符合OpenSpec规范的项目文档，包含变更提案、设计文档、功能规范和任务列表。

## 主要功能模块

1. **图形绘制与编辑**：支持多种图形类型（矩形、圆形、三角形等）的绘制和编辑
2. **布尔运算**：实现图形的并集、交集、差集、分割四种运算
3. **状态管理**：使用Vue的响应式系统管理应用状态
4. **历史记录**：支持撤销/重做操作
5. **跨平台支持**：基于Electron实现Windows、Linux等平台支持

## 使用说明

1. **开发环境启动**：`npm run dev`
2. **构建应用**：`npm run build`
3. **打包发布**：`npm run electron:build`

此项目结构遵循了WPF开发者熟悉的MVVM模式，同时保持了Electron应用的最佳实践，便于WPF转Electron的开发者快速上手和维护。