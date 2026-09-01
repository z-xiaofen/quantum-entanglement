<template>
  <div class="pixel-globe-wrap">
    <canvas ref="canvasRef" class="globe-canvas"></canvas>
    <!-- 悬停提示（CITY · SIGNAL xx% · CLICK FOR DETAIL） -->
    <div v-if="hoveredCity" class="globe-tooltip" :style="{ left: tipX + 'px', top: tipY + 'px' }">
      <span class="tip-city">{{ hoveredCity.label || 'CITY' }}</span>
      <span class="tip-sep">·</span>
      <span class="tip-signal">SIGNAL {{ hoveredCity.value ?? '--' }}%</span>
      <span class="tip-sep">·</span>
      <span class="tip-action">CLICK FOR DETAIL</span>
    </div>
    <!-- 城市详情 2D UI 卡片（Teleport 到 body，避开父级 pointer-events:none 导致无法关闭） -->
    <Teleport to="body">
      <Transition name="panel-fade">
        <div v-if="selectedCity" class="city-info-card" :style="infoCardStyle">
          <div class="card-head">
            <div class="card-id">NODE ID · {{ selectedCity.id.toUpperCase() }}</div>
            <button class="card-close" @click="selectedCity = null">✕</button>
          </div>
          <div class="card-title">{{ selectedCity.label }}<span class="card-coord">{{ selectedCity.lat.toFixed(1) }}°, {{ selectedCity.lng.toFixed(1) }}°</span></div>
          <div class="card-metrics">
            <div class="metric">
              <div class="m-label">SIGNAL</div>
              <div class="m-val"><span class="bar"><span class="fill" :style="{ width: selectedCity.value + '%' }"></span></span>{{ selectedCity.value }}%</div>
            </div>
            <div class="metric">
              <div class="m-label">STATUS</div>
              <div class="m-val status" :class="selectedCity.value > 90 ? 'ok' : selectedCity.value > 80 ? 'warn' : 'err'">
                {{ selectedCity.value > 90 ? 'ONLINE' : selectedCity.value > 80 ? 'DEGRADED' : 'CRITICAL' }}
              </div>
            </div>
            <div class="metric">
              <div class="m-label">LATENCY</div>
              <div class="m-val">{{ cityLatency(selectedCity) }} ms</div>
            </div>
            <div class="metric">
              <div class="m-label">THROUGHPUT</div>
              <div class="m-val">{{ cityThroughput(selectedCity) }} Gbps</div>
            </div>
          </div>
          <div class="card-foot">LAST SYNC · {{ nowStr }}</div>
        </div>
      </Transition>
    </Teleport>
    <!-- 图例 -->
    <div class="globe-legend">
      <div class="leg-item"><span class="dot land"></span>LAND</div>
      <div class="leg-item"><span class="dot city"></span>NODE</div>
      <div class="leg-item"><span class="dot link"></span>LINK</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { cityHotspots, isLandFast, buildLandLookup, type MapPoint } from '../data/worldMapData'

// 用户手动交互地球（拖拽/滚轮）时通知父级：清除 Top Signals 选中态
const emit = defineEmits<{
  (e: 'userInteract'): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hoveredCity = ref<MapPoint | null>(null)
const tipX = ref(0)
const tipY = ref(0)
const selectedCity = ref<MapPoint | null>(null)
const infoCardX = ref(100)
const infoCardY = ref(120)
const tickNow = ref(new Date())

let _tickInterval: ReturnType<typeof setInterval> | null = null

const nowStr = computed(() => {
  const d = tickNow.value
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})
const infoCardStyle = computed(() => ({
  left: infoCardX.value + 'px',
  top: infoCardY.value + 'px'
}))

// ponytail: 基于城市 id hash 的确定性伪随机值，代替 Math.random()（防止每秒闪烁）
function cityLatency(city: MapPoint): number {
  let hash = 0
  for (let i = 0; i < city.id.length; i++) hash = (hash * 31 + city.id.charCodeAt(i)) | 0
  return 12 + (Math.abs(hash * 16807) % 118)  // 12~129 ms
}
function cityThroughput(city: MapPoint): string {
  let hash = 0
  for (let i = 0; i < city.id.length; i++) hash = (hash * 37 + city.id.charCodeAt(i)) | 0
  const val = 0.65 + (Math.abs(hash * 48271) % 500) / 100  // 0.65~5.65 Gbps
  return val.toFixed(2)
}

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let raycaster: THREE.Raycaster | null = null
let mouse: THREE.Vector2 | null = null
let animationId = 0
let winResizeHandler: (() => void) | null = null
let _resizeTimer: ReturnType<typeof setTimeout> | null = null

// 城市标记 mesh 列表（用于 raycaster 拾取）
let cityMeshes: THREE.Mesh[] = []
// 高亮城市（点击选中 or Top Signals 命中）：mesh 与脉冲环变红色
let highlightedCityId: string | null = null
// ponytail: 缓存通用向量，避免每帧 applyCityHighlight 中构造临时对象
const _ONE_VEC = new THREE.Vector3(1, 1, 1)

// ========== 颜色基准 ==========
const CITY_MAT_BASE = 0xFFB347
const CITY_MAT_HIGHLIGHT = 0xFF2A2A   // 选中红色
const RING_MAT_BASE = 0xFF8C00
const RING_MAT_HIGHLIGHT = 0xFF3030

// 创建城市热点标记（每个城市用独立材质，保证单城市颜色变更不影响其他城市）
function createCityMarkers(): void {
  cityMeshes = []
  const geo = new THREE.SphereGeometry(4, 12, 12)

  for (const city of cityHotspots) {
    const mat = new THREE.MeshBasicMaterial({ color: CITY_MAT_BASE })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(latLngToVec3(city.lat, city.lng, GLOBE_R + 2))
    mesh.userData = { city }
    cityMeshes.push(mesh)
    scene!.add(mesh)

    // 脉冲环（每个独立材质）
    const ringGeo = new THREE.RingGeometry(5, 8, 26)
    const ringMat = new THREE.MeshBasicMaterial({
      color: RING_MAT_BASE,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.copy(mesh.position)
    ring.lookAt(0, 0, 0)
    ring.userData = { pulse: Math.random() * Math.PI * 2, baseOp: 0.5 }
    mesh.userData.ring = ring
    scene!.add(ring)
  }
}

/** 同步选中高亮（把 highlightedCityId 对应的城市变红，其他城市恢复原色；每帧与 setter 都会调用） */
function applyCityHighlight(): void {
  for (const mesh of cityMeshes) {
    const city = mesh.userData.city as MapPoint
    const cityMat = mesh.material as THREE.MeshBasicMaterial
    const ring = mesh.userData.ring as THREE.Mesh | undefined
    const ringMat = ring?.material as THREE.MeshBasicMaterial | undefined

    if (city.id === highlightedCityId) {
      // 红色高亮：mesh+ring 红色 + ring 尺寸放大高亮
      if (cityMat.color.getHex() !== CITY_MAT_HIGHLIGHT) cityMat.color.setHex(CITY_MAT_HIGHLIGHT)
      if (ringMat) {
        if (ringMat.color.getHex() !== RING_MAT_HIGHLIGHT) ringMat.color.setHex(RING_MAT_HIGHLIGHT)
        ringMat.opacity = Math.max(ringMat.opacity, 0.75)
      }
      mesh.scale.setScalar(1.25)
      if (ring) {
        const pulse = (ring.userData.pulse as number) ?? 0
        const s = 1.6 + Math.sin(pulse) * 0.35
        ring.scale.set(s, s, s)
      }
    } else {
      // 还原默认色
      if (cityMat.color.getHex() !== CITY_MAT_BASE) cityMat.color.setHex(CITY_MAT_BASE)
      if (ringMat && ringMat.color.getHex() !== RING_MAT_BASE) ringMat.color.setHex(RING_MAT_BASE)
      if (!mesh.scale.equals(_ONE_VEC)) mesh.scale.setScalar(1)
    }
  }
}

// 外部 & 内部统一：设置当前高亮城市（红色）；传 null 则清除
function setHighlightedCityId(id: string | null): void {
  highlightedCityId = id
  applyCityHighlight()
}
interface FlowParticle {
  mesh: THREE.Mesh
  curve: THREE.Curve<THREE.Vector3>
  progress: number
  speed: number
}
let flowParticles: FlowParticle[] = []
// 连线线段
let lineGroup: THREE.Group | null = null

// 地球半径
const GLOBE_R = 200

// 经纬度转球面坐标
function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  const x = -r * Math.sin(phi) * Math.cos(theta)
  const y = r * Math.cos(phi)
  const z = r * Math.sin(phi) * Math.sin(theta)
  return new THREE.Vector3(x, y, z)
}

// 创建像素点地球
function createPixelGlobe(): THREE.Group {
  const group = new THREE.Group()
  buildLandLookup()

  // 陆地像素点 - 0.8 度步长，比 1 度再密集约 1.56 倍
  const STEP = 0.8 // 度
  const landPositions: { lat: number; lng: number; isEdge: boolean }[] = []

  for (let lat = -56; lat <= 78; lat += STEP) {
    for (let lng = -180; lng <= 180; lng += STEP) {
      if (!isLandFast(lat, lng)) continue
      const isEdge = !isLandFast(lat + STEP, lng) ||
                     !isLandFast(lat - STEP, lng) ||
                     !isLandFast(lat, lng + STEP) ||
                     !isLandFast(lat, lng - STEP)
      landPositions.push({ lat, lng, isEdge })
    }
  }

  // 像素小方块 - 尺寸随步长微调，避免重叠
  const BOX_SIZE = 0.9
  const boxGeo = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE)
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xFF8C00 })
  // 内部点：改为 #d8cf04，并降低透明度（opacity 由 0.6 → 0.45，更淡不抢眼）
  const innerMat = new THREE.MeshBasicMaterial({
      color: 0xD8CF04,
      transparent: true,
      opacity: 0.75
    })

  // 边缘点
  const edgePositions = landPositions.filter(p => p.isEdge)
  const edgeInst = new THREE.InstancedMesh(boxGeo, edgeMat, edgePositions.length)
  const dummy = new THREE.Object3D()
  edgePositions.forEach((p, i) => {
    const v = latLngToVec3(p.lat, p.lng, GLOBE_R)
    dummy.position.copy(v)
    dummy.lookAt(0, 0, 0)
    dummy.updateMatrix()
    edgeInst.setMatrixAt(i, dummy.matrix)
  })
  edgeInst.instanceMatrix.needsUpdate = true
  group.add(edgeInst)

  // 内部点
  const innerPositions = landPositions.filter(p => !p.isEdge)
  if (innerPositions.length > 0) {
    const innerInst = new THREE.InstancedMesh(boxGeo, innerMat, innerPositions.length)
    innerPositions.forEach((p, i) => {
      const v = latLngToVec3(p.lat, p.lng, GLOBE_R)
      dummy.position.copy(v)
      dummy.lookAt(0, 0, 0)
      dummy.updateMatrix()
      innerInst.setMatrixAt(i, dummy.matrix)
    })
    innerInst.instanceMatrix.needsUpdate = true
    group.add(innerInst)
  }

  return group
}

// 创建城市间连线（弧线）
function createConnections(): void {
  lineGroup = new THREE.Group()
  flowParticles = []

  const shuffled = [...cityHotspots].sort(() => Math.random() - 0.5)
  const linkCount = Math.min(10, shuffled.length - 1)

  for (let i = 0; i < linkCount; i++) {
    const a = shuffled[i]
    const b = shuffled[i + 1]
    const v1 = latLngToVec3(a.lat, a.lng, GLOBE_R)
    const v2 = latLngToVec3(b.lat, b.lng, GLOBE_R)

    // 弧线高度（比原来再"向上翘起"一些：系数 0.4 → 0.68，上限 80 → 135）
    const dist = v1.distanceTo(v2)
    const arcH = Math.min(dist * 0.68, 135)
    const mid = v1.clone().lerp(v2, 0.5)
    mid.normalize().multiplyScalar(GLOBE_R + arcH)

    const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2)
    const points = curve.getPoints(50)

    // 线段
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xFF8C00,
      transparent: true,
      opacity: 0.35
    })
    const line = new THREE.Line(lineGeo, lineMat)
    lineGroup!.add(line)

    // 流动粒子（三角形箭头 = 三角锥，尖端朝前）
    const triGeo = new THREE.ConeGeometry(2.2, 5.5, 3) // 底半径2.2, 高5.5, 3段面 = 正三角锥
    triGeo.rotateX(Math.PI / 2) // 默认锥形上沿Y轴；旋转后+Z朝前，后面用 lookAt(nextPos) 定向
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 })
    const particle = new THREE.Mesh(triGeo, particleMat)
    scene!.add(particle)

    flowParticles.push({
      mesh: particle,
      curve,
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.004
    })
  }

  scene!.add(lineGroup!)
}

// 创建柔和遮挡球：让背面半球"暗化"而不是完全看不见，保留半球层次感
function createOcclusionCore(): void {
  const geo = new THREE.SphereGeometry(GLOBE_R - 0.6, 48, 48)
  const mat = new THREE.MeshBasicMaterial({
    color: 0x050200,    // 极深暖黑
    transparent: true,
    opacity: 0.72,       // 72% 不透明 → 背面半球能透出约 28%
    depthWrite: false,   // 不再硬写深度裁掉背面像素，只做颜色叠加
    depthTest: true,
    blending: THREE.NormalBlending,
    fog: false
  })
  const core = new THREE.Mesh(geo, mat)
  core.renderOrder = 2 // 后于像素方块画：盖在背面那些点上，把背面压暗（叠加变暗）
  scene!.add(core)
}

// 创建大气辉光
function createAtmosphere(): void {
  const geo = new THREE.SphereGeometry(GLOBE_R + 8, 32, 32)
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    uniforms: {},
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0) * intensity;
      }
    `
  })
  const mesh = new THREE.Mesh(geo, mat)
  scene!.add(mesh)
}

// Raycaster 拾取（click / hover 共用）—— 基于真实全屏坐标系（与相机 renderer 对齐）
function pickCity(e: MouseEvent): MapPoint | null {
  if (!camera || !raycaster || !mouse) return null
  const w = window.innerWidth
  const h = window.innerHeight
  mouse.x = (e.clientX / w) * 2 - 1
  mouse.y = -(e.clientY / h) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(cityMeshes)
  if (intersects.length > 0) return intersects[0].object.userData.city as MapPoint
  return null
}

// 悬停：显示 CITY · SIGNAL xx% · CLICK FOR DETAIL，并把 cursor 改为 pointer
function onMouseMove(event: MouseEvent): void {
  const city = pickCity(event)
  if (city) {
    hoveredCity.value = city
    tipX.value = event.clientX + 14
    tipY.value = event.clientY - 34
    if (interactEl && interactEl.style.cursor !== 'pointer') interactEl.style.cursor = 'pointer'
  } else {
    hoveredCity.value = null
    if (interactEl && interactEl.style.cursor !== 'grab') interactEl.style.cursor = 'grab'
  }
}

function onCityClick(event: MouseEvent): void {
  const city = pickCity(event)
  if (city) {
    // 选中标红（并同时打开详情卡）
    setHighlightedCityId(city.id)
    selectedCity.value = city
    const baseX = Math.min(window.innerWidth - 340, Math.max(20, event.clientX + 20))
    const baseY = Math.min(window.innerHeight - 280, Math.max(60, event.clientY - 140))
    infoCardX.value = baseX
    infoCardY.value = baseY
  }
}

let interactEl: HTMLElement | null = null

function init() {
  const canvas = canvasRef.value!

  const w = window.innerWidth
  const h = window.innerHeight

  // 渲染器 - 全屏
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setSize(w, h, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)

  // 场景
  scene = new THREE.Scene()

  // 相机
  camera = new THREE.PerspectiveCamera(45, w / h, 1, 8000)
  camera.position.set(0, 80, 780)

  // 查找交互区域元素（Dashboard 中的 #globeInteractZone）
  interactEl = document.getElementById('globeInteractZone')

  // 控制器 - 监听交互区域而非 canvas
  controls = new OrbitControls(camera, interactEl || canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.rotateSpeed = 0.5
  controls.minDistance = 260
  controls.maxDistance = 6000
  controls.enablePan = false
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.3

  // Raycaster
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // 光照
  const ambient = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambient)

  // 创建地球
  const globe = createPixelGlobe()
  scene.add(globe)

  // 遮挡核心（必须先于大气辉光、城市、连线创建，先写入深度挡住背面）
  createOcclusionCore()

  // 大气辉光
  createAtmosphere()

  // 城市标记
  createCityMarkers()

  // 连线
  createConnections()

  // 鼠标事件：mousemove（悬停提示 + cursor） + click（打开详情卡 + 红色高亮）
  // 用户手动交互（拖拽按下/滚轮）→ 清除红色高亮 + 恢复地球自转
  if (interactEl) {
    interactEl.style.cursor = 'default'
    interactEl.addEventListener('mousemove', onMouseMove as EventListener)
    interactEl.addEventListener('click', onCityClick as EventListener)
    interactEl.addEventListener('pointerdown', clearHighlightAndResumeRotation as EventListener)
    interactEl.addEventListener('wheel', clearHighlightAndResumeRotation as EventListener, { passive: true })
  }

  // 3D 场景独立监听窗口尺寸（不依赖 scale 容器）
  winResizeHandler = () => {
    if (_resizeTimer) clearTimeout(_resizeTimer)
    _resizeTimer = setTimeout(() => {
      if (!renderer || !camera) return
      const nw = window.innerWidth
      const nh = window.innerHeight
      renderer.setSize(nw, nh, false)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      _resizeTimer = null
    }, 150)
  }
  window.addEventListener('resize', winResizeHandler)

  // 动画循环
  animate(0)

  // 入场相机动画：从"最小"（地球小点）平滑飞至截图大小
  startIntroFlyIn(260)
}

let _lastAnimateT = 0
function animate(time: number): void {
  animationId = requestAnimationFrame(animate)
  if (!controls || !scene || !camera || !renderer) return

  const dt = _lastAnimateT ? Math.min(50, time - _lastAnimateT) : 16
  _lastAnimateT = time

  // 入场相机 flyIn（页面打开从最小平滑拉到当前大小）
  stepIntroTween(dt)
  // 再做 flyTo 城市相机缓动（如果有），再 controls.update
  if (!introTween) stepFlyTween(dt)
  controls.update()

  // 城市高亮（红色选中/还原）：每帧保证状态与脉冲动画一致
  applyCityHighlight()

  // 城市脉冲环
  for (const mesh of cityMeshes) {
    const ring = mesh.userData.ring as THREE.Mesh
    if (ring) {
      ring.userData.pulse += 0.05
      const city = mesh.userData.city as MapPoint
      const isHL = city && city.id === highlightedCityId
      const baseScale = isHL ? 1.6 : 1.0
      const pulseAmp  = isHL ? 0.35 : 0.3
      const s = baseScale + Math.sin(ring.userData.pulse) * pulseAmp
      ring.scale.set(s, s, s)
      const ringMat = ring.material as THREE.MeshBasicMaterial
      // 高亮：保持更高的最低透明度（0.65-0.85）；普通：0.15-0.45
      const alpha = (Math.sin(ring.userData.pulse) + 1) / 2
      ringMat.opacity = isHL
        ? 0.65 + 0.20 * (1 - alpha)
        : 0.15 + 0.30 * (1 - alpha)
    }
  }

  // 流动粒子（三角锥，尖端朝飞行方向）
  for (const fp of flowParticles) {
    fp.progress += fp.speed
    if (fp.progress > 1) fp.progress = 0
    const nextProg = Math.min(1, fp.progress + 0.01)
    const pos = fp.curve.getPoint(fp.progress)
    const ahead = fp.curve.getPoint(nextProg)
    fp.mesh.position.copy(pos)
    // 三角锥 local +Z 朝前，所以 lookAt 下一个前进位置（从当前 pos 看 ahead）
    fp.mesh.lookAt(ahead)
  }

  renderer.render(scene, camera)
}

onMounted(() => {
  // 启动秒级时钟（用于 info card 的 LAST SYNC 时间戳）
  _tickInterval = setInterval(() => tickNow.value = new Date(), 1000)

  // 等待 Dashboard 渲染 #globeInteractZone 后再初始化
  const tryInit = () => {
    const el = document.getElementById('globeInteractZone')
    if (el) {
      init()
    } else {
      requestAnimationFrame(tryInit)
    }
  }
  requestAnimationFrame(tryInit)
})

// ========== 公共方法：flyToCity（从 Dashboard 外部调用） ==========
let flyTween: {
  from: THREE.Vector3
  fromDist: number
  to: THREE.Vector3
  toDist: number
  t: number
  duration: number
} | null = null

// 页面入场相机动画：从"最小"（极远距离 → 地球小点）平滑推到默认远景大小
let introTween: {
  from: THREE.Vector3
  to: THREE.Vector3
  t: number
  duration: number
} | null = null

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
// 专门给入场：outCubic 更像"冲过去"的感觉
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * 启动入场动画：相机从远处（地球只小点 → "最小"）平滑 flyTo 到默认远景 (25, 45, 360) ≈ 参考截图地球大小
 * @param delayMs 启动前延迟，等待像素方块/城市/连线加载完成
 */
function startIntroFlyIn(delayMs: number = 260): void {
  if (!camera) return
  // 起始：很远的距离，地球只一个小点
  const from = new THREE.Vector3(0, 220, 5200)
  // 终点：在上版基础上再大 30%（740 / 1.3 ≈ 569）
  const to = new THREE.Vector3(42, 75, 569)
  // 先把相机放在远点，立即渲染一帧小点
  camera.position.copy(from)
  setTimeout(() => {
    introTween = { from, to, t: 0, duration: 2350 }
    // ⚠️ flyIn 推进的同时允许地球自转（用户要"地球要旋转"）
    if (controls) controls.autoRotate = true
  }, delayMs)
}

// 在 animate 每帧里处理入场相机缓动
function stepIntroTween(deltaMs: number): void {
  if (!introTween || !camera || !controls) return
  introTween.t += deltaMs / introTween.duration
  const tt = Math.min(1, introTween.t)
  const k = easeOutCubic(tt)
  camera.position.lerpVectors(introTween.from, introTween.to, k)
  controls.update()
  if (tt >= 1) {
    introTween = null
    // 到达目标距离后地球保持自转
    controls.autoRotate = true
  }
}

/**
 * 相机平滑飞到指定城市：
 *  - 先把相机（带缓动）拉到城市正前方一定距离，形成"正对城市 + 拉近"效果
 *  - 目标位置：城市位置向量 * (距离系数 / GLOBE_R)，即沿表面法线向外
 * @param lat 纬度（度）
 * @param lng 经度（度）
 * @param durationMs 动画时长，默认 1600ms
 * @param zoomFactor 相机距离倍率：1=远景(780)，0.42≈拉近距离约330，默认 0.42
 */
function flyToCity(lat: number, lng: number, durationMs: number = 1600, zoomFactor: number = 0.5): void {
  if (!camera || !controls) return
  const cityPos = latLngToVec3(lat, lng, GLOBE_R)
  // 目标相机位置：城市位置 + 法线向外延伸 目标距离
  const normal = cityPos.clone().normalize()
  const DEFAULT_DIST = 569               // 当前入场动画最终距离（再大 30%）
  // 默认 zoomFactor 0.5 → 正对城市拉近约在 DEFAULT_DIST * 0.6 ≈ 341（合理细节放大）
  const targetDist = Math.max(260 * zoomFactor, 130)
  const targetCamPos = normal.multiplyScalar(DEFAULT_DIST * (zoomFactor + 0.1) + GLOBE_R + 2)

  flyTween = {
    from: camera.position.clone(),
    fromDist: controls.target.length() > 0 ? camera.position.clone().sub(controls.target).length() : DEFAULT_DIST,
    to: targetCamPos,
    toDist: targetDist,
    t: 0,
    duration: Math.max(400, durationMs)
  }
  // 暂停自动旋转（动画结束后保留暂停；用户之后手动 interact 再恢复自动旋转）
  if (controls) controls.autoRotate = false
}

// 将城市名 → 坐标（从 cityHotspots 找），找不到返回 null
function findCityByLabel(label: string): MapPoint | null {
  const up = label.trim().toUpperCase()
  return cityHotspots.find(c => (c.label || '').toUpperCase() === up) || null
}

function flyToCityByLabel(label: string, durationMs?: number, zoomFactor?: number): boolean {
  const city = findCityByLabel(label)
  if (!city) return false
  flyToCity(city.lat, city.lng, durationMs, zoomFactor)
  setHighlightedCityId(city.id)
  return true
}

/** 用户手动交互时调用：清除红色高亮 + 恢复地球自动旋转 + 通知父级清 UI 选中态 */
function clearHighlightAndResumeRotation(): void {
  setHighlightedCityId(null)
  closeCityInfoCard()
  if (controls) controls.autoRotate = true
  emit('userInteract')
}

/** 关闭 3D 城市详情弹卡 */
function closeCityInfoCard(): void {
  selectedCity.value = null
}

defineExpose({
  flyToCity,
  flyToCityByLabel,
  setHighlightedCityId,
  clearHighlightAndResumeRotation,
  closeCityInfoCard
})

// 在 animate 每帧里处理 tween
function stepFlyTween(deltaMs: number): void {
  if (!flyTween || !camera || !controls) return
  flyTween.t += deltaMs / flyTween.duration
  const tt = Math.min(1, flyTween.t)
  const k = easeInOutCubic(tt)
  camera.position.lerpVectors(flyTween.from, flyTween.to, k)
  controls.update()
  if (tt >= 1) flyTween = null
}

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (_tickInterval) clearInterval(_tickInterval)
  if (_resizeTimer) { clearTimeout(_resizeTimer); _resizeTimer = null }
  if (winResizeHandler) window.removeEventListener('resize', winResizeHandler)
  if (interactEl) {
    interactEl.removeEventListener('mousemove', onMouseMove as EventListener)
    interactEl.removeEventListener('click', onCityClick as EventListener)
    interactEl.removeEventListener('pointerdown', clearHighlightAndResumeRotation as EventListener)
    interactEl.removeEventListener('wheel', clearHighlightAndResumeRotation as EventListener)
  }
  if (controls) controls.dispose()
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
  }
})
</script>

<style scoped>
.pixel-globe-wrap {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(ellipse at center, rgba(20, 10, 0, 0.3) 0%, transparent 70%);
}

.globe-canvas {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.globe-legend {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 16px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 140, 0, 0.2);
  z-index: 5;
}

.leg-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  color: rgba(255, 140, 0, 0.7);
  letter-spacing: 1px;
}

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot.land { background: #FF6B00; }
.dot.city { background: #FFB347; box-shadow: 0 0 4px #FFB347; }
.dot.link { background: #FF8C00; }

/* ========== 悬停提示（CITY · SIGNAL xx% · CLICK FOR DETAIL） ========== */
.globe-tooltip {
  position: fixed;
  z-index: 40;
  pointer-events: none;
  transform: translateZ(0);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 11px;
  letter-spacing: 0.08em;
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  color: #FFD866;
  background: rgba(16, 8, 0, 0.82);
  border: 1px solid rgba(255, 140, 0, 0.55);
  clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
  white-space: nowrap;
  box-shadow: 0 0 12px rgba(255, 140, 0, 0.22), inset 0 0 10px rgba(255, 140, 0, 0.08);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.globe-tooltip .tip-city { color: #FFB347; font-weight: 600; }
.globe-tooltip .tip-sep  { color: rgba(255, 140, 0, 0.7); }
.globe-tooltip .tip-signal { color: #FFDD88; }
.globe-tooltip .tip-action { color: #5CE08A; margin-left: 2px; }

/* ========== 城市详情 2D UI 卡片 ========== */
.city-info-card {
  position: fixed;
  width: 300px;
  pointer-events: auto;
  z-index: 9999;
  background: linear-gradient(
    180deg,
    rgba(20, 10, 0, 0.92) 0%,
    rgba(10, 5, 0, 0.95) 100%
  );
  border: 1px solid rgba(255, 140, 0, 0.4);
  backdrop-filter: blur(4px);
  box-shadow:
    0 0 0 1px rgba(255, 140, 0, 0.1),
    0 4px 30px rgba(255, 100, 0, 0.15),
    inset 0 0 20px rgba(255, 140, 0, 0.05);
  padding: 14px 16px;
  clip-path: polygon(
    0 6px, 6px 0,
    calc(100% - 6px) 0, 100% 6px,
    100% calc(100% - 6px), calc(100% - 6px) 100%,
    6px 100%, 0 calc(100% - 6px)
  );
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed rgba(255, 140, 0, 0.25);
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.card-id {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  color: rgba(255, 140, 0, 0.65);
}

.card-close {
  background: none;
  border: 1px solid rgba(255, 140, 0, 0.3);
  color: rgba(255, 140, 0, 0.7);
  width: 20px;
  height: 20px;
  line-height: 1;
  font-size: 11px;
  cursor: pointer;
  font-family: 'Share Tech Mono', monospace;
  transition: all 0.15s;
}
.card-close:hover {
  background: rgba(255, 60, 0, 0.2);
  color: #FF4400;
  border-color: rgba(255, 60, 0, 0.6);
}

.card-title {
  font-family: 'Share Tech Mono', monospace;
  font-size: 18px;
  font-weight: 700;
  color: #FFB347;
  letter-spacing: 1px;
  margin-bottom: 3px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.card-coord {
  font-size: 10px;
  font-weight: 400;
  color: rgba(255, 140, 0, 0.5);
  letter-spacing: 1px;
}

.card-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 14px;
  margin: 14px 0;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.m-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  color: rgba(255, 140, 0, 0.5);
}
.m-val {
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  color: #FF8C00;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.bar {
  display: inline-block;
  width: 54px;
  height: 4px;
  background: rgba(255, 140, 0, 0.15);
  overflow: hidden;
}
.fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #FF4400, #FFB347);
}
.status.ok   { color: #3CFF9E; text-shadow: 0 0 4px rgba(60, 255, 158, 0.6); }
.status.warn { color: #FFCC00; text-shadow: 0 0 4px rgba(255, 204, 0, 0.6); }
.status.err  { color: #FF4455; text-shadow: 0 0 4px rgba(255, 68, 85, 0.6); }

.card-foot {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 140, 0, 0.25);
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  color: rgba(255, 140, 0, 0.45);
  text-align: right;
}

/* 过渡动画 */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
  transform-origin: left top;
}
.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: scale(0.94) translateY(-4px);
}
</style>
