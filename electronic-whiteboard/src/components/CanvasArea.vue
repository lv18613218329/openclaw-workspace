<template>
  <div class="canvas-area" ref="containerRef">
    <v-stage
      ref="stageRef"
      :config="stageConfig"
      @wheel="handleWheel"
      @dragend="handleDragEnd"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @click="handleClick"
    >
      <v-layer>
        <template v-if="gridConfig.visible">
          <v-line v-for="(line, i) in gridLines.vertical" :key="'v-' + i" :config="{ points: [line.x, line.y1, line.x, line.y2], stroke: gridConfig.stroke, strokeWidth: gridConfig.strokeWidth }" />
          <v-line v-for="(line, i) in gridLines.horizontal" :key="'h-' + i" :config="{ points: [line.x1, line.y, line.x2, line.y], stroke: gridConfig.stroke, strokeWidth: gridConfig.strokeWidth }" />
        </template>
      </v-layer>
      
      <v-layer ref="layerRef">
        <template v-for="(shape, index) in shapes" :key="shape.attrs.id || shape.id">
          <component
            :is="getShapeComponent(shape.type)"
            :config="getShapeConfig(shape)"
            @dragmove="handleShapeDragMove($event, index)"
            @dragend="handleShapeDragEnd($event, index)"
            @transformend="handleTransformEnd($event, index)"
          />
        </template>
        
        <template v-if="previewShape">
          <component
            :is="getShapeComponent(previewShape.type)"
            :config="getShapeConfig(previewShape)"
          />
        </template>
      </v-layer>

      <v-layer ref="connectionLayerRef">
        <v-line 
          v-for="conn in connections" 
          :key="conn.id" 
          :config="getConnectionLineConfig(conn)" 
        />
        <v-line v-if="connectionPreview" :config="connectionPreview" />
      </v-layer>

      <v-layer ref="connectionPointsLayerRef">
        <template v-if="showConnectionPoints">
          <template v-for="shape in connectableShapes" :key="'cp-' + shape.id">
            <v-circle
              v-for="(point, pIndex) in shape.connectionPoints"
              :key="'cp-' + shape.id + '-' + pIndex"
              :config="{
                x: point.x,
                y: point.y,
                radius: 8,
                fill: point.hovered ? '#4a90d9' : '#FFFFFF',
                stroke: '#4a90d9',
                strokeWidth: 2,
                name: 'connection-point-' + shape.id + '-' + pIndex
              }"
              @mouseenter="handleConnectionPointHover(shape.id, pIndex, true)"
              @mouseleave="handleConnectionPointHover(shape.id, pIndex, false)"
              @mousedown="handleConnectionPointMouseDown(shape.id, pIndex, $event)"
            />
          </template>
        </template>
      </v-layer>
      
      <v-layer ref="transformerLayerRef">
        <v-transformer
          ref="transformerRef"
          :config="transformerConfig"
        />
      </v-layer>
      
      <!-- 分割线预览图层 -->
      <v-layer>
        <v-line
          v-if="isSplitting && splitLineStart && splitLineEnd"
          :config="{
            points: [splitLineStart.x, splitLineStart.y, splitLineEnd.x, splitLineEnd.y],
            stroke: '#ff0000',
            strokeWidth: 3,
            dash: [3, 3],
            lineCap: 'round',
            globalCompositeOperation: 'source-over'
          }"
        />
      </v-layer>
      
      <!-- 分割点图层 -->
      <v-layer>
        <template v-if="showSplitPoints">
          <template v-for="(points, shapeId) in splitPoints" :key="'sp-' + shapeId">
            <v-circle
              v-for="(point, pIndex) in points"
              :key="'sp-' + shapeId + '-' + pIndex"
              :config="{
                x: point.x,
                y: point.y,
                radius: 8,
                fill: point.selected ? '#ff6b6b' : '#FFFFFF',
                stroke: '#ff6b6b',
                strokeWidth: 2,
                name: 'split-point-' + shapeId + '-' + pIndex
              }"
              @mouseenter="handleSplitPointHover(shapeId, true)"
              @mouseleave="handleSplitPointHover(shapeId, false)"
              @mousedown="handleSplitPointMouseDown(shapeId, pIndex, $event)"
            />
          </template>
        </template>
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useToolStore, type ToolType } from '../store/toolStore'
import { useHistoryStore } from '../store/historyStore'
import { usePageStore } from '../store/pageStore'
import { PolygonUtils, type Point } from '../utils/polygon'

interface Shape {
  id: string
  type: ToolType
  attrs: Record<string, any>
}

interface Point {
  x: number
  y: number
}

interface ConnectionPoint {
  x: number
  y: number
  hovered: boolean
}

interface ConnectableShape {
  id: string
  connectionPoints: ConnectionPoint[]
}

interface Connection {
  id: string
  fromShapeId: string
  fromPointIndex: number
  toShapeId: string
  toPointIndex: number
  stroke: string
  strokeWidth: number
}

const toolStore = useToolStore()
const historyStore = useHistoryStore()
const pageStore = usePageStore()
const containerRef = ref<HTMLElement | null>(null)
const stageRef = ref<any>(null)
const layerRef = ref<any>(null)
const transformerRef = ref<any>(null)
const transformerLayerRef = ref<any>(null)

const themeColors = {
  white: { canvasBg: '#FFFFFF', containerBg: '#E0E0E0', gridColor: '#E8E8E8' },
  black: { canvasBg: '#2D5A27', containerBg: '#1E3D1A', gridColor: '#3D6B35' },
  dark: { canvasBg: '#1E1E1E', containerBg: '#121212', gridColor: '#2D2D2D' }
}

const currentThemeColors = computed(() => themeColors[toolStore.state.theme])

const stageConfig = reactive({ width: 800, height: 600 })
const gridConfig = reactive({ visible: false, spacing: 20, stroke: '#E8E8E8', strokeWidth: 1 })

const gridLines = computed(() => {
  if (!gridConfig.visible) return { vertical: [], horizontal: [] }
  const vLines = []
  const hLines = []
  const spacing = gridConfig.spacing
  for (let x = 0; x <= stageConfig.width; x += spacing) {
    vLines.push({ x, y1: 0, y2: stageConfig.height })
  }
  for (let y = 0; y <= stageConfig.height; y += spacing) {
    hLines.push({ x1: 0, x2: stageConfig.width, y })
  }
  return { vertical: vLines, horizontal: hLines }
})

const transformerConfig = reactive({
  borderStroke: '#2196F3', borderStrokeWidth: 2,
  anchorFill: '#FFFFFF', anchorStroke: '#2196F3', anchorSize: 10, rotateAnchorOffset: 30,
  enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center'],
  boundBoxFunc: (oldBox: any, newBox: any) => {
    if (newBox.width < 5 || newBox.height < 5) return oldBox
    return newBox
  }
})

const shapes = ref<Shape[]>([])
const selectedShapeIndex = ref<number | null>(null)
// 多选支持：存储所有选中图形的索引
const selectedShapeIndexes = ref<number[]>([])
const isDrawing = ref(false)
const startPoint = ref<Point | null>(null)
const currentPoint = ref<Point | null>(null)
const previewShape = ref<Shape | null>(null)
const penPoints = ref<Point[]>([])
const compassState = ref<{ center: Point | null; radius: number; step: number }>({ center: null, radius: 0, step: 1 })

// 分割工具状态
const isSplitting = ref(false)
const splitLineStart = ref<Point | null>(null)
const splitLineEnd = ref<Point | null>(null)
const showSplitPoints = ref(false)
const splitPoints = ref<{ [shapeId: string]: Array<{ x: number; y: number; selected: boolean }> }>({})
const splittingFrom = ref<{ shapeId: string; pointIndex: number } | null>(null)
const currentHoveredSplitShape = ref<string | null>(null)

const connections = ref<Connection[]>([])
const connectionPreview = ref<any>(null)
const showConnectionPoints = ref(false)
const connectableShapes = ref<ConnectableShape[]>([])
const connectingFrom = ref<{ shapeId: string; pointIndex: number } | null>(null)
const currentHoveredPoint = ref<{ shapeId: string; pointIndex: number } | null>(null)

const connectionLayerRef = ref<any>(null)
const connectionPointsLayerRef = ref<any>(null)

const generateId = () => `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

const getShapeComponent = (type: ToolType): string => {
  const map: Record<ToolType, string> = {
    select: 'v-rect', line: 'v-line', rect: 'v-rect', circle: 'v-circle',
    triangle: 'v-line', polygon: 'v-line', arrow: 'v-arrow',
    pen: 'v-line', eraser: 'v-rect', ruler: 'v-group', protractor: 'v-group',
    compass: 'v-group', setsquare: 'v-group', coordinate: 'v-group',
    function: 'v-group', numberLine: 'v-group', geometryMark: 'v-group',
    forceArrow: 'v-group', pulley: 'v-group', spring: 'v-group',
    incline: 'v-group', lever: 'v-group', magnetic: 'v-group',
    beaker: 'v-group', flask: 'v-group', testTube: 'v-group',
    alcoholLamp: 'v-group', molecule: 'v-group', latex: 'v-group', chemFormula: 'v-group',
    connect: 'v-line', split: 'v-line'
  }
  return map[type] || 'v-rect'
}

const getShapeConfig = (shape: Shape): Record<string, any> => {
  const config = { ...shape.attrs, id: shape.attrs.id || shape.id }
  // 只有在选择工具下，选中的图形才可以拖动
  if (shape.attrs.isSelected && toolStore.state.currentTool === 'select') {
    config.draggable = true
  } else {
    config.draggable = false
  }
  return config
}

const getConnectableShapeTypes = (): ToolType[] => {
  return ['rect', 'circle', 'triangle', 'polygon', 'line', 'arrow']
}

const getConnectionPointsForShape = (shape: Shape): ConnectionPoint[] => {
  const points: ConnectionPoint[] = []
  const attrs = shape.attrs
  const stage = stageRef.value?.getNode()
  const shapeId = attrs.id || shape.id
  const node = stage?.findOne('#' + shapeId)
  
  switch (shape.type) {
    case 'rect':
      let rx = attrs.x || 0
      let ry = attrs.y || 0
      let rw = attrs.width || 0
      let rh = attrs.height || 0
      
      if (node) {
        rx = node.x()
        ry = node.y()
        rw = node.width() * (node.scaleX() || 1)
        rh = node.height() * (node.scaleY() || 1)
      }
      
      points.push(
        { x: rx + rw / 2, y: ry, hovered: false },
        { x: rx + rw, y: ry + rh / 2, hovered: false },
        { x: rx + rw / 2, y: ry + rh, hovered: false },
        { x: rx, y: ry + rh / 2, hovered: false }
      )
      break
    case 'circle':
      let cx = attrs.x || 0
      let cy = attrs.y || 0
      let cr = attrs.radius || 0
      
      if (node) {
        cx = node.x()
        cy = node.y()
        cr = node.radius() * (node.scaleX() || 1)
      }
      
      points.push(
        { x: cx, y: cy - cr, hovered: false },
        { x: cx + cr, y: cy, hovered: false },
        { x: cx, y: cy + cr, hovered: false },
        { x: cx - cr, y: cy, hovered: false }
      )
      break
    case 'triangle':
      if (attrs.points && attrs.points.length >= 6) {
        const p = attrs.points
        points.push(
          { x: (p[0] + p[2]) / 2, y: (p[1] + p[3]) / 2, hovered: false },
          { x: (p[2] + p[4]) / 2, y: (p[3] + p[5]) / 2, hovered: false },
          { x: (p[4] + p[0]) / 2, y: (p[5] + p[1]) / 2, hovered: false }
        )
      }
      break
    case 'polygon':
      let px = attrs.x || 0
      let py = attrs.y || 0
      let pr = attrs.radius || 0
      const sides = attrs.sides || 5
      
      if (node) {
        px = node.x()
        py = node.y()
        // 多边形节点没有radius方法，直接使用属性值
        pr = (attrs.radius || 0) * (node.scaleX() || 1)
      }
      
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) - Math.PI / 2
        points.push({
          x: px + pr * Math.cos(angle),
          y: py + pr * Math.sin(angle),
          hovered: false
        })
      }
      break
    case 'line':
    case 'arrow':
      if (attrs.points && attrs.points.length >= 4) {
        points.push(
          { x: attrs.points[0], y: attrs.points[1], hovered: false },
          { x: attrs.points[2], y: attrs.points[3], hovered: false }
        )
      }
      break
  }
  
  return points
}

// 为图形生成分割点
const getSplitPointsForShape = (shape: Shape): Array<{ x: number; y: number; selected: boolean }> => {
  const points: Array<{ x: number; y: number; selected: boolean }> = []
  const attrs = shape.attrs
  const stage = stageRef.value?.getNode()
  const shapeId = attrs.id || shape.id
  const node = stage?.findOne('#' + shapeId)
  
  switch (shape.type) {
    case 'rect':
      let rx = attrs.x || 0
      let ry = attrs.y || 0
      let rw = attrs.width || 0
      let rh = attrs.height || 0
      
      if (node) {
        rx = node.x()
        ry = node.y()
        rw = node.width() * (node.scaleX() || 1)
        rh = node.height() * (node.scaleY() || 1)
      }
      
      // 矩形的分割点：四个角点
      points.push(
        { x: rx, y: ry, selected: false },
        { x: rx + rw, y: ry, selected: false },
        { x: rx + rw, y: ry + rh, selected: false },
        { x: rx, y: ry + rh, selected: false }
      )
      break
    case 'circle':
      let cx = attrs.x || 0
      let cy = attrs.y || 0
      let cr = attrs.radius || 0
      
      if (node) {
        cx = node.x()
        cy = node.y()
        cr = node.radius() * (node.scaleX() || 1)
      }
      
      // 圆形的分割点：8个均匀分布的点
      for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI / 8) - Math.PI / 2
        points.push({
          x: cx + cr * Math.cos(angle),
          y: cy + cr * Math.sin(angle),
          selected: false
        })
      }
      break
    case 'triangle':
      if (attrs.points && attrs.points.length >= 6) {
        const p = attrs.points
        // 三角形的分割点：三个顶点
        points.push(
          { x: p[0], y: p[1], selected: false },
          { x: p[2], y: p[3], selected: false },
          { x: p[4], y: p[5], selected: false }
        )
      }
      break
    case 'polygon':
      let px = attrs.x || 0
      let py = attrs.y || 0
      let pr = attrs.radius || 0
      const sides = attrs.sides || 5
      
      if (node) {
        px = node.x()
        py = node.y()
        pr = (attrs.radius || 0) * (node.scaleX() || 1)
      }
      
      // 多边形的分割点：所有顶点
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) - Math.PI / 2
        points.push({
          x: px + pr * Math.cos(angle),
          y: py + pr * Math.sin(angle),
          selected: false
        })
      }
      break
  }
  
  return points
}

const updateConnectableShapes = () => {
  const connectableTypes = getConnectableShapeTypes()
  connectableShapes.value = shapes.value
    .filter(shape => connectableTypes.includes(shape.type))
    .map(shape => ({
      id: shape.attrs.id || shape.id,
      connectionPoints: getConnectionPointsForShape(shape)
    }))
  console.log('updateConnectableShapes:', connectableShapes.value.length, 'shapes')
  console.log('connectableShapes:', connectableShapes.value.map(s => ({ id: s.id, points: s.connectionPoints.length })))
}

const getConnectionLineConfig = (conn: Connection): any => {
  const fromShape = connectableShapes.value.find(s => s.id === conn.fromShapeId)
  const toShape = connectableShapes.value.find(s => s.id === conn.toShapeId)
  
  if (!fromShape || !toShape) {
    console.warn('getConnectionLineConfig: Missing shape', conn.id, 'from:', conn.fromShapeId, 'to:', conn.toShapeId)
    return { points: [], stroke: conn.stroke, strokeWidth: conn.strokeWidth }
  }
  
  const fromPoint = fromShape.connectionPoints[conn.fromPointIndex]
  const toPoint = toShape.connectionPoints[conn.toPointIndex]
  
  if (!fromPoint || !toPoint) {
    console.warn('getConnectionLineConfig: Missing point', 'fromIndex:', conn.fromPointIndex, 'toIndex:', conn.toPointIndex)
    return { points: [], stroke: conn.stroke, strokeWidth: conn.strokeWidth }
  }
  
  return {
    id: conn.id,
    points: [fromPoint.x, fromPoint.y, toPoint.x, toPoint.y],
    stroke: conn.stroke,
    strokeWidth: conn.strokeWidth,
    lineCap: 'round',
    lineJoin: 'round'
  }
}

const updateConnectionLines = () => {
  updateConnectableShapes()
  const layer = connectionLayerRef.value?.getNode()
  if (layer) {
    layer.batchDraw()
  }
}

let isOnConnectionPoint = false

const handleConnectionPointHover = (shapeId: string, pointIndex: number, isHovered: boolean) => {
  const shape = connectableShapes.value.find(s => s.id === shapeId)
  if (shape && shape.connectionPoints[pointIndex]) {
    shape.connectionPoints[pointIndex].hovered = isHovered
  }
  isOnConnectionPoint = isHovered
  if (isHovered) {
    currentHoveredPoint.value = { shapeId, pointIndex }
  } else {
    currentHoveredPoint.value = null
  }
}

const handleConnectionPointMouseDown = (shapeId: string, pointIndex: number, e: any) => {
  e.evt.stopPropagation()
  isOnConnectionPoint = true
  
  console.log('=== handleConnectionPointMouseDown ===')
  console.log('shapeId:', shapeId, 'pointIndex:', pointIndex)
  console.log('connectingFrom before:', JSON.stringify(connectingFrom.value))
  
  if (connectingFrom.value === null) {
    connectingFrom.value = { shapeId, pointIndex }
    const shape = connectableShapes.value.find(s => s.id === shapeId)
    if (shape) {
      const point = shape.connectionPoints[pointIndex]
      connectionPreview.value = {
        points: [point.x, point.y, point.x, point.y],
        stroke: toolStore.state.strokeColor,
        strokeWidth: toolStore.state.strokeWidth,
        dash: [5, 5]
      }
      console.log('Started connection from:', point)
    }
  } else {
    console.log('Already connecting from another point, canceling previous connection')
    // 如果已经在连接过程中，点击另一个连接点会取消之前的连接并开始新的连接
    connectingFrom.value = { shapeId, pointIndex }
    const shape = connectableShapes.value.find(s => s.id === shapeId)
    if (shape) {
      const point = shape.connectionPoints[pointIndex]
      connectionPreview.value = {
        points: [point.x, point.y, point.x, point.y],
        stroke: toolStore.state.strokeColor,
        strokeWidth: toolStore.state.strokeWidth,
        dash: [5, 5]
      }
      console.log('Started new connection from:', point)
    }
  }
  console.log('connectingFrom after:', JSON.stringify(connectingFrom.value))
}

// 处理分割点悬停
const handleSplitPointHover = (shapeId: string, isHovered: boolean) => {
  if (isHovered) {
    currentHoveredSplitShape.value = shapeId
  } else {
    currentHoveredSplitShape.value = null
  }
}

// 处理分割点鼠标按下
const handleSplitPointMouseDown = (shapeId: string, pointIndex: number, e: any) => {
  e.evt.stopPropagation()
  
  console.log('=== handleSplitPointMouseDown ===')
  console.log('鼠标事件目标:', e.target.className, 'name:', e.target.attrs.name)
  console.log('shapeId:', shapeId, 'pointIndex:', pointIndex)
  console.log('当前分割状态:', splittingFrom.value ? '正在分割中' : '未开始分割')
  console.log('当前分割起始点:', splittingFrom.value)
  
  if (splittingFrom.value === null) {
    // 开始分割
    console.log('开始分割 - 设置起始点')
    splittingFrom.value = { shapeId, pointIndex }
    const points = splitPoints.value[shapeId]
    console.log('获取到的分割点:', points)
    
    if (points && points[pointIndex]) {
      // 将第一个点标记为选中（实心）
      console.log('标记第一个点为选中:', shapeId, pointIndex)
      points[pointIndex].selected = true
      
      const point = points[pointIndex]
      isSplitting.value = true
      splitLineStart.value = point
      splitLineEnd.value = point
      console.log('分割状态更新: isSplitting=true, splitLineStart=', point)
    } else {
      console.error('未找到指定的分割点:', shapeId, pointIndex)
    }
  } else {
    // 完成分割
    console.log('完成分割 - 处理第二个点')
    const fromShapeId = splittingFrom.value.shapeId
    const fromPointIndex = splittingFrom.value.pointIndex
    
    console.log('起始点信息: shapeId=', fromShapeId, 'pointIndex=', fromPointIndex)
    console.log('结束点信息: shapeId=', shapeId, 'pointIndex=', pointIndex)
    
    // 确保在同一个图形上选择了两个点
    if (fromShapeId === shapeId) {
      console.log('在同一个图形上选择了两个点')
      const fromPoints = splitPoints.value[fromShapeId]
      const toPoints = splitPoints.value[shapeId]
      
      console.log('起始点的分割点数组:', fromPoints)
      console.log('结束点的分割点数组:', toPoints)
      
      if (fromPoints && toPoints && fromPoints[fromPointIndex] && toPoints[pointIndex]) {
        // 将第二个点标记为选中（实心）
        console.log('标记第二个点为选中:', shapeId, pointIndex)
        toPoints[pointIndex].selected = true
        
        const startPoint = fromPoints[fromPointIndex]
        const endPoint = toPoints[pointIndex]
        
        console.log('分割线信息: 从', startPoint, '到', endPoint)
        
        // 执行分割，但不选中新生成的图形
        const shapeIndex = shapes.value.findIndex(s => (s.attrs.id || s.id) === shapeId)
        console.log('查找图形索引:', shapeId, '结果:', shapeIndex)
        
        if (shapeIndex !== -1) {
          console.log('执行分割操作')
          // 设置选中的图形索引，这样splitSelectedShape函数才能正常工作
          selectedShapeIndex.value = shapeIndex
          splitSelectedShape(startPoint, endPoint)
        } else {
          console.error('未找到要分割的图形:', shapeId)
        }
      } else {
        console.error('分割点数据不完整:', { fromPoints, toPoints, fromPointIndex, pointIndex })
      }
    } else {
      console.error('不能在不同图形之间分割')
    }
    
    // 重置所有分割点的选中状态
    console.log('重置所有分割点的选中状态')
    Object.values(splitPoints.value).forEach(points => {
      points.forEach(point => {
        point.selected = false
      })
    })
    
    // 重置分割状态
    console.log('重置分割状态')
    splittingFrom.value = null
    isSplitting.value = false
    splitLineStart.value = null
    splitLineEnd.value = null
    
    // 取消所有图形的选中状态
    console.log('取消所有图形的选中状态')
    deselectShape()
    
    console.log('=== 分割完成 ===')
  }
}

const handleConnectionMouseMove = () => {
  if (connectingFrom.value && connectionPreview.value) {
    const pos = getRelativePointerPosition()
    if (pos) {
      const shape = connectableShapes.value.find(s => s.id === connectingFrom.value!.shapeId)
      if (shape) {
        const point = shape.connectionPoints[connectingFrom.value.pointIndex]
        connectionPreview.value.points = [point.x, point.y, pos.x, pos.y]
      }
    }
  }
}

const handleConnectionMouseUp = () => {
  if (connectingFrom.value) {
    // 如果当前悬停在连接点上，自动创建连接
    if (currentHoveredPoint.value && 
        (currentHoveredPoint.value.shapeId !== connectingFrom.value.shapeId || 
         currentHoveredPoint.value.pointIndex !== connectingFrom.value.pointIndex)) {
      const newConnection: Connection = {
        id: generateId(),
        fromShapeId: connectingFrom.value.shapeId,
        fromPointIndex: connectingFrom.value.pointIndex,
        toShapeId: currentHoveredPoint.value.shapeId,
        toPointIndex: currentHoveredPoint.value.pointIndex,
        stroke: toolStore.state.strokeColor,
        strokeWidth: toolStore.state.strokeWidth
      }
      connections.value.push(newConnection)
      
      nextTick(() => {
        updateConnectableShapes()
        const layer = connectionLayerRef.value?.getNode()
        if (layer) {
          layer.batchDraw()
        }
      })
      
      historyStore.saveState(shapes.value)
    }
    connectingFrom.value = null
    connectionPreview.value = null
    currentHoveredPoint.value = null
  }
}

const updateSize = () => {
  if (containerRef.value) {
    stageConfig.width = containerRef.value.clientWidth
    stageConfig.height = containerRef.value.clientHeight
  }
}

const getRelativePointerPosition = (): Point | null => {
  const stage = stageRef.value?.getNode()
  if (!stage) return null
  const transform = stage.getAbsoluteTransform().copy()
  transform.invert()
  const pos = stage.getPointerPosition()
  if (!pos) return null
  return transform.point(pos)
}

const handleWheel = (e: any) => {
  e.evt.preventDefault()
  const stage = stageRef.value?.getNode()
  if (!stage) return
  const oldScale = stage.scaleX()
  const pointer = stage.getPointerPosition()
  if (!pointer) return
  const scaleBy = 1.1
  const direction = e.evt.deltaY > 0 ? -1 : 1
  const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
  if (newScale < 0.1 || newScale > 10) return
  const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale }
  const newPos = { x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale }
  stage.scale({ x: newScale, y: newScale })
  stage.position(newPos)
}

const handleDragEnd = () => {}

const handleMouseDown = (e: any) => {
  const stage = stageRef.value?.getNode()
  if (!stage) return
  const tool = toolStore.state.currentTool
  const pos = getRelativePointerPosition()
  if (!pos) return
  
  const transformer = transformerRef.value?.getNode()
  if (e.target === transformer || (e.target !== stage && tool === 'select')) {
  } else if (e.target === stage && tool !== 'select' && tool !== 'split') {
    if (!isOnConnectionPoint) {
      deselectShape()
    }
  }
  
  if (tool === 'connect') {
    isOnConnectionPoint = false
    return
  }
  
  if (tool === 'select' || tool === 'eraser' || tool === 'split') return
  
  // 其他绘图工具的处理逻辑
  isDrawing.value = true
  startPoint.value = pos
  currentPoint.value = pos
  updatePreviewShape()
}

const handleMouseMove = (e: any) => {
  const tool = toolStore.state.currentTool
  const stage = stageRef.value?.getNode()
  if (!stage) return
  const pos = getRelativePointerPosition()
  if (!pos) return

  if (tool === 'connect') {
    handleConnectionMouseMove()
    return
  }

  if (tool === 'eraser') {
    const shape = e?.target
    if (shape && shape !== stage && shapes.value.length > 0) {
      const shapeIndex = shapes.value.findIndex(s => stage.findOne('#' + s.id) === shape)
      if (shapeIndex !== -1) { shapes.value.splice(shapeIndex, 1); deselectShape() }
    }
    return
  }

  // 分割工具处理
  if (tool === 'split' && isSplitting.value && splitLineStart.value) {
    // 只在连接分割点时更新分割线预览
    splitLineEnd.value = pos
    console.log('分割线移动:', splitLineStart.value, '→', pos)
    return
  }

  if (!isDrawing.value || !startPoint.value) return
  currentPoint.value = pos
  updatePreviewShape()
}

const handleMouseUp = () => {
  const tool = toolStore.state.currentTool
  if (tool === 'connect') {
    // 无论是否在连接点上，都处理连接创建
    handleConnectionMouseUp()
    isOnConnectionPoint = false
    return
  }
  if (tool === 'eraser') return
  
  // 分割工具现在通过点击分割点进行操作，这里不需要处理
  
  if (!isDrawing.value || !startPoint.value || !currentPoint.value) {
    isDrawing.value = false; return
  }
  finishDrawing()
}

const handleClick = (e: any) => {
  const tool = toolStore.state.currentTool
  const stage = stageRef.value?.getNode()
  if (!stage) return

  let clickedShape = e.target
  const transformer = transformerRef.value?.getNode()
  
  if (clickedShape === transformer && transformer?.nodes().length > 0) {
    clickedShape = transformer.nodes()[0]
  }
  
  if (clickedShape === stage || clickedShape === transformer) { 
    deselectShape()
    return
  }
  
  const clickedId = clickedShape?.attrs?.id || (typeof clickedShape?.id === 'function' ? clickedShape.id() : null)
  console.log('Click:', clickedShape?.className, 'id:', clickedId)
  console.log('Available shapes:', shapes.value.map(s => s.attrs.id || s.id))

  if (tool === 'eraser') {
    if (clickedShape && shapes.value.length > 0) {
      const shapeIndex = shapes.value.findIndex(s => (s.attrs.id || s.id) === clickedId)
      if (shapeIndex !== -1) { shapes.value.splice(shapeIndex, 1); deselectShape() }
    }
    return
  }

  if (tool === 'connect') {
    return
  }

  if (tool === 'select' || tool === 'split') {
    // 检查点击的是否是分割点，如果是，不执行默认选择逻辑，让分割点的mousedown事件处理
    if (clickedShape?.attrs?.name?.includes('split-point-')) {
      console.log('点击的是分割点，跳过选择逻辑')
      return
    }
    
    const shapeIndex = shapes.value.findIndex(s => (s.attrs.id || s.id) === clickedId)
    console.log('shapeIndex:', shapeIndex)
    if (shapeIndex !== -1) {
      // 获取Shift键的状态
      const isShiftPressed = e.evt.shiftKey || e.evt.metaKey // 支持Shift和Cmd键
      selectShape(shapeIndex, isShiftPressed)
    }
  }
}

/**
 * 处理工具切换事件
 * @param event 工具切换事件
 */
const handleToolChanged = (event: Event) => {
  const { oldTool, newTool } = (event as CustomEvent).detail
  const stage = stageRef.value?.getNode()
  
  if (!stage) return
  
  console.log('工具切换:', oldTool, '→', newTool)
  
  // 当从选择工具切换到分割工具时，暂时禁用选中图形的可拖动状态
  if (newTool === 'split') {
    // 清除transformer的节点，避免在分割时触发缩放
    const transformer = transformerRef.value?.getNode()
    if (transformer) {
      transformer.nodes([])
      console.log('分割工具 - 清除transformer节点')
    }
    
    if (selectedShapeIndex.value !== null) {
      const shape = shapes.value[selectedShapeIndex.value]
      const shapeId = shape.attrs.id || shape.id
      const shapeNode = stage.findOne('#' + shapeId)
      
      if (shapeNode) {
        // 保存当前的可拖动状态，以便切换回选择工具时恢复
        shape.attrs._originalDraggable = shapeNode.draggable()
        shapeNode.draggable(false)
        console.log('分割工具 - 禁用图形拖动:', shapeId)
      }
    }
  } 
  // 当从分割工具切换回选择工具时，恢复图形的可拖动状态
  else if (oldTool === 'split' && newTool === 'select') {
    const transformer = transformerRef.value?.getNode()
    const transformerLayer = transformerLayerRef.value?.getNode()
    const layer = layerRef.value?.getNode()
    
    if (selectedShapeIndex.value !== null) {
      const shape = shapes.value[selectedShapeIndex.value]
      const shapeId = shape.attrs.id || shape.id
      const shapeNode = stage.findOne('#' + shapeId)
      
      if (shapeNode) {
        // 恢复可拖动状态
        if (shape.attrs._originalDraggable !== undefined) {
          shapeNode.draggable(shape.attrs._originalDraggable)
          delete shape.attrs._originalDraggable
          console.log('选择工具 - 恢复图形拖动:', shapeId)
        } else {
          shapeNode.draggable(true)
        }
        
        // 将图形重新添加到transformer中
        if (transformer) {
          transformer.nodes([shapeNode])
          console.log('选择工具 - 恢复图形到transformer:', shapeId)
          
          // 刷新图层
          if (layer && transformerLayer) {
            layer.batchDraw()
            transformerLayer.batchDraw()
          }
        }
      }
    }
  }
}

const updatePreviewShape = () => {
  if (!startPoint.value || !currentPoint.value) return
  const tool = toolStore.state.currentTool
  const { strokeColor, fillColor, strokeWidth, fillEnabled } = toolStore.state
  const start = startPoint.value
  const end = currentPoint.value
  const w = end.x - start.x, h = end.y - start.y
  let shape: Shape | null = null

  switch (tool) {
    case 'line':
      shape = { id: 'preview', type: 'line', attrs: { points: [start.x, start.y, end.x, end.y], stroke: strokeColor, strokeWidth, lineCap: 'round' } }
      break
    case 'rect':
      shape = { id: 'preview', type: 'rect', attrs: { x: w > 0 ? start.x : end.x, y: h > 0 ? start.y : end.y, width: Math.abs(w), height: Math.abs(h), stroke: strokeColor, strokeWidth, fill: fillEnabled ? fillColor : 'transparent' } }
      break
    case 'circle':
      const r = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2
      shape = { id: 'preview', type: 'circle', attrs: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2, radius: r, stroke: strokeColor, strokeWidth, fill: fillEnabled ? fillColor : 'transparent' } }
      break
    case 'triangle':
      shape = { id: 'preview', type: 'triangle', attrs: { points: [start.x, start.y + Math.abs(h), end.x, end.y + Math.abs(h), start.x + Math.abs(w) / 2, start.y], stroke: strokeColor, strokeWidth, fill: fillEnabled ? fillColor : 'transparent', closed: true } }
      break
    case 'arrow':
      shape = { id: 'preview', type: 'arrow', attrs: { points: [start.x, start.y, end.x, end.y], stroke: strokeColor, strokeWidth, pointerLength: 10, pointerWidth: 10, fill: strokeColor } }
      break
    case 'pen':
      penPoints.value.push(end)
      shape = { id: 'preview', type: 'pen', attrs: { points: penPoints.value.flatMap(p => [p.x, p.y]), stroke: strokeColor, strokeWidth, lineCap: 'round', tension: 0.5 } }
      break
    case 'polygon':
      const centerX = (start.x + end.x) / 2, centerY = (start.y + end.y) / 2
      const radius = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2
      shape = { id: 'preview', type: 'polygon', attrs: { x: centerX, y: centerY, sides: toolStore.state.polygonSides, radius, stroke: strokeColor, strokeWidth, fill: fillEnabled ? fillColor : 'transparent' } }
      break
  }
  previewShape.value = shape
}

const finishDrawing = () => {
  if (!startPoint.value || !currentPoint.value) { resetDrawingState(); return }
  const tool = toolStore.state.currentTool
  const { strokeColor, fillColor, strokeWidth, fillEnabled } = toolStore.state
  const start = startPoint.value
  const end = currentPoint.value
  const minDistance = 5
  if (Math.abs(end.x - start.x) < minDistance && Math.abs(end.y - start.y) < minDistance && tool !== 'pen') { resetDrawingState(); return }

  let shape: Shape | null = null
  const w = end.x - start.x, h = end.y - start.y
  const shapeId = generateId()

  switch (tool) {
    case 'line':
      shape = { id: shapeId, type: 'line', attrs: { id: shapeId, points: [start.x, start.y, end.x, end.y], stroke: strokeColor, strokeWidth, lineCap: 'round' } }
      break
    case 'rect':
      shape = { id: shapeId, type: 'rect', attrs: { id: shapeId, x: w > 0 ? start.x : end.x, y: h > 0 ? start.y : end.y, width: Math.abs(w), height: Math.abs(h), stroke: strokeColor, strokeWidth, fill: fillEnabled ? fillColor : 'transparent' } }
      break
    case 'circle':
      const r = Math.max(Math.abs(w), Math.abs(h)) / 2
      shape = { id: shapeId, type: 'circle', attrs: { id: shapeId, x: (start.x + end.x) / 2, y: (start.y + end.y) / 2, radius: r, stroke: strokeColor, strokeWidth, fill: fillEnabled ? fillColor : 'transparent' } }
      break
    case 'triangle':
      shape = { id: shapeId, type: 'triangle', attrs: { id: shapeId, points: [start.x, start.y + Math.abs(h), end.x, end.y + Math.abs(h), start.x + Math.abs(w) / 2, start.y], stroke: strokeColor, strokeWidth, fill: fillEnabled ? fillColor : 'transparent', closed: true } }
      break
    case 'arrow':
      shape = { id: shapeId, type: 'arrow', attrs: { id: shapeId, points: [start.x, start.y, end.x, end.y], stroke: strokeColor, strokeWidth, pointerLength: 10, pointerWidth: 10, fill: strokeColor } }
      break
    case 'pen':
      if (penPoints.value.length > 1) shape = { id: shapeId, type: 'pen', attrs: { id: shapeId, points: penPoints.value.flatMap(p => [p.x, p.y]), stroke: strokeColor, strokeWidth, lineCap: 'round', tension: 0.5 } }
      break
    case 'polygon':
      const centerX = (start.x + end.x) / 2, centerY = (start.y + end.y) / 2, radius = Math.max(Math.abs(w), Math.abs(h)) / 2
      if (radius > 0) shape = { id: shapeId, type: 'polygon', attrs: { id: shapeId, x: centerX, y: centerY, sides: toolStore.state.polygonSides, radius, stroke: strokeColor, strokeWidth, fill: fillEnabled ? fillColor : 'transparent' } }
      break
  }

  if (shape) { shapes.value.push(shape); historyStore.saveState(shapes.value); pageStore.setCurrentPageShapes([...shapes.value]); updateConnectableShapes() }
  resetDrawingState()
}

const resetDrawingState = () => {
  isDrawing.value = false; startPoint.value = null; currentPoint.value = null; previewShape.value = null; penPoints.value = []
}

const selectShape = (index: number, isShiftPressed: boolean = false) => {
  console.log('=== selectShape called ===', index, 'Shift pressed:', isShiftPressed)
  const transformer = transformerRef.value?.getNode()
  const transformerLayer = transformerLayerRef.value?.getNode()
  const layer = layerRef.value?.getNode()
  const stage = stageRef.value?.getNode()
  
  if (!stage || !transformer || !layer) {
    console.log('Missing stage, transformer or layer')
    return
  }
  
  // 如果不是按住Shift键，先清除之前的选择状态
  if (!isShiftPressed) {
    // 清除所有图形的选择状态
    shapes.value.forEach(shape => {
      shape.attrs.isSelected = false
    })
    selectedShapeIndexes.value = []
    console.log('Cleared all previous selections')
  } else {
    // 按住Shift键，检查当前图形是否已经选中
    const existingIndex = selectedShapeIndexes.value.indexOf(index)
    if (existingIndex !== -1) {
      // 如果已经选中，取消选择
      shapes.value[index].attrs.isSelected = false
      selectedShapeIndexes.value.splice(existingIndex, 1)
      console.log('Removed shape from selection:', index)
      
      // 如果没有选中的图形了，更新selectedShapeIndex
      if (selectedShapeIndexes.value.length === 0) {
        selectedShapeIndex.value = null
      } else {
        // 否则保持第一个选中的图形作为主要选中图形
        selectedShapeIndex.value = selectedShapeIndexes.value[0]
      }
      
      // 更新transformer
      const selectedNodes = selectedShapeIndexes.value.map(idx => {
        const shapeId = shapes.value[idx].attrs.id || shapes.value[idx].id
        return stage.findOne('#' + shapeId)
      }).filter(Boolean) as any[]
      
      transformer.nodes(selectedNodes)
      layer.batchDraw()
      transformerLayer?.batchDraw()
      return
    }
  }
  
  // 选择新图形
  selectedShapeIndex.value = index
  shapes.value[index].attrs.isSelected = true
  
  // 添加到多选数组
  if (!selectedShapeIndexes.value.includes(index)) {
    selectedShapeIndexes.value.push(index)
  }
  
  console.log('Set isSelected = true for index:', index)
  console.log('Current selected indexes:', selectedShapeIndexes.value)
  window.dispatchEvent(new CustomEvent('whiteboard:shape-selected', { detail: shapes.value[index].attrs }))
  
  // 使用 attrs.id 来查找所有选中的节点
  const selectedNodes = selectedShapeIndexes.value.map(idx => {
    const shapeId = shapes.value[idx].attrs.id || shapes.value[idx].id
    return stage.findOne('#' + shapeId)
  }).filter(Boolean) as any[]
  
  console.log('Selected nodes:', selectedNodes)
  
  // 设置所有选中图形的可拖动状态
  selectedNodes.forEach(node => {
    const isDraggable = toolStore.state.currentTool === 'select'
    node.draggable(isDraggable)
  })
  
  // 更新transformer
  transformer.nodes(selectedNodes)
  console.log('Added nodes to transformer, transformer nodes count:', transformer.nodes().length)
  
  // 刷新所有 layer
  layer.batchDraw()
  transformerLayer?.batchDraw()
  console.log('Done batchDraw')
}

const deselectShape = () => {
  console.log('=== deselectShape called ===')
  const stage = stageRef.value?.getNode()
  
  // 清除所有选中图形的状态
  selectedShapeIndexes.value.forEach(index => {
    if (shapes.value[index]) {
      const shapeId = shapes.value[index].attrs.id || shapes.value[index].id
      const shapeNode = stage?.findOne('#' + shapeId)
      if (shapeNode) {
        shapeNode.draggable(false)
        console.log('Set draggable = false for:', shapeId)
      }
      shapes.value[index].attrs.isSelected = false
      console.log('Set isSelected = false for index:', index)
    }
  })
  
  selectedShapeIndex.value = null
  selectedShapeIndexes.value = []
  window.dispatchEvent(new CustomEvent('whiteboard:shape-deselected'))
  
  nextTick(() => {
    const transformer = transformerRef.value?.getNode()
    const transformerLayer = transformerLayerRef.value?.getNode()
    if (transformer) { 
      transformer.nodes([]); 
      console.log('Cleared transformer in deselect')
      transformer.getLayer()?.batchDraw() 
    }
  })
}

const handleShapeDragMove = (e: any, index: number) => {
  const shape = shapes.value[index]
  const node = e.target
  
  if (shape && node) {
    if (shape.type === 'rect') {
      shape.attrs.x = node.x()
      shape.attrs.y = node.y()
    } else if (shape.type === 'circle' || shape.type === 'polygon') {
      shape.attrs.x = node.x()
      shape.attrs.y = node.y()
    }
  }
  
  updateConnectableShapes()
  
  const layer = connectionLayerRef.value?.getNode()
  if (layer) layer.batchDraw()
}

const handleShapeDragEnd = (e: any, index: number) => {
  const shape = shapes.value[index]
  const node = e.target
  
  if (shape && node) {
    if (shape.type === 'rect') {
      shape.attrs.x = node.x()
      shape.attrs.y = node.y()
    } else if (shape.type === 'circle' || shape.type === 'polygon') {
      shape.attrs.x = node.x()
      shape.attrs.y = node.y()
    }
    console.log('Shape dragged, new position:', shape.attrs.x, shape.attrs.y)
  }
  
  historyStore.saveState(shapes.value)
  updateConnectableShapes()
  
  nextTick(() => {
    const layer = connectionLayerRef.value?.getNode()
    if (layer) layer.batchDraw()
  })
}

const handleTransformEnd = () => {
  historyStore.saveState(shapes.value)
  updateConnectableShapes()
  
  nextTick(() => {
    const layer = connectionLayerRef.value?.getNode()
    if (layer) layer.batchDraw()
  })
}

const deleteSelectedShape = () => {
  if (selectedShapeIndexes.value.length === 0) return
  
  // 按降序删除，避免索引混乱
  selectedShapeIndexes.value.sort((a, b) => b - a)
  
  // 删除所有选中的图形
  selectedShapeIndexes.value.forEach(index => {
    shapes.value.splice(index, 1)
  })
  
  // 清除选择状态
  deselectShape()
  
  // 保存状态
  historyStore.saveState(shapes.value)
}

const getSelectedShapes = (): Shape[] => {
  if (selectedShapeIndexes.value.length === 0) return []
  return selectedShapeIndexes.value.map(index => shapes.value[index])
}

const copySelectedShapes = () => { const selected = getSelectedShapes(); if (selected.length > 0) historyStore.copyShapes(selected) }
const cutSelectedShapes = () => { const selected = getSelectedShapes(); if (selected.length > 0) { historyStore.cutShapes(selected); deleteSelectedShape() } }
const pasteShapes = () => {
  const pasted = historyStore.pasteShapes()
  if (pasted.length > 0) { shapes.value.push(...pasted); const newIndex = shapes.value.length - pasted.length; selectShape(newIndex); historyStore.saveState(shapes.value) }
}
const duplicateSelectedShapes = () => {
  const selected = getSelectedShapes()
  if (selected.length > 0) { const duplicated = historyStore.duplicateShapes(selected); shapes.value.push(...duplicated); const newIndex = shapes.value.length - duplicated.length; selectShape(newIndex); historyStore.saveState(shapes.value) }
}

/**
 * 检测与线段相交的图形
 * @param start 线段起点
 * @param end 线段终点
 * @returns 相交图形的索引数组
 */
const detectShapesIntersectingLine = (start: Point, end: Point): number[] => {
  const intersectingIndexes: number[] = []
  
  shapes.value.forEach((shape, index) => {
    const attrs = shape.attrs
    let polygonPoints: Point[] = []
    
    // 根据图形类型转换为多边形点集
    switch (shape.type) {
      case 'rect':
        polygonPoints = PolygonUtils.rectToPolygon(attrs.x, attrs.y, attrs.width, attrs.height)
        break
      case 'circle':
        polygonPoints = PolygonUtils.circleToPolygon(attrs.x, attrs.y, attrs.radius)
        break
      case 'triangle':
        if (attrs.points && attrs.points.length >= 6) {
          polygonPoints = [
            { x: attrs.points[0], y: attrs.points[1] },
            { x: attrs.points[2], y: attrs.points[3] },
            { x: attrs.points[4], y: attrs.points[5] }
          ]
        }
        break
      case 'polygon':
        if (attrs.x !== undefined && attrs.y !== undefined && attrs.radius !== undefined && attrs.sides !== undefined) {
          polygonPoints = PolygonUtils.circleToPolygon(attrs.x, attrs.y, attrs.radius, attrs.sides)
        }
        break
      default:
        return // 不支持的图形类型
    }
    
    // 检查线段是否与多边形相交 - 将响应式对象转换为普通对象
    const lineStart = { x: start.x, y: start.y }
    const lineEnd = { x: end.x, y: end.y }
    if (polygonPoints.length >= 3 && doSegmentsIntersect(lineStart, lineEnd, polygonPoints)) {
      intersectingIndexes.push(index)
    }
  })
  
  return intersectingIndexes
}

/**
 * 检查线段是否与多边形相交
 * @param lineStart 线段起点
 * @param lineEnd 线段终点
 * @param polygon 多边形顶点数组
 * @returns 是否相交
 */
const doSegmentsIntersect = (lineStart: Point, lineEnd: Point, polygon: Point[]): boolean => {
  // 检查线段是否与多边形的任何边相交
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i]
    const p2 = polygon[(i + 1) % polygon.length]
    
    if (lineSegmentsIntersect(lineStart, lineEnd, p1, p2)) {
      return true
    }
  }
  
  // 检查线段是否完全在多边形内部（通过检查线段中点是否在多边形内部）
  const midX = (lineStart.x + lineEnd.x) / 2
  const midY = (lineStart.y + lineEnd.y) / 2
  const midPoint = { x: midX, y: midY }
  
  if (isPointInPolygon(midPoint, polygon)) {
    return true
  }
  
  return false
}

/**
 * 检查两条线段是否相交
 * @param p1 第一条线段的起点
 * @param p2 第一条线段的终点
 * @param p3 第二条线段的起点
 * @param p4 第二条线段的终点
 * @returns 是否相交
 */
const lineSegmentsIntersect = (p1: Point, p2: Point, p3: Point, p4: Point): boolean => {
  const ccw = (a: Point, b: Point, c: Point) => {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x)
  }
  
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
}

/**
 * 检查点是否在多边形内部
 * @param point 要检查的点
 * @param polygon 多边形顶点数组
 * @returns 是否在内部
 */
const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    
    const intersect = ((yi > point.y) !== (yj > point.y)) && 
                     (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)
    
    if (intersect) {
      inside = !inside
    }
  }
  
  return inside
}

/**
 * 分割选中的图形
 * @param start 分割线起点
 * @param end 分割线终点
 */
const splitSelectedShape = (start: Point, end: Point) => {
  console.log('=== splitSelectedShape 开始执行 ===')
  console.log('selectedShapeIndex:', selectedShapeIndex.value)
  
  if (selectedShapeIndex.value === null) {
    console.error('splitSelectedShape: selectedShapeIndex is null')
    return
  }
  
  const shape = shapes.value[selectedShapeIndex.value]
  if (!shape) {
    console.error('splitSelectedShape: shape not found at index', selectedShapeIndex.value)
    return
  }
  
  const attrs = shape.attrs
  console.log('分割前 - 图形类型:', shape.type, '属性:', attrs)
  
  let sourcePolygon: Point[] = []
  
  // 根据图形类型转换为多边形点集
  switch (shape.type) {
    case 'rect':
      console.log('分割 - 处理矩形:', attrs.x, attrs.y, attrs.width, attrs.height)
      sourcePolygon = PolygonUtils.rectToPolygon(attrs.x, attrs.y, attrs.width, attrs.height)
      break
    case 'circle':
      console.log('分割 - 处理圆形:', attrs.x, attrs.y, attrs.radius)
      sourcePolygon = PolygonUtils.circleToPolygon(attrs.x, attrs.y, attrs.radius)
      break
    case 'triangle':
      console.log('分割 - 处理三角形:', attrs.points)
      if (attrs.points && attrs.points.length >= 6) {
        sourcePolygon = [
          { x: attrs.points[0], y: attrs.points[1] },
          { x: attrs.points[2], y: attrs.points[3] },
          { x: attrs.points[4], y: attrs.points[5] }
        ]
      }
      break
    case 'polygon':
      console.log('分割 - 处理多边形:', attrs.x, attrs.y, attrs.radius, attrs.sides)
      // 对于正多边形，我们需要重新计算所有顶点
      if (attrs.x !== undefined && attrs.y !== undefined && attrs.radius !== undefined && attrs.sides !== undefined) {
        sourcePolygon = PolygonUtils.circleToPolygon(attrs.x, attrs.y, attrs.radius, attrs.sides)
      }
      break
    default:
      console.error('不支持的图形类型分割:', shape.type)
      return
  }
  
  console.log('分割前 - 转换为多边形点集:', sourcePolygon)
  
  if (sourcePolygon.length < 3) {
    console.error('无法分割：多边形顶点数量不足')
    return
  }
  
  // 执行分割 - 将响应式对象转换为普通对象
  const splitLine = [
    { x: start.x, y: start.y },
    { x: end.x, y: end.y }
  ]
  console.log('执行分割：源多边形', sourcePolygon, '分割线', splitLine)
  const splitResult = PolygonUtils.split(sourcePolygon, splitLine)
  console.log('分割结果:', splitResult, '长度:', splitResult.length)
  
  if (splitResult.length < 2) {
    console.error('分割失败：未产生有效的子图形')
    return
  }
  
  // 保存历史记录
  console.log('保存历史记录')
  historyStore.saveState(shapes.value)
  
  // 删除原图形
  console.log('删除原图形，索引:', selectedShapeIndex.value)
  console.log('删除前 shapes.length:', shapes.value.length)
  console.log('删除前 shapes:', shapes.value)
  shapes.value.splice(selectedShapeIndex.value, 1)
  console.log('删除后 shapes.length:', shapes.value.length)
  console.log('删除后 shapes:', shapes.value)
  
  // 取消选择
  console.log('取消选择图形')
  deselectShape()
  
  // 添加分割后的子图形
  console.log('添加分割后的子图形，当前shapes长度:', shapes.value.length)
  splitResult.forEach((polygon, index) => {
    console.log('处理子图形', index + 1, '多边形点:', polygon)
    const newShapeId = generateId()
    
    // 创建新图形
    const newShape: Shape = {
      id: newShapeId,
      type: 'polygon', // 分割后的图形默认为多边形
      attrs: {
        id: newShapeId,
        points: polygon.flatMap(p => [p.x, p.y]),
        stroke: attrs.stroke,
        strokeWidth: attrs.strokeWidth,
        fill: attrs.fill,
        fillOpacity: attrs.fillOpacity,
        closed: true,
        draggable: true,
        rotation: attrs.rotation || 0, // 继承原图形的旋转属性
        scaleX: attrs.scaleX || 1,
        scaleY: attrs.scaleY || 1
      }
    }
    
    console.log('创建子图形', index + 1, ':', newShape)
    shapes.value.push(newShape)
    console.log('添加后 shapes.length:', shapes.value.length)
  })
  
  console.log('添加子图形后，最终shapes长度:', shapes.value.length)
  console.log('添加子图形后，最终shapes:', shapes.value)
  
  // 更新可连接图形
  console.log('更新可连接图形')
  updateConnectableShapes()
  
  // 保存到历史记录
  console.log('保存分割后的状态到历史记录')
  historyStore.saveState(shapes.value)
  
  console.log('=== splitSelectedShape 执行完成 ===')
  
  console.log('分割完成 - 最终 shapes 数组:', shapes.value)
  console.log('分割完成 - shapes 数组长度:', shapes.value.length)
  
  // 如果当前工具是分割工具，检查是否需要恢复图形的可拖动状态
  // 注意：这里不需要直接恢复，因为原图形已经被删除，新图形是可拖动的
  // 但如果用户在分割后仍然保持分割工具激活并继续操作，不需要额外处理
}

const rotateClockwise = () => {
  if (selectedShapeIndex.value === null) return
  const shape = shapes.value[selectedShapeIndex.value]
  const stage = stageRef.value?.getNode()
  const node = stage?.findOne('#' + shape.id)
  if (node) { const r = node.rotation(); node.rotation(r + 15); shape.attrs.rotation = r + 15; historyStore.saveState(shapes.value) }
}
const rotateCounterClockwise = () => {
  if (selectedShapeIndex.value === null) return
  const shape = shapes.value[selectedShapeIndex.value]
  const stage = stageRef.value?.getNode()
  const node = stage?.findOne('#' + shape.id)
  if (node) { const r = node.rotation(); node.rotation(r - 15); shape.attrs.rotation = r - 15; historyStore.saveState(shapes.value) }
}

const flipHorizontal = () => {
  if (selectedShapeIndex.value === null) return
  const shape = shapes.value[selectedShapeIndex.value]
  const stage = stageRef.value?.getNode()
  const node = stage?.findOne('#' + shape.id)
  if (node) { const sx = node.scaleX(); node.scaleX(-sx); shape.attrs.scaleX = -sx; historyStore.saveState(shapes.value) }
}
const flipVertical = () => {
  if (selectedShapeIndex.value === null) return
  const shape = shapes.value[selectedShapeIndex.value]
  const stage = stageRef.value?.getNode()
  const node = stage?.findOne('#' + shape.id)
  if (node) { const sy = node.scaleY(); node.scaleY(-sy); shape.attrs.scaleY = -sy; historyStore.saveState(shapes.value) }
}

const moveLayerUp = () => {
  if (selectedShapeIndex.value === null || selectedShapeIndex.value >= shapes.value.length - 1) return
  const i = selectedShapeIndex.value
  const t = shapes.value[i]; shapes.value[i] = shapes.value[i + 1]; shapes.value[i + 1] = t; selectedShapeIndex.value = i + 1; historyStore.saveState(shapes.value)
}
const moveLayerDown = () => {
  if (selectedShapeIndex.value === null || selectedShapeIndex.value <= 0) return
  const i = selectedShapeIndex.value
  const t = shapes.value[i]; shapes.value[i] = shapes.value[i - 1]; shapes.value[i - 1] = t; selectedShapeIndex.value = i - 1; historyStore.saveState(shapes.value)
}
const moveToTop = () => {
  if (selectedShapeIndex.value === null || selectedShapeIndex.value >= shapes.value.length - 1) return
  const i = selectedShapeIndex.value
  const s = shapes.value.splice(i, 1)[0]; shapes.value.push(s); selectedShapeIndex.value = shapes.value.length - 1; historyStore.saveState(shapes.value)
}
const moveToBottom = () => {
  if (selectedShapeIndex.value === null || selectedShapeIndex.value <= 0) return
  const i = selectedShapeIndex.value
  const s = shapes.value.splice(i, 1)[0]; shapes.value.unshift(s); selectedShapeIndex.value = 0; historyStore.saveState(shapes.value)
}

const undo = () => {
  if (!historyStore.canUndo.value) return
  const newShapes = historyStore.undo(shapes.value)
  shapes.value = newShapes
  deselectShape()
}
const redo = () => {
  if (!historyStore.canRedo.value) return
  const newShapes = historyStore.redo(shapes.value)
  shapes.value = newShapes
  deselectShape()
}

const loadCurrentPageShapes = () => { shapes.value = [...pageStore.getCurrentPageShapes()] }
const saveCurrentPageShapes = () => { pageStore.setCurrentPageShapes([...shapes.value]) }

watch(() => pageStore.state.currentPage, () => { saveCurrentPageShapes(); loadCurrentPageShapes(); deselectShape() })

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
  const key = e.key.toLowerCase()
  const ctrlKey = e.ctrlKey || e.metaKey

  if (ctrlKey) {
    switch (key) {
      case 'z': e.preventDefault(); undo(); break
      case 'y': e.preventDefault(); redo(); break
      case 'c': e.preventDefault(); copySelectedShapes(); break
      case 'x': e.preventDefault(); cutSelectedShapes(); break
      case 'v': e.preventDefault(); pasteShapes(); break
      case 'd': e.preventDefault(); duplicateSelectedShapes(); break
      case ']': e.preventDefault(); rotateClockwise(); break
      case '[': e.preventDefault(); rotateCounterClockwise(); break
    }
    return
  }

  switch (key) {
    case 'v': toolStore.setTool('select'); break
    case 'c': toolStore.setTool('connect'); break
    case 'l': toolStore.setTool('line'); break
    case 'r': toolStore.setTool('rect'); break
    case 'e': toolStore.setTool('circle'); break
    case 't': toolStore.setTool('triangle'); break
    case 'a': toolStore.setTool('arrow'); break
    case 'b': toolStore.setTool('pen'); break
    case 'x': toolStore.setTool('eraser'); break
    case '1': toolStore.setTool('ruler'); break
    case '2': toolStore.setTool('protractor'); break
    case '3': toolStore.setTool('compass'); break
    case '4': toolStore.setTool('setsquare'); break
    case 's': toolStore.setTool('split'); break
    case 'delete': case 'backspace': deleteSelectedShape(); break
  }
}

const handleUndoEvent = () => undo()
const handleRedoEvent = () => redo()
const handleRotateCWEvent = () => rotateClockwise()
const handleRotateCCWEvent = () => rotateCounterClockwise()
const handleFlipHEvent = () => flipHorizontal()
const handleFlipVEvent = () => flipVertical()
const handleLayerUpEvent = () => moveLayerUp()
const handleLayerDownEvent = () => moveLayerDown()
const handleLayerTopEvent = () => moveToTop()
const handleLayerBottomEvent = () => moveToBottom()

const updateSelectedShapeProperty = (type: string, value: any) => {
  if (selectedShapeIndex.value === null) return
  const stage = stageRef.value?.getNode()
  if (!stage) return
  const shape = shapes.value[selectedShapeIndex.value]
  const node = stage.findOne('#' + shape.id)
  if (!node) return
  switch (type) {
    case 'fill': shape.attrs.fill = value; node.fill(value); break
    case 'fillOpacity': shape.attrs.fillOpacity = value; node.fillOpacity(value); break
    case 'stroke': shape.attrs.stroke = value; node.stroke(value); if (shape.type === 'arrow') { node.fill(value); shape.attrs.fill = value } break
    case 'strokeWidth': shape.attrs.strokeWidth = value; node.strokeWidth(value); break
  }
  node.getLayer()?.batchDraw()
  historyStore.saveState(shapes.value)
}

const handleUpdateShapeEvent = (e: CustomEvent) => { const { type, value } = e.detail; updateSelectedShapeProperty(type, value) }
const handleAlignEvent = (e: CustomEvent) => {}

const handleExportPNG = async (event: Event) => {
  const customEvent = event as CustomEvent
  const resolution = customEvent.detail?.resolution || 1
  const stage = stageRef.value?.getNode()
  if (!stage) return
  const dataURL = stage.toDataURL({ pixelRatio: resolution, mimeType: 'image/png' })
  const link = document.createElement('a')
  link.download = `白板页面${pageStore.currentPageNumber.value}.png`
  link.href = dataURL
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
}

const handleProjectLoaded = () => { loadCurrentPageShapes(); deselectShape() }

const applyThemeColors = () => {
  const colors = currentThemeColors.value
  const canvasArea = containerRef.value
  const konvaContent = canvasArea?.querySelector('.konvajs-content') as HTMLElement
  if (canvasArea) canvasArea.style.backgroundColor = colors.containerBg
  if (konvaContent) konvaContent.style.backgroundColor = colors.canvasBg
  gridConfig.stroke = colors.gridColor
}

const updateGridConfig = () => { gridConfig.visible = toolStore.state.gridEnabled; gridConfig.spacing = toolStore.state.gridSpacing; gridConfig.stroke = currentThemeColors.value.gridColor }

watch(() => toolStore.state.currentTool, (newTool, oldTool) => {
  const stage = stageRef.value?.getNode()
  if (!stage) return
  
  console.log('工具切换:', oldTool, '→', newTool)
  
  // 分割工具和选择工具保留选择状态
  if (newTool !== 'select' && newTool !== 'split') deselectShape()
  
  stage.draggable(newTool === 'select')
  
  // 连接工具处理
  if (newTool === 'connect') {
    console.log('Switched to connect tool')
    showConnectionPoints.value = true
    nextTick(() => {
      updateConnectableShapes()
      console.log('connectableShapes updated:', connectableShapes.value.length)
    })
  } else {
    showConnectionPoints.value = false
    connectingFrom.value = null
    connectionPreview.value = null
  }
  
  // 分割工具处理
  if (newTool === 'split') {
    console.log('Switched to split tool')
    showSplitPoints.value = true
    
    // 清除transformer的节点，避免在分割时触发缩放
    const transformer = transformerRef.value?.getNode()
    if (transformer) {
      transformer.nodes([])
      console.log('分割工具 - 清除transformer节点')
    }
    
    // 为所有可分割的图形生成分割点
    const splitPointsObj: { [shapeId: string]: Point[] } = {}
    shapes.value.forEach(shape => {
      // 只处理可分割的图形类型
      if (['rect', 'circle', 'triangle', 'polygon'].includes(shape.type)) {
        const shapeId = shape.attrs.id || shape.id
        splitPointsObj[shapeId] = getSplitPointsForShape(shape)
      }
    })
    splitPoints.value = splitPointsObj
    console.log('分割工具 - 生成分割点:', Object.keys(splitPoints.value).length, '个图形')
    
    // 禁用所有图形的拖动
    shapes.value.forEach(shape => {
      const shapeId = shape.attrs.id || shape.id
      const shapeNode = stage.findOne('#' + shapeId)
      if (shapeNode) {
        shape.attrs._originalDraggable = shapeNode.draggable()
        shapeNode.draggable(false)
      }
    })
  } else if (oldTool === 'split') {
    console.log('Switched out of split tool')
    showSplitPoints.value = false
    splitPoints.value = {}
    splittingFrom.value = null
    isSplitting.value = false
    splitLineStart.value = null
    splitLineEnd.value = null
    
    // 恢复所有图形的拖动状态
    shapes.value.forEach(shape => {
      const shapeId = shape.attrs.id || shape.id
      const shapeNode = stage.findOne('#' + shapeId)
      if (shapeNode && shape.attrs._originalDraggable !== undefined) {
        shapeNode.draggable(shape.attrs._originalDraggable)
        delete shape.attrs._originalDraggable
      }
    })
  }
})

watch(shapes, () => {
  if (showConnectionPoints.value || connections.value.length > 0) {
    updateConnectableShapes()
    nextTick(() => {
      const layer = connectionLayerRef.value?.getNode()
      if (layer) layer.batchDraw()
    })
  }
}, { deep: true })

onMounted(() => {
  loadCurrentPageShapes()
  updateSize()
  applyThemeColors()
  updateGridConfig()
  window.addEventListener('resize', updateSize)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('whiteboard:undo', handleUndoEvent)
  window.addEventListener('whiteboard:redo', handleRedoEvent)
  window.addEventListener('whiteboard:rotate-cw', handleRotateCWEvent)
  window.addEventListener('whiteboard:rotate-ccw', handleRotateCCWEvent)
  window.addEventListener('whiteboard:flip-h', handleFlipHEvent)
  window.addEventListener('whiteboard:flip-v', handleFlipVEvent)
  window.addEventListener('whiteboard:layer-up', handleLayerUpEvent)
  window.addEventListener('whiteboard:layer-down', handleLayerDownEvent)
  window.addEventListener('whiteboard:layer-top', handleLayerTopEvent)
  window.addEventListener('whiteboard:layer-bottom', handleLayerBottomEvent)
  window.addEventListener('whiteboard:align', handleAlignEvent as EventListener)
  window.addEventListener('whiteboard:update-shape', handleUpdateShapeEvent as EventListener)
  window.addEventListener('whiteboard:export-png', handleExportPNG)
  window.addEventListener('whiteboard:project-loaded', handleProjectLoaded)
  window.addEventListener('whiteboard:theme-changed', applyThemeColors)
  window.addEventListener('whiteboard:grid-changed', updateGridConfig)
  window.addEventListener('whiteboard:tool-changed', handleToolChanged)
  // 布尔运算事件监听
  window.addEventListener('whiteboard:boolean-operation', handleBooleanOperationEvent as EventListener)
})

onUnmounted(() => {
  saveCurrentPageShapes()
  stageRef.value?.getNode()?.destroy()
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('whiteboard:undo', handleUndoEvent)
  window.removeEventListener('whiteboard:redo', handleRedoEvent)
  window.removeEventListener('whiteboard:rotate-cw', handleRotateCWEvent)
  window.removeEventListener('whiteboard:rotate-ccw', handleRotateCCWEvent)
  window.removeEventListener('whiteboard:flip-h', handleFlipHEvent)
  window.removeEventListener('whiteboard:flip-v', handleFlipVEvent)
  window.removeEventListener('whiteboard:layer-up', handleLayerUpEvent)
  window.removeEventListener('whiteboard:layer-down', handleLayerDownEvent)
  window.removeEventListener('whiteboard:layer-top', handleLayerTopEvent)
  window.removeEventListener('whiteboard:layer-bottom', handleLayerBottomEvent)
  window.removeEventListener('whiteboard:align', handleAlignEvent as EventListener)
  window.removeEventListener('whiteboard:update-shape', handleUpdateShapeEvent as EventListener)
  window.removeEventListener('whiteboard:export-png', handleExportPNG)
  window.removeEventListener('whiteboard:project-loaded', handleProjectLoaded)
  window.removeEventListener('whiteboard:theme-changed', applyThemeColors)
  window.removeEventListener('whiteboard:grid-changed', updateGridConfig)
  window.removeEventListener('whiteboard:tool-changed', handleToolChanged)
  // 移除布尔运算事件监听
  window.removeEventListener('whiteboard:boolean-operation', handleBooleanOperationEvent as EventListener)
})

// 监听选中图形数量变化，通知其他组件
watch(() => selectedShapeIndexes.value.length, (newLength) => {
  window.dispatchEvent(new CustomEvent('whiteboard:selection-count-changed', { 
    detail: { count: newLength } 
  }))
})

// 布尔运算事件处理函数
const handleBooleanOperationEvent = (e: CustomEvent) => {
  const { type } = e.detail
  
  if (selectedShapeIndexes.value.length !== 2) {
    console.error('布尔运算需要选择两个图形')
    return
  }
  
  const shape1 = shapes.value[selectedShapeIndexes.value[0]]
  const shape2 = shapes.value[selectedShapeIndexes.value[1]]
  
  // 转换图形为多边形点集
  let poly1: Point[] = []
  let poly2: Point[] = []
  
  const convertToPolygon = (shape: Shape): Point[] => {
    const attrs = shape.attrs
    switch (shape.type) {
      case 'rect':
        return PolygonUtils.rectToPolygon(attrs.x, attrs.y, attrs.width, attrs.height)
      case 'circle':
        return PolygonUtils.circleToPolygon(attrs.x, attrs.y, attrs.radius)
      case 'triangle':
        if (attrs.points && attrs.points.length >= 6) {
          return [
            { x: attrs.points[0], y: attrs.points[1] },
            { x: attrs.points[2], y: attrs.points[3] },
            { x: attrs.points[4], y: attrs.points[5] }
          ]
        }
        return []
      case 'polygon':
        if (attrs.x && attrs.y && attrs.radius && attrs.sides) {
          // 转换正多边形为点集
          const points: Point[] = []
          const sides = attrs.sides
          for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2
            points.push({
              x: attrs.x + attrs.radius * Math.cos(angle),
              y: attrs.y + attrs.radius * Math.sin(angle)
            })
          }
          return points
        }
        return []
      default:
        return []
    }
  }
  
  poly1 = convertToPolygon(shape1)
  poly2 = convertToPolygon(shape2)
  
  if (poly1.length === 0 || poly2.length === 0) {
    console.error('不支持的图形类型进行布尔运算')
    return
  }
  
  // 检查图形是否相交（除了并集运算）
  if (type !== 'union' && !PolygonUtils.checkIntersection(poly1, poly2)) {
    console.error('图形不相交，无法执行该布尔运算')
    return
  }
  
  let resultPolygons: Point[][] = []
  
  // 执行布尔运算
  switch (type) {
    case 'union':
      resultPolygons = PolygonUtils.unionTwo(poly1, poly2)
      break
    case 'intersect':
      resultPolygons = PolygonUtils.intersectTwo(poly1, poly2)
      break
    case 'difference':
      resultPolygons = PolygonUtils.differenceTwo(poly1, poly2)
      break
    case 'clip':
      resultPolygons = PolygonUtils.clipTwo(poly1, poly2)
      break
  }
  
  if (resultPolygons.length === 0) {
    console.error('布尔运算结果为空')
    return
  }
  
  // 删除原图形（按降序删除，避免索引混乱）
  selectedShapeIndexes.value.sort((a, b) => b - a)
  selectedShapeIndexes.value.forEach(index => {
    shapes.value.splice(index, 1)
  })
  
  // 创建新图形
  resultPolygons.forEach((polygon, index) => {
    const shapeId = generateId()
    // 使用第一个原图形的属性
    const newShape = {
      id: shapeId,
      type: 'polygon',
      attrs: {
        ...shape1.attrs,
        id: shapeId,
        // 转换点集为Konva多边形格式
        points: polygon.flatMap(p => [p.x, p.y]),
        closed: true
      }
    }
    shapes.value.push(newShape)
  })
  
  // 保存历史状态
  historyStore.saveState(shapes.value)
  
  // 清除选择
  deselectShape()
}

defineExpose({
  undo, redo, copySelectedShapes, cutSelectedShapes, pasteShapes, duplicateSelectedShapes,
  rotateClockwise, rotateCounterClockwise, flipHorizontal, flipVertical,
  moveLayerUp, moveLayerDown, moveToTop, moveToBottom, deleteSelectedShape,
  getSelectedShapes, shapes
})
</script>

<style scoped>
.canvas-area {
  flex: 1;
  background-color: #E0E0E0;
  padding: 16px;
  overflow: hidden;
  transition: background-color 0.3s ease;
}
.canvas-area :deep(.konvajs-content) {
  background-color: #FFFFFF;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>