<template>
  <div class="status-bar">
    <div class="status-left">
      <span>坐标: {{ cursorPosition.x }}, {{ cursorPosition.y }}</span>
    </div>
    <div class="status-center">
      <span>工具: {{ currentTool }}</span>
    </div>
    <div class="status-right">
      <span>缩放: {{ zoomLevel }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const cursorPosition = ref({ x: 0, y: 0 });
const currentTool = ref("选择");
const zoomLevel = ref(100);
</script>

<style scoped>
.status-bar {
  height: 28px;
  background: #f5f7fa;
  border-top: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 12px;
  color: #909399;
}

.status-left,
.status-center,
.status-right {
  display: flex;
  align-items: center;
}
</style>