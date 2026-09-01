<template>
  <!-- #screen-root: fixed 全屏，纯黑底，承载留黑边区域 -->
  <div id="screen-root" :style="bgStyle">
    <!-- 全屏背景层（星空 + 径向渐变，铺满黑边区域） -->
    <div class="dash-bg">
      <div class="starfield">
        <div v-for="i in 100" :key="i" class="star" :style="getStarStyle(i - 1)"></div>
      </div>
      <div class="radial-glow"></div>
    </div>

    <!-- Three.js 像素地球 - 全屏背景，仅中央区域可交互；globeRef 用于外部调用 flyToCityByLabel -->
    <PixelGlobe ref="globeRef" @user-interact="onGlobeUserInteract" />

    <!-- #screen-wrapper: 固定 1920x1080，所有页面内容挂在此层 -->
    <div id="screen-wrapper" :style="containerStyle">
      <!-- 角落装饰（在缩放容器内，随内容一起缩放） -->
      <div class="deco-corners">
      <div class="corner tl"><span class="corner-line-h"></span><span class="corner-line-v"></span></div>
      <div class="corner tr"><span class="corner-line-h"></span><span class="corner-line-v"></span></div>
      <div class="corner bl"><span class="corner-line-h"></span><span class="corner-line-v"></span></div>
      <div class="corner br"><span class="corner-line-h"></span><span class="corner-line-v"></span></div>
    </div>

    <!-- CRT覆盖层 -->
    <CrtOverlay
      section="GLOBAL NETWORK MAP"
      :isOnline="device.online"
      :cpuTemp="device.cpuTemp"
      :cpuUsage="device.cpuUsage"
      :memUsage="device.memUsage"
      :batteryLevel="device.batteryLevel"
      :batteryCharging="device.batteryCharging"
      :connectionType="device.connectionType"
      :effectiveType="device.effectiveType"
      :rtt="device.rtt"
      :fps="device.fps"
    />

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧面板列 -->
      <div class="left-column">
        <!-- 设备信息 -->
        <HudPanel title="Device Info" subtitle="SYSTEM TELEMETRY" status="ONLINE" :glow="true">
          <div class="device-info-grid">
            <div class="dev-item" :class="{ warn: device.cpuTemp > 70 }">
              <span class="dev-icon">◈</span>
              <div class="dev-info">
                <span class="dev-lbl">CPU TEMP</span>
                <span class="dev-val">{{ device.cpuTemp }}°C</span>
              </div>
            </div>
            <div class="dev-item">
              <span class="dev-icon">{{ device.batteryCharging ? '⚡' : '▯' }}</span>
              <div class="dev-info">
                <span class="dev-lbl">BATTERY</span>
                <span class="dev-val">{{ device.batteryLevel }}%</span>
              </div>
            </div>
            <div class="dev-item">
              <span class="dev-icon">◆</span>
              <div class="dev-info">
                <span class="dev-lbl">CPU CORES</span>
                <span class="dev-val">{{ device.hardwareConcurrency }}</span>
              </div>
            </div>
            <div class="dev-item">
              <span class="dev-icon">◇</span>
              <div class="dev-info">
                <span class="dev-lbl">MEM SIZE</span>
                <span class="dev-val">{{ device.deviceMemory }}GB</span>
              </div>
            </div>
            <div class="dev-item">
              <span class="dev-icon">◉</span>
              <div class="dev-info">
                <span class="dev-lbl">RESOLUTION</span>
                <span class="dev-val">{{ device.screenWidth }}×{{ device.screenHeight }}</span>
              </div>
            </div>
            <div class="dev-item">
              <span class="dev-icon">◎</span>
              <div class="dev-info">
                <span class="dev-lbl">DPR</span>
                <span class="dev-val">{{ device.devicePixelRatio }}x</span>
              </div>
            </div>
            <div class="dev-item">
              <span class="dev-icon">⬡</span>
              <div class="dev-info">
                <span class="dev-lbl">PLATFORM</span>
                <span class="dev-val">{{ device.platform || 'WEB' }}</span>
              </div>
            </div>
            <div class="dev-item">
              <span class="dev-icon">⬢</span>
              <div class="dev-info">
                <span class="dev-lbl">UPTIME</span>
                <span class="dev-val">{{ device.formatUptime(device.uptime) }}</span>
              </div>
            </div>
            <div class="dev-item">
              <span class="dev-icon">✦</span>
              <div class="dev-info">
                <span class="dev-lbl">GPU</span>
                <span
                  class="dev-val small"
                  :title="`${device.gpuVendor ? device.gpuVendor + ' · ' : ''}${device.gpuRenderer}${device.gpuExtensions.length ? ' · ' + device.gpuExtensions.length + ' extensions' : ''}`"
                >{{ truncateGPU(device.gpuRenderer || device.gpuVendor || 'Unknown') }}</span>
              </div>
            </div>
            <div class="dev-item" :class="{ warn: device.geoStatus === 'DENIED' || device.geoStatus === 'TIMEOUT' || device.geoStatus === 'UNAVAILABLE' }">
              <span
                class="dev-icon"
                :class="{ ok: device.geoStatus === 'GRANTED', fail: device.geoStatus === 'DENIED' || device.geoStatus === 'UNAVAILABLE', ask: device.geoStatus === 'REQUESTING' || device.geoStatus === 'TIMEOUT' }"
              >{{ geoIcon }}</span>
              <div class="dev-info">
                <span class="dev-lbl">LOCATION</span>
                <span
                  class="dev-val"
                  :class="{ ok: device.geoStatus === 'GRANTED', 'geo-btn': device.geoStatus !== 'GRANTED' && device.geoStatus !== 'REQUESTING' }"
                  @click="onLocationClick"
                  role="button"
                  :title="geoLocationTooltip"
                  :style="{ pointerEvents: (device.geoStatus !== 'GRANTED' && device.geoStatus !== 'REQUESTING') ? 'auto' : 'none', cursor: (device.geoStatus !== 'GRANTED' && device.geoStatus !== 'REQUESTING') ? 'pointer' : 'default' }"
                >{{ geoLocationDisplay }}</span>
              </div>
            </div>
            <div class="dev-item">
              <span class="dev-icon">◷</span>
              <div class="dev-info">
                <span class="dev-lbl">TIMEZONE</span>
                <span class="dev-val" :title="timezoneFull">{{ timezoneDisplay }}</span>
              </div>
            </div>
            <div class="dev-item">
              <span class="dev-icon">⌘</span>
              <div class="dev-info">
                <span class="dev-lbl">LANG</span>
                <span class="dev-val" :title="navigator && navigator.languages ? navigator.languages.join(', ') : ''">{{ String(device.language || '-').toUpperCase() }}</span>
              </div>
            </div>
          </div>
          <!-- 实时指标条 -->
          <div class="live-metrics">
            <div class="lm-row">
              <span class="lm-lbl">CPU LOAD</span>
              <div class="lm-bar">
                <div class="lm-fill" :class="{ warn: device.cpuUsage > 70 }" :style="{ width: device.cpuUsage + '%' }"></div>
              </div>
              <span class="lm-val">{{ device.cpuUsage }}%</span>
            </div>
            <div class="lm-row">
              <span class="lm-lbl">MEM USE</span>
              <div class="lm-bar">
                <div class="lm-fill mem" :style="{ width: device.memUsage + '%' }"></div>
              </div>
              <span class="lm-val">{{ device.memUsage }}%</span>
            </div>
            <div class="lm-row">
              <span class="lm-lbl">NET RTT</span>
              <div class="lm-bar">
                <div class="lm-fill net" :style="{ width: Math.min(100, device.rtt * 5) + '%' }"></div>
              </div>
              <span class="lm-val">{{ device.rtt }}ms</span>
            </div>
          </div>
        </HudPanel>

        <!-- 数据流列表 -->
        <HudPanel title="Data Streams" subtitle="LIVE FEED" status="SYNCING">
          <div class="data-list-wrap">
            <div class="data-list auto-scroll" :style="dataListStyle">
              <DataRow
                v-for="(stream, idx) in scrollStreams"
                :key="stream.id + '_' + idx"
                :index="String(idx + 1).padStart(2, '0')"
                :label="stream.type"
                :sub="stream.source"
                :value="stream.value"
                :unit="''"
                :trend="stream.trend"
                :status="stream.status"
                :active="idx < 3"
                :warning="stream.status === 'WARNING'"
              />
            </div>
          </div>
        </HudPanel>
      </div>

      <!-- 中央地图区域 -->
      <div class="center-column">
        <!-- 顶部信息 -->
        <div class="map-header">
          <div class="header-section">
            <span class="label">REGION</span>
            <span class="value">{{ currentRegion }}</span>
          </div>
          <div class="header-section">
            <span class="label">NODES</span>
            <span class="value">{{ activeNodes }} / {{ totalNodes }}</span>
          </div>
          <div class="header-section">
            <span class="label">THREAT LVL</span>
            <span class="value" :class="threatClass">{{ threatLevel }}</span>
          </div>
          <div class="header-section">
            <span class="label">LAST SYNC</span>
            <span class="value">{{ lastSync }}</span>
          </div>
        </div>

        <!-- 地图交互区域 - 透明，接收鼠标事件传给背景地球 -->
        <div class="map-wrapper">
          <div id="globeInteractZone" class="globe-interact-zone"></div>
        </div>

        <!-- 地图下方信息栏 -->
        <div class="map-footer">
          <div class="footer-section">
            <span class="icon">◆</span>
            <span class="label">ACTIVE TRANSMISSIONS</span>
            <span class="num">{{ activeTransmissions }}</span>
          </div>
          <div class="footer-section">
            <span class="icon">◇</span>
            <span class="label">DATA PACKETS</span>
            <span class="num">{{ dataPackets }}K</span>
          </div>
          <div class="footer-section">
            <span class="icon">◈</span>
            <span class="label">ERRORS</span>
            <span class="num err">{{ errorCount }}</span>
          </div>
          <div class="footer-section">
            <span class="icon">◉</span>
            <span class="label">UPTIME</span>
            <span class="num">{{ device.formatUptime(device.uptime) }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧面板列 -->
      <div class="right-column">
        <!-- 全球热点排行 -->
        <HudPanel title="Top Signals" subtitle="GLOBAL RANKING">
          <div class="rank-scroll-wrap">
            <div class="rank-list auto-scroll" :style="rankScrollStyle">
              <div
                v-for="(city, idx) in scrollCities"
                :key="idx + '_' + city.label"
                class="rank-item city-row"
                role="button"
                tabindex="0"
                :title="`Fly to ${city.label}`"
                :class="{ 'city-row-active': activeCityLabel === city.label }"
                @click="onTopCityClick(city.label)"
                @keyup.enter.prevent="onTopCityClick(city.label)"
              >
                <div class="rank-num">{{ String((idx % topCities.length) + 1).padStart(2, '0') }}</div>
                <div class="rank-info">
                  <div class="rank-name">{{ city.label }}</div>
                  <div class="rank-bar-bg">
                    <div
                      class="rank-bar-fill"
                      :style="{ width: city.value + '%' }"
                      :class="getRankColorClass(city.value)"
                    ></div>
                  </div>
                </div>
                <div class="rank-value">{{ city.value }}%</div>
              </div>
            </div>
          </div>
        </HudPanel>

        <!-- 事件日志 -->
        <HudPanel title="Event Log" subtitle="SYSTEM MESSAGES" status="ONLINE">
          <div class="event-log-wrap">
            <div class="event-log auto-scroll" :style="eventLogStyle">
              <div v-for="(event, idx) in scrollEvents" :key="idx + '_' + event.time" class="event-item" :class="'log-' + event.level">
                <span class="event-time">{{ event.time }}</span>
                <span class="event-level">{{ event.level }}</span>
                <span class="event-msg">{{ event.message }}</span>
              </div>
            </div>
          </div>
        </HudPanel>

        <!-- 网络状态 -->
        <HudPanel title="Network Status" subtitle="CONNECTION">
          <div class="net-status-grid">
            <div class="net-item">
              <span class="net-lbl">TYPE</span>
              <span class="net-val">{{ String(device.connectionType || 'unknown').toUpperCase() }}</span>
            </div>
            <div class="net-item">
              <span class="net-lbl">EFFECTIVE</span>
              <span class="net-val highlight">{{ String(device.effectiveType || 'unknown').toUpperCase() }}</span>
            </div>
            <div class="net-item">
              <span class="net-lbl">DOWNLINK</span>
              <span class="net-val">{{ device.downlink || 'N/A' }} Mbps</span>
            </div>
            <div class="net-item">
              <span class="net-lbl">RTT</span>
              <span class="net-val">{{ device.rtt }} ms</span>
            </div>
            <div class="net-item">
              <span class="net-lbl">SAVE DATA</span>
              <span class="net-val" :class="{ ok: !device.saveData, warn: device.saveData }">{{ device.saveData ? 'ENABLED' : 'DISABLED' }}</span>
            </div>
            <div class="net-item">
              <span class="net-lbl">ONLINE</span>
              <span class="net-val" :class="{ ok: device.online }">{{ device.online ? 'YES' : 'NO' }}</span>
            </div>
          </div>
        </HudPanel>

        <!-- 活跃连接 -->
        <HudPanel title="Active Connections" subtitle="REAL-TIME LINKS" status="LIVE">
          <div class="conn-list">
            <div v-for="(conn, idx) in connections" :key="idx" class="conn-item">
              <div class="conn-route">
                <span class="conn-from">{{ conn.from }}</span>
                <span class="conn-arrow">→</span>
                <span class="conn-to">{{ conn.to }}</span>
              </div>
              <div class="conn-meta">
                <span class="conn-proto">{{ conn.proto }}</span>
                <span class="conn-latency" :class="{ warn: conn.latency > 150 }">{{ conn.latency }}ms</span>
              </div>
            </div>
          </div>
        </HudPanel>
      </div>
    </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import HudPanel from './HudPanel.vue'
import DataRow from './DataRow.vue'
import PixelGlobe from './PixelGlobe.vue'
import CrtOverlay from './CrtOverlay.vue'
import { useScreenAdapter } from '../composables/useScreenAdapter'
import { useDeviceInfo } from '../composables/useDeviceInfo'
import { generateMockDataStream, type DataStream } from '../data/worldMapData'

// PixelGlobe 实例（用于调用 flyToCityByLabel）
const globeRef = ref<InstanceType<typeof PixelGlobe> | null>(null)
const activeCityLabel = ref<string | null>(null)
const device = reactive(useDeviceInfo())

// ========== GPU 名截断：去冗余前缀 + 去重复厂商 ==========
function truncateGPU(raw: string, maxLen: number = 28): string {
  if (!raw || raw === 'Unknown') return 'Unknown'
  let s = raw
    // ANGLE (Vendor, Renderer Direct3Dxx vs_x_y ps_x_y) / Google Inc. (ANGLE (..))：外层去括号一次
    .replace(/^Google Inc\.\s*\(\s*/i, '')
    .replace(/^ANGLE\s*\(\s*/i, '')
    // Direct3D 渲染后端描述（不强制前面有逗号，空格分隔也算）直到 ps_5_0 结尾/后接右括号
    .replace(/[,\s]+Direct3D\d+\s+vs_\d+_\d+\s+ps_\d+_\d+\b[^)]*/i, '')
    .replace(/\s*\)\s*$/i, '')
    // 可能还剩内层括号（嵌套 ANGLE → 再剥一层）
    .replace(/^ANGLE\s*\(\s*/i, '')
    .replace(/\s*\)\s*$/i, '')
    // "NVIDIA, NVIDIA GeForce..." / "Intel, Intel(R) UHD..." 重复厂商 → 保留一份
    .replace(/^([A-Za-z]{2,})[^A-Za-z]+?\1\s*(?:\([^)]*\)\s*)?/i, '$1 ')
    // Intel(R) Core → Intel Core 去 (R) (TM) 商标
    .replace(/\((R|TM|®|™)\)/gi, '')
    .replace(/®|™/g, '')
    // 收尾：括号没剥干净的（比如右括号残留）
    .replace(/[()]/g, '')
    // 收尾：商标删后留下的相邻空格压缩成单空格（避免 "Intel  Iris" 双空格）
    .replace(/\s{2,}/g, ' ')
  s = s.trim()
  if (!s) return raw
  // 允许到 maxLen（默认 28），长了截（中间段信息尽量保留芯片型号）
  if (s.length > maxLen) s = s.slice(0, maxLen - 1) + '…'
  return s
}

// ========== 地理位置：状态驱动 icon + 短文案（避免再截断成 "DENI"） ==========
const geoIcon = computed<string>(() => {
  const s = device.geoStatus
  if (s === 'GRANTED') return '✓'       // 绿勾
  if (s === 'DENIED') return '✕'        // 红叉
  if (s === 'TIMEOUT') return '⏱'       // 超时
  if (s === 'UNAVAILABLE') return '?'   // 不支持
  if (s === 'REQUESTING') return '◐'    // 半圈转（REQUESTING）
  return '○'                            // IDLE：空圈待点
})
const geoLocationDisplay = computed<string>(() => {
  const s = device.geoStatus
  // ponytail: 所有文案 ≤ 10 字，不再截断；具体说明交给 tooltip
  if (s === 'GRANTED') return String(device.geoCityLabel || 'GRANTED')
  if (s === 'REQUESTING') return 'AUTH…'
  if (s === 'DENIED') return 'LOCKED'
  if (s === 'TIMEOUT') return 'RETRY'
  if (s === 'UNAVAILABLE') return 'N/A'
  return 'ENABLE'
})
const geoLocationTooltip = computed<string>(() => {
  const s = device.geoStatus
  if (s === 'GRANTED') {
    const [lat, lng, acc] = [device.geoLat, device.geoLng, device.geoAccuracy]
    const coord = (lat !== null && lng !== null)
      ? `Lat ${Number(lat).toFixed(4)}°, Lng ${Number(lng).toFixed(4)}° ±${acc ?? '?'}m`
      : ''
    const city = String(device.geoCityLabel || '')
    return [city, coord].filter(Boolean).join(' · ') || 'GRANTED'
  }
  if (s === 'DENIED') return 'Permission DENIED. Click to RETRY after enabling Location in site settings.'
  if (s === 'TIMEOUT') return 'Request TIMED OUT. Click to RETRY.'
  if (s === 'UNAVAILABLE') return 'Geolocation API not available on this browser/device.'
  if (s === 'REQUESTING') return 'Waiting for user to grant location permission…'
  return 'Click to ENABLE location (used for nearest-city highlight on PixelGlobe).'
})

// ========== TIMEZONE：value 简化为 UTC+X，标题悬停看完整 IANA 名 ==========
const timezoneDisplay = computed<string>(() => {
  const off = Number(device.timezoneOffset || 0)
  const sign = off >= 0 ? '+' : '−'
  const abs = Math.abs(off)
  const h = Math.floor(abs)
  const m = Math.round((abs - h) * 60)
  const mm = String(m).padStart(2, '0')
  return `UTC${sign}${h}${m ? ':' + mm : ''}`
})
const timezoneFull = computed<string>(() => `${String(device.timezone || 'Unknown')} · ${timezoneDisplay.value}`)

function onLocationClick(): void {
  const s = device.geoStatus
  if (s === 'GRANTED' || s === 'REQUESTING') return
  device.refreshGeo()
}

// ========== 地理位置 → PixelGlobe 城市联动 ==========
let _lastGeoCity = ''
watch(
  // ponytail: reactive() 自动 unwrap 顶层 ref，不能再 .value
  () => [device.geoStatus, device.geoCityLabel] as const,
  ([status, label]) => {
    const lbl = String(label || '')
    if (status === 'GRANTED' && lbl && lbl !== 'Unknown' && lbl !== _lastGeoCity) {
      _lastGeoCity = lbl
      if (globeRef.value) {
        const ok = globeRef.value.flyToCityByLabel(lbl, 1800, 0.55)
        if (ok) activeCityLabel.value = lbl
      }
    }
  },
  { immediate: true }
)

/**
 * 点击 Top Signals 的城市：先清除上一个点击（弹框），再把地球相机 flyTo 对应城市 + 红色高亮（新覆盖旧高亮）
 * @param label 城市名（全大写）
 */
function onTopCityClick(label: string): void {
  if (!globeRef.value) return
  // 清空前一个点击态：详情弹卡、红色点、行选中
  globeRef.value.closeCityInfoCard()
  activeCityLabel.value = label
  // minDistance=260 基准下 zoomFactor=0.55 约等于更紧凑的城市级特写，与截图细节密度匹配
  globeRef.value.flyToCityByLabel(label, 1500, 0.55)
}

/**
 * 用户手动交互地球（拖拽/滚轮） → PixelGlobe 清除红色高亮并恢复自转，同时同步清除 Top Signals 行的红色选中态
 */
function onGlobeUserInteract(): void {
  activeCityLabel.value = null
}

// 大屏自适应
const { containerStyle, bgStyle } = useScreenAdapter()

// 生成固定的星星位置（避免每次渲染位置不同）
const starPositions: { x: string; y: string; s: number; d: number }[] = []
for (let i = 0; i < 100; i++) {
  starPositions.push({
    x: Math.random() * 100 + '%',
    y: Math.random() * 100 + '%',
    s: Math.random() > 0.85 ? 2 : 1,
    d: 2 + Math.random() * 4
  })
}

function getStarStyle(i: number) {
  const p = starPositions[i]
  if (!p) return {}
  return {
    left: p.x,
    top: p.y,
    width: p.s + 'px',
    height: p.s + 'px',
    animationDuration: p.d + 's'
  }
}

// 响应式数据
const dataStreams = ref<DataStream[]>([])
const currentRegion = ref('EASTERN HEMISPHERE')
const activeNodes = ref(247)
const totalNodes = ref(256)
const threatLevel = ref('LOW')
const lastSync = ref('00:00:00')
const activeTransmissions = ref(1847)
const dataPackets = ref(3847)
const errorCount = ref(12)

// 活跃连接数据
interface Connection {
  from: string
  to: string
  proto: string
  latency: number
}
const connections = ref<Connection[]>([
  { from: 'SFO-01', to: 'NYC-03', proto: 'QUANTUM', latency: 42 },
  { from: 'PEK-07', to: 'SHA-02', proto: 'FIBER', latency: 12 },
  { from: 'LDN-04', to: 'FRA-01', proto: 'QUANTUM', latency: 88 },
  { from: 'TYO-02', to: 'HKG-05', proto: 'SATELLITE', latency: 156 },
  { from: 'SYD-01', to: 'LA-08', proto: 'QUANTUM', latency: 210 },
  { from: 'MOS-03', to: 'IST-02', proto: 'FIBER', latency: 74 },
  { from: 'SAO-04', to: 'MEX-01', proto: 'QUANTUM', latency: 198 },
])

const threatClass = computed(() => {
  if (threatLevel.value === 'LOW') return 'threat-low'
  if (threatLevel.value === 'GUARDED') return 'threat-guarded'
  if (threatLevel.value === 'ELEVATED') return 'threat-elevated'
  return 'threat-high'
})

// 事件日志
interface LogEvent {
  time: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'SYNC'
  message: string
}

const events = ref<LogEvent[]>([
  { time: '14:32:07', level: 'SYNC', message: 'Global node sync completed' },
  { time: '14:31:45', level: 'INFO', message: 'Satellite SAT-02 telemetry active' },
  { time: '14:30:22', level: 'WARN', message: 'Node BETA signal degradation' },
  { time: '14:28:15', level: 'INFO', message: 'Firewall rules updated' },
  { time: '14:25:03', level: 'SYNC', message: 'Data packet relay optimized' },
  { time: '14:22:47', level: 'ERROR', message: 'Packet loss detected: 0.3%' },
  { time: '14:20:12', level: 'INFO', message: 'System health check: PASS' },
  { time: '14:18:33', level: 'INFO', message: 'Encryption layer re-initialized' },
])

// Top城市
const topCities = computed(() => {
  const cities = [
    { label: 'SAN FRANCISCO', value: 97 },
    { label: 'NEW YORK', value: 94 },
    { label: 'BEIJING', value: 98 },
    { label: 'SHANGHAI', value: 95 },
    { label: 'TOKYO', value: 92 },
    { label: 'LONDON', value: 89 },
    { label: 'HONG KONG', value: 88 },
    { label: 'SINGAPORE', value: 87 },
  ]
  return cities.sort((a, b) => b.value - a.value)
})

// Top Signals - 复制两份实现无缝滚动（与 Event Log 同效果）
const scrollCities = computed(() => [...topCities.value, ...topCities.value])
const rankScrollStyle = computed(() => {
  const count = topCities.value.length * 2
  const duration = Math.max(12, count * 1.0)
  return { animationDuration: duration + 's' }
})

function getRankColorClass(value: number) {
  if (value >= 95) return 'critical'
  if (value >= 90) return 'high'
  if (value >= 85) return 'medium'
  return 'low'
}

// ========== 自动滚动逻辑 ==========
// 数据流列表 - 复制两份以实现无缝滚动
const scrollStreams = computed(() => [...dataStreams.value, ...dataStreams.value])
const dataListStyle = computed(() => {
  const count = dataStreams.value.length * 2
  // 每个条目约0.8秒，最小8秒
  const duration = Math.max(8, count * 0.8)
  return { animationDuration: duration + 's' }
})

// 事件日志 - 复制两份实现无缝滚动
const scrollEvents = computed(() => [...events.value, ...events.value])
const eventLogStyle = computed(() => {
  const count = events.value.length * 2
  // 每个条目约1.2秒，最小10秒
  const duration = Math.max(10, count * 1.2)
  return { animationDuration: duration + 's' }
})

// 定时更新
let updateTimer: number

function tick() {
  dataStreams.value = generateMockDataStream()
  
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  lastSync.value = `${h}:${m}:${s}`
  
  activeTransmissions.value = 1800 + Math.floor(Math.random() * 200)
  dataPackets.value = 3800 + Math.floor(Math.random() * 200)
  errorCount.value = Math.floor(Math.random() * 15)
  activeNodes.value = 240 + Math.floor(Math.random() * 16)
  
  if (Math.random() > 0.7) {
    const regions = ['EASTERN HEMISPHERE', 'WESTERN HEMISPHERE', 'NORTH PACIFIC', 'ATLANTIC SECTOR', 'ASIA-PACIFIC']
    currentRegion.value = regions[Math.floor(Math.random() * regions.length)]
  }
  
  const threats = ['LOW', 'GUARDED', 'ELEVATED', 'HIGH']
  const rand = Math.random()
  threatLevel.value = rand > 0.92 ? threats[Math.floor(Math.random() * threats.length)] : 'LOW'

  // 更新连接延迟（模拟波动）
  connections.value = connections.value.map(c => ({
    ...c,
    latency: Math.max(5, c.latency + Math.floor((Math.random() - 0.5) * 30))
  }))
}

onMounted(() => {
  tick()
  updateTimer = window.setInterval(tick, 2000)
})

onBeforeUnmount(() => {
  clearInterval(updateTimer)
})
</script>

<style scoped>
/* #screen-root: fixed 全屏，纯黑底，承载留黑边区域 */
#screen-root {
  position: fixed;
  inset: 0;
  background: #000;
  overflow: hidden;
}

/* #screen-wrapper: 宽度固定1920，高度动态(由方案A算出)，等比scale铺满 */
/* 内边距 = 上下栏高度(32/26) + 统一间距6px，使内容与栏之间的距离和左右面板gap一致 */
#screen-wrapper {
  width: 1920px;
  transform-origin: left top;
  will-change: transform;
  z-index: 2;
  display: flex;
  flex-direction: column;
  padding: 38px 6px 32px;
  box-sizing: border-box;
}

/* 全屏背景层（星场 + 径向光，位于地球之上） */
.dash-bg {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: transparent;
  overflow: hidden;
  pointer-events: none;
}

.starfield {
  position: absolute;
  inset: 0;
}

.star {
  position: absolute;
  background: rgba(255, 140, 0, 0.5);
  border-radius: 50%;
  animation: star-twinkle 3s ease-in-out infinite;
}

@keyframes star-twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

.radial-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(255, 68, 0, 0.1) 0%,
    rgba(255, 68, 0, 0.05) 30%,
    rgba(0, 0, 0, 0) 70%
  );
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 290px;
  grid-template-rows: 1fr;
  gap: 6px;
  z-index: 5;
  min-height: 0;
  overflow: hidden;
}

.left-column, .right-column {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  min-height: 0;
  /* 让子面板通过 flex:1 自动分配空间 */
}

/* 左侧面板：Device Info 自适应内容，Data Streams 填充剩余 */
.left-column > :deep(.hud-panel) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.left-column > :deep(.hud-panel:nth-child(1)) {
  flex: 0 0 auto;
}

.left-column > :deep(.hud-panel:nth-child(2)) {
  flex: 1;
}

/* 右侧面板：Top Signals / Network Status / Active Connections 按内容自适应，Event Log 弹性占满剩余 */
.right-column > :deep(.hud-panel) {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.right-column > :deep(.hud-panel:first-child),
.right-column > :deep(.hud-panel:nth-child(3)),
.right-column > :deep(.hud-panel:last-child) {
  flex: 0 0 auto;
}

.right-column > :deep(.hud-panel:nth-child(2)) {
  flex: 1;
}

.right-column {
  justify-content: flex-start;
}

.center-column {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  /* 透明背景，露出背景地球 */
  background: transparent;
}

/* 地图交互区域样式（合并在下方 .map-wrapper 定义） - 保留结构 */
/* (样式合并到下文 .map-wrapper) */

.globe-interact-zone {
  position: absolute;
  inset: 0;
  background: transparent;
  cursor: pointer;
  z-index: 5;
}

.globe-interact-zone:active {
  cursor: pointer;
}

/* 隐藏滚动条但保留功能 */
.left-column::-webkit-scrollbar,
.right-column::-webkit-scrollbar {
  width: 3px;
}

.left-column::-webkit-scrollbar-track,
.right-column::-webkit-scrollbar-track {
  background: rgba(255, 140, 0, 0.05);
}

.left-column::-webkit-scrollbar-thumb,
.right-column::-webkit-scrollbar-thumb {
  background: rgba(255, 140, 0, 0.3);
}

/* 设备信息面板 */
.device-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.dev-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(255, 140, 0, 0.03);
  border: 1px solid rgba(255, 140, 0, 0.08);
  font-size: 12px;
}

.dev-icon {
  color: #FF6B00;
  font-size: 12px;
  width: 14px;
  text-align: center;
}

.dev-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dev-lbl {
  font-size: 11px;
  color: rgba(255, 179, 71, 0.5);
  letter-spacing: 1px;
}

.dev-val {
  font-size: 14px;
  color: #FFB347;
  font-weight: bold;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dev-item.warn .dev-val {
  color: #FF4500;
  text-shadow: 0 0 6px rgba(255, 69, 0, 0.5);
}

.dev-val.ok {
  color: #00FF88;
  text-shadow: 0 0 6px rgba(0, 255, 136, 0.45);
}
.dev-val.geo-btn {
  text-decoration: underline;
  text-decoration-color: rgba(255, 179, 71, 0.45);
  text-underline-offset: 2px;
  cursor: pointer;
}
.dev-val.geo-btn:hover {
  color: #FFD166;
  text-shadow: 0 0 8px rgba(255, 140, 0, 0.5);
}

/* GPU 名称字体小一号 + 允许 2 行显示（长显卡型号不再过早省略号） */
.dev-val.small {
  font-size: 12px;
  line-height: 1.2;
  letter-spacing: 0.3px;
  white-space: normal;
  word-break: break-all;
}

/* Location 图标按状态配色，一眼能看出权限状态 */
.dev-icon.ok    { color: #00FF88; text-shadow: 0 0 6px rgba(0, 255, 136, 0.6); }
.dev-icon.fail  { color: #FF4500; text-shadow: 0 0 6px rgba(255, 69, 0, 0.6);  animation: blink-warn 1.6s steps(1,end) infinite; }
.dev-icon.ask   { color: #FFB347; }

/* 权限被拒/超时时的图标慢闪（视觉提醒但不抢 CRT 主色） */
@keyframes blink-warn {
  0%, 60% { opacity: 1; }
  61%, 100% { opacity: 0.35; }
}

/* 实时指标 */
.live-metrics {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 140, 0, 0.1);
}

.lm-row {
  display: grid;
  grid-template-columns: 70px 1fr 50px;
  gap: 8px;
  align-items: center;
  font-size: 11px;
}

.lm-lbl {
  color: rgba(255, 179, 71, 0.6);
  letter-spacing: 1px;
}

.lm-bar {
  height: 6px;
  background: rgba(255, 140, 0, 0.1);
  border: 1px solid rgba(255, 140, 0, 0.15);
}

.lm-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B00, #FF8C00);
  box-shadow: 0 0 6px rgba(255, 107, 0, 0.4);
  transition: width 0.5s ease;
}

.lm-fill.mem {
  background: linear-gradient(90deg, #FF8C00, #FFB347);
}

.lm-fill.net {
  background: linear-gradient(90deg, #00BFFF, #00FF88);
  box-shadow: 0 0 6px rgba(0, 191, 255, 0.4);
}

.lm-fill.warn {
  background: linear-gradient(90deg, #FF4500, #FF6B00);
  box-shadow: 0 0 6px rgba(255, 69, 0, 0.5);
}

.lm-val {
  text-align: right;
  color: #FFB347;
  font-size: 12px;
  letter-spacing: 0.5px;
}

/* 数据流列表 - 自动滚动，充满容器 */
.data-list-wrap {
  position: relative;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.data-list-wrap::before,
.data-list-wrap::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 16px;
  z-index: 2;
  pointer-events: none;
}

.data-list-wrap::before {
  top: 0;
  background: linear-gradient(180deg, rgba(10, 5, 0, 0.95), transparent);
}

.data-list-wrap::after {
  bottom: 0;
  background: linear-gradient(0deg, rgba(10, 5, 0, 0.95), transparent);
}

.data-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.auto-scroll {
  animation: scroll-up linear infinite;
}

@keyframes scroll-up {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

/* 事件日志 - 自动滚动 */
.event-log-wrap {
  position: relative;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.event-log-wrap::before,
.event-log-wrap::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 14px;
  z-index: 2;
  pointer-events: none;
}

.event-log-wrap::before {
  top: 0;
  background: linear-gradient(180deg, rgba(10, 5, 0, 0.95), transparent);
}

.event-log-wrap::after {
  bottom: 0;
  background: linear-gradient(0deg, rgba(10, 5, 0, 0.95), transparent);
}

/* 地图头部信息 */
.map-header {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: rgba(255, 140, 0, 0.15);
  border: 1px solid rgba(255, 140, 0, 0.3);
}

.header-section {
  background: rgba(10, 5, 0, 0.65);
  backdrop-filter: blur(2px);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-section .label {
  font-size: 11px;
  color: rgba(255, 179, 71, 0.5);
  letter-spacing: 2px;
}

.header-section .value {
  font-size: 17px;
  color: #FF8C00;
  font-weight: bold;
  letter-spacing: 2px;
  text-shadow: 0 0 8px rgba(255, 140, 0, 0.4);
}

.value.threat-low { color: #00FF88; text-shadow: 0 0 6px rgba(0, 255, 136, 0.4); }
.value.threat-guarded { color: #FFB347; }
.value.threat-elevated { color: #FF8C00; }
.value.threat-high { color: #FF4500; text-shadow: 0 0 8px rgba(255, 69, 0, 0.5); }

/* 地图包装器 - 透明，露出背景地球，无边框 */
.map-wrapper {
  flex: 1;
  min-height: 0;
  border: none;
  background: transparent;
  position: relative;
  overflow: hidden;
}

/* 地图底部信息栏 */
.map-footer {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: rgba(255, 140, 0, 0.2);
  border: 1px solid rgba(255, 140, 0, 0.3);
}

.footer-section {
  background: rgba(10, 5, 0, 0.65);
  backdrop-filter: blur(2px);
  padding: 9px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-section .icon {
  color: #FF6B00;
  font-size: 12px;
  text-shadow: 0 0 6px rgba(255, 107, 0, 0.5);
}

.footer-section .label {
  font-size: 11px;
  color: rgba(255, 179, 71, 0.6);
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.footer-section .num {
  margin-left: auto;
  font-size: 16px;
  color: #FF8C00;
  font-weight: bold;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(255, 140, 0, 0.4);
}

.footer-section .num.err {
  color: #FF4500;
}

/* 排行榜 */
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rank-item {
  display: grid;
  grid-template-columns: 22px 1fr 32px;
  gap: 8px;
  align-items: center;
}

/* Top Signals 列表：自动滚动外层（与 Event Log 同效果） */
.rank-scroll-wrap {
  position: relative;
  overflow: hidden;
  max-height: 168px;
}
/* hover 时暂停滚动，方便点击城市行 */
.rank-scroll-wrap:hover .rank-list.auto-scroll {
  animation-play-state: paused;
}

/* Top Signals 城市行：点击 flyTo 地球 */
.city-row {
  pointer-events: auto;
  cursor: pointer;
  padding: 4px 6px;
  margin: 2px -6px;
  border: 1px solid transparent;
  border-radius: 3px;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
  user-select: none;
}
.city-row:hover {
  background: rgba(255, 140, 0, 0.12);
  border-color: rgba(255, 140, 0, 0.45);
  box-shadow: inset 0 0 12px rgba(255, 140, 0, 0.08);
}
.city-row:hover .rank-name {
  color: #FFD166;
  text-shadow: 0 0 8px rgba(255, 140, 0, 0.45);
}
.city-row:active {
  background: rgba(255, 140, 0, 0.22);
}

/* 选中态：红色高亮（与 3D 城市标记匹配） */
.city-row-active {
  background: rgba(255, 30, 30, 0.16);
  border-color: rgba(255, 60, 60, 0.75);
  box-shadow: inset 0 0 14px rgba(255, 40, 40, 0.18), 0 0 8px rgba(255, 40, 40, 0.25);
}
.city-row-active .rank-num {
  color: #FF4A4A;
  text-shadow: 0 0 6px rgba(255, 40, 40, 0.7);
}
.city-row-active .rank-name {
  color: #FF6464;
  text-shadow: 0 0 8px rgba(255, 40, 40, 0.7);
}
.city-row-active .rank-value {
  color: #FF8C8C;
}

.rank-num {
  font-size: 12px;
  color: rgba(255, 179, 71, 0.5);
  letter-spacing: 1px;
}

.rank-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rank-name {
  font-size: 11px;
  color: rgba(255, 179, 71, 0.9);
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-bar-bg {
  height: 4px;
  background: rgba(255, 140, 0, 0.15);
  overflow: hidden;
}

.rank-bar-fill {
  height: 100%;
  transition: width 0.5s ease;
  box-shadow: 0 0 4px currentColor;
}

.rank-bar-fill.critical { background: #FF4500; color: #FF4500; }
.rank-bar-fill.high { background: #FF6B00; color: #FF6B00; }
.rank-bar-fill.medium { background: #FF8C00; color: #FF8C00; }
.rank-bar-fill.low { background: #FFB347; color: #FFB347; }

.rank-value {
  font-size: 12px;
  color: #FFB347;
  text-align: right;
  letter-spacing: 1px;
}

/* 事件日志 */
.event-log {
  display: flex;
  flex-direction: column;
  gap: 3px;
  height: 100%;
}

.event-item {
  display: grid;
  grid-template-columns: 56px 40px 1fr;
  gap: 6px;
  align-items: baseline;
  padding: 3px 0;
  border-bottom: 1px solid rgba(255, 140, 0, 0.05);
  font-size: 11px;
}

.event-time {
  color: rgba(255, 179, 71, 0.4);
  letter-spacing: 0.5px;
}

.event-level {
  letter-spacing: 1px;
  font-weight: bold;
  font-size: 11px;
}

.log-INFO .event-level { color: #00FF88; }
.log-WARN .event-level { color: #FF8C00; }
.log-ERROR .event-level { color: #FF4500; }
.log-SYNC .event-level { color: #00BFFF; }

.event-msg {
  color: rgba(255, 179, 71, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
}

/* 网络状态 */
.net-status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.net-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  background: rgba(255, 140, 0, 0.03);
  border: 1px solid rgba(255, 140, 0, 0.08);
  font-size: 12px;
}

.net-lbl {
  font-size: 11px;
  color: rgba(255, 179, 71, 0.5);
  letter-spacing: 1px;
}

.net-val {
  font-size: 15px;
  color: #FFB347;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.net-val.highlight {
  color: #FF8C00;
}

.net-val.ok {
  color: #00FF88;
  text-shadow: 0 0 6px rgba(0, 255, 136, 0.4);
}

.net-val.warn {
  color: #FF6B00;
}

/* 活跃连接列表 */
.conn-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
}

.conn-list::-webkit-scrollbar { width: 3px; }
.conn-list::-webkit-scrollbar-thumb { background: rgba(255, 140, 0, 0.3); }

.conn-item {
  padding: 5px 8px;
  background: rgba(255, 140, 0, 0.03);
  border-left: 2px solid rgba(255, 140, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11px;
}

.conn-route {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 179, 71, 0.9);
  font-weight: bold;
  letter-spacing: 0.5px;
}

.conn-arrow {
  color: #FF8C00;
  font-size: 10px;
}

.conn-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
}

.conn-proto {
  color: rgba(255, 179, 71, 0.5);
  letter-spacing: 1px;
}

.conn-latency {
  color: #00FF88;
  letter-spacing: 0.5px;
}

.conn-latency.warn {
  color: #FF6B00;
}

/* 角落装饰 */
.deco-corners {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}

.corner {
  position: absolute;
  width: 32px;
  height: 32px;
}

.corner.tl { top: 4px; left: 4px; }
.corner.tr { top: 4px; right: 4px; }
.corner.bl { bottom: 4px; left: 4px; }
.corner.br { bottom: 4px; right: 4px; }

.corner-line-h {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, rgba(255, 140, 0, 0.8), rgba(255, 140, 0, 0.2));
}

.corner.tr .corner-line-h,
.corner.br .corner-line-h {
  background: linear-gradient(270deg, rgba(255, 140, 0, 0.8), rgba(255, 140, 0, 0.2));
}

.corner-line-v {
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 140, 0, 0.8), rgba(255, 140, 0, 0.2));
}

.corner.bl .corner-line-v,
.corner.br .corner-line-v {
  background: linear-gradient(0deg, rgba(255, 140, 0, 0.8), rgba(255, 140, 0, 0.2));
}

.corner.tr .corner-line-v,
.corner.br .corner-line-v {
  right: 0;
  left: auto;
}
</style>