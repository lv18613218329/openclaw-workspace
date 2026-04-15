<template>
  <div class="top-toolbar">
    <div class="toolbar-left">
      <span class="app-logo">📐</span>
      <span class="app-title">Graphic Notebook</span>
    </div>

    <div class="toolbar-center">
      <button class="toolbar-btn" @click="handleNew">
        <span>新建</span>
      </button>
      <button class="toolbar-btn" @click="handleSave">
        <span>保存</span>
      </button>
      <button class="toolbar-btn" @click="handleExport">
        <span>导出</span>
      </button>
    </div>

    <div class="toolbar-right">
      <button class="window-btn" @click="handleMinimize" title="最小化">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M19 13H5V11H19V13Z"/>
        </svg>
      </button>
      <button class="window-btn" @click="handleMaximize" title="最大化">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M4 4H20V20H4V4ZM6 6V18H18V6H6Z"/>
        </svg>
      </button>
      <button class="window-btn close-btn" @click="handleClose" title="关闭">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const getElectronAPI = () => {
  if (typeof window !== "undefined" && (window as any).electronAPI) {
    return (window as any).electronAPI;
  }
  return null;
};

const handleNew = () => {
  console.log("New file");
};

const handleSave = () => {
  console.log("Save file");
};

const handleExport = () => {
  console.log("Export file");
};

const handleMinimize = async () => {
  try {
    const api = getElectronAPI();
    if (api) await api.windowMinimize();
  } catch (e) {
    console.error(e);
  }
};

const handleMaximize = async () => {
  try {
    const api = getElectronAPI();
    if (api) await api.windowMaximize();
  } catch (e) {
    console.error(e);
  }
};

const handleClose = async () => {
  try {
    const api = getElectronAPI();
    if (api) await api.windowClose();
  } catch (e) {
    console.error(e);
  }
};
</script>

<style scoped>
.top-toolbar {
  height: 40px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  -webkit-app-region: drag;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-logo {
  font-size: 18px;
}

.app-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.toolbar-center {
  display: flex;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.toolbar-btn {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #ffffff;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
}

.toolbar-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.toolbar-right {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.window-btn {
  width: 32px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #606266;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.window-btn:hover {
  background: #e9e9e9;
}

.close-btn:hover {
  background: #f56c6c;
  color: #ffffff;
}
</style>