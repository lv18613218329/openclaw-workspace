<template>
  <div class="float-window">
    <!-- 标题栏 -->
    <div class="title-bar">
      <span class="app-icon">📐</span>
      <span class="app-name">图形笔记</span>
      <div class="window-controls">
        <button class="ctrl-btn" @click="minimize" title="最小化">─</button>
        <button class="ctrl-btn close" @click="close" title="关闭">✕</button>
      </div>
    </div>
    
    <!-- 主按钮区 -->
    <div class="main-buttons">
      <button 
        :class="['main-btn', currentTool === 'mouse' ? 'active' : '']" 
        @click="selectTool('mouse')"
        title="鼠标模式"
      >
        <span class="icon">🖱️</span>
        <span class="label">鼠标</span>
      </button>
      
      <button 
        :class="['main-btn', currentTool === 'pen' ? 'active' : '']" 
        @click="selectTool('pen')"
        title="画笔模式"
      >
        <span class="icon">✏️</span>
        <span class="label">画笔</span>
      </button>
      
      <button 
        :class="['main-btn', currentTool === 'eraser' ? 'active' : '']" 
        @click="selectTool('eraser')"
        title="板擦"
      >
        <span class="icon">🧹</span>
        <span class="label">板擦</span>
      </button>
    </div>
    
    <!-- 分割线 -->
    <div class="divider"></div>
    
    <!-- 功能按钮 -->
    <div class="func-buttons">
      <button class="func-btn primary" @click="openWhiteboard">
        <span class="icon">📋</span>
        <span class="label">电子黑板</span>
      </button>
      
      <button class="func-btn" @click="openHandwrite">
        <span class="icon">✍️</span>
        <span class="label">手写识别</span>
      </button>
      
      <button class="func-btn screen-annotate" @click="openScreenAnnotation">
        <span class="icon">🖊️</span>
        <span class="label">屏幕标注</span>
      </button>
      
      <button class="func-btn" @click="openFormula">
        <span class="icon">📐</span>
        <span class="label">公式</span>
      </button>
    </div>
    
    <!-- 状态栏 -->
    <div class="status-bar">
      <span class="status">{{ statusText }}</span>
      <span class="tool-hint" v-if="currentTool !== 'mouse'">当前: {{ toolNames[currentTool] }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits(["tool-change", "open-whiteboard", "open-handwrite", "open-screen-annotation", "open-formula", "minimize", "close"]);

const currentTool = ref("mouse");
const statusText = ref("就绪");

const toolNames: Record<string, string> = {
  mouse: "选择",
  pen: "画笔",
  eraser: "板擦"
};

const selectTool = (tool: string) => {
  currentTool.value = tool;
  emit("tool-change", tool);
  statusText.value = `已切换到${toolNames[tool]}模式`;
  setTimeout(() => {
    statusText.value = "就绪";
  }, 1500);
};

const openWhiteboard = () => {
  emit("open-whiteboard");
};

const openHandwrite = () => {
  emit("open-handwrite");
};

const openScreenAnnotation = () => {
  emit("open-screen-annotation");
};

const openFormula = () => {
  emit("open-formula");
};

const minimize = () => {
  emit("minimize");
};

const close = () => {
  emit("close");
};
</script>

<style scoped>
.float-window {
  width: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  user-select: none;
}

.title-bar {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-app-region: drag;
}

.app-icon {
  font-size: 18px;
  margin-right: 6px;
}

.app-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  flex: 1;
}

.window-controls {
  display: flex;
  gap: 6px;
  -webkit-app-region: no-drag;
}

.ctrl-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ctrl-btn.close:hover {
  background: #ff5f57;
}

.main-buttons {
  display: flex;
  padding: 12px 8px 8px;
  gap: 8px;
}

.main-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.main-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.main-btn.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: #fff;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
}

.main-btn .icon {
  font-size: 22px;
  margin-bottom: 4px;
}

.main-btn .label {
  font-size: 11px;
  color: #fff;
  font-weight: 500;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 4px 12px;
}

.func-buttons {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.func-btn {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.func-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(3px);
}

.func-btn.primary {
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
}

.func-btn.primary:hover {
  background: #fff;
}

.func-btn .icon {
  font-size: 16px;
  margin-right: 8px;
}

.func-btn .label {
  font-size: 12px;
  color: inherit;
  font-weight: 500;
}

.func-btn.primary .label {
  color: #667eea;
}

.func-btn.screen-annotate {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.func-btn.screen-annotate:hover {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
}

.status-bar {
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.tool-hint {
  font-size: 10px;
  color: #ffd700;
  font-weight: 600;
}
</style>