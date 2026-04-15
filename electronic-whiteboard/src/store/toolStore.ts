import { reactive, readonly } from 'vue'

export type ToolType = 'select' | 'line' | 'rect' | 'circle' | 'triangle' | 'polygon' | 'arrow' | 'pen' | 'eraser' | 'text' | 'ruler' | 'protractor' | 'compass' | 'setsquare' | 'coordinate' | 'function' | 'numberLine' | 'geometryMark' | 'forceArrow' | 'pulley' | 'spring' | 'incline' | 'lever' | 'magnetic' | 'beaker' | 'flask' | 'testTube' | 'alcoholLamp' | 'molecule' | 'latex' | 'chemFormula' | 'connect' | 'split'

// 线型
export type LineStyle = 'solid' | 'dashed' | 'dotted'

// 端点样式
export type LineCap = 'butt' | 'round' | 'square'

// 对齐方式
export type AlignType = 'left' | 'center' | 'right'

// 主题类型
export type ThemeType = 'white' | 'black' | 'dark'

// 网格间距
export type GridSpacing = 10 | 20 | 50

// 吸附容差
export type SnapTolerance = 5 | 10 | 15

interface ToolState {
  currentTool: ToolType
  strokeColor: string
  fillColor: string
  strokeWidth: number
  fillEnabled: boolean
  fillOpacity: number
  polygonSides: number
  // 描边扩展属性
  lineStyle: LineStyle
  lineCap: LineCap
  // 文字属性
  fontFamily: string
  fontSize: number
  textColor: string
  textAlign: AlignType
  // 选中图形的属性（用于联动）
  selectedShapeAttrs: Record<string, any> | null
  // 主题设置
  theme: ThemeType
  // 网格设置
  gridEnabled: boolean
  gridSpacing: GridSpacing
  // 吸附设置
  snapEnabled: boolean
  snapTolerance: SnapTolerance
}

const state = reactive<ToolState>({
  currentTool: 'select',
  strokeColor: '#333333',
  fillColor: '#2196F3',
  strokeWidth: 2,
  fillEnabled: false,
  fillOpacity: 100,
  polygonSides: 5,
  lineStyle: 'solid',
  lineCap: 'round',
  fontFamily: 'Arial',
  fontSize: 16,
  textColor: '#333333',
  textAlign: 'left',
  selectedShapeAttrs: null,
  // 主题和设置（从 localStorage 恢复）
  theme: (localStorage.getItem('whiteboard-theme') as ThemeType) || 'white',
  gridEnabled: localStorage.getItem('whiteboard-grid-enabled') === 'true',
  gridSpacing: (parseInt(localStorage.getItem('whiteboard-grid-spacing') || '20') as GridSpacing) || 20,
  snapEnabled: localStorage.getItem('whiteboard-snap-enabled') === 'true',
  snapTolerance: (parseInt(localStorage.getItem('whiteboard-snap-tolerance') || '10') as SnapTolerance) || 10
})

export function useToolStore() {
  const setTool = (tool: ToolType) => {
    const oldTool = state.currentTool
    state.currentTool = tool
    // 发送工具切换事件，让画布组件可以处理相关状态
    window.dispatchEvent(new CustomEvent('whiteboard:tool-changed', { detail: { oldTool, newTool: tool } }))
  }

  const setStrokeColor = (color: string) => {
    state.strokeColor = color
    // 如果有选中的图形，同步更新
    if (state.selectedShapeAttrs) {
      state.selectedShapeAttrs.stroke = color
    }
  }

  const setFillColor = (color: string) => {
    state.fillColor = color
    // 如果有选中的图形，同步更新
    if (state.selectedShapeAttrs) {
      state.selectedShapeAttrs.fill = color
    }
  }

  const setStrokeWidth = (width: number) => {
    state.strokeWidth = width
    if (state.selectedShapeAttrs) {
      state.selectedShapeAttrs.strokeWidth = width
    }
  }

  const setFillEnabled = (enabled: boolean) => {
    state.fillEnabled = enabled
    if (state.selectedShapeAttrs) {
      state.selectedShapeAttrs.fill = enabled ? state.fillColor : 'transparent'
    }
  }

  const setFillOpacity = (opacity: number) => {
    state.fillOpacity = opacity
    if (state.selectedShapeAttrs) {
      state.selectedShapeAttrs.fill = state.fillColor
      state.selectedShapeAttrs.fillOpacity = opacity / 100
    }
  }

  const setPolygonSides = (sides: number) => {
    state.polygonSides = sides
  }

  const setLineStyle = (style: LineStyle) => {
    state.lineStyle = style
    if (state.selectedShapeAttrs) {
      if (style === 'dashed') {
        state.selectedShapeAttrs.dash = [10, 5]
      } else if (style === 'dotted') {
        state.selectedShapeAttrs.dash = [2, 4]
      } else {
        state.selectedShapeAttrs.dash = []
      }
    }
  }

  const setLineCap = (cap: LineCap) => {
    state.lineCap = cap
    if (state.selectedShapeAttrs) {
      state.selectedShapeAttrs.lineCap = cap
    }
  }

  const setFontFamily = (family: string) => {
    state.fontFamily = family
    if (state.selectedShapeAttrs) {
      state.selectedShapeAttrs.fontFamily = family
    }
  }

  const setFontSize = (size: number) => {
    state.fontSize = size
    if (state.selectedShapeAttrs) {
      state.selectedShapeAttrs.fontSize = size
    }
  }

  const setTextColor = (color: string) => {
    state.textColor = color
    if (state.selectedShapeAttrs) {
      state.selectedShapeAttrs.fill = color
    }
  }

  const setTextAlign = (align: AlignType) => {
    state.textAlign = align
    if (state.selectedShapeAttrs) {
      state.selectedShapeAttrs.align = align
    }
  }

  const setSelectedShapeAttrs = (attrs: Record<string, any> | null) => {
    state.selectedShapeAttrs = attrs
    if (attrs) {
      // 从选中图形同步属性到面板
      if (attrs.fill && attrs.fill !== 'transparent') {
        state.fillEnabled = true
        state.fillColor = attrs.fill
      } else {
        state.fillEnabled = false
      }
      if (attrs.fillOpacity !== undefined) {
        state.fillOpacity = Math.round(attrs.fillOpacity * 100)
      }
      if (attrs.stroke) {
        state.strokeColor = attrs.stroke
      }
      if (attrs.strokeWidth) {
        state.strokeWidth = attrs.strokeWidth
      }
      if (attrs.dash) {
        if (attrs.dash.length === 0) {
          state.lineStyle = 'solid'
        } else if (attrs.dash[0] === 10) {
          state.lineStyle = 'dashed'
        } else if (attrs.dash[0] === 2) {
          state.lineStyle = 'dotted'
        }
      }
      if (attrs.lineCap) {
        state.lineCap = attrs.lineCap
      }
    }
  }

  const clearSelectedShapeAttrs = () => {
    state.selectedShapeAttrs = null
  }

  // 主题设置
  const setTheme = (theme: ThemeType) => {
    state.theme = theme
    localStorage.setItem('whiteboard-theme', theme)
    // 触发主题变化事件
    window.dispatchEvent(new CustomEvent('whiteboard:theme-changed', { detail: { theme } }))
  }

  // 网格设置
  const setGridEnabled = (enabled: boolean) => {
    state.gridEnabled = enabled
    localStorage.setItem('whiteboard-grid-enabled', String(enabled))
    window.dispatchEvent(new CustomEvent('whiteboard:grid-changed'))
  }

  const setGridSpacing = (spacing: GridSpacing) => {
    state.gridSpacing = spacing
    localStorage.setItem('whiteboard-grid-spacing', String(spacing))
    window.dispatchEvent(new CustomEvent('whiteboard:grid-changed'))
  }

  // 吸附设置
  const setSnapEnabled = (enabled: boolean) => {
    state.snapEnabled = enabled
    localStorage.setItem('whiteboard-snap-enabled', String(enabled))
  }

  const setSnapTolerance = (tolerance: SnapTolerance) => {
    state.snapTolerance = tolerance
    localStorage.setItem('whiteboard-snap-tolerance', String(tolerance))
  }

  return {
    state: readonly(state),
    setTool,
    setStrokeColor,
    setFillColor,
    setStrokeWidth,
    setFillEnabled,
    setFillOpacity,
    setPolygonSides,
    setLineStyle,
    setLineCap,
    setFontFamily,
    setFontSize,
    setTextColor,
    setTextAlign,
    setSelectedShapeAttrs,
    clearSelectedShapeAttrs,
    setTheme,
    setGridEnabled,
    setGridSpacing,
    setSnapEnabled,
    setSnapTolerance
  }
}