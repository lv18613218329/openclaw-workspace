<template>
  <div class="canvas-wrapper">
    <canvas 
      ref="canvasRef" 
      class="drawing-canvas"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
    ></canvas>
    <div class="canvas-toolbar">
      <button 
        v-for="tool in tools" 
        :key="tool.id"
        :class="['tool-btn', currentTool === tool.id ? 'active' : '']"
        @click="selectTool(tool.id)"
        :title="tool.name"
      >
        {{ tool.icon }}
      </button>
      <input type="color" v-model="strokeColor" title="画笔颜色" class="color-input" />
      <select v-model="strokeWidth" title="画笔大小" class="size-select">
        <option :value="2">细</option>
        <option :value="4">中</option>
        <option :value="8">粗</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

const currentTool = ref("pen");
const strokeColor = ref("#333333");
const strokeWidth = ref(2);

const tools = [
  { id: "pen", name: "画笔", icon: "✏️" },
  { id: "eraser", name: "橡皮擦", icon: "🧹" },
  { id: "clear", name: "清空", icon: "🗑️" },
];

const selectTool = (id: string) => {
  if (id === "clear") {
    clearCanvas();
    currentTool.value = "pen";
  } else {
    currentTool.value = id;
  }
};

const clearCanvas = () => {
  if (ctx && canvasRef.value) {
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  }
};

const resizeCanvas = () => {
  if (!canvasRef.value) return;
  const parent = canvasRef.value.parentElement;
  if (!parent) return;
  
  canvasRef.value.width = parent.clientWidth;
  canvasRef.value.height = parent.clientHeight - 40;
  
  ctx = canvasRef.value.getContext("2d");
  if (ctx) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }
};

onMounted(() => {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
});

onUnmounted(() => {
  window.removeEventListener("resize", resizeCanvas);
});

const startDrawing = (e: MouseEvent) => {
  if (!ctx || !canvasRef.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
  isDrawing = true;
  
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
};

const draw = (e: MouseEvent) => {
  if (!isDrawing || !ctx || !canvasRef.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  ctx.strokeStyle = currentTool.value === "eraser" ? "#ffffff" : strokeColor.value;
  ctx.lineWidth = currentTool.value === "eraser" ? strokeWidth.value * 4 : strokeWidth.value;
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  
  lastX = x;
  lastY = y;
};

const stopDrawing = () => {
  isDrawing = false;
};
</script>

<style scoped>
.canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.drawing-canvas {
  flex: 1;
  cursor: crosshair;
}

.canvas-toolbar {
  height: 40px;
  background: #f5f7fa;
  border-top: 1px solid #ddd;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 8px;
}

.tool-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 16px;
}

.tool-btn:hover {
  border-color: #409eff;
}

.tool-btn.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.color-input {
  width: 32px;
  height: 32px;
  border: none;
  cursor: pointer;
}

.size-select {
  height: 32px;
  padding: 0 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}
</style>