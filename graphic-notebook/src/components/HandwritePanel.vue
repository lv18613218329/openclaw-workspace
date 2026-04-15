<template>
  <div class="handwrite-panel">
    <div class="panel-header">
      <span>✍️ 手写识别</span>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>
    
    <div class="draw-area">
      <canvas 
        ref="canvasRef" 
        @mousedown="startDraw" 
        @mousemove="drawing" 
        @mouseup="endDraw"
        @mouseleave="endDraw"
        @touchstart.prevent="touchStart"
        @touchmove.prevent="touchMove"
        @touchend="endDraw"
      ></canvas>
    </div>
    
    <div class="btn-row">
      <button class="action-btn" @click="clearDrawing">清空</button>
      <button class="action-btn" @click="undoStroke">撤销</button>
      <button class="action-btn primary" @click="recognize" :disabled="isRecognizing">
        {{ isRecognizing ? '识别中...' : '识别' }}
      </button>
    </div>
    
    <div class="result-area" v-if="result">
      <div class="result-label">识别结果:</div>
      <div class="result-content">{{ result }}</div>
      <div class="result-actions">
        <button class="action-btn" @click="insertAsText">插入为文字</button>
        <button class="action-btn" @click="insertAsShape">插入为图形</button>
      </div>
    </div>
    
    <div class="tips">
      <p>提示: 可识别图形(圆、矩形、三角形、直线)和简单符号(+、-、×、÷、=)</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
// TensorFlow.js 已安装，可用于更高级的识别模型
// import * as tf from "@tensorflow/tfjs";

const emit = defineEmits(["close", "insert-text", "insert-shape"]);

const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
const isRecognizing = ref(false);
const result = ref("");

// 笔画数据
interface Stroke {
  points: { x: number; y: number }[];
}
const strokes = ref<Stroke[]>([]);
let currentStroke: { x: number; y: number }[] = [];
let isDrawing = false;

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.width = 280;
    canvasRef.value.height = 200;
    ctx = canvasRef.value.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 280, 200);
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }
});

const getPos = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
  if (!canvasRef.value) return { x: 0, y: 0 };
  const rect = canvasRef.value.getBoundingClientRect();
  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
};

const startDraw = (e: MouseEvent) => {
  isDrawing = true;
  const pos = getPos(e);
  currentStroke = [pos];
  if (ctx) {
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }
};

const touchStart = (e: TouchEvent) => {
  isDrawing = true;
  const pos = getPos(e);
  currentStroke = [pos];
  if (ctx) {
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }
};

const drawing = (e: MouseEvent) => {
  if (!isDrawing || !ctx) return;
  const pos = getPos(e);
  currentStroke.push(pos);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
};

const touchMove = (e: TouchEvent) => {
  if (!isDrawing || !ctx) return;
  const pos = getPos(e);
  currentStroke.push(pos);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
};

const endDraw = () => {
  if (isDrawing && currentStroke.length > 0) {
    strokes.value.push({ points: [...currentStroke] });
  }
  isDrawing = false;
  currentStroke = [];
};

const clearDrawing = () => {
  strokes.value = [];
  result.value = "";
  if (ctx && canvasRef.value) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  }
};

const undoStroke = () => {
  if (strokes.value.length > 0) {
    strokes.value.pop();
    redrawStrokes();
  }
};

const redrawStrokes = () => {
  if (!ctx || !canvasRef.value) return;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  
  strokes.value.forEach(stroke => {
    if (stroke.points.length < 2) return;
    ctx!.beginPath();
    ctx!.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx!.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx!.stroke();
  });
};

// ===== 识别算法 =====
const recognize = async () => {
  if (strokes.value.length === 0) return;
  
  isRecognizing.value = true;
  
  try {
    // 获取所有笔画点
    const allPoints = strokes.value.flatMap(s => s.points);
    if (allPoints.length < 3) {
      result.value = "笔画太少";
      isRecognizing.value = false;
      return;
    }
    
    // 计算边界框
    const xs = allPoints.map(p => p.x);
    const ys = allPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // 计算特征
    const features = extractFeatures(allPoints, minX, minY, width, height, centerX, centerY);
    
    // 识别图形类型
    const shapeType = classifyShape(features);
    
    result.value = shapeType;
    
  } catch (error) {
    console.error("Recognition error:", error);
    result.value = "识别失败";
  }
  
  isRecognizing.value = false;
};

// 提取特征
const extractFeatures = (
  points: { x: number; y: number }[],
  minX: number, minY: number,
  width: number, height: number,
  centerX: number, centerY: number
) => {
  const n = points.length;
  
  // 归一化点
  const normalizedPoints = points.map(p => ({
    x: (p.x - minX) / (width || 1),
    y: (p.y - minY) / (height || 1),
  }));
  
  // 1. 宽高比
  const aspectRatio = width / (height || 1);
  
  // 2. 闭合度（首尾距离）
  const first = points[0];
  const last = points[n - 1];
  const closeness = Math.sqrt(Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)) / Math.max(width, height);
  
  // 3. 圆度（到中心距离的方差）
  const distances = points.map(p => 
    Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
  );
  const avgDistance = distances.reduce((a, b) => a + b, 0) / n;
  const distanceVariance = distances.reduce((a, d) => a + Math.pow(d - avgDistance, 2), 0) / n;
  const circularity = distanceVariance / (avgDistance * avgDistance || 1);
  
  // 4. 角点数量
  const corners = detectCorners(points);
  
  // 5. 直线度
  const linearity = calculateLinearity(points);
  
  // 6. 笔画数量
  const strokeCount = strokes.value.length;
  
  return {
    aspectRatio,
    closeness,
    circularity,
    cornerCount: corners.length,
    linearity,
    strokeCount,
    width,
    height,
  };
};

// 检测角点
const detectCorners = (points: { x: number; y: number }[]): { x: number; y: number }[] => {
  const corners: { x: number; y: number }[] = [];
  const threshold = 30; // 角度阈值
  
  for (let i = 10; i < points.length - 10; i += 5) {
    const prev = points[i - 10];
    const curr = points[i];
    const next = points[i + 10];
    
    const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
    const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
    let angleDiff = Math.abs(angle2 - angle1) * 180 / Math.PI;
    
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    
    if (angleDiff > threshold) {
      // 检查是否已有相近的角点
      const hasNearby = corners.some(c => 
        Math.sqrt(Math.pow(c.x - curr.x, 2) + Math.pow(c.y - curr.y, 2)) < 20
      );
      if (!hasNearby) {
        corners.push(curr);
      }
    }
  }
  
  return corners;
};

// 计算直线度
const calculateLinearity = (points: { x: number; y: number }[]): number => {
  if (points.length < 3) return 1;
  
  const first = points[0];
  const last = points[points.length - 1];
  
  // 计算直线距离
  const lineLength = Math.sqrt(Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2));
  
  // 计算路径长度
  let pathLength = 0;
  for (let i = 1; i < points.length; i++) {
    pathLength += Math.sqrt(
      Math.pow(points[i].x - points[i-1].x, 2) + 
      Math.pow(points[i].y - points[i-1].y, 2)
    );
  }
  
  // 直线度 = 直线距离 / 路径长度
  return lineLength / (pathLength || 1);
};

// 分类图形
const classifyShape = (features: ReturnType<typeof extractFeatures>): string => {
  const { aspectRatio, closeness, circularity, cornerCount, linearity, strokeCount, width, height } = features;
  
  // 直线检测
  if (linearity > 0.85 && closeness > 0.5) {
    return "直线";
  }
  
  // 圆形检测
  if (circularity < 0.15 && closeness < 0.2 && strokeCount === 1) {
    return "圆形";
  }
  
  // 三角形检测
  if (cornerCount >= 2 && cornerCount <= 4 && closeness < 0.3) {
    return "三角形";
  }
  
  // 矩形检测
  if (cornerCount >= 3 && cornerCount <= 5 && closeness < 0.25 && aspectRatio > 0.3 && aspectRatio < 3) {
    return "矩形";
  }
  
  // 符号检测（多笔画）
  if (strokeCount > 1) {
    // 加号
    if (strokeCount === 2 && features.aspectRatio > 0.7 && features.aspectRatio < 1.3) {
      return "加号 (+)";
    }
    // 乘号
    if (strokeCount === 2 && Math.abs(features.aspectRatio - 1) < 0.5) {
      return "乘号 (×)";
    }
    // 等号
    if (strokeCount === 2 && aspectRatio > 1.5) {
      return "等号 (=)";
    }
    // 除号
    if (strokeCount >= 2 && strokeCount <= 3) {
      return "除号 (÷)";
    }
  }
  
  // 单笔画符号
  if (strokeCount === 1) {
    if (linearity > 0.7 && closeness > 0.3) {
      return "减号 (-)";
    }
  }
  
  return "未知图形";
};

const insertAsText = () => {
  if (result.value) {
    emit("insert-text", result.value);
  }
};

const insertAsShape = () => {
  if (result.value) {
    // 将识别结果转换为图形类型
    const shapeMap: Record<string, string> = {
      "圆形": "circle",
      "矩形": "rectangle",
      "三角形": "triangle",
      "直线": "line",
    };
    const shapeType = shapeMap[result.value] || "rectangle";
    emit("insert-shape", shapeType);
  }
};
</script>

<style scoped>
.handwrite-panel {
  width: 300px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
  font-size: 14px;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
}

.close-btn:hover {
  background: #e0e0e0;
}

.draw-area {
  padding: 10px;
}

.draw-area canvas {
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  cursor: crosshair;
  background: #fff;
}

.btn-row {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.action-btn:hover {
  background: #f5f5f5;
}

.action-btn.primary {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.action-btn.primary:hover {
  background: #40a9ff;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-area {
  padding: 10px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.result-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.result-content {
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 10px;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.result-actions .action-btn {
  flex: 1;
  padding: 6px 10px;
  font-size: 12px;
}

.tips {
  padding: 8px 10px;
  background: #fffbe6;
  border-top: 1px solid #ffe58f;
}

.tips p {
  font-size: 11px;
  color: #d48806;
  margin: 0;
}
</style>