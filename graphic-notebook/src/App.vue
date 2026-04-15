<template>
  <div class="app">
    <TransparentOverlayPanel
      v-if="!showWhiteboard && !showHandwrite && !showFormula && !showAnnotation"
      @open-whiteboard="openWhiteboard"
      @open-handwrite="openHandwrite"
      @open-screen-annotation="openScreenAnnotation"
      @open-formula="openFormula"
      @minimize="minimize"
      @close="close"
    />
    
    <Whiteboard v-if="showWhiteboard" @close="closeWhiteboard" />
    
    <ScreenAnnotation v-if="showAnnotation" />
    
    <div class="modal-overlay" v-if="showHandwrite">
      <HandwritePanel
        @close="showHandwrite = false"
        @insert-text="insertText"
        @insert-shape="insertShape"
      />
    </div>
    
    <div class="modal-overlay" v-if="showFormula" @click.self="showFormula = false">
      <div class="formula-panel">
        <div class="panel-header">
          <span>📐 公式编辑器</span>
          <button class="close-btn" @click="showFormula = false">×</button>
        </div>
        <div class="panel-body">
          <textarea v-model="latexInput" placeholder="输入 LaTeX 公式..."></textarea>
          <div class="preview" ref="latexPreview"></div>
        </div>
        <div class="panel-footer">
          <button class="btn" @click="showFormula = false">取消</button>
          <button class="btn primary" @click="insertFormula">插入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import katex from "katex";
import "katex/dist/katex.min.css";
import TransparentOverlayPanel from "./components/TransparentOverlayPanel.vue";
import Whiteboard from "./components/Whiteboard.vue";
import HandwritePanel from "./components/HandwritePanel.vue";
import ScreenAnnotation from "./components/ScreenAnnotation.vue";

const showWhiteboard = ref(false);
const showHandwrite = ref(false);
const showFormula = ref(false);
const showAnnotation = ref(false);
const latexInput = ref("");
const latexPreview = ref<HTMLElement | null>(null);

watch(latexInput, (val) => {
  nextTick(() => {
    if (latexPreview.value && val) {
      try {
        katex.render(val, latexPreview.value, { throwOnError: false });
      } catch (e) {
        latexPreview.value.innerHTML = '<span style="color:red">公式错误</span>';
      }
    }
  });
});

const openWhiteboard = () => { showWhiteboard.value = true; };
const closeWhiteboard = () => { showWhiteboard.value = false; };
const openHandwrite = () => { showHandwrite.value = true; };

const openScreenAnnotation = () => {
  if ((window as any).electronAPI?.windowOpenAnnotation) {
    (window as any).electronAPI.windowOpenAnnotation();
  } else {
    showAnnotation.value = true;
  }
};

const openFormula = () => { showFormula.value = true; };
const insertText = (text: string) => { showHandwrite.value = false; };
const insertShape = (shape: string) => { showHandwrite.value = false; };
const insertFormula = () => { showFormula.value = false; latexInput.value = ""; };

const minimize = () => { if ((window as any).electronAPI?.windowMinimize) (window as any).electronAPI.windowMinimize(); };
const close = () => { if ((window as any).electronAPI?.windowClose) (window as any).electronAPI.windowClose(); };
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { width: 100%; height: 100%; overflow: hidden; background: transparent; }
.app { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.formula-panel { width: 450px; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; font-weight: 600; }
.close-btn { width: 28px; height: 28px; border: none; background: rgba(255,255,255,0.2); border-radius: 6px; color: #fff; font-size: 18px; cursor: pointer; }
.panel-body { padding: 18px; }
.panel-body textarea { width: 100%; height: 80px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 10px; font-family: monospace; font-size: 14px; resize: none; }
.panel-body textarea:focus { border-color: #667eea; outline: none; }
.preview { margin-top: 14px; padding: 16px; background: #f8f9fa; border-radius: 10px; min-height: 50px; }
.panel-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 18px; background: #f8f9fa; }
.btn { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; transition: all 0.2s; }
.btn:hover { transform: translateY(-1px); }
.btn.primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
</style>
