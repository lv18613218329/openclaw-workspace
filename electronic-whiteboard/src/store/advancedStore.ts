import { reactive, readonly } from 'vue'

// 高级功能类型
export type AdvancedFeature = 
  | 'none' 
  | 'annotation'    // 屏幕标注
  | 'spotlight'     // 聚光灯
  | 'randomPicker'  // 随机抽取
  | 'timer'         // 计时器
  | 'resource'      // 资源库
  | 'handwriting'   // 手写识别

interface AdvancedState {
  // 当前激活的高级功能
  currentFeature: AdvancedFeature
  // 屏幕标注状态
  annotationEnabled: boolean
  // 聚光灯状态
  spotlightEnabled: boolean
  spotlightX: number
  spotlightY: number
  spotlightRadius: number
  // 随机抽取
  studentList: string[]
  selectedStudent: string | null
  isAnimating: boolean
  // 计时器
  timerMinutes: number
  timerSeconds: number
  timerRunning: boolean
  timerTotalSeconds: number
  // 资源库
  savedShapes: Array<{
    id: string
    name: string
    data: any
    thumbnail?: string
  }>
}

const state = reactive<AdvancedState>({
  currentFeature: 'none',
  annotationEnabled: false,
  spotlightEnabled: false,
  spotlightX: 0,
  spotlightY: 0,
  spotlightRadius: 150,
  studentList: [],
  selectedStudent: null,
  isAnimating: false,
  timerMinutes: 5,
  timerSeconds: 0,
  timerRunning: false,
  timerTotalSeconds: 300,
  savedShapes: []
})

export function useAdvancedStore() {
  // 设置当前功能
  const setFeature = (feature: AdvancedFeature) => {
    // 如果切换到其他功能，先关闭当前功能
    if (feature !== 'none' && feature !== state.currentFeature) {
      if (state.currentFeature === 'annotation') {
        state.annotationEnabled = false
      } else if (state.currentFeature === 'spotlight') {
        state.spotlightEnabled = false
      }
    }
    state.currentFeature = feature
  }

  // 关闭当前功能
  const closeFeature = () => {
    if (state.currentFeature === 'annotation') {
      state.annotationEnabled = false
    } else if (state.currentFeature === 'spotlight') {
      state.spotlightEnabled = false
    }
    state.currentFeature = 'none'
  }

  // 屏幕标注
  const toggleAnnotation = () => {
    state.annotationEnabled = !state.annotationEnabled
    if (state.annotationEnabled) {
      state.currentFeature = 'annotation'
      // 关闭其他功能
      state.spotlightEnabled = false
    } else {
      state.currentFeature = 'none'
    }
  }

  // 聚光灯
  const toggleSpotlight = () => {
    state.spotlightEnabled = !state.spotlightEnabled
    if (state.spotlightEnabled) {
      state.currentFeature = 'spotlight'
      state.annotationEnabled = false
    } else {
      state.currentFeature = 'none'
    }
  }

  const updateSpotlightPosition = (x: number, y: number) => {
    state.spotlightX = x
    state.spotlightY = y
  }

  const setSpotlightRadius = (radius: number) => {
    state.spotlightRadius = radius
  }

  // 随机抽取
  const setStudentList = (list: string[]) => {
    state.studentList = list
  }

  const addStudent = (name: string) => {
    if (name.trim() && !state.studentList.includes(name.trim())) {
      state.studentList.push(name.trim())
    }
  }

  const removeStudent = (name: string) => {
    const index = state.studentList.indexOf(name)
    if (index > -1) {
      state.studentList.splice(index, 1)
    }
  }

  const clearStudents = () => {
    state.studentList = []
    state.selectedStudent = null
  }

  const pickRandomStudent = async () => {
    if (state.studentList.length === 0 || state.isAnimating) return

    state.isAnimating = true
    
    // 动画效果：快速切换显示的名字
    const duration = 2000 // 2秒动画
    const interval = 100 // 每100ms切换一次
    const startTime = Date.now()
    
    return new Promise<void>((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        
        if (elapsed < duration) {
          // 随机显示一个名字
          const randomIndex = Math.floor(Math.random() * state.studentList.length)
          state.selectedStudent = state.studentList[randomIndex]
          setTimeout(animate, interval)
        } else {
          // 最终选择
          const finalIndex = Math.floor(Math.random() * state.studentList.length)
          state.selectedStudent = state.studentList[finalIndex]
          state.isAnimating = false
          resolve()
        }
      }
      animate()
    })
  }

  // 计时器
  const setTimerTime = (minutes: number, seconds: number) => {
    state.timerMinutes = minutes
    state.timerSeconds = seconds
    state.timerTotalSeconds = minutes * 60 + seconds
  }

  const startTimer = () => {
    if (state.timerTotalSeconds > 0) {
      state.timerRunning = true
    }
  }

  const pauseTimer = () => {
    state.timerRunning = false
  }

  const resetTimer = () => {
    state.timerRunning = false
    state.timerTotalSeconds = state.timerMinutes * 60 + state.timerSeconds
  }

  const tickTimer = () => {
    if (state.timerRunning && state.timerTotalSeconds > 0) {
      state.timerTotalSeconds--
      if (state.timerTotalSeconds === 0) {
        state.timerRunning = false
        // 触发计时结束事件
        window.dispatchEvent(new CustomEvent('whiteboard:timer-ended'))
      }
    }
  }

  // 获取当前计时器显示值
  const getTimerDisplay = () => {
    const minutes = Math.floor(state.timerTotalSeconds / 60)
    const seconds = state.timerTotalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  // 资源库 - 保存图形
  const saveShape = (name: string, data: any) => {
    const id = Date.now().toString()
    state.savedShapes.push({
      id,
      name,
      data
    })
  }

  const deleteShape = (id: string) => {
    const index = state.savedShapes.findIndex(s => s.id === id)
    if (index > -1) {
      state.savedShapes.splice(index, 1)
    }
  }

  const loadShape = (id: string) => {
    const shape = state.savedShapes.find(s => s.id === id)
    return shape ? shape.data : null
  }

  return {
    state: readonly(state),
    setFeature,
    closeFeature,
    toggleAnnotation,
    toggleSpotlight,
    updateSpotlightPosition,
    setSpotlightRadius,
    setStudentList,
    addStudent,
    removeStudent,
    clearStudents,
    pickRandomStudent,
    setTimerTime,
    startTimer,
    pauseTimer,
    resetTimer,
    tickTimer,
    getTimerDisplay,
    saveShape,
    deleteShape,
    loadShape
  }
}