<template>
  <div class="overlay-root">
    <div
      ref="panelRef"
      class="control-panel"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      @mouseenter="onPanelEnter"
      @mouseleave="onPanelLeave"
    >
      <div
        class="drag-handle"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
      >
        ● ● ●
      </div>
      <div class="button-row">
        <button class="mini-btn" @click="$emit('open-screen-annotation')">标注</button>
        <button class="mini-btn" @click="$emit('open-whiteboard')">白板</button>
        <button class="mini-btn" @click="$emit('open-handwrite')">手写</button>
        <button class="mini-btn" @click="$emit('open-formula')">公式</button>
        <button class="mini-btn" @click="$emit('minimize')">最小化</button>
        <button class="mini-btn danger" @click="$emit('close')">退出</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

defineEmits(["open-screen-annotation", "open-whiteboard", "open-handwrite", "open-formula", "minimize", "close"]);

const panelRef = ref<HTMLElement | null>(null);
const position = ref({ x: 24, y: 24 });
const dragging = ref(false);
const hoverPanel = ref(false);
let dragPointerId = -1;
let offsetX = 0;
let offsetY = 0;

const setMainClickThrough = (ignore: boolean) => {
  if ((window as any).electronAPI?.windowSetMainClickThrough) {
    (window as any).electronAPI.windowSetMainClickThrough(ignore);
  }
};

const applyPanelBounds = (nextX: number, nextY: number) => {
  if (!panelRef.value) return;
  const maxX = Math.max(0, window.innerWidth - panelRef.value.offsetWidth - 12);
  const maxY = Math.max(0, window.innerHeight - panelRef.value.offsetHeight - 12);
  position.value = {
    x: Math.min(Math.max(12, nextX), maxX),
    y: Math.min(Math.max(12, nextY), maxY),
  };
};

const refreshClickThrough = () => {
  setMainClickThrough(!hoverPanel.value && !dragging.value);
};

const onPanelEnter = () => {
  hoverPanel.value = true;
  refreshClickThrough();
};

const onPanelLeave = () => {
  hoverPanel.value = false;
  refreshClickThrough();
};

const onDragStart = (e: PointerEvent) => {
  if (!panelRef.value) return;
  dragging.value = true;
  hoverPanel.value = true;
  dragPointerId = e.pointerId;
  panelRef.value.setPointerCapture(e.pointerId);
  const rect = panelRef.value.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  refreshClickThrough();
};

const onDragMove = (e: PointerEvent) => {
  if (!dragging.value || e.pointerId !== dragPointerId) return;
  applyPanelBounds(e.clientX - offsetX, e.clientY - offsetY);
};

const onDragEnd = (e: PointerEvent) => {
  if (!panelRef.value || e.pointerId !== dragPointerId) return;
  if (panelRef.value.hasPointerCapture(e.pointerId)) {
    panelRef.value.releasePointerCapture(e.pointerId);
  }
  dragging.value = false;
  dragPointerId = -1;
  refreshClickThrough();
};

const onWindowMouseMove = (e: MouseEvent) => {
  const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
  hoverPanel.value = Boolean(target?.closest(".control-panel"));
  refreshClickThrough();
};

onMounted(() => {
  window.addEventListener("mousemove", onWindowMouseMove, true);
  setMainClickThrough(true);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", onWindowMouseMove, true);
  setMainClickThrough(false);
});
</script>

<style scoped>
.overlay-root {
  position: fixed;
  inset: 0;
  background: transparent;
  pointer-events: none;
}

.control-panel {
  position: fixed;
  min-width: 280px;
  padding: 10px;
  border-radius: 14px;
  background: rgba(30, 30, 30, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  pointer-events: auto;
  user-select: none;
}

.drag-handle {
  height: 18px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  letter-spacing: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
}

.button-row {
  display: flex;
  gap: 8px;
}

.mini-btn {
  height: 30px;
  padding: 0 10px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
}

.mini-btn:hover {
  background: rgba(255, 255, 255, 0.24);
}

.mini-btn.danger {
  background: rgba(239, 68, 68, 0.85);
}

.mini-btn.danger:hover {
  background: rgba(239, 68, 68, 1);
}
</style>
