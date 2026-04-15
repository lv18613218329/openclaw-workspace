<template>
  <div class="advanced-panel" v-if="advancedStore.state.currentFeature !== 'none'">
    <!-- 屏幕标注层 -->
    <div 
      v-if="advancedStore.state.annotationEnabled" 
      class="annotation-overlay"
      ref="annotationLayer"
      @mousedown="startAnnotation"
      @mousemove="drawAnnotation"
      @mouseup="endAnnotation"
      @mouseleave="endAnnotation"
    >
      <canvas ref="annotationCanvas" class="annotation-canvas"></canvas>
      <div class="annotation-hint">
        <span>🖊️ 标注模式 - ESC 退出</span>
        <span class="hint-color" :style="{ backgroundColor: toolStore.state.strokeColor }"></span>
      </div>
    </div>

    <!-- 聚光灯层 -->
    <div 
      v-if="advancedStore.state.spotlightEnabled" 
      class="spotlight-overlay"
      ref="spotlightLayer"
      @mousedown="startDragSpotlight"
      @mousemove="dragSpotlight"
      @mouseup="endDragSpotlight"
    >
      <div 
        class="spotlight-mask"
        :style="{
          maskImage: `radial-gradient(circle ${advancedStore.state.spotlightRadius}px at ${advancedStore.state.spotlightX}px ${advancedStore.state.spotlightY}px, black 0%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle ${advancedStore.state.spotlightRadius}px at ${advancedStore.state.spotlightX}px ${advancedStore.state.spotlightY}px, black 0%, transparent 100%)`
        }"
      ></div>
      <div 
        class="spotlight-handle"
        :style="{ left: advancedStore.state.spotlightX + 'px', top: advancedStore.state.spotlightY + 'px' }"
      >
        <span class="spotlight-hint">🔆 拖动调整位置</span>
      </div>
    </div>

    <!-- 功能面板 -->
    <div class="feature-panel" :class="advancedStore.state.currentFeature">
      <!-- 随机抽取面板 -->
      <div v-if="advancedStore.state.currentFeature === 'randomPicker'" class="panel-content">
        <div class="panel-header">
          <span class="panel-title">🎲 随机抽取</span>
          <button class="panel-close" @click="advancedStore.closeFeature()">✕</button>
        </div>
        
        <div class="panel-body">
          <!-- 学生名单输入 -->
          <div class="student-input-section">
            <div class="input-row">
              <input 
                type="text" 
                v-model="newStudentName" 
                placeholder="输入学生姓名"
                @keyup.enter="addStudent"
              />
              <button class="btn-add" @click="addStudent">添加</button>
            </div>
            
            <div class="student-count">
              共 {{ advancedStore.state.studentList.length }} 人
              <button 
                v-if="advancedStore.state.studentList.length > 0" 
                class="btn-clear"
                @click="advancedStore.clearStudents()"
              >
                清空
              </button>
            </div>
          </div>

          <!-- 学生列表 -->
          <div class="student-list" v-if="advancedStore.state.studentList.length > 0">
            <div 
              v-for="student in advancedStore.state.studentList" 
              :key="student" 
              class="student-tag"
            >
              <span>{{ student }}</span>
              <button class="tag-remove" @click="advancedStore.removeStudent(student)">✕</button>
            </div>
          </div>

          <!-- 抽取按钮和结果 -->
          <div class="picker-section">
            <button 
              class="btn-pick"
              :disabled="advancedStore.state.studentList.length === 0 || advancedStore.state.isAnimating"
              @click="doPick"
            >
              {{ advancedStore.state.isAnimating ? '抽取中...' : '开始抽取' }}
            </button>
            
            <div v-if="advancedStore.state.selectedStudent" class="result-display" :class="{ animating: advancedStore.state.isAnimating }">
              {{ advancedStore.state.selectedStudent }}
            </div>
          </div>
        </div>
      </div>

      <!-- 计时器面板 -->
      <div v-else-if="advancedStore.state.currentFeature === 'timer'" class="panel-content">
        <div class="panel-header">
          <span class="panel-title">⏱️ 计时器</span>
          <button class="panel-close" @click="advancedStore.closeFeature()">✕</button>
        </div>
        
        <div class="panel-body">
          <!-- 时间设置 -->
          <div class="timer-setting" v-if="!advancedStore.state.timerRunning && advancedStore.state.timerTotalSeconds === advancedStore.state.timerMinutes * 60 + advancedStore.state.timerSeconds">
            <div class="time-inputs">
              <div class="time-input-group">
                <input 
                  type="number" 
                  v-model.number="timerMinutes" 
                  min="0" 
                  max="99"
                  @change="updateTimer"
                />
                <span>分</span>
              </div>
              <div class="time-input-group">
                <input 
                  type="number" 
                  v-model.number="timerSeconds" 
                  min="0" 
                  max="59"
                  @change="updateTimer"
                />
                <span>秒</span>
              </div>
            </div>
          </div>

          <!-- 计时器显示 -->
          <div class="timer-display" :class="{ warning: advancedStore.state.timerTotalSeconds <= 10 && advancedStore.state.timerTotalSeconds > 0 }">
            {{ advancedStore.getTimerDisplay() }}
          </div>

          <!-- 计时器控制 -->
          <div class="timer-controls">
            <button 
              class="btn-timer"
              :class="{ active: advancedStore.state.timerRunning }"
              @click="toggleTimer"
            >
              {{ advancedStore.state.timerRunning ? '⏸ 暂停' : '▶ 开始' }}
            </button>
            <button class="btn-timer btn-reset" @click="resetTimer">
              🔄 重置
            </button>
          </div>
        </div>
      </div>

      <!-- 资源库面板 -->
      <div v-else-if="advancedStore.state.currentFeature === 'resource'" class="panel-content">
        <div class="panel-header">
          <span class="panel-title">📁 资源库</span>
          <button class="panel-close" @click="advancedStore.closeFeature()">✕</button>
        </div>
        
        <div class="panel-body">
          <!-- 图片插入 -->
          <div class="resource-section">
            <h4>🖼️ 插入图片</h4>
            <input 
              type="file" 
              ref="imageInput" 
              accept="image/*" 
              @change="handleImageUpload"
              style="display: none"
            />
            <button class="btn-resource" @click="triggerImageUpload">
              选择图片文件
            </button>
          </div>

          <!-- 图形收藏 -->
          <div class="resource-section">
            <h4>⭐ 图形收藏</h4>
            <p class="section-hint">选中画布上的图形，点击收藏按钮将其保存到资源库</p>
            
            <div v-if="advancedStore.state.savedShapes.length === 0" class="empty-hint">
              暂无收藏的图形
            </div>
            
            <div v-else class="shape-grid">
              <div 
                v-for="shape in advancedStore.state.savedShapes" 
                :key="shape.id" 
                class="shape-item"
                @click="insertShape(shape)"
              >
                <div class="shape-preview">{{ shape.name }}</div>
                <button class="shape-delete" @click.stop="advancedStore.deleteShape(shape.id)">✕</button>
              </div>
            </div>
          </div>

          <!-- 收藏按钮 -->
          <div class="save-shape-section" v-if="hasSelectedShape">
            <button class="btn-save-shape" @click="saveSelectedShape">
              ⭐ 收藏选中图形
            </button>
          </div>
        </div>
      </div>

      <!-- 手写识别面板 -->
      <div v-else-if="advancedStore.state.currentFeature === 'handwriting'" class="panel-content">
        <div class="panel-header">
          <span class="panel-title">✍️ 手写识别</span>
          <button class="panel-close" @click="advancedStore.closeFeature()">✕</button>
        </div>
        
        <div class="panel-body">
          <div class="handwriting-area">
            <canvas 
              ref="handwritingCanvas" 
              class="handwriting-canvas"
              @mousedown="startDraw"
              @mousemove="draw"
              @mouseup="endDraw"
              @mouseleave="endDraw"
            ></canvas>
            <div class="handwriting-hint">
              在上方区域书写，支持中英文和数字
            </div>
          </div>
          
          <div class="handwriting-controls">
            <button class="btn-handwriting" @click="clearHandwriting">
              🗑️ 清除
            </button>
            <button class="btn-handwriting btn-recognize" @click="recognizeHandwriting">
              🔍 识别
            </button>
          </div>
          
          <div v-if="recognizedText" class="recognized-result">
            <div class="result-label">识别结果：</div>
            <div class="result-text">{{ recognizedText }}</div>
            <button class="btn-insert-text" @click="insertRecognizedText">
              插入到画布
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 计时结束提醒 -->
  <div v-if="showTimerAlert" class="timer-alert">
    <div class="alert-content">
      <span class="alert-icon">🔔</span>
      <span class="alert-text">时间到！</span>
      <button class="alert-close" @click="showTimerAlert = false">确定</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAdvancedStore } from '../store/advancedStore'
import { useToolStore } from '../store/toolStore'

const advancedStore = useAdvancedStore()
const toolStore = useToolStore()

// 随机抽取
const newStudentName = ref('')
const addStudent = () => {
  if (newStudentName.value.trim()) {
    advancedStore.addStudent(newStudentName.value)
    newStudentName.value = ''
  }
}

const doPick = async () => {
  await advancedStore.pickRandomStudent()
}

// 计时器
const timerMinutes = ref(5)
const timerSeconds = ref(0)
const showTimerAlert = ref(false)

const updateTimer = () => {
  advancedStore.setTimerTime(timerMinutes.value, timerSeconds.value)
}

const toggleTimer = () => {
  if (advancedStore.state.timerRunning) {
    advancedStore.pauseTimer()
  } else {
    advancedStore.startTimer()
  }
}

const resetTimer = () => {
  advancedStore.resetTimer()
  timerMinutes.value = advancedStore.state.timerMinutes
  timerSeconds.value = advancedStore.state.timerSeconds
}

// 计时器tick
let timerInterval: ReturnType<typeof setInterval> | null = null

// 屏幕标注
const annotationCanvas = ref<HTMLCanvasElement | null>(null)
const annotationLayer = ref<HTMLDivElement | null>(null)
const isDrawing = ref(false)
const annotationCtx = ref<CanvasRenderingContext2D | null>(null)
const lastAnnotationPoint = ref({ x: 0, y: 0 })

const initAnnotationCanvas = () => {
  if (!annotationCanvas.value || !annotationLayer.value) return
  
  const canvas = annotationCanvas.value
  const layer = annotationLayer.value
  
  canvas.width = layer.clientWidth
  canvas.height = layer.clientHeight
  
  annotationCtx.value = canvas.getContext('2d')
}

const startAnnotation = (e: MouseEvent) => {
  isDrawing.value = true
  const rect = annotationCanvas.value?.getBoundingClientRect()
  if (rect) {
    lastAnnotationPoint.value = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }
}

const drawAnnotation = (e: MouseEvent) => {
  if (!isDrawing.value || !annotationCtx.value || !annotationCanvas.value) return
  
  const rect = annotationCanvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  annotationCtx.value.beginPath()
  annotationCtx.value.moveTo(lastAnnotationPoint.value.x, lastAnnotationPoint.value.y)
  annotationCtx.value.lineTo(x, y)
  annotationCtx.value.strokeStyle = toolStore.state.strokeColor
  annotationCtx.value.lineWidth = toolStore.state.strokeWidth
  annotationCtx.value.lineCap = 'round'
  annotationCtx.value.stroke()
  
  lastAnnotationPoint.value = { x, y }
}

const endAnnotation = () => {
  isDrawing.value = false
}

// 聚光灯
const spotlightLayer = ref<HTMLDivElement | null>(null)
const isDraggingSpotlight = ref(false)

const startDragSpotlight = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains('spotlight-handle')) {
    isDraggingSpotlight.value = true
  }
}

const dragSpotlight = (e: MouseEvent) => {
  if (!isDraggingSpotlight.value || !spotlightLayer.value) return
  
  const rect = spotlightLayer.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  advancedStore.updateSpotlightPosition(x, y)
}

const endDragSpotlight = () => {
  isDraggingSpotlight.value = false
}

// 资源库
const imageInput = ref<HTMLInputElement | null>(null)
const hasSelectedShape = ref(false)

const triggerImageUpload = () => {
  imageInput.value?.click()
}

const handleImageUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // 发送图片插入事件
        window.dispatchEvent(new CustomEvent('whiteboard:insert-image', {
          detail: { image: img, src: event.target?.result }
        }))
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }
  input.value = '' // 清空以允许重复选择同一文件
}

const saveSelectedShape = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:save-selected-shape'))
}

const insertShape = (shape: any) => {
  window.dispatchEvent(new CustomEvent('whiteboard:insert-shape', {
    detail: shape
  }))
}

// 监听选中图形变化
onMounted(() => {
  window.addEventListener('whiteboard:shape-selected', () => {
    hasSelectedShape.value = true
  })
  window.addEventListener('whiteboard:shape-deselected', () => {
    hasSelectedShape.value = false
  })
})

// 手写识别
const handwritingCanvas = ref<HTMLCanvasElement | null>(null)
const handwritingCtx = ref<CanvasRenderingContext2D | null>(null)
const isDrawingHW = ref(false)
const recognizedText = ref('')

const initHandwritingCanvas = () => {
  if (!handwritingCanvas.value) return
  
  const canvas = handwritingCanvas.value
  canvas.width = 300
  canvas.height = 150
  
  handwritingCtx.value = canvas.getContext('2d')
  if (handwritingCtx.value) {
    handwritingCtx.value.strokeStyle = '#333'
    handwritingCtx.value.lineWidth = 2
    handwritingCtx.value.lineCap = 'round'
  }
}

const startDraw = (e: MouseEvent) => {
  isDrawingHW.value = true
  if (!handwritingCtx.value || !handwritingCanvas.value) return
  
  const rect = handwritingCanvas.value.getBoundingClientRect()
  handwritingCtx.value.beginPath()
  handwritingCtx.value.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

const draw = (e: MouseEvent) => {
  if (!isDrawingHW.value || !handwritingCtx.value || !handwritingCanvas.value) return
  
  const rect = handwritingCanvas.value.getBoundingClientRect()
  handwritingCtx.value.lineTo(e.clientX - rect.left, e.clientY - rect.top)
  handwritingCtx.value.stroke()
}

const endDraw = () => {
  isDrawingHW.value = false
}

const clearHandwriting = () => {
  if (!handwritingCtx.value || !handwritingCanvas.value) return
  handwritingCtx.value.clearRect(0, 0, handwritingCanvas.value.width, handwritingCanvas.value.height)
  recognizedText.value = ''
}

// 简单的手写识别（基于笔画特征）
const recognizeHandwriting = () => {
  if (!handwritingCanvas.value) return
  
  // 获取画布内容
  const canvas = handwritingCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 获取图像数据
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  
  // 简单检测：计算非空白区域的边界
  let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0
  let hasContent = false
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4
      if (data[i + 3] > 128) { // 有内容
        hasContent = true
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }
  
  if (!hasContent) {
    recognizedText.value = '请先书写内容'
    return
  }
  
  // 简单模拟识别（实际项目中需要接入OCR服务）
  const width = maxX - minX
  const height = maxY - minY
  
  // 根据宽高比猜测
  if (width / height > 1.5) {
    recognizedText.value = '—' // 横线
  } else if (height / width > 1.5) {
    recognizedText.value = '|' // 竖线
  } else if (width < 30 && height < 30) {
    recognizedText.value = '•' // 点
  } else {
    recognizedText.value = '?' // 未知（实际应该调用OCR API）
  }
  
  // 实际项目中可以接入以下服务：
  // 1. Tesseract.js - 客户端OCR
  // 2. 百度文字识别API
  // 3. 讯飞手写识别API
}

const insertRecognizedText = () => {
  if (recognizedText.value && recognizedText.value !== '?') {
    window.dispatchEvent(new CustomEvent('whiteboard:insert-text', {
      detail: { text: recognizedText.value }
    }))
  }
}

// 监听窗口大小变化
const handleResize = () => {
  if (advancedStore.state.annotationEnabled) {
    nextTick(() => {
      initAnnotationCanvas()
    })
  }
}

// ESC退出
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (advancedStore.state.annotationEnabled) {
      advancedStore.toggleAnnotation()
    } else if (advancedStore.state.spotlightEnabled) {
      advancedStore.toggleSpotlight()
    } else if (advancedStore.state.currentFeature !== 'none') {
      advancedStore.closeFeature()
    }
  }
}

// 监听计时结束
const handleTimerEnd = () => {
  showTimerAlert.value = true
}

onMounted(() => {
  // 初始化画布
  nextTick(() => {
    initAnnotationCanvas()
    initHandwritingCanvas()
  })
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  // 监听键盘
  window.addEventListener('keydown', handleKeyDown)
  
  // 监听计时结束
  window.addEventListener('whiteboard:timer-ended', handleTimerEnd)
  
  // 启动计时器
  timerInterval = setInterval(() => {
    advancedStore.tickTimer()
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('whiteboard:timer-ended', handleTimerEnd)
  
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

// 监听功能开启
watch(() => advancedStore.state.currentFeature, (newFeature) => {
  if (newFeature === 'annotation' || newFeature === 'spotlight') {
    nextTick(() => {
      if (newFeature === 'annotation') {
        initAnnotationCanvas()
      }
    })
  }
})
</script>

<style scoped>
.advanced-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 900;
  pointer-events: none;
}

/* 屏幕标注层 */
.annotation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: auto;
  cursor: crosshair;
}

.annotation-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.annotation-hint {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hint-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
}

/* 聚光灯层 */
.spotlight-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: auto;
}

.spotlight-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
}

.spotlight-handle {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: rgba(255, 193, 7, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.spotlight-hint {
  font-size: 10px;
  white-space: nowrap;
}

/* 功能面板 */
.feature-panel {
  position: absolute;
  top: 60px;
  right: 12px;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  overflow: hidden;
}

.panel-content {
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.panel-close {
  background: none;
  border: none;
  font-size: 16px;
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.panel-close:hover {
  color: #333;
}

.panel-body {
  padding: 16px;
}

/* 随机抽取 */
.student-input-section {
  margin-bottom: 12px;
}

.input-row {
  display: flex;
  gap: 8px;
}

.input-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn-add {
  padding: 8px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-add:hover {
  background: #1976D2;
}

.student-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}

.btn-clear {
  background: none;
  border: none;
  color: #F44336;
  cursor: pointer;
  font-size: 13px;
}

.student-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 120px;
  overflow-y: auto;
  margin-bottom: 16px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
}

.student-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #E3F2FD;
  border-radius: 4px;
  font-size: 13px;
}

.tag-remove {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
}

.tag-remove:hover {
  color: #F44336;
}

.picker-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.btn-pick {
  padding: 12px 32px;
  background: linear-gradient(135deg, #FF9800, #FF5722);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-pick:hover:not(:disabled) {
  transform: scale(1.05);
}

.btn-pick:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-display {
  font-size: 32px;
  font-weight: bold;
  color: #2196F3;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 0.5s ease-in-out;
}

.result-display.animating {
  color: #FF9800;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 计时器 */
.timer-setting {
  margin-bottom: 16px;
}

.time-inputs {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input-group input {
  width: 60px;
  padding: 8px;
  text-align: center;
  font-size: 24px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.time-input-group span {
  font-size: 16px;
  color: #666;
}

.timer-display {
  font-size: 64px;
  font-weight: bold;
  text-align: center;
  color: #333;
  padding: 24px 0;
  font-family: monospace;
}

.timer-display.warning {
  color: #F44336;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn-timer {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  background: #4CAF50;
  color: white;
}

.btn-timer:hover {
  background: #45a049;
}

.btn-timer.active {
  background: #FF9800;
}

.btn-reset {
  background: #9E9E9E;
}

.btn-reset:hover {
  background: #757575;
}

/* 资源库 */
.resource-section {
  margin-bottom: 16px;
}

.resource-section h4 {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.section-hint {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.btn-resource {
  width: 100%;
  padding: 12px;
  background: #f5f5f5;
  border: 2px dashed #ddd;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
}

.btn-resource:hover {
  border-color: #2196F3;
  color: #2196F3;
}

.empty-hint {
  text-align: center;
  padding: 24px;
  color: #999;
  font-size: 13px;
}

.shape-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.shape-item {
  position: relative;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  font-size: 12px;
}

.shape-item:hover {
  background: #E3F2FD;
}

.shape-delete {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #F44336;
  color: white;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  cursor: pointer;
  display: none;
}

.shape-item:hover .shape-delete {
  display: block;
}

.save-shape-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.btn-save-shape {
  width: 100%;
  padding: 12px;
  background: #FF9800;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-save-shape:hover {
  background: #F57C00;
}

/* 手写识别 */
.handwriting-area {
  margin-bottom: 12px;
}

.handwriting-canvas {
  width: 100%;
  height: 150px;
  border: 2px solid #ddd;
  border-radius: 4px;
  cursor: crosshair;
  background: white;
}

.handwriting-hint {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.handwriting-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.btn-handwriting {
  flex: 1;
  padding: 8px;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-handwriting:hover {
  background: #e0e0e0;
}

.btn-recognize {
  background: #2196F3;
  color: white;
}

.btn-recognize:hover {
  background: #1976D2;
}

.recognized-result {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
}

.result-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.result-text {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 12px;
}

.btn-insert-text {
  width: 100%;
  padding: 8px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-insert-text:hover {
  background: #45a049;
}

/* 计时结束提醒 */
.timer-alert {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.alert-content {
  background: white;
  padding: 32px 48px;
  border-radius: 12px;
  text-align: center;
  animation: alertPulse 0.5s ease-in-out;
}

@keyframes alertPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.alert-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.alert-text {
  font-size: 24px;
  font-weight: bold;
  color: #F44336;
  display: block;
  margin-bottom: 24px;
}

.alert-close {
  padding: 12px 32px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.alert-close:hover {
  background: #1976D2;
}
</style>