<template>
  <div class="app-container" :class="{ 'whiteboard-mode': isWhiteboard }">
    <!-- 顶部工具栏 -->
    <header class="top-bar" v-if="!isWhiteboard">
      <div class="bar-left">
        <span class="logo">📐</span>
        <span class="title">图形化笔记工具</span>
      </div>
      <div class="bar-center">
        <button class="btn" @click="handleNew">新建</button>
        <button class="btn" @click="handleSave">保存</button>
        <button class="btn" @click="handleExport">导出PNG</button>
        <button class="btn" :class="{ primary: isWhiteboard }" @click="toggleWhiteboard">电子黑板</button>
        <button class="btn" @click="startAnnotation">屏幕标注</button>
      </div>
      <div class="bar-right">
        <button class="btn" @click="showLatexEditor = true">📐 公式</button>
        <button class="btn" @click="showHandwrite = true">✍️ 手写</button>
      </div>
    </header>

    <!-- 白板模式工具栏 -->
    <header class="whiteboard-bar" v-if="isWhiteboard">
      <button class="wb-btn" @click="toggleWhiteboard">退出黑板</button>
      <span class="sep"></span>
      <button v-for="t in basicShapes.slice(0,6)" :key="t.id" 
        :class="['wb-btn', currentTool === t.id ? 'active' : '']"
        @click="selectTool(t.id)">{{ t.icon }}</button>
      <span class="sep"></span>
      <input type="color" v-model="strokeColor" />
      <select v-model="lineWidth">
        <option :value="2">细</option>
        <option :value="4">中</option>
        <option :value="8">粗</option>
      </select>
      <button class="wb-btn" @click="clearCanvas">清空</button>
      <span class="page-info">页 {{ currentPage + 1 }}/{{ pages.length }}</span>
      <button class="wb-btn" @click="prevPage">◀</button>
      <button class="wb-btn" @click="nextPage">▶</button>
      <button class="wb-btn" @click="addPage">+ 页</button>
    </header>

    <!-- 主体区域 -->
    <main class="main-area">
      <!-- 左侧工具面板 -->
      <aside class="left-panel" v-if="!isWhiteboard">
        <div class="panel-section">
          <div class="section-header">📐 基础图形</div>
          <div class="tool-grid">
            <button v-for="t in basicShapes" :key="t.id" 
              :class="['tool-btn', currentTool === t.id ? 'active' : '']"
              @click="selectTool(t.id)">
              <span class="icon">{{ t.icon }}</span>
              <span class="label">{{ t.name }}</span>
            </button>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="section-header">📏 尺规工具</div>
          <div class="tool-grid">
            <button v-for="t in rulerTools" :key="t.id" 
              :class="['tool-btn', currentTool === t.id ? 'active' : '']"
              @click="selectTool(t.id)">
              <span class="icon">{{ t.icon }}</span>
              <span class="label">{{ t.name }}</span>
            </button>
          </div>
        </div>

        <div class="panel-section">
          <div class="section-header">📐 数学工具</div>
          <div class="tool-grid">
            <button v-for="t in mathTools" :key="t.id" 
              :class="['tool-btn', currentTool === t.id ? 'active' : '']"
              @click="selectTool(t.id)">
              <span class="icon">{{ t.icon }}</span>
              <span class="label">{{ t.name }}</span>
            </button>
          </div>
        </div>

        <div class="panel-section">
          <div class="section-header">⚡ 物理工具</div>
          <div class="tool-grid">
            <button v-for="t in physicsTools" :key="t.id" 
              :class="['tool-btn', currentTool === t.id ? 'active' : '']"
              @click="selectTool(t.id)">
              <span class="icon">{{ t.icon }}</span>
              <span class="label">{{ t.name }}</span>
            </button>
          </div>
        </div>

        <div class="panel-section">
          <div class="section-header">🧪 化学工具</div>
          <div class="tool-grid">
            <button v-for="t in chemistryTools" :key="t.id" 
              :class="['tool-btn', currentTool === t.id ? 'active' : '']"
              @click="selectTool(t.id)">
              <span class="icon">{{ t.icon }}</span>
              <span class="label">{{ t.name }}</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- 中间画布 -->
      <div class="canvas-area">
        <div class="canvas-toolbar" v-if="!isWhiteboard">
          <button :class="['tb-btn', drawMode === 'select' ? 'active' : '']" @click="drawMode = 'select'">选择</button>
          <button :class="['tb-btn', drawMode === 'pen' ? 'active' : '']" @click="drawMode = 'pen'">画笔</button>
          <button :class="['tb-btn', drawMode === 'eraser' ? 'active' : '']" @click="drawMode = 'eraser'">橡皮</button>
          <button class="tb-btn" @click="undo">撤销</button>
          <button class="tb-btn" @click="redo">重做</button>
          <span class="sep"></span>
          <label>颜色:</label>
          <input type="color" v-model="strokeColor" />
          <label>填充:</label>
          <input type="color" v-model="fillColor" />
          <label>粗细:</label>
          <select v-model="lineWidth">
            <option :value="1">1px</option>
            <option :value="2">2px</option>
            <option :value="3">3px</option>
            <option :value="5">5px</option>
          </select>
          <span class="sep"></span>
          <label><input type="checkbox" v-model="showGuides" /> 辅助线</label>
          <label><input type="checkbox" v-model="snapEnabled" /> 吸附</label>
        </div>
        <div class="canvas-wrapper" ref="canvasWrapper" :style="{ background: isWhiteboard ? '#2d5a27' : '#fff' }">
          <canvas ref="mainCanvas" 
            @mousedown="onMouseDown" 
            @mousemove="onMouseMove" 
            @mouseup="onMouseUp" 
            @mouseleave="onMouseUp"
            @wheel="onWheel"></canvas>
          <!-- 辅助线层 -->
          <svg class="guide-layer" ref="guideLayer" v-show="showGuides">
            <line v-for="g in guideLines" :key="g.id" 
              :x1="g.x1" :y1="g.y1" :x2="g.x2" :y2="g.y2" 
              stroke="#ff6b6b" stroke-width="1" stroke-dasharray="5,3" />
          </svg>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <aside class="right-panel" v-if="!isWhiteboard && selectedShape">
        <div class="panel-section">
          <div class="section-header">图形属性</div>
          <div class="prop-row">
            <label>X:</label>
            <input type="number" v-model.number="selectedShape.x" @change="updateShape" />
          </div>
          <div class="prop-row">
            <label>Y:</label>
            <input type="number" v-model.number="selectedShape.y" @change="updateShape" />
          </div>
          <div class="prop-row">
            <label>宽:</label>
            <input type="number" v-model.number="selectedShape.width" @change="updateShape" />
          </div>
          <div class="prop-row">
            <label>高:</label>
            <input type="number" v-model.number="selectedShape.height" @change="updateShape" />
          </div>
          <div class="prop-row">
            <label>旋转:</label>
            <input type="number" v-model.number="selectedShape.rotation" @change="updateShape" />
            <span>°</span>
          </div>
          <div class="prop-row">
            <label>填充:</label>
            <input type="color" v-model="selectedShape.fill" @change="updateShape" />
          </div>
          <div class="prop-row">
            <label>边框:</label>
            <input type="color" v-model="selectedShape.stroke" @change="updateShape" />
          </div>
        </div>
        
        <div class="panel-section">
          <div class="section-header">操作</div>
          <div class="action-buttons">
            <button class="action-btn" @click="rotateSelected(-15)">↺ -15°</button>
            <button class="action-btn" @click="rotateSelected(15)">↻ +15°</button>
            <button class="action-btn" @click="splitSelected">分割</button>
            <button class="action-btn danger" @click="deleteSelected">删除</button>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="section-header">连接点</div>
          <p class="hint">选中图形显示连接点，可拖动连接</p>
        </div>
      </aside>
    </main>

    <!-- 底部状态栏 -->
    <footer class="bottom-bar" v-if="!isWhiteboard">
      <span>坐标: ({{ mousePos.x }}, {{ mousePos.y }})</span>
      <span>工具: {{ currentToolName }}</span>
      <span>图形: {{ shapes.length }} 个</span>
      <span>缩放: {{ Math.round(zoom * 100) }}%</span>
    </footer>

    <!-- LaTeX 公式编辑器弹窗 -->
    <div class="modal-overlay" v-if="showLatexEditor" @click.self="showLatexEditor = false">
      <div class="modal-content latex-modal">
        <div class="modal-header">
          <h3>📐 LaTeX 公式编辑器</h3>
          <button class="close-btn" @click="showLatexEditor = false">×</button>
        </div>
        <div class="modal-body">
          <div class="latex-input">
            <textarea v-model="latexInput" placeholder="输入 LaTeX 公式，例如: \frac{a}{b} 或 x^2"></textarea>
          </div>
          <div class="latex-preview">
            <div class="preview-label">预览:</div>
            <div class="preview-content" ref="latexPreviewEl"></div>
          </div>
          <div class="latex-templates">
            <span class="template-label">常用公式:</span>
            <button v-for="t in latexTemplates" :key="t.label" class="template-btn" @click="latexInput += t.code">{{ t.label }}</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showLatexEditor = false">取消</button>
          <button class="btn primary" @click="insertLatex">插入</button>
        </div>
      </div>
    </div>

    <!-- 函数输入弹窗 -->
    <div class="modal-overlay" v-if="showFunctionInput" @click.self="showFunctionInput = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>📉 函数曲线</h3>
          <button class="close-btn" @click="showFunctionInput = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>函数表达式 f(x):</label>
            <input v-model="functionExpr" placeholder="例如: Math.sin(x) 或 x*x" />
          </div>
          <div class="form-row">
            <label>X范围:</label>
            <input type="number" v-model.number="functionXMin" style="width:60px" /> 
            到 
            <input type="number" v-model.number="functionXMax" style="width:60px" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showFunctionInput = false">取消</button>
          <button class="btn primary" @click="insertFunction">绘制</button>
        </div>
      </div>
    </div>

    <!-- 手写识别面板 -->
    <div class="handwrite-overlay" v-if="showHandwrite" @click.self="showHandwrite = false">
      <HandwritePanel 
        @close="showHandwrite = false" 
        @insert-text="insertHandwriteText"
        @insert-shape="insertHandwriteShape"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import katex from "katex";
import "katex/dist/katex.min.css";
import HandwritePanel from "@/components/HandwritePanel.vue";

// ===== 类型定义 =====
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
  text?: string;
  connectionPoints?: { x: number; y: number }[];
}

interface GuideLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: "horizontal" | "vertical";
}

// ===== 状态 =====
const currentTool = ref("select");
const drawMode = ref("select");
const strokeColor = ref("#333333");
const fillColor = ref("#ffffff");
const lineWidth = ref(2);
const zoom = ref(1);
const mousePos = ref({ x: 0, y: 0 });
const statusText = ref("就绪");
const isWhiteboard = ref(false);
const showGuides = ref(false);
const snapEnabled = ref(false);

// 画布
const canvasWrapper = ref<HTMLDivElement | null>(null);
const mainCanvas = ref<HTMLCanvasElement | null>(null);
const guideLayer = ref<SVGSVGElement | null>(null);
const latexPreviewEl = ref<HTMLElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;

// 图形
const shapes = ref<Shape[]>([]);
const selectedShape = ref<Shape | null>(null);
const history = ref<Shape[][]>([[]]);
const historyIndex = ref(0);
const guideLines = ref<GuideLine[]>([]);

// 多页面（电子黑板）
const pages = ref<Shape[][]>([[]]);
const currentPage = ref(0);

// LaTeX
const showLatexEditor = ref(false);
const latexInput = ref("");
const latexTemplates = [
  { label: "分数", code: "\\frac{a}{b}" },
  { label: "平方", code: "x^2" },
  { label: "根号", code: "\\sqrt{x}" },
  { label: "求和", code: "\\sum_{i=1}^{n}" },
  { label: "积分", code: "\\int_a^b" },
  { label: "极限", code: "\\lim_{x\\to\\infty}" },
  { label: "α", code: "\\alpha" },
  { label: "β", code: "\\beta" },
  { label: "π", code: "\\pi" },
];

// 函数
const showFunctionInput = ref(false);
const functionExpr = ref("Math.sin(x)");
const functionXMin = ref(-5);
const functionXMax = ref(5);

// 手写识别
const showHandwrite = ref(false);

// ===== 工具定义 =====
const basicShapes = [
  { id: "select", name: "选择", icon: "↖" },
  { id: "rectangle", name: "矩形", icon: "□" },
  { id: "circle", name: "圆", icon: "○" },
  { id: "triangle", name: "三角", icon: "△" },
  { id: "line", name: "直线", icon: "/" },
  { id: "arrow", name: "箭头", icon: "→" },
];

const rulerTools = [
  { id: "ruler", name: "直尺", icon: "📏" },
  { id: "protractor", name: "量角器", icon: "◠" },
  { id: "compass", name: "圆规", icon: "✂" },
  { id: "angle-mark", name: "角度", icon: "∠" },
];

const mathTools = [
  { id: "coordinate", name: "坐标系", icon: "+" },
  { id: "function-curve", name: "函数", icon: "∿" },
  { id: "number-line", name: "数轴", icon: "—" },
];

const physicsTools = [
  { id: "force-arrow", name: "力", icon: "→" },
  { id: "pulley", name: "滑轮", icon: "⚙" },
  { id: "spring", name: "弹簧", icon: "〰" },
  { id: "incline", name: "斜面", icon: "▱" },
  { id: "lever", name: "杠杆", icon: "⚖" },
];

const chemistryTools = [
  { id: "beaker", name: "烧杯", icon: "🧪" },
  { id: "flask", name: "烧瓶", icon: "🧫" },
  { id: "molecule", name: "分子", icon: "⬡" },
  { id: "test-tube", name: "试管", icon: "🧫" },
];

const currentToolName = computed(() => {
  const all = [...basicShapes, ...rulerTools, ...mathTools, ...physicsTools, ...chemistryTools];
  return all.find(t => t.id === currentTool.value)?.name || "选择";
});

// ===== 初始化 =====
onMounted(() => {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
});

onUnmounted(() => {
  window.removeEventListener("resize", resizeCanvas);
  // 清理 Canvas 上下文
  ctx = null;
  // 清理历史记录
  history.value = [[]];
  historyIndex.value = 0;
});

const resizeCanvas = () => {
  nextTick(() => {
    if (!mainCanvas.value || !canvasWrapper.value) return;
    const rect = canvasWrapper.value.getBoundingClientRect();
    mainCanvas.value.width = rect.width;
    mainCanvas.value.height = rect.height;
    ctx = mainCanvas.value.getContext("2d");
    redraw();
  });
};

// ===== LaTeX 预览 =====
watch(latexInput, (val) => {
  if (latexPreviewEl.value && val) {
    try {
      katex.render(val, latexPreviewEl.value, { throwOnError: false });
    } catch (e) {
      latexPreviewEl.value.innerHTML = `<span style="color:red">公式错误</span>`;
    }
  }
});

// ===== 工具选择 =====
const selectTool = (toolId: string) => {
  currentTool.value = toolId;
  if (toolId === "select") {
    drawMode.value = "select";
  } else if (toolId === "function-curve") {
    showFunctionInput.value = true;
  } else {
    drawMode.value = "draw";
  }
  selectedShape.value = null;
  statusText.value = `已选择: ${currentToolName.value}`;
};

// ===== 绘制状态 =====
let isDrawing = false;
let startX = 0;
let startY = 0;
let currentPath: { x: number; y: number }[] = [];
let dragOffsetX = 0;
let dragOffsetY = 0;
let isDragging = false;
let compassCenter: { x: number; y: number } | null = null;
let compassRadius = 0;
let rulerAngle = 0;

// ===== 鼠标事件 =====
const onMouseDown = (e: MouseEvent) => {
  if (!mainCanvas.value) return;
  const rect = mainCanvas.value.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom.value;
  const y = (e.clientY - rect.top) / zoom.value;

  if (drawMode.value === "select" || currentTool.value === "select") {
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

  startX = x;
  startY = y;
  isDrawing = true;

  // 圆规特殊处理
  if (currentTool.value === "compass") {
    if (!compassCenter) {
      compassCenter = { x, y };
      statusText.value = "点击设置圆的边缘";
    }
    return;
  }

  if (drawMode.value === "pen" || drawMode.value === "eraser") {
    currentPath = [{ x, y }];
  }
};

const onMouseMove = (e: MouseEvent) => {
  if (!mainCanvas.value) return;
  const rect = mainCanvas.value.getBoundingClientRect();
  let x = (e.clientX - rect.left) / zoom.value;
  let y = (e.clientY - rect.top) / zoom.value;
  
  // 吸附功能
  if (snapEnabled.value && isDrawing) {
    const snapped = snapToPoint(x, y);
    x = snapped.x;
    y = snapped.y;
  }
  
  mousePos.value = { x: Math.round(x), y: Math.round(y) };

  // 拖动图形
  if (isDragging && selectedShape.value) {
    selectedShape.value.x = x - dragOffsetX;
    selectedShape.value.y = y - dragOffsetY;
    redraw();
    updateGuideLines();
    return;
  }

  if (!isDrawing) return;

  // 圆规模式
  if (currentTool.value === "compass" && compassCenter) {
    compassRadius = Math.sqrt(Math.pow(x - compassCenter.x, 2) + Math.pow(y - compassCenter.y, 2));
    redraw();
    // 绘制预览圆
    if (ctx) {
      ctx.save();
      ctx.scale(zoom.value, zoom.value);
      ctx.beginPath();
      ctx.arc(compassCenter.x, compassCenter.y, compassRadius, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor.value;
      ctx.lineWidth = lineWidth.value;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }

  if (drawMode.value === "pen" || drawMode.value === "eraser") {
    currentPath.push({ x, y });
    redraw();
    if (ctx && currentPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = drawMode.value === "eraser" ? "#ffffff" : strokeColor.value;
      ctx.lineWidth = (drawMode.value === "eraser" ? lineWidth.value * 3 : lineWidth.value) * zoom.value;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const p1 = currentPath[0];
      ctx.moveTo(p1.x * zoom.value, p1.y * zoom.value);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x * zoom.value, currentPath[i].y * zoom.value);
      }
      ctx.stroke();
    }
  } else if (currentTool.value !== "select") {
    redraw();
    drawShapePreview(startX, startY, x, y);
  }
};

const onMouseUp = (e: MouseEvent) => {
  if (isDragging) {
    isDragging = false;
    saveHistory();
    return;
  }

  // 圆规完成
  if (currentTool.value === "compass" && compassCenter && compassRadius > 5) {
    shapes.value.push({
      id: `compass-${Date.now()}`,
      type: "circle",
      x: compassCenter.x - compassRadius,
      y: compassCenter.y - compassRadius,
      width: compassRadius * 2,
      height: compassRadius * 2,
      rotation: 0,
      fill: "transparent",
      stroke: strokeColor.value,
      strokeWidth: lineWidth.value,
    });
    compassCenter = null;
    compassRadius = 0;
    saveHistory();
    redraw();
    return;
  }
  compassCenter = null;

  if (!isDrawing) return;
  isDrawing = false;

  if (!mainCanvas.value) return;
  const rect = mainCanvas.value.getBoundingClientRect();
  const endX = (e.clientX - rect.left) / zoom.value;
  const endY = (e.clientY - rect.top) / zoom.value;

  if (drawMode.value === "pen" && currentPath.length > 1) {
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
  } else if (currentTool.value !== "select" && currentTool.value !== "pen" && currentTool.value !== "eraser") {
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
        fill: currentTool.value === "line" || currentTool.value === "arrow" || currentTool.value === "force-arrow" ? "transparent" : fillColor.value,
        stroke: strokeColor.value,
        strokeWidth: lineWidth.value,
        connectionPoints: [
          { x: 0, y: 0.5 }, { x: 1, y: 0.5 },
          { x: 0.5, y: 0 }, { x: 0.5, y: 1 },
        ],
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
  if (e.deltaY < 0) {
    zoom.value = Math.min(zoom.value * 1.1, 3);
  } else {
    zoom.value = Math.max(zoom.value / 1.1, 0.3);
  }
  redraw();
};

// ===== 吸附功能 =====
const snapToPoint = (x: number, y: number): { x: number; y: number } => {
  const snapDistance = 10;
  let snappedX = x;
  let snappedY = y;
  
  // 吸附到图形边界
  for (const shape of shapes.value) {
    const points = [
      shape.x, shape.x + shape.width,
      shape.y, shape.y + shape.height,
    ];
    if (Math.abs(x - points[0]) < snapDistance) snappedX = points[0];
    if (Math.abs(x - points[1]) < snapDistance) snappedX = points[1];
    if (Math.abs(y - points[2]) < snapDistance) snappedY = points[2];
    if (Math.abs(y - points[3]) < snapDistance) snappedY = points[3];
  }
  
  return { x: snappedX, y: snappedY };
};

const updateGuideLines = () => {
  if (!showGuides.value || !selectedShape.value) {
    guideLines.value = [];
    return;
  }
  
  const s = selectedShape.value;
  guideLines.value = [
    { id: "h1", x1: 0, y1: s.y, x2: mainCanvas.value!.width, y2: s.y, type: "horizontal" },
    { id: "h2", x1: 0, y1: s.y + s.height, x2: mainCanvas.value!.width, y2: s.y + s.height, type: "horizontal" },
    { id: "v1", x1: s.x, y1: 0, x2: s.x, y2: mainCanvas.value!.height, type: "vertical" },
    { id: "v2", x1: s.x + s.width, y1: 0, x2: s.x + s.width, y2: mainCanvas.value!.height, type: "vertical" },
  ];
};

// ===== 图形查找 =====
const findShapeAt = (x: number, y: number): Shape | null => {
  for (let i = shapes.value.length - 1; i >= 0; i--) {
    const s = shapes.value[i];
    if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
      return s;
    }
  }
  return null;
};

// ===== 绘制函数 =====
const redraw = () => {
  if (!ctx || !mainCanvas.value) return;
  
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, mainCanvas.value.width, mainCanvas.value.height);
  ctx.restore();
  
  // 电子黑板背景
  if (isWhiteboard.value) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#2d5a27";
    ctx.fillRect(0, 0, mainCanvas.value.width, mainCanvas.value.height);
    ctx.restore();
  }
  
  // 绘制网格
  if (!isWhiteboard.value) drawGrid();
  
  // 绘制所有图形
  ctx.save();
  ctx.scale(zoom.value, zoom.value);
  shapes.value.forEach(shape => {
    drawShape(shape, shape.id === selectedShape.value?.id);
  });
  ctx.restore();
};

const drawGrid = () => {
  if (!ctx || !mainCanvas.value) return;
  const gridSize = 20;
  ctx.strokeStyle = "#f0f0f0";
  ctx.lineWidth = 0.5;
  
  for (let x = 0; x < mainCanvas.value.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, mainCanvas.value.height);
    ctx.stroke();
  }
  for (let y = 0; y < mainCanvas.value.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(mainCanvas.value.width, y);
    ctx.stroke();
  }
};

const drawShape = (shape: Shape, selected: boolean) => {
  if (!ctx) return;
  
  ctx.save();
  ctx.translate(shape.x + shape.width / 2, shape.y + shape.height / 2);
  ctx.rotate((shape.rotation * Math.PI) / 180);
  ctx.translate(-shape.width / 2, -shape.height / 2);
  
  ctx.fillStyle = shape.fill;
  ctx.strokeStyle = shape.stroke;
  ctx.lineWidth = shape.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

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
    case "force-arrow":
      ctx.beginPath();
      ctx.moveTo(0, shape.height / 2);
      ctx.lineTo(shape.width - 12, shape.height / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(shape.width, shape.height / 2);
      ctx.lineTo(shape.width - 12, shape.height / 2 - 6);
      ctx.lineTo(shape.width - 12, shape.height / 2 + 6);
      ctx.closePath();
      ctx.fill();
      break;
    case "coordinate":
      drawCoordinateSystem(shape.width, shape.height);
      break;
    case "ruler":
      drawRuler(shape.width, shape.height);
      break;
    case "protractor":
      drawProtractor(Math.min(shape.width, shape.height));
      break;
    case "angle-mark":
      drawAngleMark(shape.width, shape.height);
      break;
    case "pulley":
      drawPulley(shape.width / 2, shape.height / 2, Math.min(shape.width, shape.height) / 2);
      break;
    case "spring":
      drawSpring(0, shape.height / 2, shape.width, 15);
      break;
    case "incline":
      ctx.beginPath();
      ctx.moveTo(0, shape.height);
      ctx.lineTo(shape.width, shape.height);
      ctx.lineTo(shape.width, 0);
      ctx.closePath();
      ctx.stroke();
      break;
    case "lever":
      drawLever(shape.width, shape.height);
      break;
    case "beaker":
      drawBeaker(shape.width, shape.height);
      break;
    case "flask":
      drawFlask(shape.width, shape.height);
      break;
    case "molecule":
      drawMolecule(shape.width / 2, shape.height / 2, Math.min(shape.width, shape.height) / 3);
      break;
    case "test-tube":
      drawTestTube(shape.width / 2, shape.height / 2, shape.width / 4, shape.height * 0.8);
      break;
    case "number-line":
      drawNumberLine(shape.width);
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

  // 选中状态和连接点
  if (selected) {
    ctx.strokeStyle = "#409eff";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(-5, -5, shape.width + 10, shape.height + 10);
    ctx.setLineDash([]);
    
    // 旋转手柄
    ctx.fillStyle = "#409eff";
    ctx.beginPath();
    ctx.arc(shape.width / 2, -20, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // 连接点
    ctx.fillStyle = "#409eff";
    const connPoints = [
      [0, 0], [shape.width / 2, 0], [shape.width, 0],
      [0, shape.height / 2], [shape.width, shape.height / 2],
      [0, shape.height], [shape.width / 2, shape.height], [shape.width, shape.height]
    ];
    connPoints.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
};

// ===== 特殊图形绘制 =====
const drawCoordinateSystem = (w: number, h: number) => {
  if (!ctx) return;
  const cx = w / 2;
  const cy = h / 2;
  
  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, h);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(w - 8, cy - 4);
  ctx.lineTo(w, cy);
  ctx.lineTo(w - 8, cy + 4);
  ctx.moveTo(cx - 4, 8);
  ctx.lineTo(cx, 0);
  ctx.lineTo(cx + 4, 8);
  ctx.stroke();
  
  ctx.fillStyle = "#333";
  ctx.font = "10px sans-serif";
  ctx.fillText("x", w - 12, cy - 8);
  ctx.fillText("y", cx + 8, 12);
  ctx.fillText("O", cx + 4, cy + 12);
};

const drawRuler = (w: number, h: number) => {
  if (!ctx) return;
  ctx.fillStyle = "#fff8dc";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeRect(0, 0, w, h);
  
  ctx.fillStyle = "#333";
  ctx.font = "8px sans-serif";
  for (let i = 0; i <= w; i += 5) {
    const isMajor = i % 50 === 0;
    const isMedium = i % 10 === 0;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, isMajor ? h * 0.4 : (isMedium ? h * 0.25 : h * 0.15));
    ctx.stroke();
    if (isMajor && i > 0) {
      ctx.fillText(String(i / 10), i - 6, h * 0.55);
    }
  }
};

const drawProtractor = (size: number) => {
  if (!ctx) return;
  const cx = size / 2;
  const cy = size * 0.9;
  
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.45, Math.PI, 0);
  ctx.lineTo(cx + size * 0.45, cy);
  ctx.lineTo(cx - size * 0.45, cy);
  ctx.closePath();
  ctx.stroke();
  
  ctx.fillStyle = "#333";
  ctx.font = "7px sans-serif";
  for (let deg = 0; deg <= 180; deg += 5) {
    const rad = (deg * Math.PI) / 180;
    const inner = deg % 30 === 0 ? size * 0.35 : (deg % 10 === 0 ? size * 0.38 : size * 0.42);
    const outer = size * 0.45;
    ctx.beginPath();
    ctx.moveTo(cx + inner * Math.cos(Math.PI - rad), cy - inner * Math.sin(rad));
    ctx.lineTo(cx + outer * Math.cos(Math.PI - rad), cy - outer * Math.sin(rad));
    ctx.stroke();
    if (deg % 30 === 0 && deg < 180) {
      const labelR = size * 0.3;
      ctx.fillText(String(deg), cx + labelR * Math.cos(Math.PI - rad) - 4, cy - labelR * Math.sin(rad) + 3);
    }
  }
};

const drawAngleMark = (w: number, h: number) => {
  if (!ctx) return;
  const cx = w * 0.2;
  const cy = h * 0.8;
  
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + w * 0.6, cy - h * 0.6);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(cx, cy, 30, -Math.PI / 4, 0);
  ctx.stroke();
  
  ctx.fillStyle = "#333";
  ctx.font = "12px sans-serif";
  ctx.fillText("α", cx + 35, cy - 10);
};

const drawPulley = (cx: number, cy: number, r: number) => {
  if (!ctx) return;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx - r, cy + r * 1.5);
  ctx.moveTo(cx + r, cy);
  ctx.lineTo(cx + r, cy + r * 1.5);
  ctx.stroke();
};

const drawSpring = (x: number, y: number, length: number, amplitude: number) => {
  if (!ctx) return;
  ctx.beginPath();
  ctx.moveTo(x, y);
  const coils = 8;
  for (let i = 0; i <= coils; i++) {
    const px = x + (length / coils) * i;
    const py = y + (i % 2 === 0 ? -amplitude : amplitude);
    ctx.lineTo(px, py);
  }
  ctx.stroke();
};

const drawLever = (w: number, h: number) => {
  if (!ctx) return;
  const cy = h * 0.6;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(w * 0.3, cy);
  ctx.lineTo(w * 0.3 - 10, h);
  ctx.lineTo(w * 0.3 + 10, h);
  ctx.closePath();
  ctx.stroke();
};

const drawBeaker = (w: number, h: number) => {
  if (!ctx) return;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, 0);
  ctx.lineTo(0, h);
  ctx.lineTo(w, h);
  ctx.lineTo(w * 0.9, 0);
  ctx.stroke();
  
  ctx.fillStyle = "#333";
  ctx.font = "8px sans-serif";
  for (let y = h - 15; y > 15; y -= 15) {
    ctx.beginPath();
    ctx.moveTo(3, y);
    ctx.lineTo(12, y);
    ctx.stroke();
    ctx.fillText(String(Math.round((h - y) / 3)), 15, y + 3);
  }
};

const drawFlask = (w: number, h: number) => {
  if (!ctx) return;
  const neckW = w * 0.2;
  const neckH = h * 0.3;
  
  ctx.beginPath();
  ctx.moveTo((w - neckW) / 2, 0);
  ctx.lineTo((w - neckW) / 2, neckH);
  ctx.quadraticCurveTo(0, h * 0.5, 0, h);
  ctx.lineTo(w, h);
  ctx.quadraticCurveTo(w, h * 0.5, (w + neckW) / 2, neckH);
  ctx.lineTo((w + neckW) / 2, 0);
  ctx.stroke();
};

const drawMolecule = (cx: number, cy: number, r: number) => {
  if (!ctx) return;
  const angles = [0, Math.PI * 2 / 3, Math.PI * 4 / 3];
  
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 3;
  angles.forEach(a => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    ctx.stroke();
  });
  
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
  ctx.fill();
  
  angles.forEach(a => {
    ctx.beginPath();
    ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawTestTube = (cx: number, cy: number, w: number, h: number) => {
  if (!ctx) return;
  ctx.beginPath();
  ctx.moveTo(cx - w, cy - h / 2);
  ctx.lineTo(cx - w, cy + h / 2 - w);
  ctx.arc(cx, cy + h / 2 - w, w, Math.PI, 0);
  ctx.lineTo(cx + w, cy - h / 2);
  ctx.stroke();
};

const drawNumberLine = (w: number) => {
  if (!ctx) return;
  const cy = 20;
  
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(w - 5, cy - 4);
  ctx.lineTo(w, cy);
  ctx.lineTo(w - 5, cy + 4);
  ctx.stroke();
  
  ctx.fillStyle = "#333";
  ctx.font = "8px sans-serif";
  for (let i = -5; i <= 5; i++) {
    const x = w / 2 + i * 30;
    ctx.beginPath();
    ctx.moveTo(x, cy - 5);
    ctx.lineTo(x, cy + 5);
    ctx.stroke();
    ctx.fillText(String(i), x - 3, cy + 15);
  }
};

const drawShapePreview = (x1: number, y1: number, x2: number, y2: number) => {
  if (!ctx) return;
  ctx.save();
  ctx.scale(zoom.value, zoom.value);
  ctx.strokeStyle = strokeColor.value;
  ctx.lineWidth = lineWidth.value;
  ctx.setLineDash([5, 5]);
  
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);

  switch (currentTool.value) {
    case "rectangle":
    case "ruler":
      ctx.strokeRect(x, y, w, h);
      break;
    case "circle":
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.stroke();
      break;
    case "line":
    case "arrow":
    case "force-arrow":
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      break;
    default:
      ctx.strokeRect(x, y, w || 100, h || 100);
  }
  
  ctx.setLineDash([]);
  ctx.restore();
};

// ===== 操作函数 =====
const updateShape = () => {
  redraw();
  saveHistory();
};

const rotateSelected = (angle: number) => {
  if (selectedShape.value) {
    selectedShape.value.rotation = (selectedShape.value.rotation + angle) % 360;
    redraw();
    saveHistory();
  }
};

const splitSelected = () => {
  if (selectedShape.value) {
    const s = selectedShape.value;
    const newShape1: Shape = { ...s, id: `shape-${Date.now()}`, width: s.width / 2 };
    const newShape2: Shape = { ...s, id: `shape-${Date.now()}`, x: s.x + s.width / 2, width: s.width / 2 };
    shapes.value = shapes.value.filter(sh => sh.id !== s.id);
    shapes.value.push(newShape1, newShape2);
    selectedShape.value = null;
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

// ===== 历史记录 =====
const MAX_HISTORY = 50; // 限制历史记录数量

const saveHistory = () => {
  history.value = history.value.slice(0, historyIndex.value + 1);
  history.value.push(JSON.parse(JSON.stringify(shapes.value)));
  
  // 限制历史记录数量，防止内存无限增长
  if (history.value.length > MAX_HISTORY) {
    history.value = history.value.slice(-MAX_HISTORY);
  }
  
  historyIndex.value = history.value.length - 1;
  pages.value[currentPage.value] = JSON.parse(JSON.stringify(shapes.value));
};

const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    shapes.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
    selectedShape.value = null;
    redraw();
  }
};

const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    shapes.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
    selectedShape.value = null;
    redraw();
  }
};

// ===== 多页面 =====
const prevPage = () => {
  if (currentPage.value > 0) {
    pages.value[currentPage.value] = JSON.parse(JSON.stringify(shapes.value));
    currentPage.value--;
    shapes.value = JSON.parse(JSON.stringify(pages.value[currentPage.value]));
    history.value = [JSON.parse(JSON.stringify(shapes.value))];
    historyIndex.value = 0;
    redraw();
  }
};

const nextPage = () => {
  if (currentPage.value < pages.value.length - 1) {
    pages.value[currentPage.value] = JSON.parse(JSON.stringify(shapes.value));
    currentPage.value++;
    shapes.value = JSON.parse(JSON.stringify(pages.value[currentPage.value]));
    history.value = [JSON.parse(JSON.stringify(shapes.value))];
    historyIndex.value = 0;
    redraw();
  }
};

const addPage = () => {
  pages.value.push([]);
  currentPage.value = pages.value.length - 1;
  shapes.value = [];
  history.value = [[]];
  historyIndex.value = 0;
  redraw();
};

// ===== 文件操作 =====
const handleNew = () => {
  shapes.value = [];
  selectedShape.value = null;
  history.value = [[]];
  historyIndex.value = 0;
  redraw();
  statusText.value = "已新建";
};

const handleSave = () => {
  const data = JSON.stringify({ pages: pages.value, currentPage: currentPage.value }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "notebook.json";
  a.click();
  URL.revokeObjectURL(url);
  statusText.value = "已保存";
};

const handleExport = () => {
  if (!mainCanvas.value) return;
  const link = document.createElement("a");
  link.download = "canvas.png";
  link.href = mainCanvas.value.toDataURL();
  link.click();
  statusText.value = "已导出PNG";
};

const toggleWhiteboard = () => {
  isWhiteboard.value = !isWhiteboard.value;
  nextTick(() => resizeCanvas());
};

const startAnnotation = () => {
  statusText.value = "屏幕标注功能开发中...";
};

// ===== LaTeX =====
const insertLatex = () => {
  if (latexInput.value) {
    shapes.value.push({
      id: `latex-${Date.now()}`,
      type: "text",
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      fill: "transparent",
      stroke: "#333",
      strokeWidth: 1,
      text: latexInput.value,
    });
    showLatexEditor.value = false;
    latexInput.value = "";
    redraw();
    saveHistory();
  }
};

// ===== 函数曲线 =====
const insertFunction = () => {
  const points: { x: number; y: number }[] = [];
  const cx = 200;
  const cy = 200;
  const scale = 30;
  
  for (let px = functionXMin.value; px <= functionXMax.value; px += 0.1) {
    try {
      const y = eval(functionExpr.value.replace(/x/g, `(${px})`));
      points.push({ x: cx + px * scale, y: cy - y * scale });
    } catch (e) {
      console.error("函数计算错误", e);
    }
  }
  
  if (points.length > 1) {
    const minX = Math.min(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    shapes.value.push({
      id: `func-${Date.now()}`,
      type: "path",
      x: minX,
      y: minY,
      width: Math.max(...points.map(p => p.x)) - minX,
      height: Math.max(...points.map(p => p.y)) - minY,
      rotation: 0,
      fill: "transparent",
      stroke: strokeColor.value,
      strokeWidth: lineWidth.value,
      points: points.map(p => ({ x: p.x - minX, y: p.y - minY })),
    });
    saveHistory();
    redraw();
  }
  
  showFunctionInput.value = false;
};

// ===== 手写识别 =====
const insertHandwriteText = (text: string) => {
  shapes.value.push({
    id: `text-${Date.now()}`,
    type: "text",
    x: 100,
    y: 100,
    width: 150,
    height: 40,
    rotation: 0,
    fill: "transparent",
    stroke: strokeColor.value,
    strokeWidth: 1,
    text: text,
  });
  showHandwrite.value = false;
  saveHistory();
  redraw();
};

const insertHandwriteShape = (shapeType: string) => {
  shapes.value.push({
    id: `shape-${Date.now()}`,
    type: shapeType,
    x: 150,
    y: 150,
    width: 100,
    height: 100,
    rotation: 0,
    fill: fillColor.value,
    stroke: strokeColor.value,
    strokeWidth: lineWidth.value,
  });
  showHandwrite.value = false;
  saveHistory();
  redraw();
};

// 初始化历史
saveHistory();
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; overflow: hidden; }
</style>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
  background: #f5f7fa;
}
.app-container.whiteboard-mode {
  background: #2d5a27;
}

/* 顶部工具栏 */
.top-bar {
  height: 44px;
  background: linear-gradient(180deg, #fff 0%, #f8f9fa 100%);
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
}
.bar-left { display: flex; align-items: center; gap: 8px; }
.logo { font-size: 22px; }
.title { font-size: 15px; font-weight: 600; color: #1a1a1a; }
.bar-center { display: flex; gap: 6px; }
.btn {
  padding: 5px 14px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}
.btn:hover { background: #f5f5f5; border-color: #ccc; }
.btn.primary { background: #1890ff; color: #fff; border-color: #1890ff; }
.bar-right { margin-left: auto; }

/* 白板工具栏 */
.whiteboard-bar {
  height: 44px;
  background: #333;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 6px;
}
.wb-btn {
  padding: 5px 12px;
  border: 1px solid #555;
  background: #444;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.wb-btn:hover { background: #555; }
.wb-btn.active { background: #1890ff; border-color: #1890ff; }
.whiteboard-bar .sep { width: 1px; height: 24px; background: #555; margin: 0 4px; }
.whiteboard-bar input[type="color"] { width: 28px; height: 28px; border: none; }
.whiteboard-bar select { height: 28px; background: #444; color: #fff; border: 1px solid #555; }
.page-info { color: #fff; font-size: 13px; margin-left: auto; margin-right: 10px; }

/* 主体 */
.main-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧面板 */
.left-panel {
  width: 200px;
  background: #fff;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
}
.panel-section { padding: 10px; border-bottom: 1px solid #f0f0f0; }
.section-header {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}
.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}
.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 4px;
  border: 1px solid #e8e8e8;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.tool-btn:hover { border-color: #1890ff; background: #e6f7ff; }
.tool-btn.active { border-color: #1890ff; background: #e6f7ff; }
.tool-btn .icon { font-size: 16px; }
.tool-btn .label { font-size: 10px; color: #666; margin-top: 2px; }

/* 画布 */
.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #e8e8e8;
}
.canvas-toolbar {
  height: 34px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 6px;
}
.tb-btn {
  padding: 3px 10px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
}
.tb-btn:hover { background: #f5f5f5; }
.tb-btn.active { background: #e6f7ff; border-color: #1890ff; }
.sep { width: 1px; height: 18px; background: #e0e0e0; margin: 0 4px; }
.canvas-toolbar label { font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px; }
.canvas-toolbar input[type="color"] { width: 24px; height: 24px; border: 1px solid #ddd; }
.canvas-toolbar select { height: 24px; padding: 0 4px; border: 1px solid #ddd; }
.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #fff;
  margin: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
canvas { display: block; cursor: crosshair; }
.guide-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 右侧面板 */
.right-panel {
  width: 220px;
  background: #fff;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
}
.prop-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.prop-row label {
  width: 50px;
  font-size: 12px;
  color: #666;
}
.prop-row input {
  flex: 1;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #ddd;
  border-radius: 3px;
}
.prop-row input[type="color"] { padding: 1px; }
.prop-row span { font-size: 12px; color: #999; margin-left: 4px; }
.hint { font-size: 12px; color: #999; text-align: center; padding: 10px 0; }
.action-buttons { display: flex; flex-wrap: wrap; gap: 6px; }
.action-btn {
  padding: 5px 10px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
}
.action-btn:hover { background: #f5f5f5; }
.action-btn.danger { color: #ff4d4f; border-color: #ff4d4f; }

/* 底部 */
.bottom-bar {
  height: 26px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 20px;
  font-size: 12px;
  color: #666;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 8px;
  width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-header h3 { font-size: 16px; font-weight: 600; }
.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  border-radius: 4px;
}
.close-btn:hover { background: #f5f5f5; }
.modal-body { padding: 16px; flex: 1; overflow-y: auto; }
.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* LaTeX编辑器 */
.latex-input textarea {
  width: 100%;
  height: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  resize: vertical;
}
.latex-preview {
  margin-top: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
  min-height: 60px;
}
.preview-label { font-size: 12px; color: #666; margin-bottom: 8px; }
.latex-templates {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.template-label { font-size: 12px; color: #666; }
.template-btn {
  padding: 3px 8px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
}
.template-btn:hover { background: #f5f5f5; }

/* 表单 */
.form-row {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.form-row label {
  font-size: 13px;
  color: #666;
  min-width: 100px;
}
.form-row input {
  flex: 1;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* 手写识别面板 */
.handwrite-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
</style>