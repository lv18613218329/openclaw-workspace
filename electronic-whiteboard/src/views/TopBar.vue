<template>
  <div class="topbar">
    <!-- 导出对话框 -->
    <div v-if="showExportDialog" class="dialog-overlay" @click.self="showExportDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <span class="dialog-title">导出</span>
          <button class="dialog-close" @click="showExportDialog = false">✕</button>
        </div>
        <div class="dialog-content">
          <div class="export-option">
            <label>导出格式：</label>
            <select v-model="exportFormat">
              <option value="png">PNG 图片</option>
            </select>
          </div>
          <div class="export-option">
            <label>分辨率：</label>
            <select v-model="exportResolution">
              <option :value="1">1x (标准)</option>
              <option :value="2">2x (高清)</option>
              <option :value="3">3x (超清)</option>
            </select>
          </div>
          <div class="export-option">
            <label>
              <input type="checkbox" v-model="exportCurrentPageOnly" />
              仅导出当前页
            </label>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="showExportDialog = false">取消</button>
          <button class="btn btn-primary" @click="handleExportConfirm">导出</button>
        </div>
      </div>
    </div>

    <!-- 另存为对话框 -->
    <div v-if="showSaveAsDialog" class="dialog-overlay" @click.self="showSaveAsDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <span class="dialog-title">另存为</span>
          <button class="dialog-close" @click="showSaveAsDialog = false">✕</button>
        </div>
        <div class="dialog-content">
          <div class="input-group">
            <label>文件名：</label>
            <input type="text" v-model="saveAsFileName" placeholder="请输入文件名" @keyup.enter="handleSaveAsConfirm" />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="showSaveAsDialog = false">取消</button>
          <button class="btn btn-primary" @click="handleSaveAsConfirm">保存</button>
        </div>
      </div>
    </div>

    <!-- 新建项目确认对话框 -->
    <div v-if="showNewProjectDialog" class="dialog-overlay" @click.self="cancelNewProject">
      <div class="dialog">
        <div class="dialog-header">
          <span class="dialog-title">新建项目</span>
          <button class="dialog-close" @click="cancelNewProject">✕</button>
        </div>
        <div class="dialog-content">
          <p>是否保存当前项目？</p>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="confirmNewProject(false)">不保存</button>
          <button class="btn btn-secondary" @click="cancelNewProject">取消</button>
          <button class="btn btn-primary" @click="confirmNewProject(true)">保存</button>
        </div>
      </div>
    </div>

    <div class="topbar-left">
      <div class="logo" @click="handleNewProject">
        <span class="logo-icon">📋</span>
        <span class="logo-text">电子白板</span>
      </div>
      <div class="file-name" v-if="fileStore.state.fileName">
        <span class="file-name-text">{{ fileStore.state.fileName }}</span>
        <span v-if="fileStore.state.hasUnsavedChanges" class="unsaved-indicator">*</span>
      </div>
      <div class="divider"></div>
      <button class="tool-btn" title="新建 (Ctrl+N)" @click="handleNewProject">
        <span class="btn-icon">🆕</span>
        <span class="btn-text">新建</span>
      </button>
      <button class="tool-btn" title="打开 (Ctrl+O)" @click="handleOpenProject">
        <span class="btn-icon">📂</span>
        <span class="btn-text">打开</span>
      </button>
      <button class="tool-btn" title="保存 (Ctrl+S)" @click="handleSaveProject">
        <span class="btn-icon">💾</span>
        <span class="btn-text">保存</span>
      </button>
      <button class="tool-btn" title="另存为" @click="showSaveAsDialog = true">
        <span class="btn-icon">📋</span>
        <span class="btn-text">另存为</span>
      </button>
      <button class="tool-btn" title="导出 (Ctrl+E)" @click="showExportDialog = true">
        <span class="btn-icon">📤</span>
        <span class="btn-text">导出</span>
      </button>
    </div>

    <div class="topbar-center-left">
      <button 
        class="tool-btn" 
        :class="{ disabled: !historyStore.canUndo.value }"
        title="撤销 (Ctrl+Z)"
        @click="handleUndo"
      >
        <span class="btn-icon">↩️</span>
        <span class="btn-text">撤销</span>
      </button>
      <button 
        class="tool-btn" 
        :class="{ disabled: !historyStore.canRedo.value }"
        title="重做 (Ctrl+Y)"
        @click="handleRedo"
      >
        <span class="btn-icon">↪️</span>
        <span class="btn-text">重做</span>
      </button>
    </div>

    <div class="topbar-center">
      <button 
        class="tool-btn" 
        :class="{ active: toolStore.state.currentTool === 'select' }"
        title="选择 (V)"
        @click="toolStore.setTool('select')"
      >
        <span class="btn-icon">👆</span>
      </button>
      <button 
        class="tool-btn" 
        :class="{ active: toolStore.state.currentTool === 'line' }"
        title="直线 (L)"
        @click="toolStore.setTool('line')"
      >
        <span class="btn-icon">📏</span>
      </button>
      <button 
        class="tool-btn" 
        :class="{ active: toolStore.state.currentTool === 'rect' }"
        title="矩形 (R)"
        @click="toolStore.setTool('rect')"
      >
        <span class="btn-icon">⬜</span>
      </button>
      <button 
        class="tool-btn" 
        :class="{ active: toolStore.state.currentTool === 'circle' }"
        title="椭圆 (E)"
        @click="toolStore.setTool('circle')"
      >
        <span class="btn-icon">⭕</span>
      </button>
      <button 
        class="tool-btn" 
        :class="{ active: toolStore.state.currentTool === 'triangle' }"
        title="三角形 (T)"
        @click="toolStore.setTool('triangle')"
      >
        <span class="btn-icon">🔺</span>
      </button>
      <button 
        class="tool-btn" 
        :class="{ active: toolStore.state.currentTool === 'arrow' }"
        title="箭头 (A)"
        @click="toolStore.setTool('arrow')"
      >
        <span class="btn-icon">➡️</span>
      </button>
      <button 
        class="tool-btn" 
        :class="{ active: toolStore.state.currentTool === 'polygon' }"
        title="多边形"
        @click="toolStore.setTool('polygon')"
      >
        <span class="btn-icon">⬡</span>
      </button>
      <button 
        class="tool-btn" 
        :class="{ active: toolStore.state.currentTool === 'pen' }"
        title="画笔 (B)"
        @click="toolStore.setTool('pen')"
      >
        <span class="btn-icon">✏️</span>
      </button>
      <button 
        class="tool-btn" 
        :class="{ active: toolStore.state.currentTool === 'eraser' }"
        title="橡皮擦 (X)"
        @click="toolStore.setTool('eraser')"
      >
        <span class="btn-icon">🧹</span>
      </button>
    </div>

    <div class="topbar-right">
      <!-- 主题切换 -->
      <div class="theme-switcher">
        <button 
          class="theme-btn" 
          :class="{ active: toolStore.state.theme === 'white' }"
          title="白板模式"
          @click="toolStore.setTheme('white')"
        >
          ☀️
        </button>
        <button 
          class="theme-btn" 
          :class="{ active: toolStore.state.theme === 'black' }"
          title="黑板模式"
          @click="toolStore.setTheme('black')"
        >
          🖤
        </button>
        <button 
          class="theme-btn" 
          :class="{ active: toolStore.state.theme === 'dark' }"
          title="深色模式"
          @click="toolStore.setTheme('dark')"
        >
          🌙
        </button>
      </div>
      <button class="tool-btn" title="自动保存开关" @click="toggleAutoSave">
        <span class="btn-icon">{{ fileStore.state.autoSaveEnabled ? '💚' : '🖤' }}</span>
        <span class="btn-text">自动保存</span>
      </button>
      <!-- 高级功能下拉菜单 -->
      <div class="advanced-dropdown" ref="advancedDropdown">
        <button 
          class="tool-btn" 
          :class="{ active: advancedStore.state.currentFeature !== 'none' }"
          title="高级功能"
          @click="toggleAdvancedMenu"
        >
          <span class="btn-icon">✨</span>
          <span class="btn-text">高级</span>
        </button>
        <div class="dropdown-menu" v-if="showAdvancedMenu">
          <div class="dropdown-item" @click="openAdvancedFeature('annotation')">
            <span class="item-icon">🖊️</span>
            <span class="item-text">屏幕标注</span>
            <span class="item-hint">全局自由绘制</span>
          </div>
          <div class="dropdown-item" @click="openAdvancedFeature('spotlight')">
            <span class="item-icon">🔦</span>
            <span class="item-text">聚光灯</span>
            <span class="item-hint">高亮局部区域</span>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item" @click="openAdvancedFeature('randomPicker')">
            <span class="item-icon">🎲</span>
            <span class="item-text">随机抽取</span>
            <span class="item-hint">随机选择学生</span>
          </div>
          <div class="dropdown-item" @click="openAdvancedFeature('timer')">
            <span class="item-icon">⏱️</span>
            <span class="item-text">计时器</span>
            <span class="item-hint">课堂倒计时</span>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item" @click="openAdvancedFeature('resource')">
            <span class="item-icon">📁</span>
            <span class="item-text">资源库</span>
            <span class="item-hint">图片与图形收藏</span>
          </div>
          <div class="dropdown-item" @click="openAdvancedFeature('handwriting')">
            <span class="item-icon">✍️</span>
            <span class="item-text">手写识别</span>
            <span class="item-hint">手写转文字</span>
          </div>
        </div>
      </div>
      <button class="tool-btn" title="设置" @click="showSettingsDialog = true">
        <span class="btn-icon">⚙️</span>
      </button>
    </div>
  </div>

  <!-- 设置对话框 -->
  <div v-if="showSettingsDialog" class="dialog-overlay" @click.self="showSettingsDialog = false">
    <div class="dialog settings-dialog">
      <div class="dialog-header">
        <span class="dialog-title">设置</span>
        <button class="dialog-close" @click="showSettingsDialog = false">✕</button>
      </div>
      <div class="dialog-content">
        <!-- 网格设置 -->
        <div class="settings-section">
          <h3 class="section-title">网格设置</h3>
          <div class="setting-item">
            <label class="checkbox-label">
              <input type="checkbox" v-model="gridEnabledLocal" @change="handleGridEnabledChange" />
              显示网格
            </label>
          </div>
          <div class="setting-item" v-if="gridEnabledLocal">
            <label>网格间距：</label>
            <select v-model="gridSpacingLocal" @change="handleGridSpacingChange">
              <option :value="10">10px</option>
              <option :value="20">20px</option>
              <option :value="50">50px</option>
            </select>
          </div>
        </div>

        <!-- 吸附设置 -->
        <div class="settings-section">
          <h3 class="section-title">吸附设置</h3>
          <div class="setting-item">
            <label class="checkbox-label">
              <input type="checkbox" v-model="snapEnabledLocal" @change="handleSnapEnabledChange" />
              启用吸附
            </label>
          </div>
          <div class="setting-item" v-if="snapEnabledLocal">
            <label>吸附容差：</label>
            <select v-model="snapToleranceLocal" @change="handleSnapToleranceChange">
              <option :value="5">5px</option>
              <option :value="10">10px</option>
              <option :value="15">15px</option>
            </select>
          </div>
        </div>

        <!-- 快捷键参考 -->
        <div class="settings-section">
          <h3 class="section-title">快捷键参考</h3>
          <div class="shortcuts-list">
            <div class="shortcut-item"><span class="shortcut-key">Ctrl+N</span> 新建项目</div>
            <div class="shortcut-item"><span class="shortcut-key">Ctrl+O</span> 打开文件</div>
            <div class="shortcut-item"><span class="shortcut-key">Ctrl+S</span> 保存项目</div>
            <div class="shortcut-item"><span class="shortcut-key">Ctrl+E</span> 导出PNG</div>
            <div class="shortcut-item"><span class="shortcut-key">Ctrl+Z</span> 撤销</div>
            <div class="shortcut-item"><span class="shortcut-key">Ctrl+Y</span> 重做</div>
            <div class="shortcut-item"><span class="shortcut-key">V</span> 选择工具</div>
            <div class="shortcut-item"><span class="shortcut-key">L</span> 直线工具</div>
            <div class="shortcut-item"><span class="shortcut-key">R</span> 矩形工具</div>
            <div class="shortcut-item"><span class="shortcut-key">E</span> 椭圆工具</div>
            <div class="shortcut-item"><span class="shortcut-key">T</span> 三角形工具</div>
            <div class="shortcut-item"><span class="shortcut-key">A</span> 箭头工具</div>
            <div class="shortcut-item"><span class="shortcut-key">B</span> 画笔工具</div>
            <div class="shortcut-item"><span class="shortcut-key">X</span> 橡皮擦工具</div>
            <div class="shortcut-item"><span class="shortcut-key">Delete</span> 删除选中</div>
            <div class="shortcut-item"><span class="shortcut-key">Ctrl+C</span> 复制</div>
            <div class="shortcut-item"><span class="shortcut-key">Ctrl+V</span> 粘贴</div>
            <div class="shortcut-item"><span class="shortcut-key">Ctrl+D</span> 复制并粘贴</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useToolStore } from '../store/toolStore'
import { useHistoryStore } from '../store/historyStore'
import { usePageStore } from '../store/pageStore'
import { useFileStore } from '../store/fileStore'
import { useAdvancedStore, type AdvancedFeature } from '../store/advancedStore'
import { 
  saveProjectToFile, 
  loadProjectFromFile, 
  exportCurrentPageToPNG,
  createFileInput,
  removeFileInput,
  autoSaveToLocalStorage,
  restoreFromLocalStorage,
  clearAutoSave
} from '../store/fileService'

const toolStore = useToolStore()
const historyStore = useHistoryStore()
const pageStore = usePageStore()
const fileStore = useFileStore()
const advancedStore = useAdvancedStore()

// 对话框状态
const showExportDialog = ref(false)
const showSaveAsDialog = ref(false)
const showNewProjectDialog = ref(false)
const showSettingsDialog = ref(false)

// 高级功能菜单状态
const showAdvancedMenu = ref(false)
const advancedDropdown = ref<HTMLElement | null>(null)

// 高级功能函数
const toggleAdvancedMenu = () => {
  showAdvancedMenu.value = !showAdvancedMenu.value
}

const openAdvancedFeature = (feature: AdvancedFeature) => {
  showAdvancedMenu.value = false
  
  switch (feature) {
    case 'annotation':
      advancedStore.toggleAnnotation()
      break
    case 'spotlight':
      advancedStore.toggleSpotlight()
      break
    case 'randomPicker':
    case 'timer':
    case 'resource':
    case 'handwriting':
      advancedStore.setFeature(feature)
      break
  }
}

// 点击外部关闭下拉菜单
const handleClickOutside = (e: MouseEvent) => {
  if (advancedDropdown.value && !advancedDropdown.value.contains(e.target as Node)) {
    showAdvancedMenu.value = false
  }
}

// 本地设置状态（用于对话框绑定）
const gridEnabledLocal = ref(toolStore.state.gridEnabled)
const gridSpacingLocal = ref(toolStore.state.gridSpacing)
const snapEnabledLocal = ref(toolStore.state.snapEnabled)
const snapToleranceLocal = ref(toolStore.state.snapTolerance)

// 设置变更处理函数
const handleGridEnabledChange = () => {
  toolStore.setGridEnabled(gridEnabledLocal.value)
}

const handleGridSpacingChange = () => {
  toolStore.setGridSpacing(gridSpacingLocal.value as 10 | 20 | 50)
}

const handleSnapEnabledChange = () => {
  toolStore.setSnapEnabled(snapEnabledLocal.value)
}

const handleSnapToleranceChange = () => {
  toolStore.setSnapTolerance(snapToleranceLocal.value as 5 | 10 | 15)
}

// 同步本地状态（当设置对话框打开时）
import { watch } from 'vue'
watch(showSettingsDialog, (newVal) => {
  if (newVal) {
    gridEnabledLocal.value = toolStore.state.gridEnabled
    gridSpacingLocal.value = toolStore.state.gridSpacing
    snapEnabledLocal.value = toolStore.state.snapEnabled
    snapToleranceLocal.value = toolStore.state.snapTolerance
  }
})

// 导出选项
const exportFormat = ref('png')
const exportResolution = ref(1)
const exportCurrentPageOnly = ref(true)

// 另存为
const saveAsFileName = ref('')

// 自动保存定时器
let autoSaveTimer: ReturnType<typeof setInterval> | null = null

// 撤销
const handleUndo = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:undo'))
}

// 重做
const handleRedo = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:redo'))
}

// 新建项目
const handleNewProject = () => {
  if (fileStore.state.hasUnsavedChanges) {
    showNewProjectDialog.value = true
  } else {
    doNewProject()
  }
}

// 确认新建项目
const confirmNewProject = async (save: boolean) => {
  showNewProjectDialog.value = false
  if (save) {
    await handleSaveProject()
  }
  doNewProject()
}

// 取消新建项目
const cancelNewProject = () => {
  showNewProjectDialog.value = false
}

// 执行新建项目
const doNewProject = () => {
  // 清空页面
  pageStore.state.pages = [[]]
  pageStore.state.currentPage = 0
  
  // 清空历史
  historyStore.clearHistory()
  
  // 重置文件状态
  fileStore.resetProject()
  
  // 清除自动保存
  clearAutoSave()
  
  // 通知 CanvasArea 刷新
  window.dispatchEvent(new CustomEvent('whiteboard:project-loaded'))
}

// 保存项目
const handleSaveProject = async () => {
  if (fileStore.isNewProject.value) {
    // 首次保存，显示另存为对话框
    saveAsFileName.value = fileStore.state.fileName
    showSaveAsDialog.value = true
  } else {
    // 直接保存
    await saveProjectToFile(fileStore.state.fileName)
    fileStore.markAsSaved()
  }
}

// 另存为确认
const handleSaveAsConfirm = async () => {
  if (!saveAsFileName.value.trim()) {
    alert('请输入文件名')
    return
  }
  
  await saveProjectToFile(saveAsFileName.value.trim())
  fileStore.markAsSaved(saveAsFileName.value.trim())
  fileStore.setFilePath(saveAsFileName.value.trim() + '.ewb')
  showSaveAsDialog.value = false
}

// 打开项目
const handleOpenProject = async () => {
  // 如果有未保存的更改，提示用户
  if (fileStore.state.hasUnsavedChanges) {
    const confirm = window.confirm('当前项目有未保存的更改，是否继续打开新文件？')
    if (!confirm) return
  }
  
  const input = createFileInput('.ewb')
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      try {
        await loadProjectFromFile(file)
        fileStore.setFilePath(file.name)
        fileStore.markAsSaved()
        historyStore.clearHistory()
      } catch (error) {
        alert('打开文件失败：' + (error as Error).message)
      }
    }
    removeFileInput(input)
  }
  
  input.click()
}

// 导出确认
const handleExportConfirm = async () => {
  if (exportCurrentPageOnly.value) {
    // 导出当前页
    await exportCurrentPageToPNG(exportResolution.value)
  } else {
    // 导出所有页（逐页导出为 PNG）
    const totalPages = pageStore.totalPages.value
    for (let i = 0; i < totalPages; i++) {
      pageStore.goToPage(i + 1)
      await new Promise(resolve => setTimeout(resolve, 100))
      await exportCurrentPageToPNG(exportResolution.value)
    }
  }
  showExportDialog.value = false
}

// 切换自动保存
const toggleAutoSave = () => {
  fileStore.setAutoSave(!fileStore.state.autoSaveEnabled)
}

// 设置自动保存
const setupAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
  
  if (fileStore.state.autoSaveEnabled) {
    autoSaveTimer = setInterval(() => {
      if (fileStore.state.hasUnsavedChanges) {
        autoSaveToLocalStorage()
      }
    }, 5 * 60 * 1000) // 5 分钟
  }
}

// 监听工具栏变化以标记修改
const setupModificationTracking = () => {
  window.addEventListener('whiteboard:shape-changed', () => {
    fileStore.markAsModified()
  })
  
  window.addEventListener('whiteboard:page-changed', () => {
    fileStore.markAsModified()
  })
}

// 监听键盘快捷键
const handleKeyDown = (e: KeyboardEvent) => {
  const ctrlKey = e.ctrlKey || e.metaKey
  
  // Ctrl+N: 新建
  if (ctrlKey && e.key.toLowerCase() === 'n') {
    e.preventDefault()
    handleNewProject()
  }
  
  // Ctrl+O: 打开
  if (ctrlKey && e.key.toLowerCase() === 'o') {
    e.preventDefault()
    handleOpenProject()
  }
  
  // Ctrl+S: 保存
  if (ctrlKey && e.key.toLowerCase() === 's') {
    e.preventDefault()
    handleSaveProject()
  }
  
  // Ctrl+E: 导出
  if (ctrlKey && e.key.toLowerCase() === 'e') {
    e.preventDefault()
    showExportDialog.value = true
  }
  
  // 撤销: Ctrl+Z
  if (ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault()
    handleUndo()
  }
  
  // 重做: Ctrl+Y 或 Ctrl+Shift+Z
  if (ctrlKey && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
    e.preventDefault()
    handleRedo()
  }
}

onMounted(() => {
  // 尝试恢复自动保存
  restoreFromLocalStorage()
  
  // 设置自动保存
  setupAutoSave()
  
  // 设置修改跟踪
  setupModificationTracking()
  
  // 监听键盘
  window.addEventListener('keydown', handleKeyDown)
  
  // 监听点击外部关闭高级功能菜单
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('click', handleClickOutside)
  
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
})
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  height: 48px;
  background-color: #F5F5F5;
  border-bottom: 1px solid #E0E0E0;
  padding: 0 12px;
  gap: 8px;
  user-select: none;
}

.topbar-left,
.topbar-center-left,
.topbar-center,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.topbar-left {
  flex: 1;
}

.topbar-center-left {
  flex: 0 0 auto;
}

.topbar-center {
  flex: 0 0 auto;
}

.topbar-right {
  flex: 1;
  justify-content: flex-end;
}

.logo {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  cursor: pointer;
}

.logo-icon {
  font-size: 20px;
}

.logo-text {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  font-size: 13px;
  color: #666;
}

.file-name-text {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unsaved-indicator {
  color: #FF5722;
  font-weight: bold;
  font-size: 16px;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: #E0E0E0;
  margin: 0 8px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;
  padding: 0 12px;
  border: none;
  background-color: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.tool-btn:hover {
  background-color: #E0E0E0;
}

.tool-btn:active {
  background-color: #D0D0D0;
}

.tool-btn.active {
  background-color: #E3F2FD;
}

.tool-btn.active:hover {
  background-color: #BBDEFB;
}

.tool-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
}

.btn-text {
  font-size: 13px;
  color: #333333;
}

.topbar-center .tool-btn {
  padding: 0 10px;
}

.topbar-right .tool-btn {
  padding: 0 10px;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 320px;
  max-width: 90%;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #E0E0E0;
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.dialog-close:hover {
  color: #333;
}

.dialog-content {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #E0E0E0;
}

/* 表单元素 */
.input-group {
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.input-group input[type="text"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #DDD;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.input-group input[type="text"]:focus {
  outline: none;
  border-color: #2196F3;
}

.export-option {
  margin-bottom: 16px;
}

.export-option label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.export-option select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #DDD;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.export-option input[type="checkbox"] {
  margin-right: 8px;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.btn-primary {
  background-color: #2196F3;
  color: white;
}

.btn-primary:hover {
  background-color: #1976D2;
}

.btn-secondary {
  background-color: #F5F5F5;
  color: #333;
}

.btn-secondary:hover {
  background-color: #E0E0E0;
}

/* 主题切换器 */
.theme-switcher {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.15s ease;
}

.theme-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.theme-btn.active {
  background-color: #2196F3;
}

/* 设置对话框 */
.settings-dialog {
  width: 480px;
  max-height: 80vh;
  overflow-y: auto;
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E0E0E0;
}

.setting-item {
  margin-bottom: 12px;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.setting-item select {
  padding: 6px 10px;
  border: 1px solid #DDD;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.checkbox-label {
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 快捷键列表 */
.shortcuts-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.shortcut-key {
  display: inline-block;
  min-width: 70px;
  padding: 2px 6px;
  background: #F5F5F5;
  border: 1px solid #DDD;
  border-radius: 3px;
  font-size: 12px;
  font-family: monospace;
  color: #333;
  text-align: center;
}

/* 高级功能下拉菜单 */
.advanced-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  z-index: 100;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.dropdown-item:hover {
  background: #F5F5F5;
}

.item-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.item-text {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.item-hint {
  font-size: 11px;
  color: #999;
}

.dropdown-divider {
  height: 1px;
  background: #E0E0E0;
  margin: 4px 0;
}
</style>