<template>
  <div class="crt-overlay">
    <!-- CRT扫描线效果 -->
    <div class="scanlines"></div>
    
    <!-- 噪点纹理 -->
    <div class="noise"></div>
    
    <!-- 暗角效果 -->
    <div class="vignette"></div>
    
    <!-- 屏幕边缘光晕 -->
    <div class="edge-glow"></div>
    
    <!-- 顶部状态栏 -->
    <div class="top-bar">
      <div class="bar-left">
        <span class="brand">MACHINA.EX.DEO</span>
        <span class="divider">//</span>
        <span class="section">{{ section }}</span>
      </div>
      <div class="bar-center">
        <div class="system-time">
          <span class="time-label">SYS_TIME</span>
          <span class="time-value">{{ currentTime }}</span>
        </div>
      </div>
      <div class="bar-right">
        <div class="connection-status">
          <span class="conn-dot" :class="{ active: isOnline }"></span>
          <span class="conn-text">{{ isOnline ? 'CONNECTION ACTIVE' : 'OFFLINE' }}</span>
        </div>
        <span class="divider">//</span>
        <span class="session-id">SESS: {{ sessionId }}</span>
      </div>
    </div>
    
    <!-- 底部状态栏 -->
    <div class="bottom-bar">
      <div class="bar-segment">
        <span class="seg-label">CPU</span>
        <div class="seg-bar">
          <div class="seg-fill" :style="{ width: cpuUsage + '%' }" :class="{ warn: cpuUsage > 70 }"></div>
        </div>
        <span class="seg-val">{{ cpuUsage }}%</span>
      </div>
      <div class="bar-segment">
        <span class="seg-label">MEM</span>
        <div class="seg-bar">
          <div class="seg-fill mem" :style="{ width: memUsage + '%' }"></div>
        </div>
        <span class="seg-val">{{ memUsage }}%</span>
      </div>
      <div class="bar-segment">
        <span class="seg-label">NET</span>
        <span class="seg-val net">{{ effectiveType }}</span>
      </div>
      <div class="bar-segment">
        <span class="seg-label">LAT</span>
        <span class="seg-val">{{ rtt }}ms</span>
      </div>
      <div class="bar-segment">
        <span class="seg-label">TEMP</span>
        <span class="seg-val" :class="{ warn: cpuTemp > 70 }">{{ cpuTemp }}°C</span>
      </div>
      <div class="bar-segment">
        <span class="seg-label">BAT</span>
        <span class="seg-val">{{ batteryLevel }}%</span>
        <span class="charging-ind" v-if="batteryCharging">⚡</span>
      </div>
      <div class="bar-segment">
        <span class="seg-label">FPS</span>
        <span class="seg-val fps" :class="{ warn: fps < 45, crit: fps < 25 }">{{ fps }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  section?: string
  isOnline?: boolean
  cpuTemp?: number
  cpuUsage?: number
  memUsage?: number
  batteryLevel?: number
  batteryCharging?: boolean
  connectionType?: string
  effectiveType?: string
  rtt?: number
  fps?: number
}>(), {
  section: 'GLOBAL NETWORK MAP',
  isOnline: true,
  cpuTemp: 45,
  cpuUsage: 30,
  memUsage: 50,
  batteryLevel: 80,
  batteryCharging: false,
  connectionType: 'unknown',
  effectiveType: 'unknown',
  rtt: 0,
  fps: 60
})

const currentTime = ref('')
const sessionId = ref('')

let timer: number

function updateTime() {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${h}:${m}:${s}`
}

onMounted(() => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  for (let i = 0; i < 6; i++) {
    sessionId.value += chars[Math.floor(Math.random() * chars.length)]
  }
  
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onBeforeUnmount(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.crt-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  font-family: 'Share Tech Mono', 'Courier New', monospace;
}

/* 扫描线效果 */
.scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
  pointer-events: none;
}

/* 噪点效果 */
.noise {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  pointer-events: none;
}

/* 暗角 */
.vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 50%,
    rgba(0, 0, 0, 0.4) 100%
  );
  pointer-events: none;
}

/* 边缘光晕 */
.edge-glow {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 60px rgba(255, 140, 0, 0.08);
  pointer-events: none;
}

/* 顶部状态栏 */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: linear-gradient(
    180deg,
    rgba(10, 5, 0, 0.7) 0%,
    rgba(10, 5, 0, 0.7) 100%
  );
  backdrop-filter: blur(3px);
  border-bottom: 1px solid rgba(255, 140, 0, 0.3);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 12px;
  pointer-events: auto;
  z-index: 10;
}

.bar-left, .bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.bar-right {
  justify-content: flex-end;
}

.brand {
  color: #FF6B00;
  font-weight: bold;
  letter-spacing: 3px;
  text-shadow: 0 0 10px rgba(255, 107, 0, 0.5);
}

.section {
  color: #FFB347;
  letter-spacing: 2px;
}

.divider {
  color: rgba(255, 140, 0, 0.3);
}

.system-time {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-label {
  color: rgba(255, 179, 71, 0.5);
  letter-spacing: 2px;
  font-size: 12px;
}

.time-value {
  color: #FF8C00;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 3px;
  text-shadow: 0 0 10px rgba(255, 140, 0, 0.6);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.conn-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #666;
}

.conn-dot.active {
  background: #00FF88;
  box-shadow: 0 0 8px #00FF88;
  animation: conn-pulse 2s ease-in-out infinite;
}

@keyframes conn-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.conn-text {
  color: rgba(255, 179, 71, 0.6);
  letter-spacing: 1px;
}

.session-id {
  color: rgba(255, 179, 71, 0.5);
  letter-spacing: 1px;
}

/* 底部状态栏 */
.bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 26px;
  background: linear-gradient(
    0deg,
    rgba(10, 5, 0, 0.7) 0%,
    rgba(10, 5, 0, 0.7) 100%
  );
  backdrop-filter: blur(3px);
  border-top: 1px solid rgba(255, 140, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 0 12px;
  pointer-events: auto;
  z-index: 10;
}

.bar-segment {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.seg-label {
  color: rgba(255, 179, 71, 0.6);
  letter-spacing: 1px;
}

.seg-bar {
  width: 60px;
  height: 6px;
  background: rgba(255, 140, 0, 0.1);
  border: 1px solid rgba(255, 140, 0, 0.2);
}

.seg-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B00, #FF8C00);
  transition: width 0.5s ease;
  box-shadow: 0 0 8px rgba(255, 140, 0, 0.5);
}

.seg-fill.mem {
  background: linear-gradient(90deg, #FF8C00, #FFB347);
}

.seg-fill.warn {
  background: linear-gradient(90deg, #FF4500, #FF6B00);
  box-shadow: 0 0 8px rgba(255, 69, 0, 0.5);
}

.seg-val {
  color: #FFB347;
  letter-spacing: 0.5px;
  min-width: 32px;
}

.seg-val.net {
  color: #00FF88;
  text-transform: uppercase;
}

.seg-val.warn {
  color: #FF4500;
  text-shadow: 0 0 6px rgba(255, 69, 0, 0.5);
}

.seg-val.fps {
  color: #00FF88;
  font-weight: bold;
  text-shadow: 0 0 6px rgba(0, 255, 136, 0.4);
}
.seg-val.fps.warn {
  color: #FFB347;
  text-shadow: 0 0 6px rgba(255, 179, 71, 0.5);
}
.seg-val.fps.crit {
  color: #FF4500;
  text-shadow: 0 0 8px rgba(255, 69, 0, 0.6);
  animation: conn-pulse 0.8s ease-in-out infinite;
}

.charging-ind {
  color: #FFD700;
  font-size: 13px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>