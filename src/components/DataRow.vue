<template>
  <div class="data-row" :class="{ 'row-active': active, 'row-warning': warning }">
    <div class="row-index">{{ index }}</div>
    <div class="row-main">
      <div class="row-label">{{ label }}</div>
      <div class="row-sub">{{ sub }}</div>
    </div>
    <div class="row-value">
      <span class="value-num" :class="{ 'val-high': warning }">{{ value }}</span>
      <span class="value-unit" v-if="unit">{{ unit }}</span>
    </div>
    <div class="row-trend" v-if="showTrend">
      <span class="trend-arrow" :class="trendClass">{{ trendArrow }}</span>
      <span class="trend-val" :class="trendClass">{{ trendAbs }}</span>
    </div>
    <div class="row-status">
      <span class="status-tag" :class="'tag-' + status">{{ status }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  index: string | number
  label: string
  sub?: string
  value: string | number
  unit?: string
  trend?: number
  status?: 'ACTIVE' | 'IDLE' | 'WARNING' | 'SYNCING'
  active?: boolean
  warning?: boolean
  showTrend?: boolean
}>(), {
  status: 'ACTIVE',
  active: false,
  warning: false,
  showTrend: true
})

const trendClass = computed(() => {
  if (props.trend === undefined) return ''
  if (props.trend > 0) return 'trend-up'
  if (props.trend < 0) return 'trend-down'
  return 'trend-flat'
})

const trendArrow = computed(() => {
  if (props.trend === undefined) return ''
  if (props.trend > 0) return '▲'
  if (props.trend < 0) return '▼'
  return '■'
})

const trendAbs = computed(() => {
  if (props.trend === undefined) return ''
  return Math.abs(props.trend).toFixed(1)
})
</script>

<style scoped>
.data-row {
  display: grid;
  grid-template-columns: 18px 1fr 40px 36px 52px;
  gap: 4px;
  align-items: center;
  padding: 6px 6px;
  border-bottom: 1px solid rgba(255, 140, 0, 0.06);
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  font-size: 12px;
  transition: all 0.3s ease;
  min-width: 0;
}

.data-row:last-child {
  border-bottom: none;
}

.row-active {
  background: rgba(255, 140, 0, 0.05);
}

.row-warning {
  background: rgba(255, 69, 0, 0.08);
}

.row-warning .value-num {
  color: #FF4500;
  text-shadow: 0 0 8px rgba(255, 69, 0, 0.5);
}

.row-index {
  font-size: 10px;
  color: rgba(255, 179, 71, 0.45);
  letter-spacing: 0.5px;
  justify-self: start;
  min-width: 0;
}

.row-main {
  min-width: 0;
  overflow: hidden;
}

.row-label {
  color: rgba(255, 179, 71, 0.9);
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.row-sub {
  font-size: 10px;
  color: rgba(255, 179, 71, 0.4);
  margin-top: 1px;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.1;
}

.row-value {
  display: flex;
  align-items: baseline;
  gap: 2px;
  justify-self: end;
  width: 100%;
  text-align: right;
  min-width: 0;
}

.value-num {
  color: #FFB347;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 0.5px;
  text-shadow: 0 0 6px rgba(255, 140, 0, 0.3);
}

.val-high {
  color: #FF6B00;
}

.value-unit {
  font-size: 9px;
  color: rgba(255, 179, 71, 0.5);
  letter-spacing: 0.3px;
}

.row-trend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  font-size: 11px;
  width: 100%;
  text-align: right;
  min-width: 0;
}

.trend-up {
  color: #00FF88;
}

.trend-down {
  color: #FF6B00;
}

.trend-flat {
  color: rgba(255, 179, 71, 0.5);
}

.trend-arrow {
  font-size: 9px;
}

.trend-val {
  letter-spacing: 0.3px;
  font-size: 11px;
}

.row-status {
  text-align: right;
  justify-self: end;
  width: 100%;
  min-width: 0;
}

.status-tag {
  font-size: 9px;
  padding: 2px 4px;
  border: 1px solid;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.tag-ACTIVE {
  color: #00FF88;
  border-color: rgba(0, 255, 136, 0.4);
  background: rgba(0, 255, 136, 0.08);
}

.tag-IDLE {
  color: rgba(255, 179, 71, 0.6);
  border-color: rgba(255, 179, 71, 0.3);
  background: rgba(255, 179, 71, 0.05);
}

.tag-WARNING {
  color: #FF6B00;
  border-color: rgba(255, 107, 0, 0.5);
  background: rgba(255, 107, 0, 0.1);
  animation: tag-blink 1s step-end infinite;
}

.tag-SYNCING {
  color: #FFB347;
  border-color: rgba(255, 179, 71, 0.5);
  background: rgba(255, 179, 71, 0.1);
}

@keyframes tag-blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.4; }
}
</style>
