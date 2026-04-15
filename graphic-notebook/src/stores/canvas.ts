import { defineStore } from "pinia";
import { ref } from "vue";

export const useCanvasStore = defineStore("canvas", () => {
  const currentTool = ref<string>("select");
  const zoomLevel = ref<number>(100);
  const canvasSize = ref({ width: 1920, height: 1080 });
  const gridVisible = ref<boolean>(false);
  const snapToGrid = ref<boolean>(false);
  const gridSize = ref<number>(10);

  const setTool = (tool: string) => {
    currentTool.value = tool;
  };

  const setZoom = (zoom: number) => {
    zoomLevel.value = zoom;
  };

  const toggleGrid = () => {
    gridVisible.value = !gridVisible.value;
  };

  const toggleSnap = () => {
    snapToGrid.value = !snapToGrid.value;
  };

  const setGridSize = (size: number) => {
    gridSize.value = size;
  };

  const setCanvasSize = (width: number, height: number) => {
    canvasSize.value = { width, height };
  };

  return {
    currentTool,
    zoomLevel,
    canvasSize,
    gridVisible,
    snapToGrid,
    gridSize,
    setTool,
    setZoom,
    toggleGrid,
    toggleSnap,
    setGridSize,
    setCanvasSize,
  };
});
