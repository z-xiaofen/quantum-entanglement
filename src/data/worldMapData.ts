// 世界地图数据 - 多边形轮廓用于像素化渲染
// 每个大陆用多边形轮廓点表示（按逆时针方向）

export interface MapPoint {
  id: string
  lat: number
  lng: number
  label?: string
  value?: number
}

export interface MapPolygon {
  name: string
  points: MapPoint[]
}

// 城市热点数据 - 全球主要城市
export const cityHotspots: MapPoint[] = [
  { id: 'bj',  lat: 39.9,  lng: 116.4,  label: 'BEIJING',        value: 98 },
  { id: 'sh',  lat: 31.2,  lng: 121.5,  label: 'SHANGHAI',       value: 95 },
  { id: 'hk',  lat: 22.3,  lng: 114.2,  label: 'HONG KONG',      value: 88 },
  { id: 'ty',  lat: 35.7,  lng: 139.7,  label: 'TOKYO',          value: 92 },
  { id: 'sf',  lat: 37.8,  lng: -122.4, label: 'SAN FRANCISCO',  value: 90 },
  { id: 'ny',  lat: 40.7,  lng: -74.0,  label: 'NEW YORK',       value: 94 },
  { id: 'lon', lat: 51.5,  lng: -0.1,   label: 'LONDON',         value: 89 },
  { id: 'par', lat: 48.8,  lng: 2.3,    label: 'PARIS',          value: 86 },
  { id: 'ber', lat: 52.5,  lng: 13.4,   label: 'BERLIN',         value: 82 },
  { id: 'mow', lat: 55.7,  lng: 37.6,   label: 'MOSCOW',         value: 80 },
  { id: 'sin', lat: 1.35,  lng: 103.8,  label: 'SINGAPORE',      value: 87 },
  { id: 'syd', lat: -33.8, lng: 151.2,  label: 'SYDNEY',         value: 85 },
  { id: 'sao', lat: -23.5, lng: -46.6,  label: 'SAO PAULO',      value: 78 },
  { id: 'mex', lat: 19.4,  lng: -99.1,  label: 'MEXICO CITY',    value: 76 },
  { id: 'del', lat: 28.6,  lng: 77.2,   label: 'NEW DELHI',      value: 84 },
  { id: 'cai', lat: 30.0,  lng: 31.2,   label: 'CAIRO',          value: 72 },
  { id: 'nai', lat: -1.2,  lng: 36.8,   label: 'NAIROBI',        value: 68 },
  { id: 'bue', lat: -34.6, lng: -58.3,  label: 'BUENOS AIRES',   value: 74 },
  { id: 'sto', lat: 59.3,  lng: 18.0,   label: 'STOCKHOLM',      value: 83 },
  { id: 'bkk', lat: 13.7,  lng: 100.5,  label: 'BANGKOK',        value: 81 },
  { id: 'sv',  lat: 37.6,  lng: -122.4, label: 'SILICON VALLEY', value: 97 },
  { id: 'dub', lat: 25.2,  lng: 55.2,   label: 'DUBAI',          value: 86 },
  { id: 'lim', lat: -12.0, lng: -77.0,  label: 'LIMA',           value: 65 },
  { id: 'rom', lat: 41.9, lng: 12.5, label: 'ROME', value: 81 },
  { id: 'pra', lat: 50.0, lng: 14.4, label: 'PRAGUE', value: 79 },
]

// ========== 大陆多边形轮廓（简化版） ==========
// 每个大陆用一系列按顺序排列的经纬度点描述其边界

// 北美洲轮廓
const northAmericaOutline: MapPoint[] = [
  { lat: 70, lng: -168 }, { lat: 72, lng: -156 }, { lat: 71, lng: -140 },
  { lat: 70, lng: -125 }, { lat: 70, lng: -110 }, { lat: 72, lng: -95 },
  { lat: 68, lng: -82 }, { lat: 60, lng: -78 }, { lat: 55, lng: -72 },
  { lat: 52, lng: -62 }, { lat: 47, lng: -53 }, { lat: 44, lng: -60 },
  { lat: 42, lng: -68 }, { lat: 40, lng: -74 }, { lat: 38, lng: -76 },
  { lat: 35, lng: -75 }, { lat: 30, lng: -80 }, { lat: 25, lng: -82 },
  { lat: 20, lng: -97 }, { lat: 18, lng: -105 }, { lat: 16, lng: -108 },
  { lat: 15, lng: -102 }, { lat: 17, lng: -95 }, { lat: 20, lng: -88 },
  { lat: 25, lng: -82 }, { lat: 28, lng: -90 }, { lat: 30, lng: -97 },
  { lat: 28, lng: -105 }, { lat: 25, lng: -110 }, { lat: 30, lng: -115 },
  { lat: 35, lng: -120 }, { lat: 40, lng: -124 }, { lat: 45, lng: -125 },
  { lat: 50, lng: -130 }, { lat: 55, lng: -135 }, { lat: 60, lng: -145 },
  { lat: 65, lng: -160 }, { lat: 70, lng: -168 },
]

// 南美洲轮廓
const southAmericaOutline: MapPoint[] = [
  { lat: 12, lng: -73 }, { lat: 10, lng: -75 }, { lat: 8, lng: -77 },
  { lat: 5, lng: -77 }, { lat: 2, lng: -78 }, { lat: 0, lng: -80 },
  { lat: -3, lng: -81 }, { lat: -8, lng: -80 }, { lat: -12, lng: -77 },
  { lat: -15, lng: -76 }, { lat: -18, lng: -70 }, { lat: -20, lng: -65 },
  { lat: -22, lng: -60 }, { lat: -25, lng: -55 }, { lat: -28, lng: -50 },
  { lat: -30, lng: -48 }, { lat: -33, lng: -53 }, { lat: -38, lng: -57 },
  { lat: -42, lng: -62 }, { lat: -48, lng: -65 }, { lat: -52, lng: -68 },
  { lat: -55, lng: -68 }, { lat: -50, lng: -73 }, { lat: -45, lng: -74 },
  { lat: -40, lng: -74 }, { lat: -35, lng: -72 }, { lat: -30, lng: -71 },
  { lat: -25, lng: -71 }, { lat: -20, lng: -72 }, { lat: -15, lng: -74 },
  { lat: -10, lng: -77 }, { lat: -5, lng: -80 }, { lat: 0, lng: -80 },
  { lat: 5, lng: -80 }, { lat: 10, lng: -78 }, { lat: 12, lng: -73 },
]

// 欧洲轮廓（包含主要欧洲大陆）
const europeOutline: MapPoint[] = [
  { lat: 71, lng: -10 }, { lat: 70, lng: 5 }, { lat: 68, lng: 20 },
  { lat: 65, lng: 30 }, { lat: 62, lng: 40 }, { lat: 60, lng: 50 },
  { lat: 58, lng: 45 }, { lat: 55, lng: 40 }, { lat: 52, lng: 48 },
  { lat: 48, lng: 45 }, { lat: 45, lng: 42 }, { lat: 42, lng: 38 },
  { lat: 40, lng: 30 }, { lat: 42, lng: 25 }, { lat: 40, lng: 20 },
  { lat: 38, lng: 15 }, { lat: 37, lng: 10 }, { lat: 38, lng: 5 },
  { lat: 40, lng: -2 }, { lat: 43, lng: -5 }, { lat: 45, lng: -2 },
  { lat: 48, lng: -5 }, { lat: 50, lng: -8 }, { lat: 54, lng: -10 },
  { lat: 58, lng: -10 }, { lat: 62, lng: -8 }, { lat: 66, lng: -10 },
  { lat: 71, lng: -10 },
]

// 亚洲轮廓
const asiaOutline: MapPoint[] = [
  { lat: 72, lng: 35 }, { lat: 73, lng: 60 }, { lat: 72, lng: 90 },
  { lat: 70, lng: 120 }, { lat: 68, lng: 145 }, { lat: 65, lng: 160 },
  { lat: 60, lng: 170 }, { lat: 55, lng: 162 }, { lat: 52, lng: 155 },
  { lat: 48, lng: 145 }, { lat: 45, lng: 140 }, { lat: 42, lng: 135 },
  { lat: 40, lng: 125 }, { lat: 38, lng: 122 }, { lat: 35, lng: 120 },
  { lat: 32, lng: 122 }, { lat: 28, lng: 122 }, { lat: 25, lng: 122 },
  { lat: 20, lng: 108 }, { lat: 15, lng: 100 }, { lat: 10, lng: 95 },
  { lat: 5, lng: 95 }, { lat: 2, lng: 100 }, { lat: 5, lng: 115 },
  { lat: 8, lng: 125 }, { lat: 10, lng: 130 }, { lat: 5, lng: 135 },
  { lat: 0, lng: 140 }, { lat: -2, lng: 148 }, { lat: -5, lng: 142 },
  { lat: -8, lng: 135 }, { lat: -5, lng: 125 }, { lat: -2, lng: 120 },
  { lat: 3, lng: 118 }, { lat: 5, lng: 110 }, { lat: 8, lng: 105 },
  { lat: 10, lng: 98 }, { lat: 13, lng: 92 }, { lat: 15, lng: 85 },
  { lat: 10, lng: 78 }, { lat: 5, lng: 74 }, { lat: 10, lng: 70 },
  { lat: 15, lng: 68 }, { lat: 22, lng: 60 }, { lat: 25, lng: 55 },
  { lat: 28, lng: 50 }, { lat: 30, lng: 45 }, { lat: 35, lng: 48 },
  { lat: 40, lng: 52 }, { lat: 42, lng: 50 }, { lat: 45, lng: 45 },
  { lat: 50, lng: 40 }, { lat: 55, lng: 38 }, { lat: 60, lng: 40 },
  { lat: 65, lng: 35 }, { lat: 70, lng: 30 }, { lat: 72, lng: 35 },
]

// 非洲轮廓
const africaOutline: MapPoint[] = [
  { lat: 37, lng: -17 }, { lat: 35, lng: -10 }, { lat: 33, lng: 0 },
  { lat: 32, lng: 10 }, { lat: 31, lng: 20 }, { lat: 31, lng: 30 },
  { lat: 30, lng: 33 }, { lat: 28, lng: 35 }, { lat: 25, lng: 35 },
  { lat: 20, lng: 37 }, { lat: 15, lng: 40 }, { lat: 12, lng: 43 },
  { lat: 8, lng: 48 }, { lat: 5, lng: 42 }, { lat: 3, lng: 40 },
  { lat: 0, lng: 42 }, { lat: -5, lng: 40 }, { lat: -10, lng: 40 },
  { lat: -15, lng: 38 }, { lat: -18, lng: 32 }, { lat: -20, lng: 30 },
  { lat: -22, lng: 28 }, { lat: -25, lng: 28 }, { lat: -28, lng: 32 },
  { lat: -30, lng: 33 }, { lat: -33, lng: 26 }, { lat: -34, lng: 20 },
  { lat: -34, lng: 18 }, { lat: -30, lng: 15 }, { lat: -25, lng: 13 },
  { lat: -20, lng: 12 }, { lat: -15, lng: 15 }, { lat: -10, lng: 14 },
  { lat: -5, lng: 9 }, { lat: 0, lng: 9 }, { lat: 5, lng: 8 },
  { lat: 5, lng: 0 }, { lat: 10, lng: 0 }, { lat: 15, lng: 0 },
  { lat: 20, lng: 0 }, { lat: 25, lng: 0 }, { lat: 30, lng: -5 },
  { lat: 33, lng: -8 }, { lat: 37, lng: -17 },
]

// 大洋洲（澳大利亚+新西兰简化）
const oceaniaOutline: MapPoint[] = [
  { lat: -10, lng: 113 }, { lat: -12, lng: 115 }, { lat: -15, lng: 118 },
  { lat: -18, lng: 121 }, { lat: -22, lng: 125 }, { lat: -25, lng: 130 },
  { lat: -28, lng: 133 }, { lat: -32, lng: 137 }, { lat: -35, lng: 138 },
  { lat: -38, lng: 140 }, { lat: -38, lng: 145 }, { lat: -36, lng: 148 },
  { lat: -33, lng: 150 }, { lat: -30, lng: 153 }, { lat: -25, lng: 153 },
  { lat: -22, lng: 150 }, { lat: -20, lng: 148 }, { lat: -18, lng: 146 },
  { lat: -16, lng: 142 }, { lat: -14, lng: 138 }, { lat: -12, lng: 135 },
  { lat: -10, lng: 130 }, { lat: -10, lng: 120 }, { lat: -10, lng: 113 },
  // 新西兰
  { lat: -34, lng: 173 }, { lat: -36, lng: 174 }, { lat: -38, lng: 176 },
  { lat: -40, lng: 178 }, { lat: -41, lng: 175 }, { lat: -42, lng: 173 },
  { lat: -44, lng: 170 }, { lat: -46, lng: 167 }, { lat: -47, lng: 168 },
  { lat: -45, lng: 170 }, { lat: -43, lng: 172 }, { lat: -40, lng: 174 },
  { lat: -38, lng: 174 }, { lat: -36, lng: 175 }, { lat: -34, lng: 173 },
]

// 格陵兰岛
const greenlandOutline: MapPoint[] = [
  { lat: 82, lng: -45 }, { lat: 80, lng: -35 }, { lat: 78, lng: -25 },
  { lat: 75, lng: -20 }, { lat: 72, lng: -22 }, { lat: 68, lng: -25 },
  { lat: 65, lng: -30 }, { lat: 62, lng: -35 }, { lat: 60, lng: -42 },
  { lat: 62, lng: -48 }, { lat: 65, lng: -52 }, { lat: 68, lng: -55 },
  { lat: 72, lng: -56 }, { lat: 75, lng: -54 }, { lat: 78, lng: -50 },
  { lat: 80, lng: -48 }, { lat: 82, lng: -45 },
]

// 合并所有大陆多边形
export const allContinents: MapPolygon[] = [
  { name: 'NORTH_AMERICA', points: northAmericaOutline },
  { name: 'SOUTH_AMERICA', points: southAmericaOutline },
  { name: 'EUROPE', points: europeOutline },
  { name: 'ASIA', points: asiaOutline },
  { name: 'AFRICA', points: africaOutline },
  { name: 'OCEANIA', points: oceaniaOutline },
  { name: 'GREENLAND', points: greenlandOutline },
]

// ========== 点在多边形内测试（射线法） ==========
export function pointInPolygon(lat: number, lng: number, polygon: MapPoint[]): boolean {
  let inside = false
  const n = polygon.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const yi = polygon[i].lat
    const yj = polygon[j].lat
    const xi = polygon[i].lng
    const xj = polygon[j].lng
    
    // 检查点是否在边的纬度范围内
    if (((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

// 检查点是否在任何大陆内
export function isOnLand(lat: number, lng: number): boolean {
  for (const continent of allContinents) {
    if (pointInPolygon(lat, lng, continent.points)) {
      return true
    }
  }
  return false
}

// 预计算陆地查找表（72x36分辨率，每5度一格）
// 使用 Int8Array 节省内存
let landLookup: Int8Array | null = null
const LAT_RES = 36 // -90 到 90, 每5度
const LNG_RES = 72 // -180 到 180, 每5度

export function buildLandLookup(): Int8Array {
  if (landLookup) return landLookup
  
  landLookup = new Int8Array(LAT_RES * LNG_RES)
  
  const stepLat = 180 / LAT_RES // 5 degrees
  const stepLng = 360 / LNG_RES // 5 degrees
  
  for (let latIdx = 0; latIdx < LAT_RES; latIdx++) {
    const lat = 90 - latIdx * stepLat
    for (let lngIdx = 0; lngIdx < LNG_RES; lngIdx++) {
      const lng = lngIdx * stepLng - 180
      // 检查中心附近的3x3格子（提高精度）
      let isLand = false
      for (let dLat = -stepLat/2; dLat <= stepLat/2; dLat += stepLat/2) {
        for (let dLng = -stepLng/2; dLng <= stepLng/2; dLng += stepLng/2) {
          if (isOnLand(lat + dLat, lng + dLng)) {
            isLand = true
            break
          }
        }
        if (isLand) break
      }
      landLookup[latIdx * LNG_RES + lngIdx] = isLand ? 1 : 0
    }
  }
  
  return landLookup
}

// 从查找表查询（使用双线性插值提高精度）
export function isLandFast(lat: number, lng: number): boolean {
  if (!landLookup) {
    landLookup = buildLandLookup()
  }
  
  const stepLat = 180 / LAT_RES
  const stepLng = 360 / LNG_RES
  
  // 计算浮点索引
  const latF = (90 - lat) / stepLat
  const lngF = (lng + 180) / stepLng
  
  const latIdx = Math.floor(latF)
  const lngIdx = Math.floor(lngF)
  
  if (latIdx < 0 || latIdx >= LAT_RES || lngIdx < 0 || lngIdx >= LNG_RES) {
    return false
  }
  
  return landLookup[latIdx * LNG_RES + lngIdx] === 1
}

// 模拟实时数据流
export interface DataStream {
  id: string
  timestamp: number
  source: string
  type: string
  value: number
  status: 'ACTIVE' | 'IDLE' | 'WARNING'
  trend: number
}

export function generateMockDataStream(): DataStream[] {
  const types = ['NETWORK', 'SENSOR', 'TRANSACTION', 'TELEMETRY', 'LOG', 'ALERT']
  const sources = ['NODE_ALPHA', 'NODE_BETA', 'NODE_GAMMA', 'NODE_DELTA', 'NODE_EPSILON', 'SATELLITE_01', 'SATELLITE_02', 'GROUND_STATION']
  const statuses: DataStream['status'][] = ['ACTIVE', 'IDLE', 'WARNING']

  const streams: DataStream[] = []
  for (let i = 0; i < 20; i++) {
    streams.push({
      id: `STRM-${String(Math.random() * 9999).padStart(4, '0')}`,
      timestamp: Date.now() - Math.floor(Math.random() * 60000),
      source: sources[Math.floor(Math.random() * sources.length)],
      type: types[Math.floor(Math.random() * types.length)],
      value: Math.floor(Math.random() * 1000),
      status: Math.random() > 0.85 ? 'WARNING' : Math.random() > 0.3 ? 'ACTIVE' : 'IDLE',
      trend: (Math.random() - 0.3) * 20
    })
  }
  return streams
}

export interface SystemMetric {
  label: string
  value: number
  unit: string
  trend: number
}

export function generateSystemMetrics(): SystemMetric[] {
  return [
    { label: 'CPU_LOAD', value: 42 + Math.floor(Math.random() * 20), unit: '%', trend: (Math.random() - 0.5) * 10 },
    { label: 'MEMORY', value: 67 + Math.floor(Math.random() * 10), unit: '%', trend: (Math.random() - 0.5) * 5 },
    { label: 'NET_THROUGHPUT', value: 128 + Math.floor(Math.random() * 50), unit: 'MB/s', trend: (Math.random() - 0.3) * 20 },
    { label: 'LATENCY', value: 12 + Math.floor(Math.random() * 8), unit: 'ms', trend: (Math.random() - 0.7) * 5 },
    { label: 'UPTIME', value: 99.97, unit: '%', trend: 0.01 },
    { label: 'PACKETS', value: 2.4 + Math.random() * 0.6, unit: 'M/s', trend: (Math.random() - 0.5) * 0.3 },
  ]
}
