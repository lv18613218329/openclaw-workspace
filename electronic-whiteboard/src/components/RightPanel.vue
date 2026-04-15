<template>
  <div class="right-panel">
    <div class="panel-header">
      <span class="header-title">工具属性</span>
    </div>

    <!-- 填充属性 -->
    <div class="property-section">
      <div class="section-header" @click="expandFill = !expandFill">
        <span class="section-title">填充</span>
        <span class="expand-icon">{{ expandFill ? '▼' : '▶' }}</span>
      </div>
      <div v-show="expandFill" class="section-content">
        <div class="property-row">
          <label>启用填充</label>
          <label class="toggle">
            <input type="checkbox" v-model="fillEnabled" @change="handleFillEnabledChange">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="property-row" v-if="fillEnabled">
          <label>颜色</label>
        </div>
        <div v-if="fillEnabled" class="color-presets">
          <div 
            v-for="color in presetColors" 
            :key="color"
            class="color-preset"
            :class="{ active: fillColor === color }"
            :style="{ backgroundColor: color }"
            @click="selectFillColor(color)"
          ></div>
          <div class="color-custom">
            <input 
              type="color" 
              v-model="fillColor" 
              @change="handleFillColorChange" 
              class="color-input"
            >
          </div>
        </div>
        <div class="property-row" v-if="fillEnabled">
          <label>透明度</label>
          <div class="slider-row">
            <input 
              type="range" 
              min="0" 
              max="100" 
              v-model.number="fillOpacity" 
              @input="handleFillOpacityChange" 
              class="slider"
            >
            <span class="slider-value">{{ fillOpacity }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 描边属性 -->
    <div class="property-section">
      <div class="section-header" @click="expandStroke = !expandStroke">
        <span class="section-title">描边</span>
        <span class="expand-icon">{{ expandStroke ? '▼' : '▶' }}</span>
      </div>
      <div v-show="expandStroke" class="section-content">
        <div class="property-row">
          <label>颜色</label>
        </div>
        <div class="color-presets">
          <div 
            v-for="color in presetColors" 
            :key="color"
            class="color-preset"
            :class="{ active: strokeColor === color }"
            :style="{ backgroundColor: color }"
            @click="selectStrokeColor(color)"
          ></div>
          <div class="color-custom">
            <input 
              type="color" 
              v-model="strokeColor" 
              @change="handleStrokeColorChange" 
              class="color-input"
            >
          </div>
        </div>
        <div class="property-row">
          <label>宽度</label>
          <div class="slider-row">
            <input 
              type="range" 
              min="1" 
              max="20" 
              v-model.number="strokeWidth" 
              @input="handleStrokeWidthChange" 
              class="slider"
            >
            <span class="slider-value">{{ strokeWidth }}px</span>
          </div>
        </div>
        <div class="property-row">
          <label>线型</label>
        </div>
        <div class="style-buttons">
          <button 
            class="style-btn" 
            :class="{ active: lineStyle === 'solid' }"
            @click="selectLineStyle('solid')"
            title="实线"
          >
            <span class="line-sample solid"></span>
          </button>
          <button 
            class="style-btn" 
            :class="{ active: lineStyle === 'dashed' }"
            @click="selectLineStyle('dashed')"
            title="虚线"
          >
            <span class="line-sample dashed"></span>
          </button>
          <button 
            class="style-btn" 
            :class="{ active: lineStyle === 'dotted' }"
            @click="selectLineStyle('dotted')"
            title="点线"
          >
            <span class="line-sample dotted"></span>
          </button>
        </div>
        <div class="property-row">
          <label>端点</label>
        </div>
        <div class="style-buttons">
          <button 
            class="style-btn" 
            :class="{ active: lineCap === 'butt' }"
            @click="selectLineCap('butt')"
            title="平头"
          >
            <span class="cap-sample butt"></span>
          </button>
          <button 
            class="style-btn" 
            :class="{ active: lineCap === 'round' }"
            @click="selectLineCap('round')"
            title="圆头"
          >
            <span class="cap-sample round"></span>
          </button>
          <button 
            class="style-btn" 
            :class="{ active: lineCap === 'square' }"
            @click="selectLineCap('square')"
            title="方头"
          >
            <span class="cap-sample square"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- 多边形设置 -->
    <div class="property-section" v-if="toolStore.state.currentTool === 'polygon'">
      <div class="section-header">
        <span class="section-title">多边形</span>
      </div>
      <div class="section-content">
        <div class="property-row">
          <label>边数</label>
          <div class="slider-row">
            <input 
              type="range" 
              min="3" 
              max="10" 
              v-model.number="polygonSides" 
              @input="handlePolygonSidesChange" 
              class="slider"
            >
            <span class="slider-value">{{ polygonSides }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 对齐工具栏 -->
    <div class="property-section" v-if="hasSelectedShape">
      <div class="section-header" @click="expandAlign = !expandAlign">
        <span class="section-title">对齐</span>
        <span class="expand-icon">{{ expandAlign ? '▼' : '▶' }}</span>
      </div>
      <div v-show="expandAlign" class="section-content">
        <div class="align-grid">
          <button class="align-btn" @click="handleAlignLeft" title="左对齐">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg>
          </button>
          <button class="align-btn" @click="handleAlignCenterH" title="水平居中">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 3h18v2H3V3zm4 4h10v2H7V7zm-4 4h18v2H3v-2zm4 4h10v2H7v-2zm-4 4h18v2H3v-2z"/></svg>
          </button>
          <button class="align-btn" @click="handleAlignRight" title="右对齐">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/></svg>
          </button>
          <button class="align-btn" @click="handleAlignTop" title="顶对齐">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 3h2v18H3V3zm4 0h14v2H7V3zm0 4h14v2H7V7zm-4 0h2v14H3V7zm4 0h14v2H7v-2z"/></svg>
          </button>
          <button class="align-btn" @click="handleAlignCenterV" title="垂直居中">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 3h2v18H3V3zm4 4h14v2H7V7zm-4 4h18v2H3v-2zm4 4h14v2H7v-2zm-4 4h18v2H3v-2z"/></svg>
          </button>
          <button class="align-btn" @click="handleAlignBottom" title="底对齐">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 3h2v18H3V3zm4 12h14v2H7v-2zm-4 4h2v2H3v-2zm4 0h14v2H7v-2z"/></svg>
          </button>
          <button class="align-btn" @click="handleDistributeH" title="水平分布">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M4 6h2v12H4V6zm4 0h2v12H8V6zm4 0h2v12h-2V6zm4 0h2v12h-2V6z"/></svg>
          </button>
          <button class="align-btn" @click="handleDistributeV" title="垂直分布">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 4h12v2H6V4zm0 4h12v2H6V8zm0 4h12v2H6v-2zm0 4h12v2H6v-2z"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 变换控制 -->
    <div class="property-section">
      <div class="section-header" @click="expandTransform = !expandTransform">
        <span class="section-title">变换</span>
        <span class="expand-icon">{{ expandTransform ? '▼' : '▶' }}</span>
      </div>
      <div v-show="expandTransform" class="section-content">
        <!-- 旋转 -->
        <div class="action-row">
          <button class="action-btn" @click="handleRotateCW" title="顺时针旋转 15°">
            <span>↻</span>
            <span>顺时针</span>
          </button>
          <button class="action-btn" @click="handleRotateCCW" title="逆时针旋转 15°">
            <span>↺</span>
            <span>逆时针</span>
          </button>
        </div>
        <!-- 翻转 -->
        <div class="action-row">
          <button class="action-btn" @click="handleFlipH" title="水平翻转">
            <span>↔</span>
            <span>水平翻转</span>
          </button>
          <button class="action-btn" @click="handleFlipV" title="垂直翻转">
            <span>↕</span>
            <span>垂直翻转</span>
          </button>
        </div>
        <!-- 层级 -->
        <div class="action-row">
          <button class="action-btn" @click="handleMoveUp" title="上移一层">
            <span>⬆</span>
            <span>上移</span>
          </button>
          <button class="action-btn" @click="handleMoveDown" title="下移一层">
            <span>⬇</span>
            <span>下移</span>
          </button>
        </div>
        <div class="action-row">
          <button class="action-btn" @click="handleMoveTop" title="移至顶层">
            <span>⬆⬆</span>
            <span>顶层</span>
          </button>
          <button class="action-btn" @click="handleMoveBottom" title="移至底层">
            <span>⬇⬇</span>
            <span>底层</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="property-section">
      <div class="section-header" @click="expandShortcuts = !expandShortcuts">
        <span class="section-title">快捷键</span>
        <span class="expand-icon">{{ expandShortcuts ? '▼' : '▶' }}</span>
      </div>
      <div v-show="expandShortcuts" class="section-content quick-actions">
        <div class="shortcut-row">
          <span class="shortcut-key">Ctrl+Z</span>
          <span class="shortcut-desc">撤销</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">Ctrl+Y</span>
          <span class="shortcut-desc">重做</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">Ctrl+C</span>
          <span class="shortcut-desc">复制</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">Ctrl+V</span>
          <span class="shortcut-desc">粘贴</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">Ctrl+D</span>
          <span class="shortcut-desc">复制</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">Ctrl+X</span>
          <span class="shortcut-desc">剪切</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">Ctrl+]</span>
          <span class="shortcut-desc">顺时针旋转</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">Ctrl+[</span>
          <span class="shortcut-desc">逆时针旋转</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">V</span>
          <span class="shortcut-desc">选择</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">L</span>
          <span class="shortcut-desc">直线</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">R</span>
          <span class="shortcut-desc">矩形</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">E</span>
          <span class="shortcut-desc">椭圆</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">T</span>
          <span class="shortcut-desc">三角形</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">A</span>
          <span class="shortcut-desc">箭头</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">B</span>
          <span class="shortcut-desc">画笔</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">X</span>
          <span class="shortcut-desc">橡皮擦</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key">Del</span>
          <span class="shortcut-desc">删除选中</span>
        </div>
      </div>
    </div>
    <!-- 布尔运算 -->
    <div class="property-section" v-if="hasTwoSelectedShapes">
      <div class="section-header">
        <span class="section-title">布尔运算</span>
      </div>
      <div class="section-content">
        <div class="action-row">
          <button class="action-btn" @click="handleBooleanOperation('union')">
            <span>➕</span>
            <span>并集</span>
          </button>
          <button class="action-btn" @click="handleBooleanOperation('intersect')">
            <span>🔄</span>
            <span>交集</span>
          </button>
        </div>
        <div class="action-row">
          <button class="action-btn" @click="handleBooleanOperation('difference')">
            <span>➖</span>
            <span>差集</span>
          </button>
          <button class="action-btn" @click="handleBooleanOperation('clip')">
            <span>✂️</span>
            <span>分割</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useToolStore, type LineStyle, type LineCap } from '../store/toolStore'
import { useHistoryStore } from '../store/historyStore'

const toolStore = useToolStore()
const historyStore = useHistoryStore()

// 预设颜色
const presetColors = [
  '#000000', '#FFFFFF', '#F44336', '#E91E63',
  '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
  '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107'
]

// 展开/收起状态
const expandFill = ref(true)
const expandStroke = ref(true)
const expandTransform = ref(true)
const expandAlign = ref(true)
const expandShortcuts = ref(false)

// 本地状态
const fillEnabled = ref(toolStore.state.fillEnabled)
const fillColor = ref(toolStore.state.fillColor)
const fillOpacity = ref(toolStore.state.fillOpacity)
const strokeColor = ref(toolStore.state.strokeColor)
const strokeWidth = ref(toolStore.state.strokeWidth)
const polygonSides = ref(toolStore.state.polygonSides)
const lineStyle = ref<LineStyle>(toolStore.state.lineStyle)
const lineCap = ref<LineCap>(toolStore.state.lineCap)

// 是否有选中的图形
const hasSelectedShape = ref(false)
// 是否有两个选中的图形（用于布尔运算）
const hasTwoSelectedShapes = ref(false)

// 同步本地状态
watch(() => toolStore.state.fillEnabled, (val) => { fillEnabled.value = val })
watch(() => toolStore.state.fillColor, (val) => { fillColor.value = val })
watch(() => toolStore.state.fillOpacity, (val) => { fillOpacity.value = val })
watch(() => toolStore.state.strokeColor, (val) => { strokeColor.value = val })
watch(() => toolStore.state.strokeWidth, (val) => { strokeWidth.value = val })
watch(() => toolStore.state.polygonSides, (val) => { polygonSides.value = val })
watch(() => toolStore.state.lineStyle, (val) => { lineStyle.value = val })
watch(() => toolStore.state.lineCap, (val) => { lineCap.value = val })
watch(() => toolStore.state.selectedShapeAttrs, (val) => { 
  hasSelectedShape.value = val !== null 
})

// 填充颜色选择
const selectFillColor = (color: string) => {
  fillColor.value = color
  handleFillColorChange()
}

const handleFillEnabledChange = () => {
  toolStore.setFillEnabled(fillEnabled.value)
  window.dispatchEvent(new CustomEvent('whiteboard:update-shape', { 
    detail: { type: 'fill', value: fillEnabled.value ? fillColor.value : 'transparent' }
  }))
}

const handleFillColorChange = () => {
  toolStore.setFillColor(fillColor.value)
  if (fillEnabled.value) {
    window.dispatchEvent(new CustomEvent('whiteboard:update-shape', { 
      detail: { type: 'fill', value: fillColor.value }
    }))
  }
}

const handleFillOpacityChange = () => {
  toolStore.setFillOpacity(fillOpacity.value)
  window.dispatchEvent(new CustomEvent('whiteboard:update-shape', { 
    detail: { type: 'fillOpacity', value: fillOpacity.value / 100 }
  }))
}

// 描边颜色选择
const selectStrokeColor = (color: string) => {
  strokeColor.value = color
  handleStrokeColorChange()
}

const handleStrokeColorChange = () => {
  toolStore.setStrokeColor(strokeColor.value)
  window.dispatchEvent(new CustomEvent('whiteboard:update-shape', { 
    detail: { type: 'stroke', value: strokeColor.value }
  }))
}

const handleStrokeWidthChange = () => {
  toolStore.setStrokeWidth(strokeWidth.value)
  window.dispatchEvent(new CustomEvent('whiteboard:update-shape', { 
    detail: { type: 'strokeWidth', value: strokeWidth.value }
  }))
}

// 线型选择
const selectLineStyle = (style: LineStyle) => {
  lineStyle.value = style
  toolStore.setLineStyle(style)
  let dash: number[] = []
  if (style === 'dashed') {
    dash = [10, 5]
  } else if (style === 'dotted') {
    dash = [2, 4]
  }
  window.dispatchEvent(new CustomEvent('whiteboard:update-shape', { 
    detail: { type: 'dash', value: dash }
  }))
}

// 端点样式选择
const selectLineCap = (cap: LineCap) => {
  lineCap.value = cap
  toolStore.setLineCap(cap)
  window.dispatchEvent(new CustomEvent('whiteboard:update-shape', { 
    detail: { type: 'lineCap', value: cap }
  }))
}

// 多边形边数
const handlePolygonSidesChange = () => {
  toolStore.setPolygonSides(polygonSides.value)
}

// 对齐操作
const handleAlignLeft = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:align', { detail: { type: 'left' } }))
}

const handleAlignCenterH = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:align', { detail: { type: 'centerH' } }))
}

const handleAlignRight = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:align', { detail: { type: 'right' } }))
}

const handleAlignTop = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:align', { detail: { type: 'top' } }))
}

const handleAlignCenterV = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:align', { detail: { type: 'centerV' } }))
}

const handleAlignBottom = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:align', { detail: { type: 'bottom' } }))
}

// 布尔运算操作
const handleBooleanOperation = (operation: 'union' | 'intersect' | 'difference' | 'clip') => {
  window.dispatchEvent(new CustomEvent('whiteboard:boolean-operation', { detail: { type: operation } }))
}

// 处理选中图形数量变化
const handleSelectionCountChanged = (e: CustomEvent) => {
  hasTwoSelectedShapes.value = e.detail.count === 2
}

const handleDistributeH = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:align', { detail: { type: 'distributeH' } }))
}

const handleDistributeV = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:align', { detail: { type: 'distributeV' } }))
}

// 旋转翻转处理
const handleRotateCW = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:rotate-cw'))
}

const handleRotateCCW = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:rotate-ccw'))
}

const handleFlipH = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:flip-h'))
}

const handleFlipV = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:flip-v'))
}

// 层级处理
const handleMoveUp = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:layer-up'))
}

const handleMoveDown = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:layer-down'))
}

const handleMoveTop = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:layer-top'))
}

const handleMoveBottom = () => {
  window.dispatchEvent(new CustomEvent('whiteboard:layer-bottom'))
}

// 监听图形选中事件，更新面板显示选中图形的属性
const handleShapeSelected = (e: CustomEvent) => {
  const attrs = e.detail
  if (attrs) {
    toolStore.setSelectedShapeAttrs(attrs)
    // 同步本地状态
    if (attrs.fill && attrs.fill !== 'transparent') {
      fillEnabled.value = true
      fillColor.value = attrs.fill
    } else {
      fillEnabled.value = false
    }
    if (attrs.fillOpacity !== undefined) {
      fillOpacity.value = Math.round(attrs.fillOpacity * 100)
    }
    if (attrs.stroke) {
      strokeColor.value = attrs.stroke
    }
    if (attrs.strokeWidth) {
      strokeWidth.value = attrs.strokeWidth
    }
    if (attrs.dash) {
      if (attrs.dash.length === 0) {
        lineStyle.value = 'solid'
      } else if (attrs.dash[0] === 10) {
        lineStyle.value = 'dashed'
      } else if (attrs.dash[0] === 2) {
        lineStyle.value = 'dotted'
      }
    }
    if (attrs.lineCap) {
      lineCap.value = attrs.lineCap
    }
  }
}

const handleShapeDeselected = () => {
  toolStore.clearSelectedShapeAttrs()
}

onMounted(() => {
  window.addEventListener('whiteboard:shape-selected', handleShapeSelected as EventListener)
  window.addEventListener('whiteboard:shape-deselected', handleShapeDeselected)
  // 监听选中图形数量变化
  window.addEventListener('whiteboard:selection-count-changed', handleSelectionCountChanged)
})

onUnmounted(() => {
  window.removeEventListener('whiteboard:shape-selected', handleShapeSelected as EventListener)
  window.removeEventListener('whiteboard:shape-deselected', handleShapeDeselected)
  // 移除选中图形数量变化监听
  window.removeEventListener('whiteboard:selection-count-changed', handleSelectionCountChanged)
})
</script>

<style scoped>
.right-panel {
  width: 280px;
  background-color: #FAFAFA;
  border-left: 1px solid #E0E0E0;
  overflow-y: auto;
  user-select: none;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #E0E0E0;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.property-section {
  border-bottom: 1px solid #E0E0E0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  background-color: #FFFFFF;
}

.section-header:hover {
  background-color: #F5F5F5;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #333333;
}

.expand-icon {
  font-size: 10px;
  color: #666666;
}

.section-content {
  padding: 8px 16px 16px;
  background-color: #FFFFFF;
}

.property-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.property-row:last-child {
  margin-bottom: 0;
}

.property-row label:first-child {
  font-size: 12px;
  color: #666666;
}

/* 颜色预设 */
.color-presets {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  margin-bottom: 12px;
}

.color-preset {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s ease;
}

.color-preset:hover {
  transform: scale(1.1);
}

.color-preset.active {
  border-color: #2196F3;
}

.color-custom {
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 32px;
  height: 24px;
  padding: 0;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  cursor: pointer;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 2px;
}

.color-value {
  font-size: 11px;
  color: #666666;
  font-family: monospace;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  background: #E0E0E0;
  border-radius: 2px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #2196F3;
  border-radius: 50%;
  cursor: pointer;
}

.slider-value {
  font-size: 11px;
  color: #666666;
  min-width: 36px;
  text-align: right;
}

/* 样式按钮 */
.style-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.style-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  background-color: #F5F5F5;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.style-btn:hover {
  background-color: #E3F2FD;
  border-color: #2196F3;
}

.style-btn.active {
  background-color: #E3F2FD;
  border-color: #2196F3;
}

.line-sample {
  display: block;
  width: 24px;
  height: 2px;
  background-color: #333333;
}

.line-sample.dashed {
  background: repeating-linear-gradient(
    to right,
    #333333 0px,
    #333333 4px,
    transparent 4px,
    transparent 8px
  );
}

.line-sample.dotted {
  background: repeating-linear-gradient(
    to right,
    #333333 0px,
    #333333 2px,
    transparent 2px,
    transparent 5px
  );
}

.cap-sample {
  display: block;
  width: 24px;
  height: 8px;
  background-color: #333333;
}

.cap-sample.butt {
  border-radius: 0;
}

.cap-sample.round {
  border-radius: 4px;
}

.cap-sample.square {
  border-radius: 1px;
}

/* 对齐工具栏 */
.align-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.align-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  background-color: #F5F5F5;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  cursor: pointer;
  color: #333333;
  transition: all 0.15s ease;
}

.align-btn:hover {
  background-color: #E3F2FD;
  border-color: #2196F3;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #E0E0E0;
  transition: 0.2s;
  border-radius: 20px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
  background-color: #2196F3;
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(16px);
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  font-family: monospace;
  font-weight: 600;
  color: #333333;
  background-color: #E0E0E0;
  border-radius: 4px;
}

.shortcut-desc {
  font-size: 12px;
  color: #666666;
}

/* 变换控制按钮 */
.action-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.action-row:last-child {
  margin-bottom: 0;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
  background-color: #F5F5F5;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #333333;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background-color: #E3F2FD;
  border-color: #2196F3;
}

.action-btn:active {
  background-color: #BBDEFB;
}

.action-btn span:first-child {
  font-size: 16px;
}
</style>