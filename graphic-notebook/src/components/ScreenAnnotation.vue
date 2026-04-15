<template>
  <div class="overlay">
    <!-- 工具栏 - 默认隐藏，通过快捷键或边缘悬停显示 -->
    <div class="toolbar" :class="{ minimized: toolbarMinimized, visible: toolbarVisible }" @mouseenter="onToolbarEnter" @mouseleave="onToolbarLeave">
      <button class="tool-btn" @click="toggleToolbar">
        {{ toolbarMinimized ? '>' : 'v' }}
      </button>
      
      <div class="tools" v-show="!toolbarMinimized">
        <button v-for="t in tools" :key="t.id" :class="['tool', currentTool === t.id ? 'active' : '']" @click="currentTool = t.id">
          {{ t.icon }}
        </button>
        
        <div class="sep"></div>
        <input type="color" v-model="strokeColor" class="color-picker" />
        <select v-model="strokeWidth" class="width-select">
          <option :value="2">1</option>
          <option :value="4">2</option>
          <option :value="8">3</option>
          <option :value="16">4</option>
        </select>
        
        <div class="sep"></div>
        <button class="tool" @click="clearAll">X</button>
        <button class="tool" @click="undo">U</button>
        <button class="tool close" @click="exitAnnotation">E</button>
      </div>
    </div>
    
    <!-- 边缘触发区域 - 鼠标移动到屏幕边缘时显示工具栏 -->
    <div class="edge-trigger top" @mouseenter="showToolbarTemp"></div>
    <div class="edge-trigger left" @mouseenter="showToolbarTemp"></div>
    
    <canvas
      ref="canvasRef"
      @pointerdown="startDraw"
      @pointermove="draw"
      @pointerup="stopDraw"
      @pointercancel="stopDraw"
      @pointerleave="stopDraw"
    ></canvas>
    
    <div class="hint" v-if="showHint">Press E to exit</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";

const tools = [
  { id: "mouse", icon: "M" },
  { id: "pen", icon: "P" },
  { id: "highlighter", icon: "H" },
  { id: "arrow", icon: ">" },
  { id: "rect", icon: "R" },
  { id: "circle", icon: "O" },
];

const currentTool = ref("mouse");
const strokeColor = ref("#ff0000");
const strokeWidth = ref(4);
const toolbarMinimized = ref(false);
const toolbarVisible = ref(false);
const showHint = ref(true);
const canvasRef = ref<HTMLCanvasElement | null>(null);

type Point = { x: number; y: number };
type PenShape = { type: "pen"; points: Point[]; color: string; width: number };
type RectShape = { type: "rect"; x: number; y: number; w: number; h: number; color: string; width: number };
type CircleShape = { type: "circle"; cx: number; cy: number; rx: number; ry: number; color: string; width: number };
type Shape = PenShape | RectShape | CircleShape;

let ctx: CanvasRenderingContext2D | null = null;
let isDrawing = false;
let startX = 0, startY = 0;
const points: Point[] = [];
const shapes: Shape[] = [];
const history: Shape[][] = [];
let historyIdx = -1;

const isDrawTool = () => currentTool.value === "pen" || currentTool.value === "rect" || currentTool.value === "circle";
const setClickThrough = (ignore: boolean) => {
  if ((window as any).electronAPI?.annotationSetClickThrough) {
    (window as any).electronAPI.annotationSetClickThrough(ignore);
  }
};
const renderAll = () => {
  if (!ctx || !canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  shapes.forEach(drawShape);
};

const resizeCanvas = () => {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvasRef.value.width !== width || canvasRef.value.height !== height) {
    canvasRef.value.width = width;
    canvasRef.value.height = height;
    ctx = canvasRef.value.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      renderAll();
    }
  }
};

const getCanvasPoint = (e: PointerEvent): Point => {
  if (!canvasRef.value) return { x: 0, y: 0 };
  const rect = canvasRef.value.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

onMounted(() => {
  nextTick(() => {
    resizeCanvas();
  });
  setClickThrough(true);
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("keydown", handleKeyDown);
  setTimeout(() => showHint.value = false, 3000);
});

onUnmounted(() => {
  setClickThrough(false);
  window.removeEventListener("resize", resizeCanvas);
  window.removeEventListener("keydown", handleKeyDown);
});

watch(currentTool, () => {
  if (isDrawTool()) {
    setClickThrough(false);
  } else {
    setClickThrough(true);
  }
});

const startDraw = (e: PointerEvent) => {
  if (!isDrawTool()) return;
  if (!canvasRef.value || !ctx) return;
  canvasRef.value.setPointerCapture(e.pointerId);
  isDrawing = true;
  const p = getCanvasPoint(e);
  startX = p.x; startY = p.y;
  if(currentTool.value==="pen"){
    points.length = 0;
    points.push(p);
  }
};
const draw = (e: PointerEvent) => {
  if(!isDrawing||!ctx)return;
  const p = getCanvasPoint(e);
  if(currentTool.value==="pen"){
    points.push(p);
    ctx.strokeStyle = strokeColor.value;
    ctx.lineWidth = strokeWidth.value;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if(points.length >= 2){
      const prev = points[points.length - 2];
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }else{
    renderAll();
    ctx.strokeStyle = strokeColor.value;
    ctx.lineWidth = strokeWidth.value;
    ctx.setLineDash([5,5]);
    if(currentTool.value==="rect")ctx.strokeRect(startX,startY,p.x-startX,p.y-startY);
    if(currentTool.value==="circle"){ctx.beginPath();ctx.ellipse((startX+p.x)/2,(startY+p.y)/2,Math.abs(p.x-startX)/2,Math.abs(p.y-startY)/2,0,0,Math.PI*2);ctx.stroke();}
    ctx.setLineDash([]);
  }
};
const stopDraw = (e: PointerEvent) => {
  if(!isDrawing)return;
  if (canvasRef.value?.hasPointerCapture(e.pointerId)) {
    canvasRef.value.releasePointerCapture(e.pointerId);
  }
  isDrawing = false;
  if(currentTool.value==="pen"&&points.length>1){
    shapes.push({type:"pen",points:[...points],color:strokeColor.value,width:strokeWidth.value});
  } else if (currentTool.value === "rect") {
    const end = getCanvasPoint(e);
    shapes.push({ type: "rect", x: startX, y: startY, w: end.x - startX, h: end.y - startY, color: strokeColor.value, width: strokeWidth.value });
  } else if (currentTool.value === "circle") {
    const end = getCanvasPoint(e);
    shapes.push({
      type: "circle",
      cx: (startX + end.x) / 2,
      cy: (startY + end.y) / 2,
      rx: Math.abs(end.x - startX) / 2,
      ry: Math.abs(end.y - startY) / 2,
      color: strokeColor.value,
      width: strokeWidth.value
    });
  }
  renderAll();
};

const drawShape = (s: Shape) => {
  if(!ctx)return;
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if(s.type==="pen"){
    ctx.beginPath();
    ctx.moveTo(s.points[0].x,s.points[0].y);
    for(let i=1;i<s.points.length;i++){
      ctx.lineTo(s.points[i].x,s.points[i].y);
    }
    ctx.stroke();
  } else if (s.type === "rect") {
    ctx.strokeRect(s.x, s.y, s.w, s.h);
  } else if (s.type === "circle") {
    ctx.beginPath();
    ctx.ellipse(s.cx, s.cy, s.rx, s.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
};

const toggleToolbar = () => { toolbarMinimized.value = !toolbarMinimized.value; };
const clearAll = () => {
  shapes.length = 0;
  renderAll();
};
const undo = () => {};
const onToolbarEnter = () => {
  setClickThrough(false);
};
const onToolbarLeave = () => {
  if (!isDrawTool()) {
    setClickThrough(true);
  }
};
const exitAnnotation = () => {
  if ((window as any).electronAPI?.windowCloseAnnotation) {
    (window as any).electronAPI.windowCloseAnnotation();
  } else {
    // 在浏览器环境中，通过事件通知父组件关闭标注模式
    window.dispatchEvent(new CustomEvent('close-annotation'));
  }
};

const showToolbarTemp = () => {
  toolbarVisible.value = true;
  setTimeout(() => {
    if (!toolbarVisible.value) return;
    toolbarVisible.value = false;
  }, 3000);
};

const handleKeyDown = (e: KeyboardEvent) => {
  // Ctrl+T 显示/隐藏工具栏
  if (e.ctrlKey && e.key === 't') {
    e.preventDefault();
    toolbarVisible.value = !toolbarVisible.value;
  }
  // Esc 退出标注
  else if (e.key === 'Escape') {
    e.preventDefault();
    exitAnnotation();
  }
  // 数字键快速切换工具
  else if (e.key >= '1' && e.key <= '6') {
    e.preventDefault();
    const index = parseInt(e.key) - 1;
    if (index < tools.length) {
      currentTool.value = tools[index].id;
    }
  }
};
</script>

<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;background:transparent !important;}
#app{width:100%;height:100%;background:transparent !important;}
.overlay{position:fixed;inset:0;background:transparent !important;z-index:99999;pointer-events:none;}
.toolbar{position:fixed;top:20px;left:20px;background:rgba(30,30,30,0.9);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px;opacity:0;transform:translateY(-20px);transition:opacity 0.3s ease, transform 0.3s ease;pointer-events:none;}
.toolbar.visible{opacity:1;transform:translateY(0);pointer-events:auto;}
.tool{width:36px;height:36px;background:rgba(255,255,255,0.1);border:none;border-radius:8px;color:#fff;cursor:pointer;font-size:16px;}
.tool.active{background:#667eea;}
.tool.close{background:#e74c3c;}
.tool-btn{width:36px;height:36px;background:rgba(255,255,255,0.1);border:none;border-radius:8px;color:#fff;cursor:pointer;}
.sep{height:1px;background:rgba(255,255,255,0.2);}
.color-picker{width:36px;height:36px;border:none;border-radius:8px;cursor:pointer;}
.width-select{width:36px;height:28px;background:rgba(255,255,255,0.1);color:#fff;border:none;border-radius:6px;}
.edge-trigger{position:fixed;background:transparent;z-index:99998;pointer-events:auto;}
.edge-trigger.top{top:0;left:0;right:0;height:20px;}
.edge-trigger.left{top:0;left:0;bottom:0;width:20px;}
canvas{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:auto;cursor:crosshair;background:transparent !important;touch-action:none;}
.hint{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;pointer-events:none;}
</style>
