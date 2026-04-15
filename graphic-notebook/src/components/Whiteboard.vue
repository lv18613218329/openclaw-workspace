<template>
  <div class="whiteboard">
    <!-- 顶部工具栏 -->
    <header class="toolbar">
      <div class="tool-group">
        <button class="tool-btn" @click="$emit('close')" title="退出">
          <span>←</span>
        </button>
      </div>
      
      <div class="tool-group">
        <button 
          v-for="t in drawTools" :key="t.id"
          :class="['tool-btn', currentTool === t.id ? 'active' : '']"
          @click="currentTool = t.id"
          :title="t.name"
        >
          <span>{{ t.icon }}</span>
        </button>
      </div>
      
      <div class="tool-group">
        <input type="color" v-model="strokeColor" title="颜色" class="color-picker" />
        <select v-model="lineWidth" class="size-select">
          <option :value="2">细</option>
          <option :value="4">中</option>
          <option :value="6">粗</option>
        </select>
      </div>
      
      <div class="tool-group">
        <button class="tool-btn" @click="undo">↩️</button>
        <button class="tool-btn" @click="redo">↪️</button>
        <button class="tool-btn" @click="clearCanvas">🗑️</button>
      </div>
    </header>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 左侧工具面板 -->
      <aside class="left-panel">
        <div class="panel-section">
          <div class="section-title">📐 基础图形</div>
          <div class="tool-grid">
            <button v-for="t in basicShapes" :key="t.id"
              :class="['s-btn', currentTool === t.id ? 'active' : '']"
              @click="currentTool = t.id">{{ t.icon }}</button>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="section-title">📏 尺规</div>
          <div class="tool-grid">
            <button v-for="t in rulerTools" :key="t.id"
              :class="['s-btn', currentTool === t.id ? 'active' : '']"
              @click="currentTool = t.id">{{ t.icon }}</button>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="section-title">📐 数学</div>
          <div class="tool-grid">
            <button v-for="t in mathTools" :key="t.id"
              :class="['s-btn', currentTool === t.id ? 'active' : '']"
              @click="currentTool = t.id">{{ t.icon }}</button>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="section-title">⚡ 物理</div>
          <div class="tool-grid">
            <button v-for="t in physicsTools" :key="t.id"
              :class="['s-btn', currentTool === t.id ? 'active' : '']"
              @click="currentTool = t.id">{{ t.icon }}</button>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="section-title">🧪 化学</div>
          <div class="tool-grid">
            <button v-for="t in chemistryTools" :key="t.id"
              :class="['s-btn', currentTool === t.id ? 'active' : '']"
              @click="currentTool = t.id">{{ t.icon }}</button>
          </div>
        </div>
      </aside>
      
      <!-- 画布 -->
      <div class="canvas-container" ref="containerRef">
        <canvas ref="canvasRef" 
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
          @wheel="onWheel"></canvas>
      </div>
      
      <!-- 右侧属性面板 -->
      <aside class="right-panel" v-if="selectedShape">
        <div class="panel-section">
          <div class="section-title">属性</div>
          <div class="prop-row">
            <label>X</label>
            <input type="number" v-model.number="selectedShape.x" @change="redraw" />
          </div>
          <div class="prop-row">
            <label>Y</label>
            <input type="number" v-model.number="selectedShape.y" @change="redraw" />
          </div>
          <div class="prop-row">
            <label>宽</label>
            <input type="number" v-model.number="selectedShape.width" @change="redraw" />
          </div>
          <div class="prop-row">
            <label>高</label>
            <input type="number" v-model.number="selectedShape.height" @change="redraw" />
          </div>
          <div class="prop-row">
            <label>旋转</label>
            <input type="number" v-model.number="selectedShape.rotation" @change="redraw" />
          </div>
        </div>
        <div class="panel-section">
          <div class="section-title">操作</div>
          <button class="action-btn" @click="rotateSelected(-15)">↺</button>
          <button class="action-btn" @click="rotateSelected(15)">↻</button>
          <button class="action-btn danger" @click="deleteSelected">删除</button>
        </div>
      </aside>
    </main>
    
    <!-- 底部状态栏 -->
    <footer class="footer">
      <span>坐标: ({{ mousePos.x }}, {{ mousePos.y }})</span>
      <span>图形: {{ shapes.length }}</span>
      <span>缩放: {{ Math.round(zoom * 100) }}%</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";

const emit = defineEmits(["close"]);

// 工具定义
const drawTools = [
  { id: "select", name: "选择", icon: "↖" },
  { id: "pen", name: "画笔", icon: "✏️" },
  { id: "connector", name: "连接器", icon: "🔗" },
  { id: "eraser", name: "板擦", icon: "🧹" },
];

const basicShapes = [
  { id: "rectangle", icon: "□" },
  { id: "circle", icon: "○" },
  { id: "triangle", icon: "△" },
  { id: "line", icon: "/" },
  { id: "arrow", icon: "→" },
];

const rulerTools = [
  { id: "ruler", icon: "📏" },
  { id: "protractor", icon: "◠" },
  { id: "compass", icon: "✂" },
  { id: "angle-mark", icon: "∠" },
];

const mathTools = [
  { id: "coordinate", icon: "+" },
  { id: "function-curve", icon: "∿" },
  { id: "number-line", icon: "—" },
];

const physicsTools = [
  { id: "force-arrow", icon: "→" },
  { id: "pulley", icon: "⚙" },
  { id: "spring", icon: "〰" },
  { id: "incline", icon: "▱" },
];

const chemistryTools = [
  { id: "beaker", icon: "🧪" },
  { id: "flask", icon: "🧫" },
  { id: "molecule", icon: "⬡" },
  { id: "test-tube", icon: "🧫" },
];

// 状态
const currentTool = ref("select");
const strokeColor = ref("#ffffff");
const fillColor = ref("#ffffff");
const lineWidth = ref(2);
const zoom = ref(1);
const mousePos = ref({ x: 0, y: 0 });

// 画布
const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;

// 图形
interface Shape {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  points?: { x: number; y: number }[];
}

// 连接点
interface ConnectionPoint {
  x: number;  // 相对于图形左上角的x
  y: number;  // 相对于图形左上角的y
  position: string; // 'top'|'bottom'|'left'|'right'|'top-left'|'top-right'|'bottom-left'|'bottom-right'
}

// 连接线
interface Connector {
  id: string;
  fromShapeId: string;
  fromPoint: string;
  toShapeId: string;
  toPoint: string;
  stroke: string;
  strokeWidth: number;
  style: 'straight' | 'orthogonal';
}

const shapes = ref<Shape[]>([]);
const connectors = ref<Connector[]>([]);
const selectedShape = ref<Shape | null>(null);
const selectedConnector = ref<Connector | null>(null);
const history = ref<any[]>([]);
let historyIndex = 0;

// 连接点相关状态
const showConnectionPoints = ref(false);
const hoveredShape = ref<Shape | null>(null);
const connectorStart = ref<{ shapeId: string; point: string; x: number; y: number } | null>(null);
const connectorPreview = ref<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

// 连接点位置定义
const getConnectionPoints = (shape: Shape): ConnectionPoint[] => {
  return [
    { x: shape.width / 2, y: 0, position: 'top' },
    { x: shape.width / 2, y: shape.height, position: 'bottom' },
    { x: 0, y: shape.height / 2, position: 'left' },
    { x: shape.width, y: shape.height / 2, position: 'right' },
    { x: 0, y: 0, position: 'top-left' },
    { x: shape.width, y: 0, position: 'top-right' },
    { x: 0, y: shape.height, position: 'bottom-left' },
    { x: shape.width, y: shape.height, position: 'bottom-right' },
  ];
};

// 获取连接点的绝对坐标
const getConnectionPointAbs = (shape: Shape, point: string): { x: number; y: number } => {
  const points = getConnectionPoints(shape);
  const p = points.find(pp => pp.position === point) || points[0];
  return {
    x: shape.x + p.x,
    y: shape.y + p.y
  };
};

// 绘制状态
let isDrawing = false;
let startX = 0;
let startY = 0;
let currentPath: { x: number; y: number }[] = [];
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

onMounted(() => {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
});

onUnmounted(() => {
  window.removeEventListener("resize", resizeCanvas);
});

const resizeCanvas = () => {
  nextTick(() => {
    if (!canvasRef.value || !containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    canvasRef.value.width = rect.width;
    canvasRef.value.height = rect.height;
    ctx = canvasRef.value.getContext("2d");
    redraw();
  });
};

// 鼠标事件
const onMouseDown = (e: MouseEvent) => {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom.value;
  const y = (e.clientY - rect.top) / zoom.value;

  if (currentTool.value === "select") {
    const clicked = findShapeAt(x, y);
    if (clicked) {
      selectedShape.value = clicked;
      isDragging = true;
      dragOffsetX = x - clicked.x;
      dragOffsetY = y - clicked.y;
    } else {
      selectedShape.value = null;
    }
    redraw();
    return;
  }

  // 连接器工具：检查是否点击了连接点
  if (currentTool.value === "connector") {
    const result = findConnectionPointAt(x, y);
    if (result) {
      connectorStart.value = {
        shapeId: result.shape.id,
        point: result.point,
        x: result.absX,
        y: result.absY
      };
      isDrawing = true;
      return;
    }
    // 没点到连接点则取消
    connectorStart.value = null;
    redraw();
    return;
  }

  startX = x;
  startY = y;
  isDrawing = true;

  if (currentTool.value === "pen" || currentTool.value === "eraser") {
    currentPath = [{ x, y }];
  }
};

const onMouseMove = (e: MouseEvent) => {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom.value;
  const y = (e.clientY - rect.top) / zoom.value;
  
  mousePos.value = { x: Math.round(x), y: Math.round(y) };

  // 连接器模式下检测悬停的图形，显示连接点
  if (currentTool.value === "connector") {
    const hovered = findShapeAt(x, y);
    hoveredShape.value = hovered || null;
    if (hovered) {
      showConnectionPoints.value = true;
    } else {
      showConnectionPoints.value = false;
    }
    redraw();
  }

  // 绘制连接线预览
  if (currentTool.value === "connector" && connectorStart.value && isDrawing) {
    connectorPreview.value = {
      x1: connectorStart.value.x,
      y1: connectorStart.value.y,
      x2: x,
      y2: y
    };
    redraw();
    return;
  }

  if (isDragging && selectedShape.value) {
    selectedShape.value.x = x - dragOffsetX;
    selectedShape.value.y = y - dragOffsetY;
    redraw();
    return;
  }

  if (!isDrawing) return;

  if (currentTool.value === "pen" || currentTool.value === "eraser") {
    currentPath.push({ x, y });
    redraw();
    drawPath(currentPath, currentTool.value === "eraser" ? "#1a5f1a" : strokeColor.value, lineWidth.value);
  } else if (!["select", "pen", "eraser", "connector"].includes(currentTool.value)) {
    redraw();
    drawShapePreview(startX, startY, x, y);
  }
};

const onMouseUp = (e: MouseEvent) => {
  // 连接器：完成连接线
  if (currentTool.value === "connector" && connectorStart.value) {
    if (!canvasRef.value) return;
    const rect = canvasRef.value.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom.value;
    const y = (e.clientY - rect.top) / zoom.value;

    const result = findConnectionPointAt(x, y);
    if (result && result.shape.id !== connectorStart.value.shapeId) {
      // 创建连接线
      const newConnector: Connector = {
        id: `connector-${Date.now()}`,
        fromShapeId: connectorStart.value.shapeId,
        fromPoint: connectorStart.value.point,
        toShapeId: result.shape.id,
        toPoint: result.point,
        stroke: strokeColor.value,
        strokeWidth: lineWidth.value,
        style: 'straight'
      };
      connectors.value.push(newConnector);
      saveHistory();
    }
    
    connectorStart.value = null;
    connectorPreview.value = null;
    isDrawing = false;
    redraw();
    return;
  }

  if (isDragging) {
    isDragging = false;
    saveHistory();
    return;
  }

  if (!isDrawing) return;
  isDrawing = false;

  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const endX = (e.clientX - rect.left) / zoom.value;
  const endY = (e.clientY - rect.top) / zoom.value;

  // 创建图形
  if (currentTool.value === "pen" && currentPath.length > 1) {
    const minX = Math.min(...currentPath.map(p => p.x));
    const minY = Math.min(...currentPath.map(p => p.y));
    shapes.value.push({
      id: `path-${Date.now()}`,
      type: "path",
      x: minX,
      y: minY,
      width: Math.max(...currentPath.map(p => p.x)) - minX || 1,
      height: Math.max(...currentPath.map(p => p.y)) - minY || 1,
      rotation: 0,
      fill: "transparent",
      stroke: strokeColor.value,
      strokeWidth: lineWidth.value,
      points: currentPath.map(p => ({ x: p.x - minX, y: p.y - minY })),
    });
    saveHistory();
  } else if (!["select", "pen", "eraser"].includes(currentTool.value)) {
    const w = Math.abs(endX - startX);
    const h = Math.abs(endY - startY);
    if (w > 5 || h > 5) {
      const newShape: Shape = {
        id: `shape-${Date.now()}`,
        type: currentTool.value,
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: w || 100,
        height: h || 100,
        rotation: 0,
        fill: fillColor.value,
        stroke: strokeColor.value,
        strokeWidth: lineWidth.value,
      };
      shapes.value.push(newShape);
      selectedShape.value = newShape;
      saveHistory();
    }
  }

  currentPath = [];
  redraw();
};

const onWheel = (e: WheelEvent) => {
  e.preventDefault();
  zoom.value = e.deltaY < 0 ? Math.min(zoom.value * 1.1, 3) : Math.max(zoom.value / 1.1, 0.3);
  redraw();
};

// 辅助函数
const findShapeAt = (x: number, y: number): Shape | null => {
  for (let i = shapes.value.length - 1; i >= 0; i--) {
    const s = shapes.value[i];
    if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
      return s;
    }
  }
  return null;
};

// 查找指定位置的连接点
const findConnectionPointAt = (x: number, y: number): { shape: Shape; point: string; absX: number; absY: number } | null => {
  const threshold = 10; // 连接点检测半径
  for (const shape of shapes.value) {
    const points = getConnectionPoints(shape);
    for (const p of points) {
      const absX = shape.x + p.x;
      const absY = shape.y + p.y;
      const dist = Math.sqrt((x - absX) ** 2 + (y - absY) ** 2);
      if (dist <= threshold) {
        return { shape, point: p.position, absX, absY };
      }
    }
  }
  return null;
};

// 绘制函数
const redraw = () => {
  if (!ctx || !canvasRef.value) return;
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  
  ctx.save();
  ctx.scale(zoom.value, zoom.value);
  
  // 绘制连接线
  connectors.value.forEach(conn => drawConnector(conn));
  
  // 绘制连接线预览
  if (connectorPreview.value) {
    drawConnectorPreview(connectorPreview.value);
  }
  
  // 绘制所有图形
  shapes.value.forEach(shape => {
    const isSelected = shape.id === selectedShape.value?.id;
    const isHovered = shape.id === hoveredShape.value?.id;
    drawShape(shape, isSelected, isHovered);
  });
  
  // 绘制连接点（悬停时显示）
  if (showConnectionPoints.value && hoveredShape.value) {
    drawConnectionPoints(hoveredShape.value);
  }
  
  ctx.restore();
};

// 绘制连接线
const drawConnector = (conn: Connector) => {
  if (!ctx) return;
  
  const fromShape = shapes.value.find(s => s.id === conn.fromShapeId);
  const toShape = shapes.value.find(s => s.id === conn.toShapeId);
  if (!fromShape || !toShape) return;
  
  const from = getConnectionPointAbs(fromShape, conn.fromPoint);
  const to = getConnectionPointAbs(toShape, conn.toPoint);
  
  ctx.strokeStyle = conn.stroke;
  ctx.lineWidth = conn.strokeWidth;
  ctx.lineCap = "round";
  
  if (conn.style === 'orthogonal') {
    // 正交（折线）
    const midX = (from.x + to.x) / 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(midX, from.y);
    ctx.lineTo(midX, to.y);
    ctx.lineTo(to.x, to.y);
  } else {
    // 直线
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
  }
  ctx.stroke();
  
  // 绘制端点箭头
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const arrowSize = 10;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - arrowSize * Math.cos(angle - Math.PI / 6), to.y - arrowSize * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - arrowSize * Math.cos(angle + Math.PI / 6), to.y - arrowSize * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = conn.stroke;
  ctx.fill();
};

// 绘制连接线预览
const drawConnectorPreview = (preview: { x1: number; y1: number; x2: number; y2: number }) => {
  if (!ctx) return;
  ctx.strokeStyle = strokeColor.value;
  ctx.lineWidth = lineWidth.value;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(preview.x1, preview.y1);
  ctx.lineTo(preview.x2, preview.y2);
  ctx.stroke();
  ctx.setLineDash([]);
};

// 绘制连接点
const drawConnectionPoints = (shape: Shape) => {
  if (!ctx) return;
  const points = getConnectionPoints(shape);
  
  for (const p of points) {
    const x = shape.x + p.x;
    const y = shape.y + p.y;
    
    // 外圈
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 内圈
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#667eea';
    ctx.fill();
  }
};

const drawShape = (shape: Shape, selected: boolean, isHovered: boolean = false) => {
  if (!ctx) return;
  
  ctx.save();
  ctx.translate(shape.x + shape.width / 2, shape.y + shape.height / 2);
  ctx.rotate((shape.rotation * Math.PI) / 180);
  ctx.translate(-shape.width / 2, -shape.height / 2);
  
  ctx.fillStyle = shape.fill;
  ctx.strokeStyle = shape.stroke;
  ctx.lineWidth = shape.strokeWidth;

  switch (shape.type) {
    case "rectangle":
      ctx.fillRect(0, 0, shape.width, shape.height);
      ctx.strokeRect(0, 0, shape.width, shape.height);
      break;
    case "circle":
      ctx.beginPath();
      ctx.ellipse(shape.width / 2, shape.height / 2, shape.width / 2, shape.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(shape.width / 2, 0);
      ctx.lineTo(shape.width, shape.height);
      ctx.lineTo(0, shape.height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "line":
      ctx.beginPath();
      ctx.moveTo(0, shape.height / 2);
      ctx.lineTo(shape.width, shape.height / 2);
      ctx.stroke();
      break;
    case "arrow":
      ctx.beginPath();
      ctx.moveTo(0, shape.height / 2);
      ctx.lineTo(shape.width - 10, shape.height / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(shape.width, shape.height / 2);
      ctx.lineTo(shape.width - 10, shape.height / 2 - 5);
      ctx.lineTo(shape.width - 10, shape.height / 2 + 5);
      ctx.fill();
      break;
    case "path":
      if (shape.points && shape.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        ctx.stroke();
      }
      break;
    default:
      ctx.fillRect(0, 0, shape.width, shape.height);
      ctx.strokeRect(0, 0, shape.width, shape.height);
  }

  if (selected) {
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(-5, -5, shape.width + 10, shape.height + 10);
    ctx.setLineDash([]);
  }

  ctx.restore();
};

const drawPath = (points: { x: number; y: number }[], color: string, width: number) => {
  if (!ctx || points.length < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.moveTo(points[0].x * zoom.value, points[0].y * zoom.value);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x * zoom.value, points[i].y * zoom.value);
  }
  ctx.stroke();
};

const drawShapePreview = (x1: number, y1: number, x2: number, y2: number) => {
  if (!ctx) return;
  ctx.strokeStyle = strokeColor.value;
  ctx.lineWidth = lineWidth.value;
  ctx.setLineDash([5, 5]);
  
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);

  switch (currentTool.value) {
    case "rectangle":
      ctx.strokeRect(x * zoom.value, y * zoom.value, w * zoom.value, h * zoom.value);
      break;
    case "circle":
      ctx.beginPath();
      ctx.ellipse((x + w / 2) * zoom.value, (y + h / 2) * zoom.value, w / 2 * zoom.value, h / 2 * zoom.value, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "triangle":
      ctx.beginPath();
      ctx.moveTo((x + w / 2) * zoom.value, y * zoom.value);
      ctx.lineTo((x + w) * zoom.value, (y + h) * zoom.value);
      ctx.lineTo(x * zoom.value, (y + h) * zoom.value);
      ctx.closePath();
      ctx.stroke();
      break;
    default:
      ctx.strokeRect(x * zoom.value, y * zoom.value, w * zoom.value, h * zoom.value);
  }
  
  ctx.setLineDash([]);
};

// 操作函数
const rotateSelected = (angle: number) => {
  if (selectedShape.value) {
    selectedShape.value.rotation = (selectedShape.value.rotation + angle) % 360;
    redraw();
    saveHistory();
  }
};

const deleteSelected = () => {
  if (selectedShape.value) {
    shapes.value = shapes.value.filter(s => s.id !== selectedShape.value!.id);
    selectedShape.value = null;
    redraw();
    saveHistory();
  }
};

const clearCanvas = () => {
  shapes.value = [];
  selectedShape.value = null;
  redraw();
  saveHistory();
};

// 历史记录（保存图形和连接线）
const saveHistory = () => {
  history.value = history.value.slice(0, historyIndex + 1);
  history.value.push({
    shapes: JSON.parse(JSON.stringify(shapes.value)),
    connectors: JSON.parse(JSON.stringify(connectors.value))
  } as any);
  if (history.value.length > 50) {
    history.value = history.value.slice(-50);
  }
  historyIndex = history.value.length - 1;
};

const undo = () => {
  if (historyIndex > 0) {
    historyIndex--;
    const state = history.value[historyIndex];
    shapes.value = JSON.parse(JSON.stringify(state.shapes || state));
    connectors.value = JSON.parse(JSON.stringify(state.connectors || []));
    selectedShape.value = null;
    redraw();
  }
};

const redo = () => {
  if (historyIndex < history.value.length - 1) {
    historyIndex++;
    const state = history.value[historyIndex];
    shapes.value = JSON.parse(JSON.stringify(state.shapes || state));
    connectors.value = JSON.parse(JSON.stringify(state.connectors || []));
    selectedShape.value = null;
    redraw();
  }
};

// 初始化历史
saveHistory();
</script>

<style scoped>
.whiteboard {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a5f1a;
  font-family: -apple-system, sans-serif;
}

/* 工具栏 */
.toolbar {
  height: 50px;
  background: #2d2d2d;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tool-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #3d3d3d;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.15s;
}

.tool-btn:hover {
  background: #4d4d4d;
}

.tool-btn.active {
  background: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.5);
}

.color-picker {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.size-select {
  height: 32px;
  background: #3d3d3d;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0 8px;
}

/* 主内容 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧面板 */
.left-panel {
  width: 60px;
  background: #2d2d2d;
  padding: 8px;
  overflow-y: auto;
}

.panel-section {
  margin-bottom: 12px;
}

.section-title {
  font-size: 9px;
  color: #888;
  text-align: center;
  margin-bottom: 6px;
}

.tool-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.s-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: #3d3d3d;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.15s;
}

.s-btn:hover {
  background: #4d4d4d;
}

.s-btn.active {
  background: #667eea;
}

/* 画布 */
.canvas-container {
  flex: 1;
  overflow: hidden;
}

canvas {
  display: block;
  cursor: crosshair;
}

/* 右侧面板 */
.right-panel {
  width: 180px;
  background: #2d2d2d;
  padding: 12px;
}

.prop-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.prop-row label {
  width: 30px;
  font-size: 12px;
  color: #aaa;
}

.prop-row input {
  flex: 1;
  height: 24px;
  background: #3d3d3d;
  border: none;
  border-radius: 4px;
  color: #fff;
  padding: 0 6px;
}

.action-btn {
  padding: 8px 12px;
  background: #3d3d3d;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  margin-right: 6px;
  margin-top: 6px;
}

.action-btn:hover {
  background: #4d4d4d;
}

.action-btn.danger {
  background: #e74c3c;
}

/* 底部状态栏 */
.footer {
  height: 28px;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 20px;
  font-size: 12px;
  color: #888;
}
</style>