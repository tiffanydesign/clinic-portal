# Clinic Portal — Universal KPI Card 设计规范 v1.0

> 范围：只定义数据的呈现（presentation），不定义指标口径与业务计算。
> 目标：全站 KPI 卡收敛为一个组件族、4 个 variant、2 个尺寸；紧凑、低高度、可并排。
> 基调：Linear/Stripe 式克制——数字是主角，装饰零容忍。

---

## 1. KPI Card 类型审计

### 1.1 通用类型 × Portal 现状对照

| 类型 | 用途 | 典型数据 | 何时使用 | Portal 中的实例 |
|---|---|---|---|---|
| **Basic metric** | 陈述一个数 | 数值 + 标签 | 数字本身即答案，无需比较 | Staff Detail 的 Assigned Patients、Timesheet 概览 |
| **Comparison metric** | 本期 vs 上期 | 数值 + delta + 方向 | 运营复盘、发现变化 | Admin 的 Appointments Today（↑3 vs last Friday） |
| **Trend metric** | 走势形状 | sparkline | 变化的形状比幅度重要 | Admin KPI 卡的趋势线 |
| **Live metric** | 当下快照 | 数值 + LIVE 标识 | 值随时在变、与周期无关 | In Clinic Now、Results Pending Review |
| **Goal / Progress metric** | 完成度 | x/y + 进度条 | 有明确终点 | Nurse 的 3/5 段汇总、Attendance 20 of 22 |
| **Status metric** | 定性状态 | 状态词 + 计数 | 好/坏比多/少重要 | Terminal Online 3/4、Utilisation 78% |
| **Actionable count**（Portal 特有） | 待办队列入口 | 计数，可点筛选 | 点了就去处理 | Results to Review、Unpaid、Needs Your Action |

**审计结论**：Trend 不是独立类型——它是 Comparison 的可选元素（sparkline）。Status 也不是——它是 Basic/Progress 加语义色。Actionable count 是 Basic 的交互态。7 类可压成 4 个 variant。

---

## 2. 通用 KPI Card 系统（4 个 variant × 2 个尺寸）

| Variant | 覆盖场景 | 必选元素 | 可选元素 |
|---|---|---|---|
| **Metric** | Basic、Status、Actionable count | Title、Primary value | icon、suffix（₺金额/next 09:15）、alert dot、点击下钻 |
| **Comparison** | 本期 vs 上期、Trend | Title、Primary value、Delta（方向+文字） | sparkline、period 徽标（TODAY/7D）、锁 icon |
| **Live** | 实时快照 | Title、Primary value、LIVE 徽标 | 期间均值参考文字（灰色、无箭头）、点击下钻 |
| **Progress** | 完成度、分段汇总 | Title、`x / y` 值、进度条或分段点 | 百分比、分段 label（Scheduled/Done） |

**尺寸**：
- `regular`：Dashboard 网格卡（高 ≤96px）；
- `compact`：单行统计条内的一项（高 ≤56px，无边框，用于 Summary Bar / Queue Counters / Timesheet 条）。

**明确排除**：行内计数徽标（tab 计数、分组计数）不属于 KPI Card，归 Badge/Pill 组件；仪表盘 gauge、环形图、插画卡一律不做。

---

## 3. 信息层级（视觉权重从强到弱）

```
1. Primary value   ——唯一的视觉锚点，全卡最大最重
2. Delta / 进度    ——第二眼：变化方向或完成度
3. Title           ——定位用，小而稳定（uppercase label）
4. Supporting text ——参考信息（均值、suffix、timestamp）
5. Icon / 徽标     ——辅助识别，永不与数字争抢
```

| 元素 | 规格 | 规则 |
|---|---|---|
| Title | 11px / 600 / uppercase / letter-spacing 0.06em / secondary 色 | 一行截断，完整名进 tooltip（点击弹层，非 hover） |
| Primary value | regular 28px、compact 20px / 600 / primary 色 / tabular-nums | 永不换行、永不截断 |
| Delta | 12px / 500 / 语义色 + ↑↓→ 箭头 | 箭头与颜色必须同时出现 |
| Supporting | 12px / 400 / muted | informational 均值无箭头无色 |
| Status/LIVE 徽标 | 10px / 600 / uppercase pill | 紧跟 Title 行，不占独立行 |
| Icon | 20px（regular）/ 16px（compact），secondary 色 | 仅 Metric variant 可用，置于 Title 左 |
| Timestamp | 并入 Supporting（"as of 09:14"） | 仅 Live 需要时显示 |

---

## 4. 布局规范

### Regular（两区横排，压高度的关键）

```
┌────────────────────────────────────────────┐
│ TITLE ●LIVE 🔒            ╱╲╱╲╱  spark     │  ← 行1：title+徽标 | 右上 spark
│ 1,284 ₺                   ↑ 3 vs last Fri  │  ← 行2：大数字    | 右下 delta
└────────────────────────────────────────────┘
   高 88–96px · padding 16px · 左右两区 space-between
```

- **左区**（主信息，左对齐）：Title 行（含徽标）→ Primary value；
- **右区**（趋势信息，右对齐）：sparkline（72×28）→ Delta；
- Metric/Live 无右区内容时，左区垂直居中，卡可等宽收窄；
- Progress：value 行右侧放 `x / y`，下方通栏 4px 进度条（代替右区）。

### Compact（单行，用于 strip）

```
│ 1,284  UNPAID · ₺8,400 │ 5  IN CLINIC │ ...
   数字20px + label 12px 同行，项间 32px 或细分隔线，高 ≤56px
```

### 通用

| 属性 | 值 |
|---|---|
| 圆角 | 12px |
| 边框/阴影 | 1px border（token: --divider），**无常驻阴影**；可点卡片 pressed 态加浅阴影 |
| 卡间距 | 16px |
| 最小宽度 | regular 200px，4 卡一行 ≥1200px 容器；不足时 2×2 |
| 对齐 | 数字左对齐（西文数字左对齐扫读最快）；delta/spark 右对齐 |
| 触控 | 可点卡整卡为热区 ≥44pt，focus ring 2px accent |

---

## 5. 状态 variants

| 状态 | 视觉差异 |
|---|---|
| Default | 如上 |
| Live | Title 行加 `● LIVE` 绿点 pill；无 sparkline 趋势叙事；supporting 为灰色均值文字 |
| Comparison positive | delta 绿 + ↑（inverse 指标：下降才是绿，方向箭头如实显示 ↓） |
| Comparison negative | delta amber + ↑/↓（坏方向用 amber，红色保留给 blocked/overdue 级） |
| Neutral / flat | delta 灰 + →，"no change" |
| Alert（Metric） | 数字旁 6px amber 圆点 + supporting 说明（如 "1 overdue"） |
| Loading | skeleton：title 条 + 数字块灰条呼吸动画；不显示 spinner |
| Empty / no data | 数字位显示 "—"，supporting "No data yet"；不隐藏卡片（保持网格稳定） |
| Error | 数字位 "—" + supporting "Couldn't load · Retry"（Retry 为行内可点文字） |

---

## 6. Design Tokens（8pt 网格）

```css
/* Typography */
--kpi-title:     11px/600, uppercase, ls 0.06em;
--kpi-value-lg:  28px/600, tabular-nums;   /* regular */
--kpi-value-sm:  20px/600, tabular-nums;   /* compact */
--kpi-delta:     12px/500;
--kpi-support:   12px/400;

/* Color（引用系统语义 token，不新造色） */
--kpi-value:     var(--text-primary);
--kpi-title-c:   var(--text-secondary);
--kpi-good:      var(--status-success);
--kpi-bad:       var(--status-warning);   /* 坏方向=amber；red 只给 blocked/overdue */
--kpi-live:      var(--status-success);
--kpi-neutral:   var(--text-muted);

/* Shape & space */
--kpi-radius: 12px;
--kpi-pad: 16px;
--kpi-gap-row: 4px;      /* title 与数字之间 */
--kpi-gap-card: 16px;    /* 卡间 */
--kpi-elevation: none;   /* hover/press: 0 2px 8px rgba(16,33,75,.08) 仅限可点卡 */

/* Icon */
--kpi-icon: 20px;  --kpi-icon-sm: 16px;
```

---

## 7. Accessibility

- 对比度：value/title 对底色 ≥4.5:1；delta 语义色文字 ≥4.5:1（amber 用深档 #B45309 级）；
- **方向不只靠色**：↑↓→ 箭头 + 文字（"vs last Friday"）永远伴随颜色；inverse 指标语义在 delta 文案中自明；
- 数字格式：tabular-nums；千分位 en 格式（₺4,800）；**计数不缩写**（127 不写 0.1K），金额 ≥₺100,000 可缩写（₺124K）并 tooltip 全值；
- 大数溢出：字号不缩、卡内滚动禁止——超宽时 sparkline 先让位收窄，再隐藏；
- 长标题：一行 ellipsis，点击弹层显示全称（无 hover tooltip，iPad）；
- 响应式：4 → 2×2 → （compact strip 横向滚动，禁止换行堆高）；
- 屏幕阅读器：卡为单一可聚焦元素，aria-label = "Title, value, delta 全文"。

---

## 8. Figma 组件结构

```
KPI Card (Component Set)
├── Variant: type = Metric | Comparison | Live | Progress
├── Variant: size = Regular | Compact
├── Variant: state = Default | Loading | Empty | Error
└── Variant: trend = None | Up-good | Up-bad | Down-good | Down-bad | Flat
```

| 属性类型 | 属性 |
|---|---|
| Boolean | showIcon、showSpark、showLock、showBadge（LIVE/TODAY/7D）、interactive |
| Text | title、value、suffix、deltaText、supportText |
| Instance swap | icon（20px slot）、badge |
| Auto Layout | 卡：horizontal, space-between, padding 16, fill-W × hug-H（max 96）；左区：vertical, gap 4, hug；右区：vertical, gap 4, hug, 右对齐 |

命名建议：`KPI/Comparison/Regular/Default/Up-good`。sparkline 做成独立子组件（`KPI/.spark`）以便统一改样式。

---

## 9. 最终决议

**Design System 只保留 4 个 variant**：Metric / Comparison / Live / Progress，各 × Regular/Compact 两尺寸 + 4 个数据状态。

**明确不做**：独立 Trend 卡（spark 是 Comparison 的 boolean）；gauge/环形仪表；带插画或大 icon 的营销风卡片；每卡自定义配色；**Live 卡上的趋势线叙事**（live 数配趋势是伪信息）；Actionable count 做成 Regular 大卡（待办数没有趋势，只配 Metric compact/tile）。

**一致性三法则**：
1. 一个 Dashboard 行内所有卡同 variant 同尺寸——不允许一行里混大小；
2. 语义色只表达好坏方向与 LIVE，不用于装饰；amber=坏方向，red 只留给 blocked/overdue；
3. 数字是唯一主角：任何新增元素（icon、徽标、spark）不得大于、亮于、先于 Primary value。

**给 Figma 的一句话规格**：12px 圆角 1px 描边白卡，16px padding，左区 11px uppercase 标题 + 28px/600 tabular 数字，右区 72×28 sparkline + 12px delta（箭头+语义色），整卡 ≤96px；compact 版去边框单行 20px 数字，≤56px。
