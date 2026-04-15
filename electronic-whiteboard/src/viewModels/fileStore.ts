import { reactive, readonly, computed, watch } from 'vue'

interface FileState {
  currentFilePath: string | null
  hasUnsavedChanges: boolean
  fileName: string
  autoSaveEnabled: boolean
}

const state = reactive<FileState>({
  currentFilePath: null,
  hasUnsavedChanges: false,
  fileName: '未命名',
  autoSaveEnabled: true
})

// 计算属性
const isNewProject = computed(() => !state.currentFilePath)

// 标记为已修改
const markAsModified = () => {
  state.hasUnsavedChanges = true
}

// 标记为已保存
const markAsSaved = (fileName?: string) => {
  state.hasUnsavedChanges = false
  if (fileName) {
    state.fileName = fileName
  }
}

// 设置当前文件路径
const setFilePath = (path: string | null) => {
  state.currentFilePath = path
  if (path) {
    // 从路径中提取文件名
    const parts = path.split(/[/\\]/)
    const name = parts[parts.length - 1]
    state.fileName = name.replace('.ewb', '')
  }
}

// 重置为新项目
const resetProject = () => {
  state.currentFilePath = null
  state.hasUnsavedChanges = false
  state.fileName = '未命名'
}

// 设置自动保存
const setAutoSave = (enabled: boolean) => {
  state.autoSaveEnabled = enabled
}

// 导出 store
export function useFileStore() {
  return {
    state: readonly(state),
    isNewProject,
    markAsModified,
    markAsSaved,
    setFilePath,
    resetProject,
    setAutoSave
  }
}