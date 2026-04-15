<template>
  <div class="left-panel">
    <!-- 绘图工具 -->
    <div
      v-for="tool in drawingTools"
      :key="tool.type"
      class="tool-item"
      :class="{ active: toolStore.state.currentTool === tool.type }"
      :style="{ borderLeftColor: tool.color }"
      :title="tool.title"
      @click="toolStore.setTool(tool.type)"
    >
      <span class="tool-icon">{{ tool.icon }}</span>
      <span class="tool-name">{{ tool.name }}</span>
    </div>

    <div class="panel-divider"></div>

    <!-- 扩展工具 -->
    <div
      v-for="(tool, index) in tools"
      :key="index"
      class="tool-category"
    >
      <div
        class="tool-item"
        :class="{ active: tool.subTools ? tool.activeIndex !== null : (activeIndex === index) }"
        :style="{ borderLeftColor: tool.color }"
        :title="tool.name"
        @click="handleToolClick(tool, index)"
      >
        <span class="tool-icon">{{ tool.icon }}</span>
        <span class="tool-name">{{ tool.name }}</span>
      </div>
      
      <!-- 子工具展开 -->
      <div v-if="tool.subTools && tool.activeIndex !== null" class="sub-tools">
        <div
          v-for="(subTool, subIndex) in tool.subTools"
          :key="subTool.type"
          class="tool-item sub-tool-item"
          :class="{ active: toolStore.state.currentTool === subTool.type }"
          :style="{ borderLeftColor: subTool.color }"
          :title="subTool.title"
          @click.stop="tool.onClick(subTool)"
        >
          <span class="tool-icon">{{ subTool.icon }}</span>
          <span class="tool-name">{{ subTool.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToolStore, type ToolType } from '../store/toolStore'

const toolStore = useToolStore()
const activeIndex = ref(0)
const activeRulerIndex = ref<number | null>(null)

const drawingTools: { type: ToolType; icon: string; name: string; title: string; color: string }[] = [
  { type: 'select', icon: '👆', name: '选择', title: '选择 (V)', color: '#2196F3' },
  { type: 'connect', icon: '🔗', name: '连接', title: '连接 (C)', color: '#E91E63' },
  { type: 'line', icon: '📏', name: '直线', title: '直线 (L)', color: '#4CAF50' },
  { type: 'rect', icon: '⬜', name: '矩形', title: '矩形 (R)', color: '#9C27B0' },
  { type: 'circle', icon: '⭕', name: '椭圆', title: '椭圆 (E)', color: '#FF9800' },
  { type: 'triangle', icon: '🔺', name: '三角', title: '三角形 (T)', color: '#F44336' },
  { type: 'arrow', icon: '➡️', name: '箭头', title: '箭头 (A)', color: '#00BCD4' },
  { type: 'polygon', icon: '⬡', name: '多边', title: '多边形', color: '#795548' },
  { type: 'pen', icon: '✏️', name: '画笔', title: '画笔 (B)', color: '#E91E63' },
  { type: 'eraser', icon: '🧹', name: '橡皮', title: '橡皮擦 (X)', color: '#607D8B' },
  { type: 'split', icon: '✂️', name: '分割', title: '分割 (S)', color: '#FF5722' }
]

// 处理工具点击
const handleToolClick = (tool: any, index: number) => {
  if (tool.subTools) {
    // 尺规工具：切换子工具显示
    tool.activeIndex.value = tool.activeIndex.value === null ? 0 : null
  } else {
    activeIndex.value = activeIndex.value === index ? -1 : index
  }
}

// 尺规工具列表
const rulerTools: { type: ToolType; icon: string; name: string; title: string; color: string; angleType?: number }[] = [
  { type: 'ruler', icon: '📏', name: '直尺', title: '直尺', color: '#4CAF50' },
  { type: 'protractor', icon: '📐', name: '量角器', title: '量角器', color: '#FF9800' },
  { type: 'compass', icon: '📍', name: '圆规', title: '圆规', color: '#9C27B0' },
  { type: 'setsquare', icon: '🔺', name: '三角尺', title: '三角尺 (45°/60°)', color: '#00BCD4', angleType: 45 }
]

// 三角尺角度
const currentSetsquareAngle = ref<number>(45)

// 处理尺规工具点击
const handleRulerToolClick = (tool: { type: ToolType; icon: string; name: string; title: string; color: string; angleType?: number }) => {
  // 如果点击三角尺，循环切换角度
  if (tool.type === 'setsquare') {
    currentSetsquareAngle.value = currentSetsquareAngle.value === 45 ? 60 : 45
    tool.angleType = currentSetsquareAngle.value
    // 发送事件通知切换角度
    window.dispatchEvent(new CustomEvent('whiteboard:setsquare-angle', { 
      detail: { angle: currentSetsquareAngle.value }
    }))
  }
  activeRulerIndex.value = rulerTools.findIndex(t => t.type === tool.type)
  toolStore.setTool(tool.type)
}

// 数学工具列表
const mathTools: { type: ToolType; icon: string; name: string; title: string; color: string }[] = [
  { type: 'coordinate', icon: '📊', name: '坐标系', title: '坐标系', color: '#2196F3' },
  { type: 'function', icon: '📈', name: '函数曲线', title: '函数曲线', color: '#4CAF50' },
  { type: 'numberLine', icon: '📏', name: '数轴', title: '数轴', color: '#FF9800' },
  { type: 'geometryMark', icon: '📐', name: '几何标记', title: '几何标记', color: '#9C27B0' }
]

// 几何标记子工具
const geometryMarkTools: { type: ToolType; icon: string; name: string; title: string; color: string }[] = [
  { type: 'geometryMark', icon: '∠', name: '角平分线', title: '角平分线', color: '#E91E63', data: 'angleBisector' },
  { type: 'geometryMark', icon: '⊥', name: '中垂线', title: '中垂线', color: '#00BCD4', data: 'perpendicularBisector' },
  { type: 'geometryMark', icon: '∥', name: '平行线', title: '平行线', color: '#795548', data: 'parallel' },
  { type: 'geometryMark', icon: '⟂', name: '垂线', title: '垂线', color: '#F44336', data: 'perpendicular' }
]

// 数学工具激活状态
const activeMathIndex = ref<number | null>(null)
const activeGeometryMarkIndex = ref<number | null>(null)

// 处理数学工具点击
const handleMathToolClick = (tool: { type: ToolType; icon: string; name: string; title: string; color: string }) => {
  if (tool.type === 'geometryMark') {
    // 几何标记显示子工具
    activeGeometryMarkIndex.value = activeGeometryMarkIndex.value === null ? 0 : null
  } else {
    // 其他工具直接选中
    activeMathIndex.value = mathTools.findIndex(t => t.type === tool.type)
    activeGeometryMarkIndex.value = null
    toolStore.setTool(tool.type)
    
    // 如果是函数工具，弹出输入框
    if (tool.type === 'function') {
      window.dispatchEvent(new CustomEvent('whiteboard:show-function-dialog'))
    }
  }
}

// 处理几何标记子工具点击
const handleGeometryMarkClick = (tool: { type: ToolType; icon: string; name: string; title: string; color: string; data: string }) => {
  toolStore.setTool(tool.type)
  // 发送事件通知选择了几何标记类型
  window.dispatchEvent(new CustomEvent('whiteboard:geometry-mark-type', {
    detail: { markType: tool.data }
  }))
}

// 物理工具列表
const physicsTools: { type: ToolType; icon: string; name: string; title: string; color: string; subType?: string }[] = [
  { type: 'forceArrow', icon: '→', name: '力箭头', title: '力箭头', color: '#FF5722' },
  { type: 'pulley', icon: '⚙️', name: '滑轮', title: '定滑轮', color: '#9C27B0', subType: 'fixed' },
  { type: 'spring', icon: '〰️', name: '弹簧', title: '弹簧', color: '#00BCD4' },
  { type: 'incline', icon: '📐', name: '斜面', title: '斜面', color: '#795548' },
  { type: 'lever', icon: '⚖️', name: '杠杆', title: '杠杆', color: '#FF9800' },
  { type: 'magnetic', icon: '🧲', name: '磁场', title: '磁场', color: '#3F51B5' }
]

// 物理工具激活状态
const activePhysicsIndex = ref<number | null>(null)
const activePulleyType = ref<'fixed' | 'movable'>('fixed')

// 处理物理工具点击
const handlePhysicsToolClick = (tool: { type: ToolType; icon: string; name: string; title: string; color: string; subType?: string }) => {
  if (tool.type === 'pulley') {
    // 滑轮工具切换类型
    activePulleyType.value = activePulleyType.value === 'fixed' ? 'movable' : 'fixed'
    // 发送事件通知切换滑轮类型
    window.dispatchEvent(new CustomEvent('whiteboard:pulley-type', { 
      detail: { pulleyType: activePulleyType.value }
    }))
  }
  activePhysicsIndex.value = physicsTools.findIndex(t => t.type === tool.type)
  toolStore.setTool(tool.type)
}

// ========== 化学工具 ==========
const chemistryTools: { type: ToolType; icon: string; name: string; title: string; color: string; subType?: string }[] = [
  { type: 'beaker', icon: '🧪', name: '烧杯', title: '烧杯', color: '#00BCD4' },
  { type: 'flask', icon: '⚗️', name: '烧瓶', title: '烧瓶', color: '#9C27B0', subType: 'conical' },
  { type: 'testTube', icon: '🧫', name: '试管', title: '试管', color: '#4CAF50' },
  { type: 'alcoholLamp', icon: '🔥', name: '酒精灯', title: '酒精灯', color: '#FF5722' },
  { type: 'molecule', icon: '⬡', name: '分子', title: '分子模型', color: '#E91E63', subType: 'water' }
]

// 化学工具激活状态
const activeChemistryIndex = ref<number | null>(null)
const flaskType = ref<'conical' | 'round'>('conical')
const moleculeType = ref<'water' | 'co2' | 'methane'>('water')
const testTubeAngle = ref<number>(90)

// 处理化学工具点击
const handleChemistryToolClick = (tool: { type: ToolType; icon: string; name: string; title: string; color: string; subType?: string }) => {
  if (tool.type === 'flask') {
    // 烧瓶切换类型
    flaskType.value = flaskType.value === 'conical' ? 'round' : 'conical'
    window.dispatchEvent(new CustomEvent('whiteboard:flask-type', { 
      detail: { flaskType: flaskType.value }
    }))
  } else if (tool.type === 'molecule') {
    // 分子模型循环切换：水分 -> 二氧化碳 -> 甲烷 -> 水
    const types: ('water' | 'co2' | 'methane')[] = ['water', 'co2', 'methane']
    const currentIndex = types.indexOf(moleculeType.value)
    moleculeType.value = types[(currentIndex + 1) % types.length]
    window.dispatchEvent(new CustomEvent('whiteboard:molecule-type', { 
      detail: { moleculeType: moleculeType.value }
    }))
  } else if (tool.type === 'testTube') {
    // 试管切换角度
    testTubeAngle.value = testTubeAngle.value === 90 ? 45 : (testTubeAngle.value === 45 ? 135 : 90)
    window.dispatchEvent(new CustomEvent('whiteboard:test-tube-angle', { 
      detail: { angle: testTubeAngle.value }
    }))
  }
  activeChemistryIndex.value = chemistryTools.findIndex(t => t.type === tool.type)
  toolStore.setTool(tool.type)
}

// ========== 公式工具 ==========
const formulaTools: { type: ToolType; icon: string; name: string; title: string; color: string }[] = [
  { type: 'latex', icon: '∑', name: 'LaTeX公式', title: 'LaTeX公式', color: '#F44336' },
  { type: 'chemFormula', icon: '⚗️', name: '化学方程式', title: '化学方程式', color: '#9C27B0' }
]

// 公式工具激活状态
const activeFormulaIndex = ref<number | null>(null)

// 处理公式工具点击
const handleFormulaToolClick = (tool: { type: ToolType; icon: string; name: string; title: string; color: string }) => {
  activeFormulaIndex.value = formulaTools.findIndex(t => t.type === tool.type)
  toolStore.setTool(tool.type)
  
  // 弹出对应的输入对话框
  if (tool.type === 'latex') {
    window.dispatchEvent(new CustomEvent('whiteboard:show-latex-dialog'))
  } else if (tool.type === 'chemFormula') {
    window.dispatchEvent(new CustomEvent('whiteboard:show-chem-dialog'))
  }
}

// ========== 多页面工具 ==========
const pageTools: { type: string; icon: string; name: string; title: string; color: string }[] = [
  { type: 'add', icon: '➕', name: '新建页面', title: '新建页面', color: '#4CAF50' },
  { type: 'delete', icon: '🗑️', name: '删除页面', title: '删除当前页面', color: '#F44336' },
  { type: 'clone', icon: '📋', name: '复制页面', title: '复制当前页面', color: '#2196F3' },
  { type: 'list', icon: '📑', name: '页面列表', title: '打开页面列表', color: '#9C27B0' }
]

// 多页面工具激活状态
const activePageToolIndex = ref<number | null>(null)

// 处理多页面工具点击
const handlePageToolClick = (tool: { type: string; icon: string; name: string; title: string; color: string }) => {
  activePageToolIndex.value = pageTools.findIndex(t => t.type === tool.type)
  
  switch (tool.type) {
    case 'add':
      window.dispatchEvent(new CustomEvent('whiteboard:add-page'))
      break
    case 'delete':
      if (confirm('确定要删除当前页面吗？')) {
        window.dispatchEvent(new CustomEvent('whiteboard:delete-page'))
      }
      break
    case 'clone':
      window.dispatchEvent(new CustomEvent('whiteboard:clone-page'))
      break
    case 'list':
      window.dispatchEvent(new CustomEvent('whiteboard:show-page-list'))
      break
  }
}

const tools = [
  { icon: '📐', name: '基础图形', color: '#2196F3' },
  { icon: '📏', name: '尺规工具', color: '#4CAF50', subTools: rulerTools, activeIndex: activeRulerIndex, onClick: handleRulerToolClick },
  { 
    icon: '📈', 
    name: '数学工具', 
    color: '#9C27B0', 
    subTools: [
      ...mathTools.map(t => ({ 
        ...t, 
        onClick: handleMathToolClick,
        activeIndex: activeMathIndex,
        subTools: t.type === 'geometryMark' ? geometryMarkTools.map(gt => ({
          ...gt,
          onClick: handleGeometryMarkClick
        })) : null,
        activeGeometryIndex: activeGeometryMarkIndex
      }))
    ], 
    activeIndex: activeMathIndex,
    onClick: () => {} 
  },
  { icon: '⚛️', name: '物理工具', color: '#FF9800', subTools: physicsTools, activeIndex: activePhysicsIndex, onClick: handlePhysicsToolClick },
  { icon: '🧪', name: '化学工具', color: '#00BCD4', subTools: chemistryTools, activeIndex: activeChemistryIndex, onClick: handleChemistryToolClick },
  { icon: '∑', name: '公式工具', color: '#F44336', subTools: formulaTools, activeIndex: activeFormulaIndex, onClick: handleFormulaToolClick },
  { icon: '✍️', name: '手写工具', color: '#795548' },
  { icon: '📄', name: '多页面', color: '#607D8B', subTools: pageTools, activeIndex: activePageToolIndex, onClick: handlePageToolClick }
]
</script>

<style scoped>
.left-panel {
  display: flex;
  flex-direction: column;
  width: 72px;
  background-color: #FAFAFA;
  border-right: 1px solid #E0E0E0;
  padding: 8px 0;
  user-select: none;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 64px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-left: 3px solid transparent;
}

.tool-item:hover {
  background-color: #E8E8E8;
}

.tool-item.active {
  background-color: #E3F2FD;
}

.tool-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.tool-name {
  font-size: 10px;
  color: #666666;
  text-align: center;
}

.tool-item.active .tool-name {
  color: #2196F3;
  font-weight: 500;
}

.panel-divider {
  height: 1px;
  background-color: #E0E0E0;
  margin: 8px 8px;
}

.tool-category {
  display: flex;
  flex-direction: column;
}

.sub-tools {
  background-color: #F5F5F5;
  border-left: 2px solid #4CAF50;
}

.sub-tool-item {
  height: 56px !important;
}

.sub-tool-item .tool-icon {
  font-size: 20px;
}

.sub-tool-item .tool-name {
  font-size: 9px;
}
</style>