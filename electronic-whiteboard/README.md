# 电子白板

基于 Electron、Vue 3、TypeScript 和 Konva.js 构建的专业图形设计与绘图应用。

## 技术栈

- **Electron 28+** - 桌面应用框架
- **Vue 3.4+** - 渐进式 JavaScript 框架
- **TypeScript 5.3+** - JavaScript 的类型超集
- **Vite 5.0+** - 下一代前端构建工具
- **Konva.js** - 2D Canvas 绘图库
- **polybooljs** - 多边形布尔运算库
- **vue-konva** - Konva.js 的 Vue 3 绑定

## 功能特性

- **无限画布** - 无边界绘图、素描和设计
- **专业绘图工具** - 矩形、圆形、三角形、多边形、自由绘制、文本等
- **图形布尔运算** - 并集、交集、差集、分割
- **多选编辑** - Shift+点击选择多个图形进行操作
- **历史记录** - 支持撤销/重做操作
- **页面管理** - 多页面切换与管理
- **文件操作** - 新建、打开、保存、导出
- **跨平台支持** - Windows、UOS统信、银河麒麟

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

1. 克隆仓库
2. 安装依赖：

   ```bash
   npm install
   ```

3. 开发模式运行：

   ```bash
   npm run dev
   ```

4. 生产构建：
   ```bash
   npm run build
   ```

## 项目结构

本项目采用 MVVM 架构模式，便于 WPF 开发者快速上手：

```
electronic-whiteboard/
├── main-process/             # Electron 主进程
│   ├── main.js              # 主进程入口
│   └── preload.js           # 预加载脚本
├── src/                     # 渲染进程（Vue 3）
│   ├── main.ts              # Vue 应用入口
│   ├── views/               # 视图层（View）- UI 组件
│   │   ├── App.vue          # 根组件
│   │   ├── TopBar.vue       # 顶部工具栏
│   │   ├── LeftPanel.vue    # 左侧工具面板
│   │   ├── RightPanel.vue   # 右侧属性面板
│   │   ├── CanvasArea.vue   # 画布区域
│   │   ├── BottomBar.vue    # 底部状态栏
│   │   ├── FormulaDialog.vue # 公式对话框
│   │   └── AdvancedPanel.vue # 高级功能面板
│   ├── viewModels/          # 视图模型层（ViewModel）- 状态管理
│   │   ├── toolStore.ts     # 工具状态管理
│   │   ├── historyStore.ts  # 历史记录管理
│   │   ├── pageStore.ts     # 页面状态管理
│   │   ├── fileStore.ts     # 文件状态管理
│   │   ├── fileService.ts   # 文件服务
│   │   └── advancedStore.ts # 高级功能状态管理
│   ├── utils/               # 工具函数
│   │   └── polygon.ts       # 多边形工具和布尔运算
│   ├── models/              # 数据模型层（Model）- 预留
│   ├── services/            # 服务层 - 预留
│   └── styles/              # 全局样式 - 预留
├── openspec/                # OpenSpec 规范文档
│   ├── structure.md         # 项目结构说明
│   └── changes/             # 变更记录
├── index.html               # HTML 模板
├── package.json             # 项目配置
└── vite.config.ts           # Vite 配置
```

### MVVM 架构说明

| 层级 | 目录 | 说明 | WPF 对应 |
|------|------|------|----------|
| View | `src/views/` | UI 界面组件 | XAML + CodeBehind |
| ViewModel | `src/viewModels/` | 状态管理与业务逻辑 | ViewModel 类 |
| Model | `src/models/` | 数据模型定义 | Model 类 |
| Service | `src/services/` | 服务与外部接口 | Service 层 |

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run electron:build` | 打包 Electron 应用 |

## 开发指南

### 新增视图组件

在 `src/views/` 目录下创建新的 Vue 组件：

```vue
<template>
  <div class="custom-component">
    <!-- 组件模板 -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<style scoped>
.custom-component {
  /* 组件样式 */
}
</style>
```

### 新增状态管理

在 `src/viewModels/` 目录下创建新的 Store：

```typescript
import { defineStore } from 'pinia'

export const useCustomStore = defineStore('custom', () => {
  const data = ref([])

  function addItem(item: any) {
    data.value.push(item)
  }

  return { data, addItem }
})
```

### 新增布尔运算

布尔运算功能位于 `src/utils/polygon.ts`，已支持以下操作：

- **并集（Union）**：合并两个图形
- **交集（Intersect）**：保留重叠部分
- **差集（Difference）**：从第一个图形减去重叠部分
- **分割（Clip）**：使用轮廓分割图形

## 许可证

MIT
