<template>
  <div v-if="visible" class="dialog-overlay" @click.self="handleClose">
    <div class="dialog-content">
      <div class="dialog-header">
        <h3>{{ isLatex ? 'LaTeX 公式' : '化学方程式' }}</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      
      <div class="dialog-body">
        <!-- LaTeX 公式界面 -->
        <div v-if="isLatex" class="latex-panel">
          <div class="input-section">
            <div class="template-buttons">
              <span class="template-label">常用模板:</span>
              <button v-for="tpl in latexTemplates" :key="tpl.label" 
                class="template-btn" 
                @click="insertTemplate(tpl.code)"
                :title="tpl.label"
              >
                {{ tpl.label }}
              </button>
            </div>
            <textarea 
              v-model="inputText" 
              class="formula-input"
              placeholder="输入 LaTeX 公式，如: \frac{a}{b}"
              @input="updatePreview"
            ></textarea>
          </div>
          
          <div class="preview-section">
            <div class="preview-label">实时预览:</div>
            <div class="preview-content" v-html="previewHtml"></div>
          </div>
        </div>
        
        <!-- 化学方程式界面 -->
        <div v-else class="chem-panel">
          <div class="input-section">
            <textarea 
              v-model="inputText" 
              class="formula-input"
              placeholder="输入化学式，如: 2H2 + O2 = 2H2O"
              @input="updateChemPreview"
            ></textarea>
            <div class="chem-hint">
              <span class="hint-label">提示:</span>
              <span>数字会自动转换为下标，如 CO2 → CO₂</span>
            </div>
          </div>
          
          <div class="preview-section">
            <div class="preview-label">实时预览:</div>
            <div class="preview-content chem-preview">
              {{ formattedChemText }}
            </div>
          </div>
          
          <div class="chem-options">
            <div class="arrow-option">
              <span class="option-label">箭头类型:</span>
              <button 
                v-for="arrow in arrows" 
                :key="arrow.value"
                class="arrow-btn"
                :class="{ active: selectedArrow === arrow.value }"
                @click="selectedArrow = arrow.value"
              >
                {{ arrow.display }}
              </button>
            </div>
            
            <div class="condition-option">
              <span class="option-label">反应条件:</span>
              <button 
                v-for="cond in conditions" 
                :key="cond.value"
                class="cond-btn"
                :class="{ active: selectedConditions.includes(cond.value) }"
                @click="toggleCondition(cond.value)"
              >
                {{ cond.display }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button class="cancel-btn" @click="handleClose">取消</button>
        <button class="insert-btn" @click="handleInsert" :disabled="!inputText.trim()">
          插入到画布
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const props = defineProps<{
  type: 'latex' | 'chemFormula'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'insert', data: any): void
}>()

const visible = ref(true)
const inputText = ref('')
const previewHtml = ref('')
const isLatex = computed(() => props.type === 'latex')

// LaTeX 模板
const latexTemplates = [
  { label: '分数', code: '\\frac{a}{b}' },
  { label: '平方根', code: '\\sqrt{x}' },
  { label: '积分', code: '\\int_{a}^{b} f(x)dx' },
  { label: '求和', code: '\\sum_{i=1}^{n} a_i' },
  { label: '极限', code: '\\lim_{x \\to \\infty}' },
  { label: 'α', code: '\\alpha' },
  { label: 'β', code: '\\beta' },
  { label: 'γ', code: '\\gamma' },
  { label: 'δ', code: '\\delta' },
  { label: 'π', code: '\\pi' },
  { label: 'θ', code: '\\theta' },
  { label: '∞', code: '\\infty' },
  { label: '×', code: '\\times' },
  { label: '÷', code: '\\div' },
  { label: '≈', code: '\\approx' },
  { label: '≠', code: '\\neq' },
  { label: '≤', code: '\\leq' },
  { label: '≥', code: '\\geq' },
  { label: '²', code: '^2' },
  { label: '³', code: '^3' }
]

// 化学方程式相关
const arrows = [
  { value: '→', display: '→' },
  { value: '⇌', display: '⇌' },
  { value: '←', display: '←' }
]

const conditions = [
  { value: 'Δ', display: '△ 加热' },
  { value: 'Pt', display: 'Pt 催化剂' },
  { value: 'MnO2', display: 'MnO₂' },
  { value: '通电', display: '通电' },
  { value: '点燃', display: '点燃' }
]

const selectedArrow = ref('→')
const selectedConditions = ref<string[]>([])

// 格式化化学式（数字转下标）
const formattedChemText = computed(() => {
  if (!inputText.value) return ''
  let text = inputText.value
  
  // 替换等号和箭头
  if (text.includes('=')) {
    text = text.replace(/=/g, ' ' + selectedArrow.value + ' ')
  }
  
  // 数字转下标
  text = text.replace(/(\d+)/g, (match) => {
    const subscripts = '₀₁₂₃₄₅₆₇₈₉'
    return match.split('').map(d => subscripts[parseInt(d)] || d).join('')
  })
  
  // 添加反应条件
  if (selectedConditions.value.length > 0) {
    text += '  ' + selectedConditions.value.join('')
  }
  
  return text
})

// 插入模板
const insertTemplate = (code: string) => {
  inputText.value += code
  updatePreview()
}

// 更新预览
const updatePreview = () => {
  if (!inputText.value.trim()) {
    previewHtml.value = '<span class="placeholder">请输入公式</span>'
    return
  }
  
  try {
    previewHtml.value = katex.renderToString(inputText.value, {
      throwOnError: false,
      displayMode: true
    })
  } catch (e) {
    previewHtml.value = '<span class="error">公式解析错误</span>'
  }
}

// 更新化学预览
const updateChemPreview = () => {
  // 化学式预览在 computed 中自动更新
}

// 切换反应条件
const toggleCondition = (cond: string) => {
  const index = selectedConditions.value.indexOf(cond)
  if (index > -1) {
    selectedConditions.value.splice(index, 1)
  } else {
    selectedConditions.value.push(cond)
  }
}

// 关闭对话框
const handleClose = () => {
  emit('close')
}

// 插入公式
const handleInsert = () => {
  if (!inputText.value.trim()) return
  
  if (isLatex.value) {
    // 生成 LaTeX 图片
    try {
      const html = katex.renderToString(inputText.value, {
        throwOnError: false,
        displayMode: true
      })
      
      // 创建临时 div 来渲染
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.fontSize = '20px'
      document.body.appendChild(tempDiv)
      
      // 使用 html2canvas 或手动创建图片
      // 这里我们保存 SVG 形式
      const svgText = katex.renderToString(inputText.value, {
        throwOnError: false,
        displayMode: true,
        output: 'html'
      })
      
      emit('insert', {
        type: 'latex',
        content: inputText.value,
        previewHtml: previewHtml.value
      })
      
      document.body.removeChild(tempDiv)
    } catch (e) {
      console.error('LaTeX 渲染错误:', e)
    }
  } else {
    emit('insert', {
      type: 'chemFormula',
      content: inputText.value,
      formattedContent: formattedChemText.value,
      arrow: selectedArrow.value,
      conditions: [...selectedConditions.value]
    })
  }
  
  handleClose()
}

// 监听显示状态
watch(() => props.type, (newType) => {
  isLatex.value = newType === 'latex'
  inputText.value = ''
  previewHtml.value = '<span class="placeholder">请输入公式</span>'
  selectedArrow.value = '→'
  selectedConditions.value = []
})

onMounted(() => {
  updatePreview()
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #E0E0E0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.dialog-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.latex-panel, .chem-panel {
  display: flex;
  gap: 20px;
}

.input-section, .preview-section {
  flex: 1;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.template-label {
  font-size: 12px;
  color: #666;
  margin-right: 4px;
}

.template-btn {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #E0E0E0;
  background: #F5F5F5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.template-btn:hover {
  background: #E3F2FD;
  border-color: #2196F3;
}

.formula-input {
  width: 100%;
  height: 150px;
  padding: 12px;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: none;
  box-sizing: border-box;
}

.formula-input:focus {
  outline: none;
  border-color: #2196F3;
}

.preview-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.preview-content {
  min-height: 120px;
  padding: 16px;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  background: #F9F9F9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.preview-content :deep(.placeholder) {
  color: #999;
  font-size: 14px;
}

.preview-content :deep(.error) {
  color: #F44336;
  font-size: 14px;
}

.chem-preview {
  font-size: 22px;
  color: #333;
}

.chem-hint {
  font-size: 12px;
  color: #666;
}

.hint-label {
  margin-right: 4px;
}

.chem-options {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.arrow-option, .condition-option {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.option-label {
  font-size: 12px;
  color: #666;
  min-width: 60px;
}

.arrow-btn, .cond-btn {
  padding: 6px 12px;
  border: 1px solid #E0E0E0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}

.arrow-btn:hover, .cond-btn:hover {
  background: #F5F5F5;
}

.arrow-btn.active, .cond-btn.active {
  background: #E3F2FD;
  border-color: #2196F3;
  color: #2196F3;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #E0E0E0;
}

.cancel-btn, .insert-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.cancel-btn {
  background: white;
  border: 1px solid #E0E0E0;
  color: #666;
}

.cancel-btn:hover {
  background: #F5F5F5;
}

.insert-btn {
  background: #2196F3;
  border: none;
  color: white;
}

.insert-btn:hover:not(:disabled) {
  background: #1976D2;
}

.insert-btn:disabled {
  background: #BDBDBD;
  cursor: not-allowed;
}
</style>