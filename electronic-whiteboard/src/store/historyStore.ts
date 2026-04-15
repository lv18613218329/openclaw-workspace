import { reactive, readonly, computed } from 'vue'

// 图形类型定义
interface Shape {
  id: string
  type: string
  attrs: Record<string, any>
}

interface HistoryState {
  history: Shape[][]
  historyIndex: number
  clipboard: Shape[]
}

const state = reactive<HistoryState>({
  history: [],           // 历史记录数组
  historyIndex: -1,      // 当前历史索引（-1 表示空历史）
  clipboard: []          // 剪贴板
})

// 计算属性
const canUndo = computed(() => state.historyIndex > 0)
const canRedo = computed(() => state.historyIndex < state.history.length - 1)

// 深度复制图形数组
const deepCloneShapes = (shapes: Shape[]): Shape[] => {
  return JSON.parse(JSON.stringify(shapes))
}

// 保存当前状态到历史
const saveState = (shapes: Shape[]) => {
  // 如果当前不在历史末尾，删除当前索引之后的所有历史
  if (state.historyIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIndex + 1)
  }
  
  // 添加新状态
  state.history.push(deepCloneShapes(shapes))
  state.historyIndex = state.history.length - 1
  
  // 限制历史记录数量（最多 50 条）
  if (state.history.length > 50) {
    state.history.shift()
    state.historyIndex--
  }
}

// 获取当前状态
const getCurrentState = (): Shape[] => {
  if (state.historyIndex >= 0 && state.historyIndex < state.history.length) {
    return deepCloneShapes(state.history[state.historyIndex])
  }
  return []
}

// 撤销
const undo = (currentShapes: Shape[]): Shape[] => {
  if (!canUndo.value) return currentShapes
  
  state.historyIndex--
  return deepCloneShapes(state.history[state.historyIndex])
}

// 重做
const redo = (currentShapes: Shape[]): Shape[] => {
  if (!canRedo.value) return currentShapes
  
  state.historyIndex++
  return deepCloneShapes(state.history[state.historyIndex])
}

// 复制图形到剪贴板
const copyShapes = (shapes: Shape[]) => {
  state.clipboard = deepCloneShapes(shapes)
}

// 剪切图形到剪贴板
const cutShapes = (shapes: Shape[]) => {
  state.clipboard = deepCloneShapes(shapes)
}

// 粘贴图形（返回粘贴的图形，偏移位置）
const pasteShapes = (): Shape[] => {
  if (state.clipboard.length === 0) return []
  
  const pasted = deepCloneShapes(state.clipboard)
  const offset = 20
  
  // 为粘贴的图形生成新 ID 并偏移位置
  pasted.forEach(shape => {
    shape.id = `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    shape.attrs.id = shape.id
    
    // 偏移位置
    if (shape.attrs.x !== undefined) {
      shape.attrs.x += offset
    }
    if (shape.attrs.y !== undefined) {
      shape.attrs.y += offset
    }
    // 对于点数组（如 line, triangle, arrow 等）
    if (shape.attrs.points && Array.isArray(shape.attrs.points)) {
      const newPoints: number[] = []
      for (let i = 0; i < shape.attrs.points.length; i += 2) {
        newPoints.push(shape.attrs.points[i] + offset)
        newPoints.push(shape.attrs.points[i + 1] + offset)
      }
      shape.attrs.points = newPoints
    }
  })
  
  return pasted
}

// 原地复制图形
const duplicateShapes = (shapes: Shape[]): Shape[] => {
  if (shapes.length === 0) return []
  
  const duplicated = deepCloneShapes(shapes)
  const offset = 20
  
  duplicated.forEach(shape => {
    shape.id = `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    shape.attrs.id = shape.id
    
    // 偏移位置
    if (shape.attrs.x !== undefined) {
      shape.attrs.x += offset
    }
    if (shape.attrs.y !== undefined) {
      shape.attrs.y += offset
    }
    if (shape.attrs.points && Array.isArray(shape.attrs.points)) {
      const newPoints: number[] = []
      for (let i = 0; i < shape.attrs.points.length; i += 2) {
        newPoints.push(shape.attrs.points[i] + offset)
        newPoints.push(shape.attrs.points[i + 1] + offset)
      }
      shape.attrs.points = newPoints
    }
  })
  
  return duplicated
}

// 清空历史
const clearHistory = () => {
  state.history = []
  state.historyIndex = -1
}

export function useHistoryStore() {
  return {
    state: readonly(state),
    canUndo,
    canRedo,
    saveState,
    getCurrentState,
    undo,
    redo,
    copyShapes,
    cutShapes,
    pasteShapes,
    duplicateShapes,
    clearHistory
  }
}