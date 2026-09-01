# DESIGN.md — 量子纠缠 (quantum-entanglement) 设计规范

> 风格定位：**纯黑深空 × 霓虹量子粒子 × 科幻全息**
> 背景：用户硬约束纯黑 (#000000)，在此基础上加霓虹色、发光叠加、Bloom 后期
> 最后更新：2026-08-12

---

## 一、风格总原则

```
✓ 纯黑深空背景                    ✗ 深蓝深紫等"类黑"替代色
✓ 加法光混（AdditiveBlending）      ✗ 实体材质遮罩
✓ 多层发光叠加（Glow）              ✗ 实体描边 / 轮廓线
✓ 有机流动（噪声/正弦/轨道）         ✗ 机械线性动画
✓ 极克制的文字 UI（半透明面板）      ✗ 花里胡哨按钮导航栏
✓ 全息感（模糊 + 半透明边框）        ✗ 实心纯色卡片
✓ 差异大的色板（多窗口一眼可辨）     ✗ 相似色无法区分量子归属
```

---

## 二、色彩系统

### 2.1 基础色

| Token | 值 | 说明 |
|---|---|---|
| 背景 bg | `#000000` | ⚠️ **硬约束**：全项目 Canvas 底色 + CSS 底 + Scene.background，一律纯黑，绝不允许 #000005 / #0a0a12 这类"偷懒纯黑" |
| UI 面板底 | `rgba(0, 0, 0, 0.6)` | info-panel 专用：60% 不透明黑 + backdrop-filter blur(12px) |
| UI 边框 | `rgba(100, 200, 255, 0.15)` | 冷蓝青色极细描边，全息感 |
| UI 分隔线 | `rgba(100, 200, 255, 0.06 ~ 0.1)` | info-row 分隔、列表分隔 |

### 2.2 文字色（偏冷全息风，不要纯白 #fff）

| Token | 值 | 用途 |
|---|---|---|
| 主文字（标题） | `#FFFFFF` | 标题（14pt w600）、主标签 |
| 次文字（数值） | `#D0E8FF` | 窗口位置/尺寸等数值字段 + `SF Mono` 等宽 |
| 高亮计数 | `#00FFFF` | 纠缠数量、特别强调（16pt 粗体青色） |
| 辅助标签 | `rgba(180, 200, 240, 0.4)` | label（"窗口位置"等弱提示） |
| hint 说明 | `rgba(180, 200, 240, 0.4)` | 底部操作提示（12pt） |
| 列表弱文字 | `rgba(255, 255, 255, 0.6)` | 纠缠列表项文字 |
| 距离值（暖） | `rgba(255, 200, 100, 0.7)` | 橙色点缀，距离数值 |

### 2.3 量子粒子色系（多窗口色板）

从**差异大的 8 色相**随机抽取，保证多窗口开 4~8 个量子颜色**肉眼绝对可区分**：

```ts
const hues = [180, 210, 270, 300, 340, 45, 120, 0]
const s = 85 + rand × 15     // 高饱和
const l = 55 + rand × 10     // 明度偏亮
```

| Hue | 主感 | 代表色 |
|---|---|---|
| 0 | 警告红 | `hsl(0, 95%, 60%)` |
| 45 | 暖橙金 | `hsl(45, 90%, 60%)` |
| 120 | 自然绿 | `hsl(120, 90%, 60%)` |
| 180 | 量子青（默认） | `hsl(180, 95%, 60%)` |
| 210 | 宇宙蓝 | `hsl(210, 95%, 60%)` |
| 270 | 深紫 | `hsl(270, 95%, 60%)` |
| 300 | 霓虹粉紫 | `hsl(300, 95%, 60%)` |
| 340 | 品红 | `hsl(340, 95%, 60%)` |

每颗量子的**核心着色器内部还会衍生辅助色**：
```
uColor2 = uColor.offsetHSL(+0.08, 0, +0.35)  // 偏亮偏偏黄
轨道/飘散粒子再在 ±0.4 light / ±0.3 light 内打散
```

### 2.4 背景星云色板（10000 颗）

| 概率 | 颜色 | 感观 |
|---|---|---|
| 3% | `#FFCC88` 暖黄巨星 | 点缀 |
| 7% | `#88AAFF` 蓝巨星 | 重点点缀 |
| 5% | `#FF88AA` 粉红星 | 点缀 |
| 85% | HSL(0.6~0.75, 0.5, 0.2~0.7) 蓝青系 + 随机亮度 | 主体星空 |

---

## 三、字体

```
全局：-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
数值字段：'SF Mono', monospace（info-panel 的 .value 类）
```

| 用途 | 字号 | 字重 |
|---|---|---|
| 面板标题（量子 #N） | 14 | 600 |
| 纠缠高亮数值 | 16 | bold / 700（青色） |
| 列表行 / 信息行 | 10-11 | regular |
| 底部 hint | 12 | regular |

---

## 四、视觉层规范（Three.js 端）

### 4.1 渲染管线（硬顺序，勿改）

```
渲染器 → RenderPass(scene, camera) → UnrealBloomPass → OutputPass
```

| 参数 | 值 | 说明 |
|---|---|---|
| Renderer.antialias | true | 抗锯齿 |
| Renderer.powerPreference | high-performance | 独显模式（有集显核显机型必走独立卡）|
| Renderer.pixelRatio | min(devicePixelRatio, 2) | 防止 Retina 机器像素比 3 爆性能 |
| Renderer.clearColor | `0x000000` | ⚠️ 纯黑 |
| Bloom.strength | 1.5 | 主体发光强度 |
| Bloom.radius | 0.8 | 扩散半径 |
| Bloom.threshold | 0.0 | 0 阈值保证黑色背景粒子也 Bloom |

### 4.2 材质共享规则（省 GPU）

- `AdditiveBlending` + `depthWrite: false` 所有粒子 / 发光统一
- 纹理生成统一用 `textures.ts` 工具，不重复画 Canvas
- 本地量子 1000 轨道 / 1800 飘散 → 远程量子 **lightweight 模式** 300/500

### 4.3 单颗量子视觉层次（7 层叠加）

```
z-layer  外层柔光 Sprite(400×400)  softGlow  0.3±0.08 脉冲
z-layer  星芒十字 Sprite(250×250)  慢旋转 0.35±0.15
z-layer  内层强光 Sprite(160×160)  glow  0.55±0.15 脉冲
z-layer  飘散粒子 Points  围绕引力/吸引器/切向力  0.75 alpha
z-layer  轨道粒子 Points  椭圆轨道三维  0.9 alpha
z-layer  能量波纹 Ring  每 0.8s 一张  scale 1→9  2.5s 消散
z=0      等离子核心 Icosahedron(35, 5)  ShaderMaterial
         └ fbm 噪声流 2~3 倍速 3 层混合
         └ Fresnel pow(2.5) 边缘 0.5 倍白光
         └ 电弧 smoothstep 0.55~0.65 尖锐高亮点 2×uColor2
         └ 自旋转 x=0.25/s  y=0.4/s
         └ 脉冲缩放 1±0.06 (sin 2.5Hz)
底       轨迹 Line（60 点）0.35 alpha  Additive
```

**色彩 dot（UI 覆盖层色点）规则**：
```
大：10px 直径（标题旁）+ 0 0 12px 光晕阴影
小：6px 直径（纠缠列表） + 0 0 8px 光晕阴影
```

### 4.4 能量光束（量子间）

```
TubeGeometry(catmull-rom curve × segments24, radius max(2,6*intensity), radial=8)
```
- 5×正弦扰动 + 3×Z 抖动（管长方向波动，增强"光流"）
- 着色器 `pulse = sin(vUv.x × 15 − uTime × 3) × 0.5 + 0.5`：流动光脉冲
- 边缘 `sin(vUv.y × π)` 柔边
- 强度 = `max(0, 1 − dist/1500)`，>0.01 才创建
- 吸引器飘散粒子 = `max(0, 1 − dist/2000)`

### 4.5 背景星云

- 10000 颗，6000px 范围
- 缓慢漂移 0.15 px/frame，超出 ±3000 回绕
- 整体 alpha 0.6 ± 0.2 慢呼吸（`sin(time × 0.5)`）

---

## 五、UI 覆盖层规范（DOM 端）

### 5.1 信息面板（info-panel）

```
位置：top:20px  left:20px
min-width：220px
padding：16px 20px
圆角：12px
背景：rgba(0,0,0,0.6)
模糊：backdrop-filter: blur(12px)   + webkit 前缀
描边：1px solid rgba(100,200,255,0.15)
pointer-events：auto（可选，以便后续加交互）
```

内部结构：
1. **header**：色点 10px（12px glow shadow）+ 标题 14/w600 + gap 8px
2. **info-row × 3**：space-between 左右分布，11px，底部 1px 分隔线（最后一条无）
   - label（左）：rgba(180,200,240,0.4)
   - value（右）：#D0E8FF  SF Mono 10px
3. **entangled-list**（可选，仅纠缠数>0 出现）：
   - border-top 10% 蓝青分隔，padding-top 10
   - item 行：6px 色点 + #id + 距离（auto margin 靠右橙色）font 10 SF Mono

### 5.2 Hint 提示

```
位置：bottom:24px  left:50% translateX(-50%)
文字：12px  rgba(180,200,240,0.4)
居中一行："拖动此浏览器窗口 · 打开多个窗口体验量子纠缠"
```

### 5.3 全局约束

```css
html, body, #app { width:100%; height:100%; overflow:hidden; background:#000; }
```
- **绝对禁止出现滚动条**
- 所有 overlay 的容器 `pointer-events: none`，可交互子节点单独改 `auto`

---

## 六、动效 & 时间曲线

| 场景 | 时长 | 曲线 | 说明 |
|---|---|---|---|
| 核心脉冲缩放 | 0.4s / 周期 | `sin(2.5Hz)` | 1 ± 0.06 |
| 强光脉冲 | 0.5s / 周期 | `sin(2Hz)` | 尺寸 ±12.5%，透明度 ±13.6% |
| 柔光脉冲 | 0.833s / 周期 | `sin(1.2Hz)` | 尺寸 ±10%，透明度 ±7.2% |
| 星芒旋转 | 10s / 转 | linear | 0.1 rad/s |
| 星芒呼吸 | 0.555s / 周期 | `sin(1.8Hz)` | ±12% 尺寸 ±10% alpha |
| 轨道整体自旋 | 78.5s / 转 | linear | 0.08 rad/s |
| 背景星云呼吸 | 12.56s / 周期 | `sin(0.5Hz)` | 0.6±0.2 |
| 波纹扩散 | 2.5s 总生命 | linear（自定义）| scale×9，alpha 1→0 线性 |
| 波纹生成间隔 | 0.8s | 固定 | |
| 心跳同步 | 200ms 间隔 | — | WindowManager 上报形状 |
| 死窗口清理 | 5000ms | — | 无心跳超过即移除 |

**禁做动画**（违反"克制的科幻"调性）：
- ❌ 全屏彩色闪屏切换
- ❌ 文字逐字出现打字机
- ❌ 面板滑入滑出（这个项目面板就一直显示）
- ❌ 粒子爆炸 / 屏幕震动

---

## 七、坐标系约定（非常重要，改就坏）

1. **相机坐标系 = 屏幕像素坐标**（正交相机）：左上角 (0,0)，右下 (w,h)，每像素 = 1 单位
2. **世界坐标系 = 桌面像素坐标**：所有粒子位置都按桌面上的真实像素摆放
3. **world 偏移 = 窗口左上角屏幕坐标的相反数**：`world.pos = (-screenX, -screenY, 0)`
4. **量子位置**：窗口中心 `(screenX + w/2, screenY + h/2)`
5. **轨迹线**：直接挂 `world` 根节点，**不能挂 quantum.group**（否则 world.position 叠加两次，正好 2×center，粒子拖尾会偏移到右下角——HANDOFF §六第2条有说明）

---

## 八、性能预算（开发新功能前必查）

单窗口（本地量子 1 颗 + 远程 0 颗）目标：
- FPS ≥ 60（2020 年后主流独显机型）
- 不卡顿：打开 4 窗口 FPS ≥ 30

| 项目 | 当前预算 | 修改前必须权衡 |
|---|---|---|
| 本地量子轨道粒子 | 1000 | 超过 1500 显卡负担翻倍 |
| 本地量子飘散粒子 | 1800 | 超过 2500 掉帧 |
| 远程量子（每个） | 300+500 | 8 窗口极限 |
| 背景星云 | 10000 | 不建议动 |
| 轨迹采样 | 60 | 可下调到 30 但拖尾会短 |
| 波纹数量上限 | ~3/量子 | 别改 RIPPLE_INTERVAL <0.5 |
| Bloom | strength 1.5 | 超过 2.0 开始过曝糊一片 |
| pixelRatio | min(DPR, 2) | 别强制 2，4K 屏卡死 |

---

## 九、新增功能 Checklist

```
□ 底色是不是绝对 #000？有没有偷偷换成深灰渐变？
□ 新增粒子是不是 AdditiveBlending + depthWrite:false？
□ dispose() 把 geometry / material / texture 都清了吗？（不能内存泄漏）
□ 远程量子是否走 lightweight 分支？
□ 坐标系统有没有遵守 world 偏移 + 轨迹挂根的两条铁律？
□ 多窗口（开 4 个）测试 FPS 是否仍然 ≥ 30？
□ UI 文字是不是全息冷色系（#D0E8FF / #00FFFF 等）？有没有误用纯白或暖色？
□ 信息面板有没有 blur(12px) + 半透明边？是不是实体不透明卡片？
```
