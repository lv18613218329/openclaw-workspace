<template>
  <div class="left-panel">
    <div class="panel-header">工具箱</div>
    <div class="tools-section">
      <div class="section-title">基础工具</div>
      <div class="tools-grid">
        <button 
          :class="['tool-btn', selectedTool === 'select' ? 'active' : '']"
          @click="selectTool('select')"
          title="选择工具"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M13.64 21.97C13.14 22.21 12.54 22 12.31 21.5L10.13 16.76L7.62 18.78C7.45 18.92 7.24 19 7 19C6.45 19 6 18.55 6 18V3C6 2.45 6.45 2 7 2C7.24 2 7.47 2.09 7.64 2.23L7.65 2.22L19.14 11.86C19.57 12.22 19.62 12.85 19.26 13.28C19.1 13.46 18.91 13.57 18.7 13.61L15.54 14.23L17.74 18.96C17.97 19.46 17.76 20.06 17.26 20.3L13.64 21.97Z"/>
          </svg>
        </button>
        <button 
          :class="['tool-btn', selectedTool === 'rectangle' ? 'active' : '']"
          @click="selectTool('rectangle')"
          title="矩形"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M3 3H21V21H3V3ZM5 5V19H19V5H5Z"/>
          </svg>
        </button>
        <button 
          :class="['tool-btn', selectedTool === 'ellipse' ? 'active' : '']"
          @click="selectTool('ellipse')"
          title="椭圆"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </button>
        <button 
          :class="['tool-btn', selectedTool === 'line' ? 'active' : '']"
          @click="selectTool('line')"
          title="直线"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button 
          :class="['tool-btn', selectedTool === 'arrow' ? 'active' : '']"
          @click="selectTool('arrow')"
          title="箭头"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M4 12H20M20 12L14 6M20 12L14 18" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </button>
        <button 
          :class="['tool-btn', selectedTool === 'draw' ? 'active' : '']"
          @click="selectTool('draw')"
          title="画笔"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20.71 7.04C21.1 6.65 21.1 6 20.71 5.63L18.37 3.29C18 2.9 17.35 2.9 16.96 3.29L15.12 5.12L18.87 8.87M3 17.25V21H6.75L17.81 9.93L14.06 6.18L3 17.25Z"/>
          </svg>
        </button>
        <button 
          :class="['tool-btn', selectedTool === 'text' ? 'active' : '']"
          @click="selectTool('text')"
          title="文本"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M5 4V7H10V19H14V7H19V4H5Z"/>
          </svg>
        </button>
        <button class="tool-btn" @click="handleInsertImage" title="插入图片">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M21 3H3C2 3 1 4 1 5V19C1 20 2 21 3 21H21C22 21 23 20 23 19V5C23 4 22 3 21 3M5 17L8.5 12.5L11 15.51L14.5 11L19 17H5Z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="tools-section">
      <div class="section-title">数学工具</div>
      <div class="tools-grid">
        <button class="tool-btn" title="直尺">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M1.39 18.36L3.16 16.6L4.58 18L5.64 16.95L4.22 15.54L5.99 13.77L8.11 15.89L9.17 14.82L7.05 12.71L8.82 10.94L10.23 12.35L11.29 11.29L9.88 9.88L11.65 8.11L13.77 10.23L14.82 9.17L12.71 7.05L14.47 5.28L15.89 6.7L16.95 5.64L15.54 4.22L17.3 2.46C17.69 2.07 18.32 2.07 18.71 2.46L21.53 5.28C21.92 5.67 21.92 6.3 21.53 6.69L6.69 21.53C6.3 21.92 5.67 21.92 5.28 21.53L2.46 18.71C2.07 18.32 2.07 17.69 2.46 17.3L1.39 18.36Z"/>
          </svg>
        </button>
        <button class="tool-btn" title="量角器">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12H12V22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
          </svg>
        </button>
        <button class="tool-btn" title="圆规">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" fill="none"/>
            <circle cx="12" cy="12" r="1" fill="currentColor"/>
          </svg>
        </button>
        <button class="tool-btn" title="坐标系">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M3 21L3 3L21 3" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const selectedTool = ref("select");

const selectTool = (tool: string) => {
  selectedTool.value = tool;
  console.log("Selected tool:", tool);
};

const handleInsertImage = () => {
  console.log("Insert image");
};
</script>

<style scoped>
.left-panel {
  width: 200px;
  background: #f5f7fa;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #dcdfe6;
}

.tools-section {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
}

.section-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.tool-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  transition: all 0.2s;
}

.tool-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.tool-btn.active {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}
</style>