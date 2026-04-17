<template>
  <div class="bottom-bar">
    <!-- 页面导航 -->
    <div class="page-nav">
      <button 
        class="nav-btn" 
        @click="pageStore.prevPage()"
        :disabled="pageStore.state.currentPage === 0"
        title="上一页"
      >
        ◀
      </button>
      <div class="page-info" @click="showPageList = !showPageList">
        <span class="page-current">{{ pageStore.currentPageNumber }}</span>
        <span class="page-divider">/</span>
        <span class="page-total">{{ pageStore.totalPages }}</span>
        <span class="dropdown-icon">▼</span>
      </div>
      <button 
        class="nav-btn" 
        @click="pageStore.nextPage()"
        :disabled="pageStore.state.currentPage >= pageStore.totalPages - 1"
        title="下一页"
      >
        ▶
      </button>
    </div>

    <!-- 页面列表弹窗 -->
    <div v-if="showPageList" class="page-list-popup" @click.stop>
      <div class="page-list-header">
        <span>页面列表</span>
        <button class="close-btn" @click="showPageList = false">×</button>
      </div>
      <div class="page-list">
        <div 
          v-for="(page, index) in pageStore.state.pages" 
          :key="index"
          class="page-item"
          :class="{ active: index === pageStore.state.currentPage }"
          @click="goToPage(index + 1)"
        >
          <span class="page-thumbnail">{{ index + 1 }}</span>
          <span class="page-label">第 {{ index + 1 }} 页</span>
          <button 
            v-if="pageStore.totalPages > 1"
            class="delete-page-btn" 
            @click.stop="handleDeletePage(index)"
            title="删除页面"
          >
            ×
          </button>
        </div>
      </div>
      <div class="page-list-footer">
        <button class="add-page-btn" @click="handleAddPage">
          + 新建页面
        </button>
        <button class="clone-page-btn" @click="handleClonePage">
          复制当前页
        </button>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 缩放 -->
    <div class="status-item">
      <span class="status-label">缩放</span>
      <span class="status-value">{{ zoom }}%</span>
    </div>
    <div class="divider"></div>

    <!-- 画布尺寸 -->
    <div class="status-item">
      <span class="status-label">画布</span>
      <span class="status-value">1920×1080</span>
    </div>
    <div class="divider"></div>

    <!-- 坐标 -->
    <div class="status-item">
      <span class="status-label">坐标</span>
      <span class="status-value">{{ cursorX }}, {{ cursorY }}</span>
    </div>
    <div class="divider"></div>

    <!-- 模式和课件模式按钮 -->
    <div class="status-item mode-item">
      <span class="status-label">模式</span>
      <span class="status-value mode-value" :class="{ active: mode === '课件' }" @click="toggleMode">
        {{ mode }}
      </span>
    </div>

    <!-- 课件模式按钮 -->
    <button 
      v-if="mode === '课件'" 
      class="presentation-btn" 
      @click="togglePresentation"
      title="退出课件模式"
    >
      ⛶
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePageStore } from '../viewModels/pageStore'

const pageStore = usePageStore()

// 状态
const showPageList = ref(false)
const zoom = ref(100)
const cursorX = ref(0)
const cursorY = ref(0)
const mode = ref('白板')

// 跳转到指定页
const goToPage = (pageNumber: number) => {
  pageStore.goToPage(pageNumber)
  showPageList.value = false
}

// 添加页面
const handleAddPage = () => {
  pageStore.addPage()
  showPageList.value = false
  // 通知 CanvasArea 更新
  window.dispatchEvent(new CustomEvent('whiteboard:page-added'))
}

// 删除页面
const handleDeletePage = (index: number) => {
  if (pageStore.totalPages > 1) {
    pageStore.deletePage(index)
    // 通知 CanvasArea 更新
    window.dispatchEvent(new CustomEvent('whiteboard:page-changed'))
  }
}

// 克隆页面
const handleClonePage = () => {
  pageStore.clonePage()
  showPageList.value = false
  // 通知 CanvasArea 更新
  window.dispatchEvent(new CustomEvent('whiteboard:page-added'))
}

// 切换模式
const toggleMode = () => {
  if (mode.value === '白板') {
    mode.value = '课件'
    // 进入课件模式
    enterPresentationMode()
  } else {
    mode.value = '白板'
    // 退出课件模式
    exitPresentationMode()
  }
}

// 进入课件模式
const enterPresentationMode = () => {
  pageStore.setPresentationMode(true)
  // 全屏处理
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {})
  }
  // 通知 CanvasArea
  window.dispatchEvent(new CustomEvent('whiteboard:presentation-mode', { 
    detail: { enabled: true } 
  }))
}

// 退出课件模式
const exitPresentationMode = () => {
  pageStore.setPresentationMode(false)
  // 退出全屏
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
  // 通知 CanvasArea
  window.dispatchEvent(new CustomEvent('whiteboard:presentation-mode', { 
    detail: { enabled: false } 
  }))
}

// 切换课件模式（按钮）
const togglePresentation = () => {
  exitPresentationMode()
  mode.value = '白板'
}

// 监听键盘事件（左右方向键切换页面）
const handleKeyDown = (e: KeyboardEvent) => {
  if (mode.value !== '课件') return
  
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault()
    pageStore.nextPage()
    window.dispatchEvent(new CustomEvent('whiteboard:page-changed'))
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    pageStore.prevPage()
    window.dispatchEvent(new CustomEvent('whiteboard:page-changed'))
  } else if (e.key === 'Escape') {
    exitPresentationMode()
    mode.value = '白板'
  }
}

// 挂载事件监听
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// 暴露方法给外部
defineExpose({
  setZoom: (z: number) => { zoom.value = z },
  setCursor: (x: number, y: number) => { cursorX.value = x; cursorY.value = y }
})
</script>

<style scoped>
.bottom-bar {
  display: flex;
  align-items: center;
  height: 32px;
  background-color: #F5F5F5;
  border-top: 1px solid #E0E0E0;
  padding: 0 16px;
  gap: 8px;
  user-select: none;
  position: relative;
}

.page-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  font-size: 10px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover:not(:disabled) {
  background-color: #E0E0E0;
}

.nav-btn:disabled {
  color: #CCC;
  cursor: not-allowed;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  background: white;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  cursor: pointer;
  min-width: 50px;
  justify-content: center;
}

.page-info:hover {
  background-color: #F0F0F0;
}

.page-current {
  font-size: 12px;
  color: #2196F3;
  font-weight: 600;
}

.page-divider {
  font-size: 12px;
  color: #999;
}

.page-total {
  font-size: 12px;
  color: #666;
}

.dropdown-icon {
  font-size: 8px;
  color: #999;
  margin-left: 4px;
}

/* 页面列表弹窗 */
.page-list-popup {
  position: absolute;
  bottom: 36px;
  left: 8px;
  background: white;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 200px;
}

.page-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #E0E0E0;
  font-size: 13px;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 0 4px;
}

.close-btn:hover {
  color: #333;
}

.page-list {
  max-height: 240px;
  overflow-y: auto;
}

.page-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
  gap: 8px;
}

.page-item:hover {
  background-color: #F5F5F5;
}

.page-item.active {
  background-color: #E3F2FD;
}

.page-thumbnail {
  width: 24px;
  height: 24px;
  background: #E0E0E0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #666;
}

.page-item.active .page-thumbnail {
  background: #2196F3;
  color: white;
}

.page-label {
  flex: 1;
  font-size: 12px;
  color: #333;
}

.delete-page-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #999;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.15s, background-color 0.15s;
}

.page-item:hover .delete-page-btn {
  opacity: 1;
}

.delete-page-btn:hover {
  background: #FFEBEE;
  color: #F44336;
}

.page-list-footer {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #E0E0E0;
}

.add-page-btn, .clone-page-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.add-page-btn {
  background: #2196F3;
  color: white;
}

.add-page-btn:hover {
  background: #1976D2;
}

.clone-page-btn {
  background: #F5F5F5;
  color: #333;
  border: 1px solid #E0E0E0;
}

.clone-page-btn:hover {
  background: #E8E8E8;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-label {
  font-size: 12px;
  color: #666666;
}

.status-value {
  font-size: 12px;
  color: #333333;
}

.mode-item {
  margin-left: auto;
}

.mode-value {
  font-weight: 500;
  color: #2196F3;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.mode-value:hover {
  background-color: #E3F2FD;
}

.mode-value.active {
  background-color: #2196F3;
  color: white;
}

.presentation-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #FF9800;
  color: white;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.presentation-btn:hover {
  background: #F57C00;
}

.divider {
  width: 1px;
  height: 16px;
  background-color: #E0E0E0;
}
</style>