import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'

/**
 * 类型声明：浏览器非标准/实验性 API
 */
interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<any>
}
interface NavigatorWithConnection extends Navigator {
  connection?: any
  mozConnection?: any
  webkitConnection?: any
  deviceMemory?: number
  userAgentData?: { platform?: string; platformVersion?: string; brands?: any[] }
}
interface NavigatorWithGPU {
  getContext?: (type: string) => WebGLRenderingContext | null
}
interface GeolocationPermission {
  state: 'granted' | 'denied' | 'prompt'
}

// ========== 最近城市匹配（Haversine 球面距离）：纯函数，独立导出供测试/复用 ==========
// ponytail: 放在顶层而不是 useDeviceInfo 内部，方便单测和外部工具调用（不需要创建 Vue 组件实例）
export interface MinimalCity { id: string; lat: number; lng: number; label?: string }
const DEFAULT_CITIES: MinimalCity[] = [
  { id: 'bj',  lat: 39.9,  lng: 116.4,  label: 'BEIJING' },
  { id: 'sh',  lat: 31.2,  lng: 121.5,  label: 'SHANGHAI' },
  { id: 'hk',  lat: 22.3,  lng: 114.2,  label: 'HONG KONG' },
  { id: 'ty',  lat: 35.7,  lng: 139.7,  label: 'TOKYO' },
  { id: 'sf',  lat: 37.8,  lng: -122.4, label: 'SAN FRANCISCO' },
  { id: 'sv',  lat: 37.6,  lng: -122.4, label: 'SILICON VALLEY' },
  { id: 'ny',  lat: 40.7,  lng: -74.0,  label: 'NEW YORK' },
  { id: 'lon', lat: 51.5,  lng: -0.1,   label: 'LONDON' },
  { id: 'par', lat: 48.8,  lng: 2.3,    label: 'PARIS' },
  { id: 'ber', lat: 52.5,  lng: 13.4,   label: 'BERLIN' },
  { id: 'mow', lat: 55.7,  lng: 37.6,   label: 'MOSCOW' },
  { id: 'sin', lat: 1.35,  lng: 103.8,  label: 'SINGAPORE' },
  { id: 'syd', lat: -33.8, lng: 151.2,  label: 'SYDNEY' },
  { id: 'sao', lat: -23.5, lng: -46.6,  label: 'SAO PAULO' },
  { id: 'mex', lat: 19.4,  lng: -99.1,  label: 'MEXICO CITY' },
  { id: 'del', lat: 28.6,  lng: 77.2,   label: 'NEW DELHI' },
  { id: 'cai', lat: 30.0,  lng: 31.2,   label: 'CAIRO' },
  { id: 'nai', lat: -1.2,  lng: 36.8,   label: 'NAIROBI' },
  { id: 'bue', lat: -34.6, lng: -58.3,  label: 'BUENOS AIRES' },
  { id: 'sto', lat: 59.3,  lng: 18.0,   label: 'STOCKHOLM' },
  { id: 'bkk', lat: 13.7,  lng: 100.5,  label: 'BANGKOK' },
  { id: 'dub', lat: 25.2,  lng: 55.2,   label: 'DUBAI' },
  { id: 'lim', lat: -12.0, lng: -77.0,  label: 'LIMA' },
  { id: 'rom', lat: 41.9,  lng: 12.5,   label: 'ROME' },
  { id: 'pra', lat: 50.0,  lng: 14.4,   label: 'PRAGUE' }
]
export function findNearestCityLabel(lat: number, lng: number, cities: MinimalCity[] = DEFAULT_CITIES): string {
  let best = cities[0]
  let bestD = Infinity
  const latRad = lat * Math.PI / 180
  for (const c of cities) {
    const dLat = (c.lat - lat) * Math.PI / 180
    const dLng = (c.lng - lng) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(latRad) * Math.cos(c.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    const d = 2 * Math.asin(Math.sqrt(a))
    if (d < bestD) { bestD = d; best = c }
  }
  return best.label || best.id.toUpperCase()
}

/**
 * 获取设备真实信息（CPU、内存、电池、网络、GPU、地理位置、FPS 等）
 * 不支持的 API 会回退到合理默认值
 */
export function useDeviceInfo() {
  // 设备基础信息
  const devicePixelRatio = ref(window.devicePixelRatio || 1)
  const screenWidth = ref(screen.width)
  const screenHeight = ref(screen.height)
  const viewportW = ref(window.innerWidth)
  const viewportH = ref(window.innerHeight)
  const colorDepth = ref(screen.colorDepth)
  const pixelDepth = ref(screen.pixelDepth)
  const touchSupport = ref('ontouchstart' in window)
  const platform = ref((navigator as NavigatorWithGPU & NavigatorWithConnection).userAgentData?.platform || navigator.platform || 'Unknown')
  const userAgent = ref(navigator.userAgent)
  const language = ref(navigator.language)
  const online = ref(navigator.onLine)
  const hardwareConcurrency = ref(navigator.hardwareConcurrency || 4)
  const maxTouchPoints = ref(navigator.maxTouchPoints || 0)

  // 性能指标
  const deviceMemory = ref((navigator as NavigatorWithConnection).deviceMemory || 8) // GB
  const connectionType = ref('unknown')
  const effectiveType = ref('unknown')
  const downlink = ref(0)
  const rtt = ref(0)
  const saveData = ref(false)

  // 电池信息 (Battery API)
  const batteryLevel = ref(100)
  const batteryCharging = ref(false)
  const batteryChargingTime = ref(0)
  const batteryDischargingTime = ref(0)

  // CPU 温度 - 浏览器不直接支持，使用模拟值 + 负载推断
  const cpuTemp = ref(45)
  const cpuUsage = ref(0)
  const memUsage = ref(0)

  // 系统正常运行时间
  const uptimeStart = ref(Date.now())
  const uptime = ref(0)

  // ========== 新增：GPU 显卡信息（WebGL UNMASKED_RENDERER） ==========
  const gpuVendor = ref('Unknown')
  const gpuRenderer = ref('Unknown')
  const gpuExtensions = ref<string[]>([])

  // ========== 新增：实时 FPS 帧率 ==========
  const fps = ref(0)
  const fpsMin = ref(999)
  const fpsMax = ref(0)

  // ========== 新增：本机地理位置（Geolocation API，需用户授权） ==========
  const geoLat = ref<number | null>(null)
  const geoLng = ref<number | null>(null)
  const geoAccuracy = ref<number | null>(null)   // 米
  const geoStatus = ref<'IDLE' | 'REQUESTING' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE' | 'TIMEOUT'>('IDLE')
  const geoCityLabel = ref<string>('Unknown')   // 匹配 cityHotspots 后得到的最近城市名（全大写），用于 PixelGlobe 联动
  const geoTimestamp = ref<number | null>(null)
  // 时区（不需要授权，低门槛信息）
  const timezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown')
  const timezoneOffset = ref(-new Date().getTimezoneOffset() / 60) // UTC+X 小时

  let batteryManager: any = null
  let timer: number
  let fpsRafId: number | null = null
  let _fpsFrames = 0
  let _fpsLastTs = 0
  let geoWatchId: number | null = null

  // ========== GPU 信息采集：WebGL debug renderer 扩展 ==========
  function initGPU(): void {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
        (canvas.getContext('webgl') as WebGLRenderingContext | null)
      if (!gl) return
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        const vendor = gl.getParameter((debugInfo as any).UNMASKED_VENDOR_WEBGL)
        const renderer = gl.getParameter((debugInfo as any).UNMASKED_RENDERER_WEBGL)
        if (vendor) gpuVendor.value = String(vendor)
        if (renderer) gpuRenderer.value = String(renderer)
      } else {
        // 拿不到 debug 扩展：至少回退到基础 RENDERER（通常是通用名如 "WebKit WebGL"）
        const baseR = gl.getParameter(gl.RENDERER)
        const baseV = gl.getParameter(gl.VENDOR)
        if (baseR) gpuRenderer.value = String(baseR)
        if (baseV) gpuVendor.value = String(baseV)
      }
      // 支持的扩展列表（取前 20，避免太长）
      try {
        const exts = gl.getSupportedExtensions() || []
        gpuExtensions.value = exts.slice(0, 20).map(String)
      } catch { /* ignore */ }
    } catch {
      // 完全不支持 WebGL：保持默认 Unknown
    }
  }

  // ========== FPS 帧率采样：独立 rAF 循环，每 500ms 汇总一次 ==========
  function initFPS(): void {
    _fpsLastTs = performance.now()
    const tick = (ts: number): void => {
      _fpsFrames++
      if (ts - _fpsLastTs >= 500) {
        const elapsedSec = (ts - _fpsLastTs) / 1000
        const current = Math.round(_fpsFrames / elapsedSec)
        fps.value = current
        if (current < fpsMin.value) fpsMin.value = current
        if (current > fpsMax.value) fpsMax.value = current
        _fpsFrames = 0
        _fpsLastTs = ts
      }
      fpsRafId = requestAnimationFrame(tick)
    }
    fpsRafId = requestAnimationFrame(tick)
  }

  // ========== 地理位置：请求授权 → watchPosition 持续刷新（含最近城市匹配） ==========
  function initGeo(): void {
    if (!('geolocation' in navigator)) { geoStatus.value = 'UNAVAILABLE'; return }
    geoStatus.value = 'REQUESTING'
    try {
      geoWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          geoLat.value = pos.coords.latitude
          geoLng.value = pos.coords.longitude
          geoAccuracy.value = Math.round(pos.coords.accuracy)
          geoTimestamp.value = pos.timestamp
          geoStatus.value = 'GRANTED'
          geoCityLabel.value = findNearestCityLabel(pos.coords.latitude, pos.coords.longitude)
        },
        (err) => {
          if (err.code === 1) geoStatus.value = 'DENIED'
          else if (err.code === 2) geoStatus.value = 'UNAVAILABLE'
          else if (err.code === 3) geoStatus.value = 'TIMEOUT'
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      )
    } catch {
      geoStatus.value = 'UNAVAILABLE'
    }
  }

  // 对外暴露：用户手动触发再次请求地理位置（用于 DENIED 后用户手动开启权限再尝试）
  function refreshGeo(): void {
    if (geoWatchId !== null) {
      navigator.geolocation.clearWatch(geoWatchId)
      geoWatchId = null
    }
    initGeo()
  }

  async function initBattery() {
    try {
      if ('getBattery' in navigator) {
        batteryManager = await (navigator as any).getBattery()
        updateBattery(batteryManager)
        batteryManager.addEventListener('levelchange', () => updateBattery(batteryManager))
        batteryManager.addEventListener('chargingchange', () => updateBattery(batteryManager))
      } else {
        // 回退：模拟电池数据
        batteryLevel.value = 75 + Math.floor(Math.random() * 20)
        batteryCharging.value = Math.random() > 0.5
      }
    } catch {
      batteryLevel.value = 75
      batteryCharging.value = false
    }
  }

  function updateBattery(batt: any) {
    batteryLevel.value = Math.round(batt.level * 100)
    batteryCharging.value = batt.charging
    batteryChargingTime.value = batt.chargingTime || 0
    batteryDischargingTime.value = batt.dischargingTime || 0
  }

  function initConnection() {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (conn) {
      connectionType.value = String(conn.type ?? 'unknown')
      effectiveType.value = String(conn.effectiveType ?? 'unknown')
      downlink.value = Number(conn.downlink) || 0
      rtt.value = Number(conn.rtt) || 0
      saveData.value = Boolean(conn.saveData)

      conn.addEventListener('change', () => {
        connectionType.value = String(conn.type ?? 'unknown')
        effectiveType.value = String(conn.effectiveType ?? 'unknown')
        downlink.value = Number(conn.downlink) || 0
        rtt.value = Number(conn.rtt) || 0
      })
    }
  }

  function updateSimulatedMetrics() {
    // 基于 Performance API 获取真实负载
    try {
      const perf = performance
      const memInfo = (perf as any).memory
      if (memInfo && memInfo.jsHeapSizeLimit && memInfo.jsHeapSizeLimit > 0) {
        // Chrome only（需要 --enable-precise-memory-info 或 HTTPS）
        memUsage.value = Math.max(1, Math.min(99,
          Math.round((memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100)
        ))
      } else {
        // ponytail: Firefox/Safari/无 memory 属性环境 → 走模拟值；之前缺 else 分支导致 UI 显示 0%
        memUsage.value = 40 + Math.floor(Math.random() * 30)
      }
    } catch {
      // 回退：模拟
      memUsage.value = 40 + Math.floor(Math.random() * 30)
    }

    // CPU 使用率 - 模拟（浏览器不提供真实CPU使用率）
    cpuUsage.value = 20 + Math.floor(Math.random() * 40)

    // CPU 温度 - 基于使用量推断（20-90°C 范围）
    const baseTemp = 35
    const loadFactor = cpuUsage.value * 0.6
    cpuTemp.value = Math.round(baseTemp + loadFactor + (Math.random() * 5 - 2))

    // 运行时间
    uptime.value = Math.floor((Date.now() - uptimeStart.value) / 1000)
  }

  function formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  function onOnline() { online.value = true }
  function onOffline() { online.value = false }
  function onResize() {
    viewportW.value = window.innerWidth
    viewportH.value = window.innerHeight
  }

  onMounted(() => {
    initGPU()       // GPU 型号
    initFPS()        // 帧率采样
    initGeo()        // 地理位置（会弹授权请求，用户可拒绝，不阻塞其他初始化）
    initBattery()
    initConnection()
    updateSimulatedMetrics()

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('resize', onResize)

    timer = window.setInterval(() => {
      updateSimulatedMetrics()
    }, 2000)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
    window.removeEventListener('resize', onResize)
    clearInterval(timer)
    if (fpsRafId !== null) { cancelAnimationFrame(fpsRafId); fpsRafId = null }
    if (geoWatchId !== null) { navigator.geolocation.clearWatch(geoWatchId); geoWatchId = null }
  })

  return {
    // 设备
    devicePixelRatio,
    screenWidth,
    screenHeight,
    viewportW,
    viewportH,
    colorDepth,
    pixelDepth,
    touchSupport,
    platform,
    userAgent,
    language,
    online,
    hardwareConcurrency,
    maxTouchPoints,
    deviceMemory,
    // GPU
    gpuVendor,
    gpuRenderer,
    gpuExtensions,
    // 帧率
    fps,
    fpsMin,
    fpsMax,
    // 网络
    connectionType,
    effectiveType,
    downlink,
    rtt,
    saveData,
    // 电池
    batteryLevel,
    batteryCharging,
    batteryChargingTime,
    batteryDischargingTime,
    // 性能
    cpuTemp,
    cpuUsage,
    memUsage,
    // 运行时间
    uptime,
    formatUptime,
    // 地理位置
    geoLat,
    geoLng,
    geoAccuracy,
    geoStatus,
    geoCityLabel,
    geoTimestamp,
    timezone,
    timezoneOffset,
    refreshGeo
  }
}
