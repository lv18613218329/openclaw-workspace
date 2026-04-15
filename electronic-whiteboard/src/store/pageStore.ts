import { reactive, readonly, computed } from 'vue'

// Shape 类型定义（与 CanvasArea.vue 保持一致）
interface Shape {
  id: string
  type: string
  attrs: Record<string, any>
}

interface PageState {
  pages: Shape[][]
  currentPage: number
  presentationMode: boolean
}

const state = reactive<PageState>({
  pages: [[]], // 初始为1页，空数组
  currentPage: 0,
  presentationMode: false
})

// 计算属性
const totalPages = computed(() => state.pages.length)
const currentPageNumber = computed(() => state.currentPage + 1)

// 获取当前页面的图形
const getCurrentPageShapes = (): Shape[] => {
  return state.pages[state.currentPage] || []
}

// 设置当前页面的图形
const setCurrentPageShapes = (shapes: Shape[]) => {
  state.pages[state.currentPage] = shapes
}

// 添加新页面
const addPage = (index?: number): number => {
  const newPage: Shape[] = []
  const insertIndex = index !== undefined ? index : state.pages.length
  
  // 在指定位置插入新页面
  state.pages.splice(insertIndex, 0, newPage)
  
  // 切换到新页面
  state.currentPage = insertIndex
  
  return insertIndex
}

// 删除页面
const deletePage = (index?: number): boolean => {
  // 至少保留一页
  if (state.pages.length <= 1) {
    return false
  }
  
  const deleteIndex = index !== undefined ? index : state.currentPage
  
  // 如果删除当前页面，需要先切换到其他页面
  if (deleteIndex === state.currentPage) {
    if (deleteIndex >= state.pages.length - 1) {
      state.currentPage = state.pages.length - 2
    }
  }
  
  state.pages.splice(deleteIndex, 1)
  
  // 如果当前页码超出范围，调整
  if (state.currentPage >= state.pages.length) {
    state.currentPage = state.pages.length - 1
  }
  
  return true
}

// 下一页
const nextPage = (): boolean => {
  if (state.currentPage < state.pages.length - 1) {
    state.currentPage++
    return true
  }
  return false
}

// 上一页
const prevPage = (): boolean => {
  if (state.currentPage > 0) {
    state.currentPage--
    return true
  }
  return false
}

// 跳转到指定页
const goToPage = (pageNumber: number): boolean => {
  const index = pageNumber - 1
  if (index >= 0 && index < state.pages.length) {
    state.currentPage = index
    return true
  }
  return false
}

// 克隆当前页
const clonePage = (): number => {
  const currentShapes = [...state.pages[state.currentPage]]
  const newShapes = currentShapes.map(shape => ({
    ...shape,
    id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    attrs: {
      ...shape.attrs,
      id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }))
  
  // 在当前页后插入
  const newIndex = state.currentPage + 1
  state.pages.splice(newIndex, 0, newShapes)
  state.currentPage = newIndex
  
  return newIndex
}

// 插入指定页的副本
const insertPageCopy = (fromIndex: number, toIndex: number): boolean => {
  if (fromIndex < 0 || fromIndex >= state.pages.length) {
    return false
  }
  
  const sourceShapes = state.pages[fromIndex]
  const newShapes = sourceShapes.map(shape => ({
    ...shape,
    id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    attrs: {
      ...shape.attrs,
      id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }))
  
  state.pages.splice(toIndex, 0, newShapes)
  
  // 如果插入位置在当前页之前，更新当前页码
  if (toIndex <= state.currentPage) {
    state.currentPage++
  }
  
  return true
}

// 移动页面
const movePage = (fromIndex: number, toIndex: number): boolean => {
  if (fromIndex < 0 || fromIndex >= state.pages.length ||
      toIndex < 0 || toIndex >= state.pages.length) {
    return false
  }
  
  const page = state.pages.splice(fromIndex, 1)[0]
  state.pages.splice(toIndex, 0, page)
  
  // 更新当前页码
  if (fromIndex === state.currentPage) {
    state.currentPage = toIndex
  } else if (fromIndex < state.currentPage && toIndex >= state.currentPage) {
    state.currentPage--
  } else if (fromIndex > state.currentPage && toIndex <= state.currentPage) {
    state.currentPage++
  }
  
  return true
}

// 切换课件模式
const togglePresentationMode = (): boolean => {
  state.presentationMode = !state.presentationMode
  return state.presentationMode
}

const setPresentationMode = (enabled: boolean) => {
  state.presentationMode = enabled
}

// 导出 store
export function usePageStore() {
  return {
    state: readonly(state),
    totalPages,
    currentPageNumber,
    getCurrentPageShapes,
    setCurrentPageShapes,
    addPage,
    deletePage,
    nextPage,
    prevPage,
    goToPage,
    clonePage,
    insertPageCopy,
    movePage,
    togglePresentationMode,
    setPresentationMode
  }
}

// 导出类型
export type { Shape }