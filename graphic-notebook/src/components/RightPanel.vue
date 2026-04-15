<template>
  <div class="right-panel">
    <div class="panel-header">属性</div>
    
    <div class="property-section">
      <div class="section-title">位置</div>
      <div class="property-row">
        <label>X</label>
        <input type="number" v-model.number="position.x" />
      </div>
      <div class="property-row">
        <label>Y</label>
        <input type="number" v-model.number="position.y" />
      </div>
    </div>

    <div class="property-section">
      <div class="section-title">尺寸</div>
      <div class="property-row">
        <label>宽</label>
        <input type="number" v-model.number="size.width" />
      </div>
      <div class="property-row">
        <label>高</label>
        <input type="number" v-model.number="size.height" />
      </div>
    </div>

    <div class="property-section">
      <div class="section-title">样式</div>
      <div class="property-row">
        <label>填充</label>
        <input type="color" v-model="fillColor" />
      </div>
      <div class="property-row">
        <label>边框</label>
        <input type="color" v-model="strokeColor" />
      </div>
      <div class="property-row">
        <label>线宽</label>
        <input type="number" v-model.number="strokeWidth" min="0" max="20" />
      </div>
    </div>

    <div class="property-section">
      <div class="section-title">旋转</div>
      <div class="property-row">
        <label>角度</label>
        <input type="number" v-model.number="rotation" min="0" max="360" />
        <span>°</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const position = ref({ x: 0, y: 0 });
const size = ref({ width: 100, height: 100 });
const fillColor = ref("#ffffff");
const strokeColor = ref("#000000");
const strokeWidth = ref(2);
const rotation = ref(0);
</script>

<style scoped>
.right-panel {
  width: 240px;
  background: #f5f7fa;
  border-left: 1px solid #dcdfe6;
  overflow-y: auto;
}

.panel-header {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #dcdfe6;
}

.property-section {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.section-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.property-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.property-row:last-child {
  margin-bottom: 0;
}

.property-row label {
  width: 40px;
  font-size: 13px;
  color: #606266;
}

.property-row input[type="number"] {
  flex: 1;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
}

.property-row input[type="color"] {
  width: 60px;
  height: 28px;
  padding: 2px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
}

.property-row span {
  margin-left: 4px;
  font-size: 13px;
  color: #909399;
}
</style>