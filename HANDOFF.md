# HANDOFF.md — 量子纠缠 (quantum-entanglement) 交接文档

> 最后更新：2026-08-27
> 用途：会话丢失上下文时，AI 新会话打开此文件即可续接

---

## 一、项目概览

| 项 | 值 |
|---|---|
| 项目名 | 量子纠缠 (quantum-entanglement) |
| 路径 | `d:\codex\quantum-entanglement` |
| 技术栈 | Vue 3.4 + TypeScript 5.3 + Vite 5 + Three.js 0.160 |
| 视觉风格 | 纯黑 `#000` 背景 + 霓虹量子粒子 + Bloom 后期效果，赛博/科幻风 |
| 包管理 | npm |
| 核心概念 | 参考 [bgstaal/multipleWindow3dScene](https://github.com/bgstaal/multipleWindow3dScene)：通过 **window.screenX/screenY** 获取桌面真实坐标，跨浏览器窗口共享统一 3D 坐标系 |

---

## 二、核心效果（一句话理解）

**打开多个浏览器窗口，每个窗口显示一颗量子粒子。拖动任意窗口，粒子跟着移动；粒子之间根据距离产生纠缠光束和飘散粒子的互相吸引效果。**

- 单窗口：一颗量子 + 轨道 + 飘散 + 波纹 + 轨迹（观赏型）
- 多窗口：量子之间出现**能量光束**（距离越近越强），飘散粒子会被其他窗口量子吸引（跨屏幕统一坐标）

---

## 三、架构与文件树

```
quantum-entanglement/
├── src/
│   ├── main.ts                     # Vue 入口
│   ├── App.vue                     # 根组件：全屏 wrapper，纯黑背景
│   ├── components/
│   │   └── QuantumScene.vue        # ⭐ 核心场景编排：装配 + 动画循环 + UI 覆盖层
│   ├── core/
│   │   ├── QuantumParticle.ts      # ⭐ 量子粒子类（7 层视觉：核心着色器/多层发光/轨道/飘散/波纹/轨迹/星芒）
│   │   ├── SceneController.ts      # 场景控制器（正交相机 + Bloom 后期 + world 偏移 + 背景星云 + 纠缠光束）
│   │   └── WindowManager.ts        # ⭐ 窗口管理器（BroadcastChannel + localStorage 心跳同步跨窗口坐标）
│   └── utils/
│       └── textures.ts             # Canvas 生成纹理：圆形发光 / 软光晕 / 星芒十字
├── public/favicon.svg
├── dist/                           # 构建产物
├── package.json                    # 依赖
├── vite.config.ts                  # Vite 配置：host 0.0.0.0，port 5173，base './'，viteSingleFile 单文件打包
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── .agents/ .cursor/ .windsurf/    # 各种 IDE 的 ponytail 规则（见 AGENTS.md）
```

---

## 四、关键模块详解

### 4.1 QuantumParticle.ts — 量子粒子（视觉层）

单颗量子由 7 层叠加实现（全 THREE AdditiveBlending + depthWrite:false）：

| 层 | 实现 | 说明 |
|---|---|---|
| 1. 等离子核心 | ShaderMaterial + IcosahedronGeometry(35, 5) | 多层 fbm 噪声流 + Fresnel 边缘 + 电弧尖锐边缘，自旋转 + 脉冲缩放 1±0.06 |
| 2. 内层强光 | Sprite(160×160) | createGlowTexture，透明度 0.55±0.15 脉冲 |
| 3. 外层柔光 | Sprite(400×400) | createSoftGlowTexture，0.3±0.08 更大扩散 |
| 4. 星芒十字 | Sprite(250×250) + 缓慢旋转 | createStarTexture，0.35±0.15 脉冲 |
| 5. 轨道粒子 | Points(1000 本地 / 300 远程 lightweight) | 椭圆轨道（半径 50+rand×120，3D z 波动） |
| 6. 飘散粒子 | Points(1800 / 500 远程) | 围绕核心引力 + 外部吸引器 + 切向轨道效应，阻尼 0.95 |
| 7. 能量波纹 | RingGeometry 每 0.8s 一张，扩散 2.5s 内 scale×9 | ShaderMaterial 边缘衰减 |
| 轨迹 | Line 长度 60 点，**直接挂 world 根**（不挂 group，避免坐标双叠加 bug） | 位置 `unshift`，透明度 0.35 |

**构造参数**：
```ts
new QuantumParticle(id: string, colorHex: string, lightweight = false)
// 本地量子 = 1000 轨道 + 1800 飘散
// 远程量子 lightweight = 300 轨道 + 500 飘散（省性能）
```

### 4.2 SceneController.ts — 场景驱动

- **正交相机**：`OrthographicCamera(0, w, 0, h, -10000, 10000)`，左上原点，与屏幕像素坐标 1:1 对齐
- **world 偏移技巧**：所有粒子挂在 `world: Group` 下；每帧把 `world.position.x/y = -screenX/screenY`，这样 world 坐标系就是**桌面统一坐标系**（窗口左上角偏移正好抵消）
- **后期链**：RenderPass → **UnrealBloomPass(strength 1.5, radius 0.8, threshold 0)** → OutputPass
- **额外导出类**：
  - `BackgroundStars`：10000 颗彩色背景星云，缓慢漂移 + 边界回绕
  - `EntanglementBeams`：量子间的能量管道光束（TubeGeometry + 正弦波形扰动 + 着色器脉冲）

### 4.3 WindowManager.ts — 跨窗口同步（架构核心）

参考 bgstaal 项目方案：

| 通道 | 作用 |
|---|---|
| BroadcastChannel(`quantum-window-channel`) | 实时消息：`update` / `leave` / `request-all` |
| localStorage(`quantum_windows`) | 持久化 + storage 事件降级（BroadcastChannel 挂了时兜底） |
| 心跳 200ms | 更新自身 shape + timestamp 广播 |
| 清理 1000ms | 过滤 `timestamp > 5000ms` 的死窗口 |

每个窗口数据：
```ts
{ id: number, shape: {x,y,w,h}, color: string, timestamp: number }
```

### 4.4 QuantumScene.vue — 编排 & UI

**装配顺序**：
1. SceneController → 挂 BackgroundStars
2. 本地 QuantumParticle（非 lightweight），trailLine 直接挂 world
3. EntanglementBeams
4. WindowManager（颜色随机从 8 色相差异大的色板取）
5. 立即填初始位置 + 轨迹预填充（避免初始拖尾偏移到右下角 bug）

**动画循环每帧**：
1. 更新星云
2. world.x/y = -screenX/-screenY（**不缓动，避免初始漂移**）
3. 本地量子位置 = 窗口中心桌面坐标
4. 遍历其他窗口：生成吸引器数组 + 光束连接数组
5. 本地量子 `update(delta, time, attractors)`
6. 远程量子：位置 = 对方中心，也做自己的吸引器（飘散粒子视觉统一）
7. 光束 `update(connections)` + `updateTime(time)`

**远程量子生命周期**：窗口出现 → lightweight 实例化 + 轨迹预填充；窗口消失 → dispose + Map 清理

**覆盖层 UI**（`ui-overlay` pointer-events: none）：
- 左上 info-panel：黑半透明 0.6 + blur(12px) + 蓝边 12px 圆角
  - 颜色点 + "量子 #id" 标题
  - 三行信息：窗口位置 / 尺寸 / 纠缠数（青色高亮大字）
  - 纠缠列表：其他量子色点 + #id + 距离 px（橙色）
- 底部居中 hint："拖动此浏览器窗口 · 打开多个窗口体验量子纠缠"

---

## 五、命令速查

| 用途 | 命令 |
|---|---|
| 开发服务器 | `cd d:\codex\quantum-entanglement ; npm run dev` → http://localhost:5173 |
| 生产构建（单文件 HTML） | `npx vite build`（跳过 vue-tsc，直接打包） |
| 完整构建（含类型检查） | `npm run build`（先 vue-tsc --noEmit 再 vite build） |
| 本地预览构建物 | `npm run preview` |
| 类型检查 | `npx vue-tsc --noEmit` |

### 5.1 打包方式：单文件 HTML（离线可双击直开）

本项目使用 **`vite-plugin-singlefile`** 插件，构建时把所有 JS / CSS **全部内嵌**进 `dist/index.html`，生成一个真正的单文件 HTML，双击即可在浏览器打开，**无需 nginx / dev server**。

**为什么用 singlefile？**
> Vite 默认产物用 `<script type="module" src="./assets/xxx.js">` 外链 JS。在 `file://` 协议下，Chromium 内核会因为 **CORS 策略** 拦截模块脚本加载（每个 `file://` URL 被当作独立安全域），导致白屏 + 控制台一堆 `Cross origin null` 红报错。singlefile 把所有资源内联成 `<script>` / `<style>` 标签，不再有外部请求，彻底绕开此问题。

**`vite.config.ts` 关键配置：**
```ts
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [vue(), viteSingleFile()],
  base: './',                    // 相对路径，file:// 直开可定位 favicon
  build: {
    target: 'es2020',
    assetsInlineLimit: 100_000_000,   // 所有资源都内联
    chunkSizeWarningLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } }
  }
})
```

**构建产物结构：**
```
dist/
├── index.html   ← 618 KB，JS/CSS 全内嵌，双击此文件即可打开
└── favicon.svg  ← 标签页图标（与 index.html 同目录，非必须）
```

> ⚠️ `dist/index.html` 依赖同目录的 `favicon.svg`（相对路径引用）。如果要拷贝到别处，整个 `dist/` 文件夹一起拷，不能只拿单个 HTML。
>
> ⚠️ 唯一保留的外链是 Google Fonts CDN（`Share Tech Mono` 字体），**需要联网**；断网时自动回落为 `Courier New` 等宽字体，不影响渲染。

### 5.2 设置为浏览器默认页 / 待机页

**Chrome / Edge 设为启动页：**
1. 设置 → 启动时 → "打开特定页面或一组页面" → 添加新页面
2. 地址栏填：`file:///D:/codex/quantum-entanglement/dist/index.html`（注意三斜杠，路径换成实际位置）

**Firefox 设为主页：**
1. 设置 → 主页 → 主页和新窗口 → 自定义网址
2. 粘贴上面的 `file:///...` 路径

**Windows 桌面动态壁纸 / 锁屏待机页：**
| 工具 | 说明 |
|---|---|
| Lively Wallpaper（Microsoft Store 免费，推荐） | 支持网页设为桌面/锁屏壁纸，把 `index.html` 拖进去即可 |
| Wallpaper Engine（Steam 付费） | 同样支持 Web 壁纸，特效更丰富 |

---

## 六、已知坑 & 临时方案

| # | 问题 | 说明 |
|---|---|---|
| 1 | screenX/screenY 在页面打开**瞬间**读不准 | 用 `setTimeout(init, 100)` 延迟初始化，并且 world 偏移 / 量子位置 **每帧直接设置不做缓动** |
| 2 | 轨迹如果挂在 `quantum.group` 下，会把 group.position 叠加一次 → **正好偏移到 2×center = 右下角** | 硬约束：`trailLine` 必须直接挂在 `sceneCtrl.world` 根下，不能挂量子 group（代码中有注释说明原因） |
| 3 | 远程量子刚出现时轨迹会从 (0,0) 拖一条长线到当前位置 | 初始化轨迹点全部 `copy(worldPosition)` 预填充（代码已有） |
| 4 | BroadcastChannel 不支持的极老浏览器 | 降级：监听 `window.storage` 事件同步 localStorage（代码已有 try/catch 降级） |
| 5 | 多窗口性能 | 远程量子必须走 `lightweight=true`（300+500 粒子），不然 4+ 窗口会卡 |
| 6 | 粒子纹理是 Canvas 动态生成 | 不会触发 CORS，但要记得 dispose（QuantumParticle.dispose 已处理） |

---

## 七、下一步待办（优先级）

1. （可选）移动端触屏支持：当前只响应拖动窗口，移动端可加屏幕内拖动手势控制量子位置
2. （可选）量子碰撞效果：两颗量子距离 < 阈值时触发闪电/爆散特效
3. （可选）声音：WebAudio 跟随距离合成环境音
4. （可选）设置面板：调整 Bloom 强度、粒子数、颜色自定义
5. （可选）PWA + 新窗口打开按钮，方便一键开多窗口

---

## 八、关键交叉引用

- 正交相机 + world 偏移论文/参考：bgstaal/multipleWindow3dScene 原方案
- 着色器细节：QuantumParticle 的核心 fbm / Fresnel / arc 电弧、beam 的 pulse 流动
- Ponytail 编码规范：见本项目 **[AGENTS.md](file:///d:/codex/quantum-entanglement/AGENTS.md)**（Ponytail 懒鬼高级开发模式，和 life_hub 项目的 AGENTS 风格完全不同）
