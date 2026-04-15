import { usePageStore, type Shape } from './pageStore'

// 项目文件格式
interface WhiteboardProject {
  version: string
  name: string
  createdAt: string
  modifiedAt: string
  pages: Shape[][]
}

// 保存项目到文件
export const saveProjectToFile = async (fileName?: string): Promise<boolean> => {
  const pageStore = usePageStore()
  
  // 创建项目数据
  const project: WhiteboardProject = {
    version: '1.0',
    name: fileName || '未命名',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    pages: JSON.parse(JSON.stringify(pageStore.state.pages))
  }
  
  // 转换为 JSON
  const json = JSON.stringify(project, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  
  // 创建下载链接
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName || '白板项目'}.ewb`
  
  // 触发下载
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // 释放 URL
  URL.revokeObjectURL(url)
  
  return true
}

// 从文件加载项目
export const loadProjectFromFile = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const project: WhiteboardProject = JSON.parse(content)
        
        // 验证项目格式
        if (!project.version || !project.pages || !Array.isArray(project.pages)) {
          throw new Error('无效的项目文件格式')
        }
        
        const pageStore = usePageStore()
        
        // 加载页面数据
        pageStore.state.pages = project.pages
        
        // 确保当前页码有效
        if (pageStore.state.currentPage >= project.pages.length) {
          pageStore.state.currentPage = 0
        }
        
        // 通知 CanvasArea 刷新
        window.dispatchEvent(new CustomEvent('whiteboard:project-loaded'))
        
        resolve(true)
      } catch (error) {
        console.error('加载项目失败:', error)
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }
    
    reader.readAsText(file)
  })
}

// 导出当前页为 PNG
export const exportCurrentPageToPNG = async (resolution: number = 1): Promise<boolean> => {
  return new Promise((resolve) => {
    // 发送事件让 CanvasArea 处理导出
    window.dispatchEvent(new CustomEvent('whiteboard:export-png', { 
      detail: { resolution } 
    }))
    
    // 等待一下让导出完成
    setTimeout(() => resolve(true), 100)
  })
}

// 自动保存到 localStorage
const AUTO_SAVE_KEY = 'whiteboard_autosave'
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000 // 5 分钟

export const autoSaveToLocalStorage = (): void => {
  const pageStore = usePageStore()
  
  const project: WhiteboardProject = {
    version: '1.0',
    name: '自动保存',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    pages: JSON.parse(JSON.stringify(pageStore.state.pages))
  }
  
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(project))
    console.log('自动保存完成')
  } catch (error) {
    console.error('自动保存失败:', error)
  }
}

// 从 localStorage 恢复
export const restoreFromLocalStorage = (): boolean => {
  try {
    const saved = localStorage.getItem(AUTO_SAVE_KEY)
    if (!saved) return false
    
    const project: WhiteboardProject = JSON.parse(saved)
    
    if (!project.version || !project.pages || !Array.isArray(project.pages)) {
      return false
    }
    
    const pageStore = usePageStore()
    pageStore.state.pages = project.pages
    
    if (pageStore.state.currentPage >= project.pages.length) {
      pageStore.state.currentPage = 0
    }
    
    return true
  } catch (error) {
    console.error('恢复自动保存失败:', error)
    return false
  }
}

// 清除自动保存
export const clearAutoSave = (): void => {
  localStorage.removeItem(AUTO_SAVE_KEY)
}

// 创建文件输入元素（用于打开文件）
export const createFileInput = (accept: string = '.ewb', multiple: boolean = false): HTMLInputElement => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.multiple = multiple
  input.style.display = 'none'
  document.body.appendChild(input)
  return input
}

// 删除文件输入元素
export const removeFileInput = (input: HTMLInputElement): void => {
  document.body.removeChild(input)
}