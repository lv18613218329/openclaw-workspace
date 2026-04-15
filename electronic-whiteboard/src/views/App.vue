<template>
  <div class="app-container">
    <TopBar />
    <div class="main-content">
      <LeftPanel />
      <CanvasArea ref="canvasRef" />
      <RightPanel />
    </div>
    <BottomBar />
    
    <!-- 高级功能面板 -->
    <AdvancedPanel />
    
    <!-- 公式对话框 -->
    <FormulaDialog 
      v-if="showFormulaDialog" 
      :type="formulaDialogType"
      @close="closeFormulaDialog"
      @insert="handleFormulaInsert"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import TopBar from './TopBar.vue'
import LeftPanel from './LeftPanel.vue'
import RightPanel from './RightPanel.vue'
import BottomBar from './BottomBar.vue'
import CanvasArea from './CanvasArea.vue'
import FormulaDialog from './FormulaDialog.vue'
import AdvancedPanel from './AdvancedPanel.vue'
import { useToolStore } from '../viewModels/toolStore'

const canvasRef = ref<any>(null)
const toolStore = useToolStore()

// 公式对话框状态
const showFormulaDialog = ref(false)
const formulaDialogType = ref<'latex' | 'chemFormula'>('latex')

// 主题颜色
const themeColors = {
  white: { appBg: '#F5F5F5', toolbarBg: '#F5F5F5' },
  black: { appBg: '#1E3D1A', toolbarBg: '#1E3D1A' },
  dark: { appBg: '#1E1E1E', toolbarBg: '#252526' }
}

// 当前主题颜色
const currentTheme = computed(() => themeColors[toolStore.state.theme])

// 打开公式对话框
const openFormulaDialog = (type: 'latex' | 'chemFormula') => {
  formulaDialogType.value = type
  showFormulaDialog.value = true
}

// 关闭公式对话框
const closeFormulaDialog = () => {
  showFormulaDialog.value = false
}

// 处理公式插入
const handleFormulaInsert = (data: any) => {
  if (canvasRef.value) {
    canvasRef.value.addFormulaShape(data)
  }
}

// 监听公式对话框事件
onMounted(() => {
  window.addEventListener('whiteboard:show-latex-dialog', () => {
    openFormulaDialog('latex')
  })
  window.addEventListener('whiteboard:show-chem-dialog', () => {
    openFormulaDialog('chemFormula')
  })
  
  // 应用初始主题
  applyTheme()
  
  // 监听主题变化
  window.addEventListener('whiteboard:theme-changed', applyTheme)
})

onUnmounted(() => {
  window.removeEventListener('whiteboard:theme-changed', applyTheme)
})

// 应用主题颜色
const applyTheme = () => {
  const colors = themeColors[toolStore.state.theme]
  const appContainer = document.querySelector('.app-container') as HTMLElement
  const topbar = document.querySelector('.topbar') as HTMLElement
  
  if (appContainer) {
    appContainer.style.backgroundColor = colors.appBg
  }
  if (topbar) {
    topbar.style.backgroundColor = colors.toolbarBg
  }
  
  // 通知子组件更新
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('whiteboard:theme-applied'))
  }, 100)
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #F5F5F5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>