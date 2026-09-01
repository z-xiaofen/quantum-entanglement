import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

/**
 * 方案 A：动态基准不变形铺满
 * 设计基准宽度 1920，容器高度随屏幕比例动态算，再等比 scale
 * 无黑边、无变形、无裁切
 * 前提：#screen-wrapper 内部纵向用 flex 布局
 */

const DESIGN_W = 1920

export function useScreenAdapter() {
  const viewportW = ref(window.innerWidth)
  const viewportH = ref(window.innerHeight)

  // 动态容器高度：跟随屏幕宽高比
  const designH = computed(() => {
    const ratio = viewportW.value / viewportH.value
    return DESIGN_W / ratio
  })

  // 等比缩放：Y 方向自然相等
  const scale = computed(() => viewportW.value / DESIGN_W)

  const isSmallScreen = computed(() => scale.value < 0.5)

  function updateViewport() {
    viewportW.value = window.innerWidth
    viewportH.value = window.innerHeight
  }

  // 150ms 防抖
  let timer: ReturnType<typeof setTimeout> | null = null
  function onResize() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(updateViewport, 150)
  }

  // 容器样式 - 固定宽 1920，高度动态，等比 scale 铺满
  const containerStyle = computed(() => {
    const s = scale.value
    return {
      width: DESIGN_W + 'px',
      height: designH.value + 'px',
      transform: `scale(${s})`,
      transformOrigin: 'left top',
      position: 'fixed' as const,
      left: '0',
      top: '0',
      willChange: 'transform'
    }
  })

  // 背景样式（填充整个视口）
  const bgStyle = computed(() => ({
    position: 'fixed' as const,
    inset: '0',
    background: '#000',
    overflow: 'hidden'
  }))

  onMounted(() => {
    updateViewport()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onResize)
    if (timer) clearTimeout(timer)
  })

  return {
    scale,
    isSmallScreen,
    viewportW,
    viewportH,
    designH,
    containerStyle,
    bgStyle
  }
}
