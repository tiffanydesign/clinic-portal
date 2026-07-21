# TOKEN_AUDIT.md — Phenome Portal 样式现状审计 + Token 冻结映射

> **两步交付合一文档。** Step 0 是现状扫描；Step 1 的冻结 token 已回填进每张表的
> 「建议归入」列，形成下一步迁移的**工单清单**。本任务只产出报告 / token / 脚本，
> **未改动任何页面代码**。

> ⚠️ **审计修正（迁移中发现）**：Step 0 初版只扫 `.tsx`，遗漏了 7 个 `.ts` 数据文件里的
> **165 个调色板类 + 9 个 hex/任意值**（`feedbackData.ts`、`staffData.ts`、`dashboardData.ts`
> 等把 `SOURCE_COLORS`/`STATUS_PILLS`/角色 pill 样式常量写在 `.ts` 里）。
> 扫描器与 check 脚本均已扩至 `.ts`；**修正后的真实基线 = 879**（原报 863 偏低）。

## 扫描方法（可复核）

- **范围**：`src/app/**/*.{tsx,ts}` + `src/styles/*.css`（5 个，实质只有
  `theme.css`）。**排除** `node_modules`、`src/imports`、`dist`。
  （`.ts` 必须包含：共享样式常量映射在 `*Data.ts` / `*View.ts` 中。）
- **口径**：occurrence = 每个正则命中一次计一次（同一行多次分别计数），因此数字可复核。
- **命令**：
  ```bash
  node scripts/audit-tokens.mjs           # 人读报告（本文件所有数字的来源）
  node scripts/audit-tokens.mjs --json    # 结构化输出，供工具消费
  ```
  抽查用（无 rg 时用 grep -rE）：
  ```bash
  # 例：text-sm 出现次数
  grep -roE '(^|[^-a-z])text-sm([^-a-z]|$)' src/app --include=*.tsx | wc -l
  # 例：硬编码 hex
  grep -roE '#[0-9a-fA-F]{3,8}\b' src/app --include=*.tsx | sort | uniq -c | sort -rn
  ```
- **冻结 token 全集见** `src/styles/theme.css` 的 “FROZEN COMPACT TOKENS” 段。

## 冻结结论速览（Step 1 → 迁移目标）

| 维度 | 冻结 token | 数量 |
|---|---|---|
| Spacing | `--space-1/2/3/4/6` = 4/8/12/16/24 | 5 |
| Typography | `--text-page-title/section/body/data/label/overline` (+`--kpi-value-lg/sm`) | 6 (+2) |
| Radius | `--radius-sm` 8 / `--radius-md` 12（`rounded-full` 保留） | 2 |
| 控件高度 | `--control-h` 38 / `--control-h-sm` 32 / `--row-h` 48 / `--row-h-dense` 40 / `--touch-target` 44 | 5 |
| 语义/文本/表面色 | status ×5 + text ×3 + surface ×3(`page/card/divider`) | 11 (≤15) ✅ |
| Elevation | `--shadow-none` / `--shadow-raised` | 2 |

**收敛幅度**：字号 24→6(+2)｜间距 192→5｜圆角 24→2(+full)｜阴影 22→2｜控件高度散乱→5。

---

# Step 0 + Step 1：六类统计与映射表

## 1. Font sizes — 24 distinct, 1597 occurrences

| 值 | 次数 | 主要文件 | 建议归入 |
|---|---|---|---|
| `text-sm` 14px | 686 | BillingPage(23) · FeedbackAdminPage(22) · ProfilePage(18) | **`--text-body`** ✓ 精确 |
| `text-xs` 12px | 461 | BillingPage(24) · FeedbackAdminPage(22) · PatientJourneyCard(17) | **`--text-label`** ✓ 精确 |
| `text-[10px]` | 133 | PatientsPage(13) · MyScheduleGrid(8) · FeedbackAdminPage(8) | **`--text-overline`**（↑11px；badge/pill 10px 例外见 D-1） |
| `text-[11px]` | 92 | ConsentFormPreview(6) · AvailabilityApprovalPage(5) · Timesheet(5) | **`--text-overline`** ✓ 精确 |
| `text-lg` 18px | 51 | CalendarPage(3) · VersionHistoryPanel(3) · ProfilePage(3) | **`--text-section`**（↓15px，卡/区块标题） |
| `text-2xl` 24px | 43 | ForgotPasswordPage(4) · AppPages(2) · AvailabilityApprovalPage(2) | **`--text-page-title`**（↓22px） |
| `text-base` 16px | 35 | ConsentSignPage(4) · StaffWorkloadTab(3) · OverrideModal(2) | **`--text-body`**（正文↓14）；作标题时→`--text-section` |
| `text-[9px]` | 31 | DayGrid(4) · MyScheduleGrid(3) · CalendarWidget(3) | **`--text-overline`**（↑11px；9px 低于 a11y 下限，见 D-1） |
| `text-xl` 20px | 22 | JourneyDialogs(4) · LoginPage(2) · AvailabilityEditorPage(2) | **`--text-page-title`**（22px，页/弹窗标题） |
| `text-[15px]` | 14 | ConsentSignPage(2) · GlassCard(1) · ProfilePatterns(1) | **`--text-section`** ✓ 精确 |
| `text-3xl` 30px | 8 | BillingPage(4) · StaffWorkloadTab(3) · PatientRecord(1) | **`--text-page-title`**；若为数字→`--kpi-value-lg` |
| `text-[13px]` | 3 | AvailabilityGrid · ClinicianScheduleList · StaffDetailLayout | **`--text-data`** ✓ 精确 |
| `text-6xl` 60px | 2 | LoginPage(1) · AuthLayout(1) | **待决策 D-2**（auth 品牌大字，超 6 档） |
| `text-[8px]` | 2 | WeeklyAvailabilityPreview · Timesheet | **`--text-overline`**（↑11px，见 D-1） |
| `text-[10.5px]` | 2 | FeedbackAdminPage(2) | **`--text-overline`**（↑11px） |
| `text-[18px]` | 1 | ProfilePatterns | **`--text-section`**（↓15px） |
| `text-[28px]` | 1 | stat/Stat.tsx | **`--kpi-value-lg`** ✓ 精确（KPI 数值） |
| `text-[0.8rem]` 12.8px | 1 | ui/calendar.tsx | **`--text-label`**（12px） |
| `css font-size: var(--text-base)` | 4 | theme.css | 保留（`@layer base` h4/label/button/input 默认） |
| `css font-size: var(--text-2xl/xl/lg)` | 各1 | theme.css | 保留（h1/h2/h3 base 默认，Tailwind 可覆盖） |
| `css font-size: 16px` / `var(--font-size)` | 各1 | theme.css | 保留（root 字号锚点） |

## 2. Spacing — 192 distinct, 3919 occurrences

**规则**：目标集 `{4,8,12,16,24}`，就近取整（半数向上）。**组件内 padding ≤ `--space-4`(16px)；
`--space-6`(24px) 及以上仅限页面布局层。** 所有 ≥24px 的**组件内** padding 在下表降档到 `--space-4`。

### 2a. 高频与常规值（映射直接）

| 值 (px) | 代表类·次数 | 建议归入 |
|---|---|---|
| 4px | `mt-1`(92)·`gap-1`(66)·`py-1`(101)·`p-1`(22)·`mb-1`(39)·`px-1`(14)·`mr-1`(12)·`ml-1`(11) | **`--space-1`** ✓ |
| 8px | `py-2`(207)·`gap-2`(159)·`px-2`(127)·`mb-2`(104)·`p-2`(41)·`mr-2`(42)·`mt-2`(25)·`space-y-2`(17)·`pt-2`(18)·`ml-2`(19)·`pr-2`(11) | **`--space-2`** ✓ |
| 12px | `py-3`(149)·`px-3`(148)·`gap-3`(94)·`p-3`(50)·`mb-3`(32)·`space-x-3`(19)·`mr-3`(19)·`mt-3`(16)·`pt-3`(12)·`pr-3`(11)·`space-y-3`(12) | **`--space-3`** ✓ |
| 16px | `px-4`(253)·`p-4`(190)·`gap-4`(52)·`mb-4`(44)·`py-4`(71)·`mt-4`(23)·`space-y-4`(22)·`pt-4`(12)·`space-x-4`(10)·`pb-4`(10) | **`--space-4`** ✓ |
| 0px | `p-0`(8)·`p-0`… | 保留 0（reset，无需 token） |

### 2b. 需就近取整的值

| 值 (px) | 代表类·次数 | 建议归入 |
|---|---|---|
| 2px (`.5`) | `py-0.5`(80)·`mt-0.5`(63)·`p-0.5`(17) | **`--space-1`**（↑4px） |
| 6px (`1.5`) | `gap-1.5`(126)·`py-1.5`(105)·`px-1.5`(30)·`p-1.5`(27)·`mb-1.5`(26)·`space-y-1.5`(18)·`mt-1.5`(17) | **`--space-2`**（→8px）；icon↔text 场景可选 `--space-1`(4) |
| 10px (`2.5`) | `py-2.5`(59)·`px-2.5`(49)·`gap-2.5`(18) | **`--space-3`**（→12px） |
| 14px (`3.5`) | `py-3.5`(35) | **`--space-4`**（→16px） |
| 20px (`5`) | `px-5`(38)·`p-5`(18)·`space-y-5`(13)·`py-5`(14)·`mt-5`… | 组件内→**`--space-4`**(16)；页面级→**`--space-6`**(24) |

### 2c. ≥24px（收敛主战场；组件内一律降档，见规则）

| 值 (px) | 代表类·次数 | 建议归入 |
|---|---|---|
| 24px | `px-6`(135)·`p-6`(70)·`mb-6`(46)·`pt-6`(18)·`gap-6`(15)·`mt-6`(9)·`space-y-6`(24)·`py-6`(7)·`pb-6`(7)·`pl-6`(1) | 页面级→**`--space-6`**；**组件内 padding→`--space-4`(16)** |
| 28px (`7`) | `pl-7`(2)·`pr-7`(1)·`p-7`(1) | **`--space-6`**（页级）/ 组件内→`--space-4` |
| 32px (`8`) | `px-8`(40)·`p-8`(38)·`pl-8`(18)·`mb-8`(16)·`mt-8`(11)·`py-8`(3)·`pt-8`(3)·`pb-8`(3)·`pr-8`(2) | 页级→**`--space-6`**(24，封顶)；组件内→`--space-4`。`pl-8`(下拉勾选缩进)见 D-6 |
| 36px (`9`) | `pl-9`(10)·`pr-9`(1) | **`--space-6`**（封顶24）；输入左 icon 缩进见 D-6 |
| 40px (`10`) | `p-10`(14)·`py-10`(7)·`pb-10`(1) | **待决策 D-3**（空状态/hero 大 padding，超 24 上限） |
| 48px (`12`) | `p-12`(4)·`pl-12`(1)·`pr-12`(1) | **待决策 D-3**（auth 布局） |
| 56px (`14`) | `pl-14`(4) | **待决策 D-6**（日历时间轴左栏轴距，语义化布局值） |
| 64px (`16`) | `pr-16`(6)·`py-16`(2)·`p-16`(2) | **待决策 D-3** |
| 76px (`[76px]`) | `pl-[76px]`(1) ClinicianScheduleList | **待决策 D-6**（时间轴对齐硬值） |
| 80px (`20`) | `py-20`(3) | **待决策 D-3**（空状态垂直居中→建议改 flex 居中） |
| 96px (`24`) | `pb-24`(2)·`py-24`(1) | **待决策 D-3** |

## 3. Radius — 24 distinct, 1066 occurrences

> `--radius-sm`=8（inputs/buttons/chips）、`--radius-md`=12（cards/modals/drawers）。
> `rounded-full` 保留给 pill/avatar。**注意**：这两个 token 与 Tailwind 内联的
> `rounded-sm/md`（6px/8px，由 `--radius` 算出）**不同**，迁移时改类名而非依赖同名。

| 值（本主题解析px） | 次数 | 主要文件 | 建议归入 |
|---|---|---|---|
| `rounded`(4px) | 354 | PatientsPage(30) · Timesheet(19) · CalendarPage(15) | **`--radius-sm`**（↑8） |
| `rounded-full` | 241 | PatientJourneyCard(19) · NotificationsPage(13) · FeedbackAdminPage(10) | **保留 `rounded-full`** ✓ |
| `rounded-lg`(10px) | 201 | FeedbackAdminPage(14) · AppShell(9) · DeviceDetailDrawer(9) | **`--radius-md`**（→12） |
| `rounded-xl`(14px) | 128 | JourneyDialogs(9) · StaffWorkloadTab(7) · ForgotPasswordPage(7) | **`--radius-md`**（→12） |
| `rounded-md`(8px) | 73 | ui/sidebar(8) · Timesheet(6) · ui/button(4) | **`--radius-sm`** ✓ |
| `rounded-sm`(6px) | 18 | ui/context-menu(4) · ui/dropdown-menu(4) · ui/menubar(3) | **`--radius-sm`**（→8） |
| `rounded-2xl`(16px) | 16 | DemoControlsPill · GlobalSearchOverlay · LoginPage | **`--radius-md`**（→12） |
| `rounded-{r,l}-md` | 9 | ui/calendar · input-otp · toggle-group | **`--radius-sm`**（单侧） |
| `rounded-{l,r}-full` | 6 | RangeDatePicker · AvailabilityPage | **保留 `rounded-full`**（单侧） |
| `rounded-{t,b}-lg` | 4 | ui/drawer · PeopleDayPopover | **`--radius-md`**（单侧） |
| `rounded-[var(--radius-frosted-sm/md)]` | 3 | glass/GlassButton · glass/GlassCard | frosted-sm(10)→**`--radius-sm`**；frosted-md(16)→**`--radius-md`** |
| `rounded-[2px]` | 3 | ui/chart(2) · ui/tooltip(1) | **待决策 D-4**（chart bar 微圆角，保留 2px） |
| `rounded-[4px]` | 1 | ui/checkbox | **`--radius-sm`**（→8）/ checkbox 可保留小值见 D-4 |
| `rounded-{r,l}-none` | 4 | RangeDatePicker · toggle-group | 保留（拼接控件，功能性） |
| `rounded-none` / `rounded-[inherit]` | 2 | toggle-group · ui/scroll-area | 保留（功能性） |
| `rounded-tl-sm` / `rounded-b-2xl` / `rounded-l-lg` | 各1 | navigation-menu · UpNextPanel · FeedbackAdminPage | 单侧→`--radius-sm`/`--radius-md` |

## 4. Colors

分三类统计。**规则**：硬编码 hex 与直接 Tailwind 调色板引用都必须归属 token；无法归类的进
「待人工决策」。语义映射：red→`--status-danger`、emerald/green→`--status-success`、
amber/orange/yellow→`--status-warning`、blue/sky/cyan→`--status-info`、
purple/violet/fuchsia→`--status-special`；文本灰阶→`--text-primary/secondary/muted`；
边框→`--divider`；面→`--surface-page/card`。

### 4a. 硬编码 hex（组件内）— 56 distinct（含 theme.css 定义），组件侧 229 occ

> theme.css 内的 hex 是 **token 定义本身**（`#030213`/`#ffffff`/`#ececf0`/`#10214B`…），
> 是真源，不算“组件硬编码”，不迁移。下表只列**组件里**直接写的。

| hex | 次数 | 主要文件 | 建议归入 |
|---|---|---|---|
| `#0077b6` | 44 | ForgotPasswordPage(8) · LoginPage(7) · EnrollmentPage(5) | **待决策 D-5**（auth 品牌蓝 ramp） |
| `#00b4d8` | 36 | ForgotPasswordPage(10) · LoginPage(6) · LoginPage(5) | **待决策 D-5**（auth 品牌青） |
| `#0b1528` | 31 | ForgotPasswordPage(5) · LoginPage(4) · LoginPage(4) | `--ink-900`/`--phenome-blue-900`（暗底），确认见 D-5 |
| `#e5e7eb` (gray-200) | 20 | BillingPage(5) · PatientsPage(5) · Timesheet(5) | **`--divider`** |
| `#0096b4` | 12 | ForgotPasswordPage(4) · LoginPage(1) · EnrollmentPage(1) | **待决策 D-5** |
| `#005b8c` | 12 | ForgotPasswordPage(4) · LoginPage(1) · EnrollmentPage(1) | **待决策 D-5** |
| `#dc2626` (red-600) | 5 | StaffWorkloadTab(4) · stat/trend(1) | **`--status-danger`** |
| `#f3f4f6` (gray-100) | 5 | StaffWorkloadTab(2) · DayGrid(1) · MyScheduleGrid(1) | **`--surface-page`**/中性填充见 D-7 |
| `#6b7280` (gray-500) | 3 | StaffWorkloadTab(3) | **`--text-muted`** |
| `#ccc` / `#fff` | 5 | ui/chart(3/2) | chart 默认（shadcn），→`--divider`/`--surface-card` 见 D-4 |
| `#374151` (gray-700) | 2 | StaffWorkloadTab(2) | **`--text-secondary`** |
| `#475569` (slate-600) | 2 | StaffWorkloadTab(2) | **`--text-secondary`** |
| `#122a50`·`#1e4e8c`·`#f4f7f9` | 各2 | LoginPage · AuthLayout | **待决策 D-5**（auth 渐变/底色） |
| `#059669` (emerald) | 1 | stat/trend | **`--status-success`** |
| `#94a3b8`·`#9ca3af`·`#d1d5db` | 各1 | trend · ScheduleLeftRail · PatientJourneyCard | `#94a3b8/#9ca3af`→`--text-muted`；`#d1d5db`→`--divider` |
| `#1f2937` | 1 | consent-sign/SignatureCanvas | `--text-primary`（canvas 笔迹色，JS 内，见 D-8） |
| `#4285f4`·`#34a853`·`#fbbc05`·`#ea4335` | 各1 | FeedbackAdminPage | **待决策 D-9**（Google 品牌色，豁免保留） |
| `#e8f0fe` | 1 | FeedbackAdminPage | `--status-info`（浅底） |
| `#fee2e2` (red-100) | 1 | Timesheet | `--status-danger`（浅底） |

### 4b. rgb()/rgba()（组件内）— 21 distinct, 35 occ（theme.css 内为定义，不迁移）

| 值 | 次数 | 用途/文件 | 建议归入 |
|---|---|---|---|
| `rgb(0,0,0,0.04)` | 9 | LoginPage/Enrollment/ForgotPassword 卡阴影 | **`--shadow-raised`**（阴影 token 化） |
| `rgba(239,68,68,0.35)` | 4 | DayGrid/WeekGrid/CalendarWidget 危险 glow | `--status-danger` @ 透明度（见 D-8） |
| `rgba(15,23,42,0.04)` | 2 | DayGrid/WeekGrid 阴影 | **`--shadow-raised`** |
| `rgba(0,0,0,0.04)` | 2 | ListView/ScheduleToolbar 阴影 | **`--shadow-raised`** |
| `rgba(100,116,139,0.07/0.35)` | 2 | AvailabilityGrid 网格底纹 | `--divider` / `--text-muted` @ 透明度（见 D-8） |
| `rgba(0,0,0,0.08)` | 1 | RangeDatePicker 阴影 | **`--shadow-raised`** |
| `rgba(255,255,255,0.25)` | 1 | glass/GlassButton 高光 | 保留（frosted 玻璃系专用，见 D-8） |

### 4c. 直接 Tailwind 调色板引用 — 160 distinct, **4464 occ**（最大债）

> 全部需归属。下按语义族汇总（每族列 Top 值），**族内所有 shade 归同一 token**。

| 调色板族（代表类·次数） | 合计量级 | 建议归入 |
|---|---|---|
| **中性文本** text-gray-900/800(297)·700/600(490)·500(361)·400(348)·300(37)；text-slate-800/700/600/500/400 | ~1900 | 900/800→`--text-primary`；700/600→`--text-secondary`；≤500→`--text-muted` |
| **中性边框** border-gray-200(434)·300(233)·100(65)·400(15)；border-slate-200/300/400/500(51)；divide-gray-100/200 | ~900 | **`--divider`**（含 400/500 强边框，见 D-7） |
| **中性背景** bg-gray-50(293)·100(165)·200(72)·300(17)；bg-slate-50/100/200 | ~600 | bg-*-50→`--surface-page`；100/200/300 悬停/轨道/chip 填充→**待决策 D-7** |
| **深色按钮** bg-slate-900(39)·800(19)·700(76)·600(69)·500/400 | ~220 | `--primary`（#030213，主操作按钮底，见 D-7） |
| **danger** text/bg/border-red-500/600/700·bg-red-50/100·border-red-100/200 | ~250 | **`--status-danger`** |
| **success** emerald/green-500/600/700·-50/100·border-emerald-200 | ~180 | **`--status-success`** |
| **warning** amber/orange/yellow-500/600/700/800·-50/100·border-amber/orange-200 | ~160 | **`--status-warning`** |
| **info** blue/sky/cyan-500/600/700·-50/100·border-blue-200 | ~110 | **`--status-info`** |
| **special** purple/violet/fuchsia-600/700·-50·border-purple-200 | ~40 | **`--status-special`** |
| placeholder-slate-400(8) | 8 | `--text-muted`（占位符需 ≥4.5:1，见 D-10） |

### 4d. 已合规引用（保留，作对照，不迁移）

- **语义色类** 35 distinct / 357 occ（`bg-accent`·`text-muted-foreground`·`bg-primary`…）——
  全部集中在 `src/app/components/ui/*`（shadcn 原件），已走 CSS 变量，**保留**。
- **CSS `var(--…)`** 48 distinct / 59 occ，全在 `theme.css`，是 token 消费/定义，**保留**。

## 5. 控件高度 — heights 75 distinct, 928 occ

> **区分**：多数 `h-*` 是 **icon / 进度条 / 图形**尺寸，不是控件高度，不归控件 token。
> 只有作用在 button/input/select/行 的高度进下表。

| 值 (px) | 次数 | 主要文件 / 用途 | 建议归入 |
|---|---|---|---|
| `h-8` 32 | 41 | ui/sidebar · ConsentFormPreview（小按钮/图标钮） | **`--control-h-sm`** ✓ |
| `h-12` 48 | 39 | JourneyDialogs(8) · AppShell（行/头） | **`--row-h`** ✓ |
| `h-9` 36 | 24 | NotificationsPage · AdminOverview（按钮） | **`--control-h`**（→38） |
| `h-11` 44 | 23 | PatientJourneyCard(8) · NotificationsPage（按钮/行） | **`--control-h`**(38)+`.touch-extend`；行→`--row-h-dense`(40) |
| `min-h-11` 44 | 23 | RegisterPatientModal(9) · AppShell(4) | **`--touch-target`** ✓（已合规） |
| `h-10` 40 | 20 | FeedbackAdminPage · StartTransactionModal（input/按钮） | **`--control-h`**(38)；只读行→`--row-h-dense`(40) |
| `h-[18px]` | 9 | FeedbackAdminPage · AppShell | icon/badge，非控件（→ icon 尺寸，超范围） |
| `h-14` 56 | 6 | AppShell · GlobalSearchOverlay（顶栏/搜索行） | **`--row-h`**(48) 或页头布局值，见 D-11 |
| `min-h-[44px]` | 4 | AvailabilityFilter(3) · stat/Stat(1) | **`--touch-target`** ✓（已合规） |
| `h-[38px]` / `min-h-[38px]` | 各1 | Timesheet | **`--control-h`** ✓ 精确 |
| `h-7` 28 / `h-16` 48+ / `h-20`.. | 少量 | 见 --json | 控件→就近；容器/图形→超范围（见 D-11） |
| `h-4`(164)·`h-3.5`(124)·`h-5`(80)·`h-3`(55)·`h-6`(19)·`h-1.5`(31)·`h-2.5`·`h-2`·`h-1`·`h-px` | ~560 | 图标 / 进度条 / 分隔线 | **超范围**：icon/图形尺寸，不属控件高度 token（见 D-11） |

## 6. 阴影 — 22 distinct, 335 occ

> 规则：卡片常态 `--shadow-none`；仅弹层与 pressed 态用 `--shadow-raised`。

| 值 | 次数 | 主要文件 | 建议归入 |
|---|---|---|---|
| `shadow-sm` | 162 | PatientsPage(18) · BillingPage(14) · FeedbackAdminPage(9) | 卡片→**`--shadow-none`**（扁平化，主收敛）；如需微浮→`--shadow-raised` |
| `shadow-2xl` | 37 | VersionHistoryPanel · MyScheduleView · ConsentFormPage | **`--shadow-raised`**（弹层/drawer） |
| `shadow-md` | 34 | ForgotPasswordPage(4) · DayGrid · WeekGrid | **`--shadow-raised`** |
| `shadow-lg` | 28 | ScheduleToolbar(3) · AppShell(2) · NotificationsPage(2) | **`--shadow-raised`** |
| `shadow-[1px_0_0_#e5e7eb]` | 13 | PatientsPage · Timesheet · BillingPage | **待决策 D-12**（sticky 列分隔线用阴影实现，应改 `--divider` 边框） |
| `shadow-[#0077B6]` | 12 | ForgotPasswordPage(4) · LoginPage · EnrollmentPage | **待决策 D-5**（auth focus ring）→ `--status-info`/ring |
| `shadow-xl` | 11 | Timesheet(2) · CalendarPage · GlobalSearch | **`--shadow-raised`** |
| `shadow-[0_8px_30px_rgb(0,0,0,0.04)]` | 9 | LoginPage · Enrollment · ForgotPassword | **`--shadow-raised`** |
| `shadow-xs` | 4 | ui/checkbox · ui/menubar · ui/radio-group | **`--shadow-none`**（或 raised，shadcn 原件） |
| `shadow-none` | 4 | ui/sidebar · toggle-group · ForgotPasswordPage | **`--shadow-none`** ✓ |
| `shadow-[0_1px_0_#e5e7eb]` / `[0_-1px_0_#e5e7eb]` | 5 | Billing/Patients/StaffListPage | **`--divider`** 边框（同 D-12） |
| `shadow-[0_0_6px_rgba(239,68,68,0.35)]` | 4 | DayGrid · WeekGrid · CalendarWidget | 保留/`--status-danger` glow（见 D-8） |
| `shadow-[0_1px_3px_rgba(15,23,42,0.04)]` / `[0_1px_0_rgba(0,0,0,0.04)]` | 4 | DayGrid/WeekGrid/ListView | **`--shadow-raised`** |
| `shadow`(DEFAULT) | 2 | ui/navigation-menu | **`--shadow-raised`** |
| `shadow-[inset…]`·`[0_4px_24px…]`·`[0_0_0_1px_hsl(var(--sidebar-*))]`·`[0_0_0_2px_white]`·`shadow-inner` | 各1–2 | glass/GlassButton · RangeDatePicker · ui/sidebar · FeedbackAdminPage · Enrollment | glass 高光/ focus-ring：保留或语义化，见 D-8/D-12 |

---

# Top offenders（硬编码最严重的文件排名）

统计口径：硬编码 hex + rgb + 直接调色板引用 + 任意值 `[..]`（间距/字号/圆角/高度/阴影）之和。

| # | 文件 | 债务分 |
|---|---|---|
| 1 | `src/app/pages/app/PatientsPage.tsx` | 292 |
| 2 | `src/app/pages/app/Timesheet.tsx` | 255 |
| 3 | `src/app/pages/app/BillingPage.tsx` | 227 |
| 4 | `src/app/pages/app/FeedbackAdminPage.tsx` | 211 |
| 5 | `src/app/pages/app/dashboard/journey/PatientJourneyCard.tsx` | 110 |
| 6 | `src/app/pages/app/staff/StaffWorkloadTab.tsx` | 107 |
| 7 | `src/app/pages/app/availability/AvailabilityApprovalPage.tsx` | 107 |
| 8 | `src/app/components/CalendarPage.tsx` | 98 |
| 9 | `src/app/pages/app/NotificationsPage.tsx` | 86 |
| 10 | `src/app/pages/app/calendar/ScheduleToolbar.tsx` | 85 |

> 迁移优先级：这 10 个文件（尤其前 4 个 Patients/Timesheet/Billing/Feedback）承载约
> 40% 的调色板债，应作为迁移第一批。

---

# 待人工决策清单（无法自动归类，逐条附上下文）

> 规则：每个审计值要么已在上表归属 token，要么在此列出——不允许静默保留。

| ID | 值 / 现象 | 文件:行（示例） | 为什么需要人决策 | 倾向建议 |
|---|---|---|---|---|
| **D-1** | 10/9/8px 微字号（含 badge/pill） | MyScheduleGrid、DayGrid、KPI status pill（KPI_CARD_SPEC §3=10px pill） | 6 档最小 11px；KPI/Badge 规范另定 10px pill | 正文微字统一 `--text-overline`(11)；badge/pill 是否保留 10px 由 Badge 规范定 |
| **D-2** | `text-6xl` 60px | LoginPage、AuthLayout | auth 品牌大字，远超 6 档产品字阶 | 归入 auth 品牌层（独立于产品 6 档），或降到 `--text-page-title` |
| **D-3** | 组件外 padding 40/48/64/80/96px | `p-10`/`p-12`/`py-16`/`py-20`/`py-24`（LoginPage、空状态、AuthLayout） | 超 `--space-6`(24) 上限；多为空状态垂直居中或 auth hero | 空状态改 flex 居中；auth 布局定义页级 gutter，不用 padding token |
| **D-4** | `rounded-[2px]`/`[4px]`、chart `#ccc/#fff` | ui/chart、ui/tooltip、ui/checkbox | shadcn 原件 + 图表 bar 微圆角是刻意 | chart/checkbox 保留小值；或纳入图表专用 token，非通用 radius |
| **D-5** | auth 品牌色 ramp `#0077b6/#00b4d8/#0096b4/#005b8c/#0b1528/#122a50/#1e4e8c/#f4f7f9` + `shadow-[#0077B6]` | LoginPage、ForgotPasswordPage、EnrollmentPage、AuthLayout | 与现有 `--gradient-brand`(#30B0CD/#2394CC/#2E74B2)、`--phenome-blue-*` 不精确一致 | 决定：统一到 `--gradient-brand`+`--phenome-blue-*`，还是新增 `--brand-*` auth 层 |
| **D-6** | 时间轴/缩进硬值 `pl-14`(56)、`pl-[76px]`、`pl-9`/`pl-8`（下拉勾选/输入 icon 缩进） | ClinicianScheduleList、DayGrid、FilterSelect、ui/dropdown-menu | 是布局对齐值（图标/时间列宽），非通用间距 | 定义少量语义布局值（如 `--rail-time-w`），不塞进 space 阶 |
| **D-7** | 中性填充/边框/深按钮：`bg-gray-100/200/300`、`border-gray-400`/`slate-400/500`、`bg-slate-600/700/900` | Patients、Timesheet、AppShell、EditModals 等 | 3 个 surface token（page/card/divider）覆盖不了：悬停填充、轨道、chip、强边框、主按钮底 | 决定是否补 `--surface-hover`/`--surface-sunken`/`--border-strong`，或以 `--divider`/`--primary` 的透明度表达 |
| **D-8** | 语义色透明变体 & glass 高光：`rgba(239,68,68,.35)` glow、`rgba(100,116,139,…)`、`rgba(255,255,255,.25)` | DayGrid、AvailabilityGrid、glass/GlassButton | token 是实色，透明变体/玻璃高光无直接槽位 | 用 `color-mix(in oklch, var(--status-danger) 35%, transparent)`；glass 系保留专用值 |
| **D-9** | Google 品牌色 `#4285f4/#34a853/#fbbc05/#ea4335` | FeedbackAdminPage | 第三方 logo 品牌色，语义上不能改 | 豁免保留（加注释标记 third-party brand），check 脚本白名单 |
| **D-10** | `placeholder-slate-400` 占位符对比度 | LoginPage、LoginPage | 归 `--text-muted` 但占位符需 ≥4.5:1（a11y 硬线） | 迁移时验证 `--text-muted`(#8B93AD) 在输入底色上的对比度，不足则用更深档 |
| **D-11** | icon/图形高度 `h-4/3.5/5/3/6/1.5…`(~560) 与容器高度 `h-14/16/20/[600px]` | 全站 | 非控件高度，本 token 集不含 icon/容器尺寸 | 明确超范围；如需可另立 `--icon-*` 尺寸体系（不在本任务） |
| **D-12** | 用阴影画分隔线：`shadow-[1px_0_0_#e5e7eb]`、`shadow-[0_±1px_0_#e5e7eb]` | PatientsPage、Timesheet、BillingPage（sticky 列/行分隔） | 是分隔线不是高度，语义应为 `--divider` 边框 | 迁移改为 `border` + `--divider`；保留阴影仅当确为 elevation |

---

## 验收对照

1. **六类统计齐全、次数可复核**：✅ 附 `scripts/audit-tokens.mjs` 及 grep 抽查命令。
2. **token 总数**：spacing 5 + type 6(+2 KPI) + radius 2 + 控件高度 5 + 语义/文本/表面色 11(≤15)
   + elevation 2 = 符合上限。✅
3. **映射覆盖率 100%**：每个审计值均有归属 token 或进 D-1~D-12 待决策清单。✅
4. **check 脚本可运行**：见 `scripts/check-tokens.sh`；当前违规基线数即下一步迁移基线（见脚本输出）。

---

# 迁移日志（Migration Log）

## 基线口径

| 口径 | 数值 | 说明 |
|---|---|---|
| Step 0 初报 | 863 | ⚠️ 偏低：只扫 `.tsx`，漏了 `.ts` 常量文件 |
| **修正基线** | **879** | `.tsx` + `.ts` 全量扫描，迁移前原始代码实测 |
| 当前 | **803** | 已完成 Top offenders #1–#4 + `feedbackData.ts` |
| 降幅 | **−76** | 硬编码 hex −21｜任意字号 −49｜>24px padding −23 |

> `Padding = 24px (page-review)` 从 232 升到 249 是**预期方向**：`px-8`(32) 页面边距
> 被收敛为 `px-6`(24)，即从「硬违规」降档进「页面级允许」区间。硬违规 162 → 139。

## 已完成批次

| # | 文件 | 债务分 | hex | 任意字号 | 调色板类 | 状态 |
|---|---|---|---|---|---|---|
| 1 | `PatientsPage.tsx` | 292 | 0 | 0 | 0 | ✅ 完成 |
| 2 | `Timesheet.tsx` | 255 | 0 | 0 | 0 | ✅ 完成 |
| 3 | `BillingPage.tsx` | 227 | 0 | 0 | 0 | ✅ 完成 |
| 4 | `FeedbackAdminPage.tsx` | 211 | 4（Google 品牌，D-9 豁免） | 0 | 0 | ✅ 完成 |
| + | `feedbackData.ts` | （审计外） | 2（Google 品牌点） | 0 | 0 | ✅ 完成 |

## 验证（每批必跑）

```bash
npx tsc --noEmit    # 26 errors —— 与迁移前完全一致，零回归（均在未触碰文件中，属既有问题）
npm run build       # ✓ built，退出码 0
bash scripts/check-tokens.sh --summary
```

- **零回归证明**：`git stash` 原始文件后 typecheck 同样是 26 个错误，证明这 26 个
  （CalendarPage / PatientRecord / AvailabilityFilter / ScheduleToolbar / CodeInputBoxes /
  main.tsx）是**既有问题**，非迁移引入。
- **产物验证**：`bg-info/danger/success/warning/special`、`text-ink*`、`bg-surface*`、
  `border-divider`、`rounded-card/control`、`btn-primary`、`text-overline`、`touch-extend`
  均已在编译 CSS 中生成。

## D 项落地决议

| D | 决议 | 实现 |
|---|---|---|
| D-5 | 统一到 `--gradient-brand` + `--phenome-blue-*`，不新立 auth 层 | 新增 `--color-brand-ink`；主 CTA 用 `.btn-primary`（品牌渐变底） |
| D-7 | 补 3 个 token；`bg-slate-700` 按语义分流 | `--surface-hover` / `--surface-sunken` / `--border-strong`；**主按钮→`.btn-primary`**，深色中性容器→`bg-surface-sunken` |
| D-9 | Google 品牌色豁免保留 | `<svg fill="#4285F4|#34A853|#FBBC05|#EA4335">` 与品牌圆点保留；周边 tint（`#e8f0fe` 等）归 `--status-info` |
| D-1 | 10/9px 微字号统一升到 `--text-overline`(11) | 满足 a11y 下限，同时去掉冗余 `uppercase/tracking/font-bold` |
| D-3 | 空状态大 padding 收敛 | `py-24`→`py-6`（容器已 flex 居中）；`p-16`→`p-6` |
| D-12 | 阴影画分隔线 → token 变量 | `shadow-[1px_0_0_#e5e7eb]` → `shadow-[1px_0_0_var(--border-strong)]` |

## 剩余批次（待迁移）

Top offenders #5–#10：`PatientJourneyCard`(110)、`StaffWorkloadTab`(107)、
`AvailabilityApprovalPage`(107)、`CalendarPage`(98)、`NotificationsPage`(86)、
`ScheduleToolbar`(85)；以及 6 个仍含调色板常量的 `.ts` 文件
（`staffData` 30、`dashboardData` 28、`availabilityData` 21、`deviceView` 15、
`patientRecordData` 12、`myScheduleData` 4）。

## 迁移中发现的既有设计问题（未改，供后续决策）

1. **side-stripe 装饰条**：`FeedbackAdminPage` 卡片左侧 `absolute left-0 w-1` 彩色条
   （`rounded-l-lg`），属设计规范中明令禁止的 side-stripe 模式，建议后续改为整边框或前置图标。
2. **`.frosted-gradient-text`**（`theme.css`）：渐变文字，装饰性用法；本任务只允许对
   theme.css 追加，故保留未动。

---

# 视觉验收（Visual QA，dev server 实测）

在 iPad 视口（1194×834）实机检查已迁移的 4 个页面，**发现并修复了一个由本次迁移
引入的真实 a11y 回归**——这正是「编译通过但视觉错误」的典型случай，纯静态检查查不出来。

## 发现 1：语义色作文字，对比度全线不达标（迁移引入 ❌ → 已修）

映射规则 `text-*-800 → text-{sem}` 是**错的**：`--status-*` 是中间调**信号色**，
适合填充/圆点/图标，**不适合作浅底上的文字**。实测（canvas 真值）：

| 元素 | 迁移后颜色 | 对比度 | 要求 |
|---|---|---|---|
| VIP pill | `--status-warning` #F5A623 | **1.8** | 4.5 |
| ACTIVE pill | `--status-success` #34C759 | **2.0** | 4.5 |
| Corporate pill | `--status-info` #2394CC | **2.9** | 4.5 |

**修复**：新增 5 个 **ink 文字档**（KPI_CARD_SPEC 早已预告「amber 用深档 #B45309 级」）：

```css
--status-success-ink: #177245;  --status-warning-ink: #A15C07;
--status-danger-ink:  #B91C1C;  --status-info-ink:    #12658F;
--status-special-ink: #8B1FA0;
```

**规则（写进 theme.css）**：**底/边/圆点用 `--status-*`；文字用 `--status-*-ink`。**
另：白字压在实心语义色上同样不达标（白 on info=3.4、on success=2.0），
故**实心底 + 白字的场合，底色也改用 `-ink` 档**。

## 发现 2：`--text-muted` 未达标（既有问题，已修）

`--ink-400` #8B93AD 实测白底 **3.05:1** / 页面底 2.83:1，低于正文 4.5 下限（即 D-10）。
`--text-muted` 改为 **#646B80**（5.31 / 4.91）。`--ink-400` 本身保留不动，非文字用途不受影响。

## 发现 3：头像首字母白字压浅底（既有问题，已修）

`bg-gray-200 + text-white` → 迁移后 `bg-surface-sunken + text-white` = **1.19:1**，
几乎不可读（原代码即如此，非迁移引入）。4 个文件共 6 处 → 改 `text-ink-soft`。

## 发现 4：`Stat` 组件 suffix 文字 2.6:1（既有问题，已修）

`text-[11px] text-gray-400` 在 Patients / Timesheet 上造成 8 处失败，
一处改动（`text-overline text-ink-muted`）全部解决。

## 验收结果

| 页面 | 对比度失败数 |
|---|---|
| /patients | **0** |
| /timesheet | **0** |
| /billing | **0** |
| /feedback | **0** |

- Console：**0 error / 0 warning**。
- 视觉确认：`btn-primary` 品牌渐变主按钮成立；Google logo 与品牌圆点完整保留（D-9）；
  行高收紧后同屏行数 5.5 → 7（紧凑目标达成，电话号码不再折行）。
- **测量方法学教训**：第一版对比度脚本用正则解析 `oklab(0.78 0.046 0.15 / 0.15)`，
  把 oklab 分量误当 sRGB，得出假失败。改用 **canvas 合成取真值** 后结论才可靠；
  且 Tailwind v4 的 `/N` 透明度在 **oklab** 空间混合，不能用 sRGB 线性插值估算。

## 既有问题（未改，留待后续决策）

1. `Stat.tsx` L158 gray-on-color（彩底灰字）——未迁移文件，批次 3 处理。
2. KPI strip 文案截断（"Total …"、"12 new t…"）——**迁移前后一致**，是 `Stat` strip
   宽度问题，非本次引入。
3. `FeedbackAdminPage` 卡片左侧 side-stripe 彩条；`theme.css` 的 `.frosted-gradient-text`。

---

# Batch 3 迁移日志

## 方法改进：可复现迁移脚本

上次 4 个 agent 被 session limit 打断留下半迁移文件。本批改用**内联 + 可复现脚本**：
`scripts/migrate-tokens.pl`（编码全部 token 映射规则，幂等、可 re-run），先跑脚本清批量，
再逐文件人工处理 hex / 任意值 / CTA 判断，最后逐页对比度实测。

## 已完成（offenders #5–#10 + KPI 引擎 + 6 个 .ts）

| 文件 | 残留 palette/hex/字号 | 状态 |
|---|---|---|
| PatientJourneyCard.tsx | 0 | ✅ |
| StaffWorkloadTab.tsx | 0（12 个 chart hex → `var(--chart-*)` / `var(--status-danger)`） | ✅ |
| AvailabilityApprovalPage.tsx | 0 | ✅ |
| CalendarPage.tsx | 0 | ✅ |
| NotificationsPage.tsx | 0 | ✅ |
| ScheduleToolbar.tsx | 0 | ✅ |
| KpiBar.tsx | 0 | ✅ |
| **Stat.tsx / trend.tsx**（KPI 引擎，额外纳入） | 0 | ✅ |
| staffData / dashboardData / availabilityData / deviceView / patientRecordData / myScheduleData `.ts` | 0 | ✅ |

## 脚本盲区发现（3 类系统性 bug，已修）

批量脚本无法判断语义，暴露三类需人工修正的问题：

1. **`bg-slate-700 text-white` → `bg-surface-sunken text-white`（白字压浅底 1.2:1）**：脚本把深色
   slate 映射到浅 surface-sunken，白字失效。按语义分流：
   - 主 CTA（Start Next Patient / Confirm Reassignment / 新建）→ `.btn-primary`；
   - 选中态（tab / 日历日 / range 选择器）→ `bg-ink text-white`（深色选中片）；
   - 头像/图标容器 → `text-ink-soft`；
   - 深色 tooltip（原 `bg-gray-800`）→ `bg-ink text-white`。
2. **双斜杠透明度 `bg-red-50/60` → `bg-danger/10/60`（非法类）**：8 处，全局折叠为单档 `/10`。
3. **`text-navy` 死类**：预存无效类，顺手移除。

## 对比度实测（canvas 真值，全部 0 失败）

| 页面 | batch-3 组件失败 |
|---|---|
| /notifications | **0** |
| /approval | **0** |
| /dashboard（KPI 卡 + Journey） | KPI delta / pill / value **全部 0**（delta 曾 3.65 → 修） |

- **`--status-warning-ink` 加深** #A15C07 → **#8F4E05**：原值在 tint 叠加到非纯白行底后掉到
  4.35（Approval pill），加深后 6.0/白 6.44，全局留足余量。

## 基线

**879（修正基线）→ 732**，累计 **−147**。硬 >24px padding 162 → 129。

## 明确的作用域边界（= 下一批 Batch 4）

「迁移某页」≠ 迁移一个文件——页面由多个子组件拼成。以下**同级未迁移组件**仍有失败，
**不属于 Batch 3 命名清单**，是 Batch 4：
- Dashboard body：`ClinicianDashboardBody` / `TodaySchedule`（`Fri, 3 Jul` text-gray-400、`·` text-gray-300、`9 in progress` text-amber-600）；
- Staff：`StaffListPage` / `StaffOverviewTab`（`EMP-003` text-[10px] text-gray-400）；
- Calendar 网格：`DayGrid` / `WeekGrid` / `ListView` / `MyScheduleGrid`（`Consultation · 60m` text-[10px] text-gray-500）。

## 既有问题（未改）

- Notifications 行左侧 side-stripe 彩条（通知类型强调）——impeccable 禁止 >1px side-stripe，
  但属预存设计，且为整行列表项左accent，留待设计决策。

---

# Batch 4 迁移日志（长尾全量）

## 范围与方法

Batch 4 = 除已迁移文件与 vendored `src/components/ui/*`（shadcn 原件，已走 CSS-var 主题）
外的**全部剩余 124 个文件**。用 `scripts/migrate-tokens.pl` 跑批量，再按类别人工收尾：

1. **批量脚本**（124 文件，幂等）：palette→语义 token、radius→2 档。
2. **全局字号**：uppercase 微标 → `text-overline`（去冗余）、plain → `text-label`；13/15/18/28px → data/section/kpi。
3. **全局系统 bug 修复**：`bg-surface-sunken text-white`（脚本盲区）→ 头像 `text-ink-soft`、其余 → `bg-ink text-white`（深色片，恒达标）；双斜杠透明度折叠。
4. **Hex 分类**：
   - **Auth 品牌 ramp（D-5）**：`from-[#00B4D8] to-[#0077B6]…` 登录 CTA → `.btn-primary`；
     品牌蓝链接 `text-[#0077B6]` → `text-brand-ink`（`--phenome-blue-900`）；
     focus ring/border → `info`；深色分屏 `via-[#122A50] to-[#1E4E8C]` → `via/to-[var(--phenome-blue-900/500)]`；面板底 `#F4F7F9` → `bg-surface-page`。
   - **图表色**：`#475569/#3b82f6/#8b5cf6/#f59e0b/#10b981` → `var(--chart-1..5)`；`#dc2626` → `var(--status-danger)`。
   - **中性**：`#e5e7eb`→`border-strong`、`#f3f4f6`→`surface-hover`、`#9ca3af`→`text-muted`、`#1f2937`→`text-primary`。
   - **Google（D-9 豁免）**：`#4285F4/#34A853/#FBBC05/#EA4335` 保留。
5. **Palette 边缘态**（55 处脚本跳过的语义案例）：头像/圆点、subtle ring→divider、
   faint 状态边框→`{sem}/30`、legend 填充 200/300/400→signal、渐变 stop、
   深色面板 faint 文字→`text-white/N`、indigo 角色 pill→special、密码强度条。
6. **Padding 收敛**：组件内 28px+ → `p-4`；页级 `px-8`→`px-6`；空状态竖向 → `py-6`。

## 结果

| 指标 | 值 |
|---|---|
| 处理文件 | 124 |
| 残留 palette 类（app） | **0** |
| 残留 hex（app，排除 Google + `#2847` 工单文本） | **0** |
| 残留任意字号（app） | **0** |
| 硬 >24px padding | 40（其中 ~19 为 app 内 D-6 图标/时间轴 gutter，功能必需；余为 vendored ui/） |
| **对比度失败（10 条主路由 canvas 实测）** | **全部 0** |
| Console error/warning | 0 |
| typecheck | 26（基线，零回归） · build ✓ |

## 累计基线

**879（修正基线）→ 329**。剩余 329 构成：
- **276** = `px-6`/`p-6`（=24px）——**页面布局层允许带**（非违规，按设计规则合法）；
- **40** 硬 padding = D-6 图标/时间轴 gutter（app，功能必需）+ vendored ui/；
- **6 hex / 1 font / 6 arb-padding** = **全部在 vendored `ui/` shadcn 原件** + `#2847`（工单号文本，gate 已知误报）。

→ **应用层（非 vendored）的颜色/hex/字号迁移已 100% 完成。**

## 判断权衡（诚实记录）

- **白字压 sunken 的 CTA** 统一用 `bg-ink text-white`（深色片，恒达标）而非逐一判成
  `.btn-primary`——124 文件无法可靠自动识别「哪个是主 CTA」。结果：auth/journey 等
  手挑的用品牌渐变，其余 CTA 是深色导航蓝（如 Rooms「+ Add room」）。可读、成立，
  但**品牌渐变一致性**留待后续人工点选升级（非 bug）。
- **vendored `ui/`** 未迁移：shadcn 原件已用 CSS-var 主题，其零星 hex 为图表默认；不在 app 迁移范围。
- **gate `#2847` 误报**：feedbackData 里的工单号「ticket #2847」被 hex 正则命中，属文本非颜色。
