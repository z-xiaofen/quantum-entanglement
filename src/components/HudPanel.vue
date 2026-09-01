<template>
  <div class="hud-panel" :class="{ 'panel-glow': glow }">
    <div class="panel-header">
      <div class="header-left">
        <div class="header-icon" v-if="icon">
          <span v-html="icon"></span>
        </div>
        <span class="panel-title">{{ title }}</span>
      </div>
      <div class="header-right">
        <span v-if="subtitle" class="panel-subtitle">{{ subtitle }}</span>
        <span v-if="status" class="status-indicator" :class="'status-' + status">
          <span class="status-dot"></span>
          {{ status }}
        </span>
      </div>
    </div>
    <div class="panel-body">
      <slot></slot>
    </div>
    <!-- 底部装饰线 -->
    <div class="panel-decoration">
      <span class="deco-line"></span>
      <span class="deco-node"></span>
      <span class="deco-line"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  status?: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'SYNCING'
  icon?: string
  glow?: boolean
}>()
</script>

<style scoped>
.hud-panel {
  background: linear-gradient(
    180deg,
    rgba(25, 12, 0, 0.7) 0%,
    rgba(15, 8, 0, 0.7) 100%
  );
  border: 1px solid rgba(255, 140, 0, 0.25);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(3px);
}

.hud-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 140, 0, 0.6),
    transparent
  );
}

.hud-panel::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 107, 0, 0.3),
    transparent
  );
}

.panel-glow {
  box-shadow:
    0 0 20px rgba(255, 140, 0, 0.15),
    inset 0 0 30px rgba(255, 140, 0, 0.03);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 140, 0, 0.2);
  background: linear-gradient(
    90deg,
    rgba(255, 140, 0, 0.08) 0%,
    transparent 100%
  );
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FF8C00;
  font-size: 14px;
}

.panel-title {
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  font-size: 15px;
  font-weight: bold;
  color: #FF8C00;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-subtitle {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  color: rgba(255, 179, 71, 0.6);
  letter-spacing: 1px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FF4500;
}

.status-ONLINE .status-dot {
  background: #00FF88;
  box-shadow: 0 0 8px #00FF88;
  animation: pulse-dot 2s ease-in-out infinite;
}

.status-ONLINE {
  color: #00FF88;
}

.status-OFFLINE .status-dot {
  background: #666;
}

.status-OFFLINE {
  color: #666;
}

.status-WARNING .status-dot {
  background: #FF6B00;
  box-shadow: 0 0 8px #FF6B00;
  animation: blink-dot 1s step-end infinite;
}

.status-WARNING {
  color: #FF6B00;
}

.status-SYNCING .status-dot {
  background: #FFB347;
  box-shadow: 0 0 8px #FFB347;
  animation: pulse-dot 1s ease-in-out infinite;
}

.status-SYNCING {
  color: #FFB347;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes blink-dot {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.2; }
}

.panel-body {
  padding: 8px 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.panel-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 140, 0, 0.1);
}

.deco-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 140, 0, 0.4),
    transparent
  );
}

.deco-node {
  width: 4px;
  height: 4px;
  background: #FF8C00;
  border-radius: 50%;
  box-shadow: 0 0 6px #FF8C00;
}
</style>
