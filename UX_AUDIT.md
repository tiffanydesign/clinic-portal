# UX_AUDIT.md — Phenome Portal 全站体验审计报告

> 版本 v1.0 · 2026-07-14 · 审计人：Senior PM / UX（以代码为唯一事实源）
> 审计范围：`src/app` 下全部 187 个源文件（除 shadcn `components/ui/*` 基础件外全部逐文件走查），覆盖 Admin / Reception / Nurse / Clinician 四角色 × 全部路由页面。
> 本报告只记录问题与一句话修复方案，**未改动任何代码**。确认批次后再进入 Phase 2。

---

## 严重度定义

| 级别 | 含义 |
|---|---|
| **P0** | 破坏任务完成：核心流程走不通 / 死路 / 违反业务规则 |
| **P1** | 明显摩擦：死按钮、无效控件、缺失确认、误导性 UI |
| **P2** | 打磨：一致性、文案、mock 数据自洽、触控细节 |

问题类型缩写：`死按钮`（点击无结果）、`假控件`（有 UI 无逻辑）、`死路`（导航到无法完成任务的页面）、`无确认`（破坏性操作缺二次确认）、`hover-only`（iPad 触控违规）、`数据`（mock 数据矛盾）、`一致性`（视觉/文案/语义不统一）、`层级`（信息架构）。

---

## 一、P0 问题（4 条）

| # | 位置 | 类型 | 问题 | 修复方案 |
|---|---|---|---|---|
| P0-1 | `patient-record/ResultsTab.tsx`（全文件）；入口：`dashboard/ClinicianWorkQueue.tsx:67`、`dashboard/RolePanels.tsx:40`、`ClinicianQueueCounters` | 死路 | **Clinician 的核心工作流（审阅结果 / 签核报告）无法完成**：Work Queue 的 Review/Sign 按钮、Admin Results Queue 的每一行、通知里的结果链接全部导向 `/patients/…/results`，而该 Tab 是一个 "Digital Twin — Coming Soon" 占位页。点了按钮 → 到达死胡同 → 队列数字永远不减。 | ResultsTab 落地最小可用版：按患者列出待审结果（复用 `CLINICIAN_REVIEW_QUEUE`/`SIGNOFF_QUEUE` 数据），提供 Mark as Reviewed / Sign Report 行内动作并回写队列计数；"Digital Twin" 降级为页内一个 Coming soon 子卡片。 |
| P0-2 | `PatientsPage.tsx:60-68`（9 个 filter state）、`:126-180`（Toolbar 渲染） | 假控件 | **患者列表的全部 9 个筛选器（四角色合计）都不生效**：Status/Clinician/Group/Consent/Payment/Review/Flag/Next Appt/Journey 的选中值从未参与过滤，列表永远全量。用户以为"筛完就这些人"，直接误导业务判断。 | 把每个 filter 应用到 `patients` 计算管道；顶部显示 "Showing X of Y"；活跃筛选以可删除 chip 展示 + Clear all。 |
| P0-3 | `PatientsPage.tsx:478-480` | 业务规则 | Reception 患者表的 **"Check Out" 按钮违反既定业务规则**（全系统已确立：Check-out 是 Nurse journey 的最后一站，Reception 永远不做 check-out——见 `journeyEngine.ts`、`AppointmentDrawer.tsx:346` 注释与 Front Desk Queue 设计）。 | 删除该按钮；Checked In 状态显示只读 "In clinic · with nurse" 文案。 |
| P0-4 | `auth/LoginPage.tsx:28`、`auth/registrationData.ts:24` | 死路 | **登录页用系统内任何已知账号都登不进去**：校验要求邮箱以 `@phenomelongevity.com` 结尾 + 密码恰为 `123456`，但页面 placeholder 写 `you@clinic.com`、全体员工数据是 `@phenome.com`、页面没有任何 demo 提示（2FA 页反而有）。 | 校验放宽为 WHITELIST + 两个域名皆可；页面 Demo Settings 区加一行"演示密码 123456"提示，与 2FA/注册页的做法一致。 |

---

## 二、按页面分组的 P1 / P2 问题

### 1. 全局壳层（AppShell / 路由 / SiteMap）

| # | 位置 | 类型 | 严重度 | 问题 | 修复方案 |
|---|---|---|---|---|---|
| 1-1 | `components/AppShell.tsx:156-163` | 假控件 | **P1** | 顶栏全局搜索是纯 placeholder：无 state、无 onChange、无结果。rubric 明确要求实现最小版或移除。 | 实现最小版：输入 ≥2 字符弹出 患者/员工 两组结果下拉（数据来自 `MOCK_PATIENTS` + `MOCK_STAFF`），点击跳详情，回车跳列表页带搜索词。 |
| 1-2 | `components/AppShell.tsx:191-194` | 假控件 | **P1** | 通知铃铛的红点是硬编码 `<div>`，与 `notificationsStore` 的真实未读数无关——全部已读后红点仍亮。 | 从 `useReadIds()` + 角色通知集派生未读数；0 时隐藏红点，可选显示数字。 |
| 1-3 | `pages/app/AppPages.tsx:106-149`（SiteMap） | 死路 | **P1** | SiteMap 含两个 404 死链：`/calendar/appointment/A-101`（路由不存在）与 `/availability`（不存在）；`/approval/REQ-1` 指向骨架页。 | 修正为 `/calendar/schedule/appointment/A-01` 与 `/calendar/my-availability`；删除 REQ-1 条目及其骨架路由。 |
| 1-4 | `App.tsx:118` + `AppPages.tsx:90`（NewPatientSkeleton） | 死路 | **P1** | `/patients/new` 是占位骨架，但它是 Reception 仪表盘主 CTA "Register Patient" 和 New Appointment 弹窗 "Register new patient" 的落点；同时 PatientsPage 自己却用弹窗注册——同一动作两套入口、一套是死的。 | 统一：`/patients/new` 直接打开 PatientsPage 并弹出现有 Register New Patient 弹窗（或该路由渲染同一弹窗组件），删除骨架。 |
| 1-5 | `components/CalendarPage.tsx`、`components/LoginPage.tsx`、`components/PatientRecord.tsx` | 死代码 | P2 | 三个旧版组件已无任何 import（grep 验证），留在仓库里干扰"以代码为事实源"。 | 删除三个文件。 |
| 1-6 | 全站 icon 按钮（如 `StaffRowMenu.tsx:43` p-1.5≈30px、PaymentTerminals 行内笔/垃圾桶、各弹窗 X） | 触控 | P2 | 多处 icon-only 按钮触控目标 <44×44pt。 | 统一 icon 按钮最小 `min-w-[44px] min-h-[44px]`（视觉尺寸不变，扩大命中区）。 |

### 2. Dashboard（Admin）

| # | 位置 | 类型 | 严重度 | 问题 | 修复方案 |
|---|---|---|---|---|---|
| 2-1 | `dashboard/KpiBar.tsx:102-105` | 死按钮 | **P1** | KPI 卡在 7d/30d 可点击，但除 `checked-in-now` 外多数 KPI 无 `route`，点击只 toast "Opening filtered list (demo)"。Today 态不可点且无解释。 | 给每张卡配真实 route（Appointments→/calendar/schedule、Results→患者列表带 Review 筛选…）；Today 态去掉 hover 视觉即无点击暗示。 |
| 2-2 | `dashboard/KpiBar.tsx:66-73` | hover-only | **P1** | 锁定 KPI 的说明 tooltip 仅 `group-hover` 触发，iPad 上永远看不到"为什么锁"。 | 改为点击锁 icon 弹出同文案 popover（复用 FloatingPopover）。 |
| 2-3 | `dashboard/RolePanels.tsx:40`、`ClinicianWorkQueue.tsx:67` | 数据 | **P1** | Results Queue / Work Queue 每一行都导航到 `/patients/P-001/results`——点 Arysse 打开的是 Mackenzie 的档案。 | 行导航改为按患者名映射到 `MOCK_PATIENTS` 的 patientId（`/patients/PH-2026-0015/results` 等）。 |
| 2-4 | `dashboard/AppointmentDrawer.tsx:350-360`（Reception footer） | 一致性 | **P1** | Drawer 的 Check In 只 toast，不写共享 `appointmentsStore`——关掉抽屉后 Front Desk Queue 里该患者仍是待办；同页两个入口行为分裂。 | footer Check In 调 `checkIn(appt.id)`；成功后 toast+关闭。 |
| 2-5 | `dashboard/AppointmentDrawer.tsx:208-223` | 一致性 | **P1** | Drawer 的 "Start Transaction / Send Payment Link / Initialize Signing / Send Form" 全是 toast 占位，而队列行早已接好 `StartTransactionModal` 与 `/consent-sign` 全流程。 | Start Transaction 打开 `StartTransactionModal`（成功回写 `recordPayment`）；Initialize Signing 导航 `/consent-sign/:id`；两个 Send 保留 toast 但更新对应表单/付款状态为 Pending 已发送。 |
| 2-6 | `dashboard/NeedsYourActionCard.tsx` → `/billing` | 死路 | **P1** | Refund 待审条目把 Admin 送到 Billing，但 Billing 里没有任何 Approve/Reject refund 动作（见 4-3）——审批闭环断裂。 | 与 4-3 一起修：Billing 详情面板对 `Refund Pending` 记录提供 Approve/Reject（带确认+理由），回写 `billingData`，Needs Your Action 计数随之下降。 |
| 2-7 | `dashboard/ActivityFeed.tsx`、`RolePanels.tsx` Waiting Room | 打磨 | P2 | Recent Activity / Waiting Room 行不可点（活动提到的患者/账单无入口）。 | 涉及患者/账单的行加浅导航（患者名→档案，付款→Billing）。 |
| 2-8 | `DashboardPage.tsx` KPI 自选状态 | 打磨 | P2 | Customise KPIs 的选择存组件 state，切页即重置。 | 存 sessionStorage（同 kpiRangeStore 模式）。 |

### 3. Patients 列表页（四角色）

| # | 位置 | 类型 | 严重度 | 问题 | 修复方案 |
|---|---|---|---|---|---|
| 3-1 | `PatientsPage.tsx:278-289` | 死按钮 | **P1** | Admin 批量操作条 4 个按钮（Assign Clinician/Assign Nurse/Change Group/Export Selected）全部没有 onClick。 | 前两个开最小指派弹窗（复用 Workload 的 ReassignModal 形态），Change Group 开选择弹窗，Export Selected 走真 CSV 导出（FeedbackAdminPage 已有可复用实现）。 |
| 3-2 | `PatientsPage.tsx:109-111` | 死按钮 | **P1** | Admin 头部 Export 按钮无 onClick。 | 复用 Feedback 的 CSV 导出逻辑导出当前筛选结果。 |
| 3-3 | `PatientsPage.tsx:422/515` | 死按钮 | **P1** | Admin/Clinician 行内 "…" Actions → `toast('Open actions menu')`，无菜单。 | 复用 `StaffRowMenu` 的 portal 菜单模式：View Record / New Appointment / (Admin) Assign…。 |
| 3-4 | `PatientsPage.tsx:145-149 / 173-176` | 假控件 | **P1** | Reception 三个视图 tab（All / Today's / Awaiting Check-in）与 Nurse 两个 tab 是写死的静态样式，点击无效。 | 接 state 并过滤列表（Today=nextAppt 含 3 Jul；Awaiting=今天且 gate 未过）；选中态随 state。 |
| 3-5 | `PatientsPage.tsx:544` | 死按钮 | **P1** | Nurse 行 "Continue" → toast。 | 导航到该患者 `/patients/:id/journeys`（Nurse 默认 tab 即 journeys）。 |
| 3-6 | `PatientsPage.tsx:556-565` | 假控件 | **P1** | 假分页：Next 永远无效但样式可点；行数 ≤12 时应隐藏分页而非展示死按钮。 | 数据一页放得下 → 只显示 "Showing 1–N of N"，去掉 Prev/Next。 |
| 3-7 | `PatientsPage.tsx:296` | Bug | **P1** | 表头 sticky 列偏移用了模板字符串类名 `left-[${…}]`，Tailwind 无法编译 → Admin 视图横向滚动时 Patient 列头偏移失效。 | 改为条件完整类名：`role==='Admin' ? 'left-[40px]' : 'left-0'`。 |
| 3-8 | `PatientsPage.tsx:570-627` | 误导 | **P1** | 新患者弹窗显示 1-2-3 步骤指示器但只有第 1 步存在；按钮叫 "Next Step" 实际直接提交成功并关闭。 | 步骤指示器删掉或补足 2/3 步；按钮改 "Register Patient"；必填项校验后再提交。 |
| 3-9 | `PatientsPage.tsx:432-434` | 假控件 | P2 | Reception 行电话号样式是链接（蓝色+hover 下划线）但不可点。 | 包 `tel:` 链接或去掉链接样式。 |
| 3-10 | `PatientsPage.tsx:381`（同 Billing） | 对比度 | P2 | 头像 `bg-gray-200 text-white`——白字浅灰底不可读。 | 改 `bg-slate-500 text-white`（同 Staff 列表）。 |
| 3-11 | `PatientsPage.tsx:476` | hover-only | P2 | 禁用 Check In 的原因仅 `title=` 提示。 | 点击弹 toast 说明"Complete consent and payment first"。 |
| 3-12 | KPI 卡区 `:183-265` | 数据 | P2 | 计数卡全硬编码（247/189/…），与表格 12 行完全脱节；rubric 要求计数一致。 | 可算的从列表算（Total/Active/Unassigned/Pending=按 MOCK_PATIENTS 计算）；补一句 "of N shown" 说明口径。 |
| 3-13 | 空态 `:350-356` | 打磨 | P2 | 空结果态有文案但没有"清除筛选"按钮（rubric 要求）。 | 加 "Clear all filters" 按钮（Staff/Billing/Feedback 空态同步加）。 |

### 4. Billing

| # | 位置 | 类型 | 严重度 | 问题 | 修复方案 |
|---|---|---|---|---|---|
| 4-1 | `BillingPage.tsx:84` | 假控件 | **P1** | 搜索框无 state/onChange。 | 接 state，按患者名/ID 过滤。 |
| 4-2 | `BillingPage.tsx:88-99` + 渲染 `:175` | 假控件 | **P1** | Status/Method 两个 FilterSelect 的值从不参与过滤。 | 应用到 `MOCK_DATA` 管道 + 结果计数。 |
| 4-3 | `BillingPage.tsx:417-432` | 无确认/死路 | **P1** | "Issue Refund" 仅 toast，无二次确认（rubric 点名退款必须确认）；且对 `Refund Pending` 记录没有 Approve/Reject 入口，Admin 审批闭环断（见 2-6）。 | 详情面板按记录状态分化：Refund Pending → Approve Refund / Reject（确认弹窗写清金额与后果，Reject 需理由，复用 RejectReasonModal 形态）；普通 Paid → Issue Refund 走确认弹窗。回写数据以联动 Needs Your Action。 |
| 4-4 | `BillingPage.tsx:101-111` | 假控件 | **P1** | 日期范围（写死 1–7 Jul）与 All/Today/This Week 三个 toggle 全是静态装饰。 | 日期范围接 `RangeDatePicker`（Timesheet 已有完整用法）；三个 toggle 接 state 过滤 `isToday` 等。 |
| 4-5 | `BillingPage.tsx:268` | 数据 | **P1** | "Showing 1–8 of 89 records" 与实际 12 行两头都不对；Next 死按钮。 | 显示真实 `MOCK_DATA.length`；单页时隐藏分页。 |
| 4-6 | `BillingPage.tsx:160-170` | 假控件 | P2 | 全部表头带 `cursor-pointer hover` 的排序 affordance + "Date ▼" 假排序指示，均无排序逻辑。 | 要么实现 Date/Amount 排序（Staff 列表已有可复制实现），要么去掉 hover/cursor/箭头。 |
| 4-7 | `BillingPage.tsx:206-214` | hover-only | P2 | Voucher 详情 tooltip 仅 hover 展示。 | 改点击 popover。 |
| 4-8 | `BillingPage.tsx:233-236` | 一致性 | P2 | 发票状态用 emoji ✅/⏳ + title-only 提示，与全站 pill 语言不符。 | 换 StatusPill（Issued=success，Pending=warning）。 |
| 4-9 | `BillingPage.tsx:194/290` | 数据 | P2 | 患者链接全部硬编码 `/patients/P-001`。 | 按患者名映射真实 patientId。 |
| 4-10 | KPI 卡 `:115-148` | 数据 | P2 | 四张卡硬编码，与表内数据矛盾（如今日收款 ₺12,400/8 笔 vs 表内今日仅 1 笔 ₺18,000）。 | 从 `MOCK_BILLING_DATA` 计算今日收款/待付；月度两张保留但口径注明。 |
| 4-11 | Reception 视角 `:422-428` | hover-only | P2 | 禁用 Issue Refund 的解释仅 `title=`。 | 按钮下加一行灰字 "Only Admin can issue refunds"。 |

### 5. Patient Record（档案页五 Tab）

| # | 位置 | 类型 | 严重度 | 问题 | 修复方案 |
|---|---|---|---|---|---|
| 5-1 | `patient-record/PatientHeader.tsx` | 层级 | **P1** | Header 常驻区缺**关键安全信息**：Mackenzie 的 `Allergy: Penicillin (critical)` 只藏在 Overview 卡片里，Nurse/Clinician 换 tab 就看不见（rubric §5 点名过敏警示应常驻）。 | Header 姓名行右侧加红色 alert chip（`medicalAlerts` 中 critical/high 各一枚，同 ClinicianNowCard 的样式）。 |
| 5-2 | `PatientHeader.tsx:35`（Delete）、`AppointmentsTab.tsx:48`（Cancel）、`ClinicianNotesTab.tsx:137`（Delete note） | 无确认 | **P1** | 三处破坏性操作零确认直接执行/直接 toast。 | 统一走确认弹窗（复用 EditModals 的 ConfirmDialog / CancelModal），文案写清后果。 |
| 5-3 | `ResultsTab.tsx` | 死路 | **P0-1 已列** | —— | —— |
| 5-4 | `ClinicianNotesTab.tsx:64-67` | 死按钮 | P2 | Add Note 弹窗的 B/I/List/H2 工具栏按钮全是 toast 占位，而 clinic-settings 已有完整 `RichTextEditor`。 | 直接换用 `RichTextEditor` 组件。 |
| 5-5 | `AdminOverview.tsx:111-126` | 数据 | P2 | Activity 卡硬编码同一份内容（合成患者也显示 Mackenzie 的活动），icon 一律灰色 AlertTriangle。 | 数据挂到 patient 上（合成患者显示"暂无活动"空态）；icon 按事件类型换（复用 ActivityFeed 的 KIND_ICON）。 |
| 5-6 | `SignedFormsTab.tsx` 各动作、`ReceptionOverview` Contact/Send | demo 深度 | P2 | View PDF/Download/Resend/Send 均 toast——可接受，但 Resend/Send 后应把该表单状态置为 "Pending Signature" 以形成反馈闭环。 | toast + 本地状态更新。 |
| 5-7 | `JourneyDetailPage.tsx:64-65/87` | 打磨 | P2 | 步骤 Add Note 提示成功但笔记不落地；markStarted 的时间戳是字符串 "Now"。 | note 写进 `step.notes`；时间戳用当前 `minToClock`。 |
| 5-8 | `PatientRecordLayout` 返回 | 打磨 | P2 | Back 固定回 `/patients`，列表滚动位置/筛选丢失。 | 列表滚动位置存 sessionStorage，返回时恢复（筛选生效后同存）。 |
| 5-9 | `PatientHeader.tsx:111` flag emoji | hover-only | P2 | 旗标含义仅 title 提示；emoji 与全站 pill 语言不一致。 | 换成带文字的小 pill（Urgent/Follow-up/Watch）。 |

### 6. Staff 模块

| # | 位置 | 类型 | 严重度 | 问题 | 修复方案 |
|---|---|---|---|---|---|
| 6-1 | `staff/StaffPermissionsTab.tsx` + `StaffRowMenu.tsx:71` | 死路 | **P1** | Permissions Tab 是 Coming Soon 占位，但行菜单 "Manage Permissions" 与 Detail Tab 都导向它；且 `patientRecordData.ts:11` 注释声称 Tab 可见性"镜像 Staff Management → Permissions 的配置"——引用一个不存在的东西。 | 最小只读版权限矩阵：按现有事实源渲染（`ROLE_TABS` 患者档案 Tab 权限 + 各角色路由白名单 `ALLOWED_ROUTES`），分组折叠 + 每组一句说明，标注 "Role defaults · editing coming soon"。不新增编辑逻辑（守住"不加大功能"约束）。 |
| 6-2 | `staff/StaffOverviewTab.tsx:63-76` | 无确认 | **P1** | Account Status toggle 一键停用账号（对当前登录管理员之外任何人）无确认；且与 Detail 头部菜单/行菜单的 Deactivate 三处入口互不同步。 | toggle 触发确认弹窗；确认后三处状态同源（提升到 staffData 简单 store 或仅保留菜单入口、toggle 变只读显示）。 |
| 6-3 | `StaffDetailLayout.tsx:87-95`、`StaffRowMenu.tsx:74-86` | 无确认 | **P1** | Set On Leave / Deactivate / Reset Password 全部直接 toast 无确认（Deactivate 是破坏性的）。 | Deactivate 加确认弹窗；其余 toast 可保留但文案统一。 |
| 6-4 | `StaffListPage.tsx:113-118` | 死按钮 | **P1** | Export 菜单两项点击只关菜单，无任何动作（连 toast 都没有）。 | 走真 CSV 导出当前筛选（复用 Feedback 实现）；Excel 项 toast 说明。 |
| 6-5 | `StaffAvailabilityTab.tsx:160-166` | 假控件 | **P1** | 编辑器时间输入 `readOnly` 改不了，但 Save 报"保存成功"；"Copy to all" 无 onClick（`AvailabilityEditorPage.tsx:324` 同样死）。 | 时间输入换 `FilterSelect`（My Availability 编辑器同款）；Copy to all 实现为把第一行 slots 覆盖到所有 active 日。 |
| 6-6 | `StaffAvailabilityTab.tsx:163`、`AvailabilityEditorPage.tsx:321` | hover-only | **P1** | 行内 添加/删除/复制 slot 按钮 `opacity-0 group-hover:opacity-100`——iPad 上完全不可见不可用。 | 常显（低饱和灰即可），去掉 opacity 切换。 |
| 6-7 | `staff/AddStaffModal.tsx:139` | 文案 | **P1** | 单人创建的提交按钮写成批量导入的 "Import & Send Invitations"。 | 改 "Create & Send Invitation"。 |
| 6-8 | `StaffOverviewTab.tsx:49-51` | 数据 | P2 | 所有员工共用同一份个人信息：DOB 15 May 1988、国籍 Portuguese（对 Berna Koç 等土耳其姓名员工非常出戏）、同一份月度活动数。 | 个人信息挂到 `staffData` 每人身上（至少国籍改 Turkish，各人错开数值）。 |
| 6-9 | `StaffListPage.tsx:149-162` | 数据 | P2 | On Duty 9 / Avg 74% / Pending 3 硬编码，与列表可计算值脱节。 | On Duty/Avg 从 `MOCK_STAFF` 计算；Pending 保留但把 “1 permission review” 改为与 6-1 一致的口径。 |
| 6-10 | `AddStaffModal.tsx:57` | Bug | P2 | 新 ID 按 `MOCK_STAFF.length+1` 生成，连加两人 ID 重复。 | 用已存在 ID 集合取 max+1 或时间戳（Import 已用时间戳）。 |
| 6-11 | `StaffListPage.tsx:314`（status title）、`StaffDetailLayout` 头像 hover 相机 | hover-only | P2 | On Leave 的日期范围仅 title；换头像提示仅 hover 蒙层。 | 状态 pill 直接内联短日期（"On Leave · 1–5 Jul"）；头像点击即触发（已可点击，蒙层改常显小相机角标）。 |
| 6-12 | `staffData.ts:33` vs `ASSIGNED_PATIENTS`(8) vs PatientsPage(4) | 数据 | P2 | Dr. Claudia 患者数三处三个值：24（列表）/8（Workload 明细，页脚自己写 "Showing 8 of 24"）/4（患者页 My Patients）。 | 统一到一个口径（建议 8，与明细一致），三处同源或加口径说明。 |

### 7. Calendar / Schedule / Team Availability

| # | 位置 | 类型 | 严重度 | 问题 | 修复方案 |
|---|---|---|---|---|---|
| 7-1 | `calendar/EditModals.tsx:24-27` | Bug | **P1** | Edit Appointment 弹窗可改 Type 和 Notes，但 apply 只提交 startMin/duration——**用户的修改被静默丢弃**。 | `onApply` 带上 type；Notes 至少存 override（或去掉这两个字段）。 |
| 7-2 | `calendar/CreateModals.tsx:283`、`EditModals.tsx:106` | 数据 | P2 | Block Time / Reschedule 的日期写死 "3 Jul 2026" readOnly——Schedule 页现已支持任意日期，看着 15 Jul 的表却在给 3 Jul block。 | 从 SchedulePage 把 selectedDate 传入两弹窗显示。 |
| 7-3 | `availability/OverrideModal.tsx:66-68` | 死按钮 | P2 | 月历上一月/下一月箭头无 onClick（锁定 July 2026）。 | 禁用态展示（去掉 hover 样式）+ title 说明 demo 仅支持 7 月，或实现翻月。 |
| 7-4 | `TeamAvailability.tsx:273-289/319`（周导航）| 假控件 | P2 | 周期左右箭头无 onClick；日历弹层点任意一周都跳同一个 "13–19 Jul" 空周；"July 2026" 翻月箭头也无效。 | 与 Schedule 页同思路：仅锚定周有数据，其余周显示空态（每人 "No availability set"），箭头/日历真切换 weekLabel+数据清空。 |
| 7-5 | `dashboard/CalendarWidget.tsx`（Admin/Reception 首页） | 打磨 | P2 | 首页 Today's Schedule 无日期导航（固定 3 Jul）——与 Schedule 页新加的日期选择器能力不一致；可接受但报告备案。 | 保持现状（首页就该只看今天），标题已写 Fri, 3 Jul，无需改。 |
| 7-6 | `ScheduleToolbar` 状态图例 | 一致性 | P2 | 图例 In Clinic=orange、Checked In=emerald，而 Clinician 列表 In Clinic 文本用 orange、journey 进行中用 blue、CalendarWidget 汇总 in progress 用 amber——"进行中"语义色三分。 | 全站收敛：blue=in progress/进行中，amber=waiting/pending，emerald=complete，red=blocked/overdue；逐处对齐（详见横切 C-2）。 |

### 8. Nurse Dashboard / Journey

| # | 位置 | 类型 | 严重度 | 问题 | 修复方案 |
|---|---|---|---|---|---|
| 8-1 | `nurseDashboardData.ts:94` | 数据 | P2 | 从队列开动的患者身份 tag 是 "—"（年龄性别空白）。 | QueueItem 补 tag 字段（mock 数据加上）。 |
| 8-2 | `nurseDashboardData.ts:70` | 数据 | P2 | Noah Kimura 行 `doctor: "Lab 1"`（房间名填进了医生字段）。 | 改成真实医生名。 |
| 8-3 | `nurseDashboardData.ts` vs `ActivityFeed`/`dashboardData` | 数据 | P2 | Amara Chen 10:30 Body Scan 在 Admin 活动流里"已取消"，Nurse 排程里却是 upcoming；Penny 在 Nurse 页 09:00 cancelled 但 Reception 数据里 09:45 Arrived。 | 对齐这两名患者的跨页状态（Amara 在 Nurse 排程也标 cancelled；Penny 移除 Nurse 页的 cancelled 行或改为同一时段）。 |

### 9. Feedback / Timesheet / Notifications / Profile

| # | 位置 | 类型 | 严重度 | 问题 | 修复方案 |
|---|---|---|---|---|---|
| 9-1 | `FeedbackAdminPage.tsx:444-447` | 死按钮 | **P1** | 头部 Settings 齿轮按钮无 onClick。 | 无对应功能 → 删除按钮。 |
| 9-2 | `FeedbackAdminPage.tsx:211-215` | 死按钮 | **P1** | 抽屉里 "View Patient Record / View Staff Profile" 无 onClick。 | 患者→按名映射患者档案；员工→`/staff/:id`（按名匹配 MOCK_STAFF）。 |
| 9-3 | `FeedbackAdminPage.tsx:484-499` | 假控件 | P2 | "This Month" 日期块与 5 星评分筛选是静态装饰。 | 评分筛选实现（点星过滤 rating≥n，再点清除）；日期块删除或接 RangeDatePicker。 |
| 9-4 | KPI 卡 `:504-537` | 数据 | P2 | Total 47/Open 5/Staff 9 硬编码，状态一变就与 tab 计数矛盾（Google 两张已是活数据，样板在同页）。 | 全部从 `feedbacks` 计算。 |
| 9-5 | `Timesheet.tsx:549` | 数据 | P2 | Weekly 视图 Week 列硬编码 "1 Jul – 7 Jul 2026"，无视顶部日期筛选。 | 用 `dateRange` 格式化。 |
| 9-6 | `Timesheet.tsx` Export、`StaffAvailability` change history 等 | demo 深度 | P2 | Export 是 toast（Feedback 已有真导出）。 | 复用 CSV 导出。 |
| 9-7 | `ProfilePage.tsx:358-374` | 数据/死按钮 | P2 | Recent Activity 混入 "Oct 12/11" 旧日期（demo 时间是 7 月）；"View Audit Log" 无 onClick。 | 日期改 6–7 月序列；按钮删除或 toast。 |
| 9-8 | `ProfilePage.tsx:200` | 打磨 | P2 | "Save Changes" 用 secondary 样式，主次不分。 | 换 primary 变体。 |
| 9-9 | `TwoFactorPage.tsx:65`、`ProfilePage` 2FA 行 | 数据 | P2 | 掩码邮箱硬编码 `a****z@example.com`，与登录邮箱/角色邮箱无关（registrationData 已有 `maskEmail` 可复用）。 | 用 `maskEmail(pendingAuth 对应邮箱 ?? 角色邮箱)`。 |
| 9-10 | `ForgotPasswordPage` | 打磨 | P2 | 四个路由（/verify、/reset-password、/done）都渲染步骤 A，URL 不随步骤走，刷新丢进度；SiteMap 链到这些路由产生误导。 | 低成本方案：步骤写入 URL（navigate 到对应路由 + 直链守卫回 A，复用 registrationStore 的守卫模式）。 |
| 9-11 | 通知 Resend code（2FA/Verify） | 打磨 | P2 | Resend 点击后无任何"已重发"反馈。 | 加 toast.success("Code resent")。 |

### 10. 各弹窗横向（确认与 loading 规范）

| # | 位置 | 类型 | 严重度 | 问题 | 修复方案 |
|---|---|---|---|---|---|
| 10-1 | 破坏性操作确认覆盖率 | 无确认 | **P1** | 已有确认：取消预约(Calendar)、移除终端、签退设备、Skip/GoBack、Discard 草稿、Import 部分导入 ✅。缺确认：患者 Delete、笔记 Delete、档案页 Cancel appointment、员工 Deactivate×3、Billing Issue Refund、Approval 页 Reject 有理由弹窗✅但 Approve 直接执行（可接受，非破坏）。 | 按 5-2/6-2/6-3/4-3 补齐；统一确认弹窗文案模板（做什么+影响谁+可否撤销）。 |
| 10-2 | 异步 loading 态 | 打磨 | P2 | 已有：StartTransactionModal waiting、Import 处理中 ✅。其余提交均为即时 mock（可接受）。 | 不动；新增的 Refund Approve 等沿用 toast 即可。 |

---

## 三、横切一致性检查（rubric §7/§8）

### C-1 跨页面数据抽查（10 项，7 项不一致 ⚠️）

| 数据点 | 页面 A | 页面 B | 结论 |
|---|---|---|---|
| Mackenzie 年龄/DOB | Dashboard 抽屉：12 Feb 1988 · 38 | 患者档案：12 Mar 1992 · 34（列表同 34） | ⚠️ 两套生日 |
| Penny 年龄 | Dashboard：41 | 患者列表：28 | ⚠️ |
| Riley 年龄 | Dashboard：33 | 患者列表：42 | ⚠️ |
| Bob 年龄 | Dashboard：55 | 患者列表：38 | ⚠️ |
| Dr. Claudia 患者数 | Staff 列表 24 | Workload 8 · 患者页 4 | ⚠️ 三值 |
| 医生名册 | 排班/员工：Reis/Okonkwo/Andersen/Martinez | 患者列表/Billing："Dr. Higgs"、简称混用 | ⚠️ Higgs 不存在 |
| Amara Chen 10:30 Scan | Admin 活动流：已取消 | Nurse 排程：upcoming | ⚠️ |
| Mackenzie 今日 Body Scan ₺ | Dashboard：₺4,800 | Billing：₺18,000 | ⚠️（可解释为套餐价，需统一口径） |
| 员工邮箱域 | staffData `@phenome.com` | 登录仅认 `@phenomelongevity.com` | ⚠️（P0-4） |
| refund 待审计数 | Needs Your Action 4 | Billing Refund Pending 4 | ✅（同源，好样板） |

**修复方案**：以 `dashboardData.ts`（预约层）与 `MOCK_PATIENTS`（名册层）为准做一次对账：名册年龄/生日改为与 dashboardData 一致；医生名统一全名并映射到 CLINICIANS 四人；Amara/Penny 状态对齐；金额口径统一（Body Scan=₺4,800，7-Omics=₺18,000/24,000 并全站沿用）。

### C-2 状态语义色

现状：emerald=完成/成功 ✅ 一致；red=阻塞/逾期 ✅ 基本一致；**"进行中"三分**（journey/进度条 blue、StatusPill "In Clinic" orange、CalendarWidget 汇总 amber）；amber/orange 同时表示 pending 与 in-progress。
**修复方案**：约定 blue=in progress、amber=pending/waiting、emerald=complete、red=blocked/overdue、purple=refund 专用；逐处替换（改动集中在 `dashboardData.statusPillType`、CalendarWidget 汇总行、ClinicianScheduleList 的 In Clinic 文本色）。所有色点均已带文字 ✅。

### C-3 术语与文案

- 动词统一 ✅ 基本达标（Check In/Check Out/Mark Arrived 全站一致）；遗留：journey 步骤 "Test Kit / Home Test Kit / Home Kit" 三写法（`patientRecordData`、`JOURNEY_STEPS_RECEPTION`）→ 统一 "Home Test Kit"。
- 大小写：标题 Title Case 与 Sentence case 混用（如 "Mark as Started" vs "Mark arrived"）→ 按 rubric 统一 Sentence case（按钮/标题批量过一遍，属低风险文案改）。
- 日期格式 ✅ 已统一 "D MMM YYYY" + 24h；遗留 Profile 活动日志 "Oct 12"（9-7）。

### C-4 间距 / 圆角 / 阴影

卡片圆角现存 4 档（rounded / lg / xl / 2xl）。**修复方案**：收敛两档——容器卡 `rounded-xl`、小件(pill/按钮) `rounded`；Nurse 页 2xl 与 Dashboard Section 无圆角 rounded 各改一档。阴影已基本两档（sm / md）✅。间距大体在 8pt 网格上，不做全局重排（只随批次顺手修偏差）。

### C-5 五态完整性

- Loading：纯本地 mock，页面级 skeleton 无必要；仅两处真实异步模拟已带 loading ✅。**不补页面级 skeleton**（避免为演示造假加载）。
- Empty：多数列表有空态 ✅；缺"清筛"按钮的按 3-13 补。TeamAvailability/Timesheet 的引导空态是全站样板。
- Error：无网络层，唯一可错的表单均有行内错误 ✅。
- 无权限：RoleGuard toast+重定向 ✅；Billing 的 Reception 禁用按钮解释改点击可见（4-11）。

### C-6 iPad 触控

- hover-only 违规清单：KPI 锁 tooltip（2-2）、availability slot 按钮（6-6）、Staff leave title（6-11）、Billing voucher/invoice（4-7/4-8）、患者 flag emoji（5-9）、Patients 禁用 Check In title（3-11）、Approve 禁因 title（Approval 页，低频，随 4 批修）。
- 长按/拖拽：DayGrid 拖拽为鼠标事件（mousedown/mousemove），iPad 上退化为"点按打开抽屉"仍可用 ✅（不改，避免动交互模型）。
- 触控目标：见 1-6 统一垫高。

---

## 四、建议实施批次

**批次 1 — P0（先做，半天量级）**
P0-1 Results 最小工作流 · P0-2 Patients 筛选生效（含计数/chips/清筛）· P0-3 移除 Reception Check Out · P0-4 登录修复。

**批次 2 — P1「死按钮/假控件清零」**
1-1 全局搜索最小版 · 1-2 铃铛真未读 · 1-3 SiteMap 死链 · 1-4 /patients/new 统一 · 3-1~3-8（Patients 交互补全）· 4-1~4-5（Billing 搜索/筛选/日期/退款闭环）· 9-1/9-2（Feedback 死按钮）· 6-4 Staff 导出 · 6-5/6-6 可用的可编辑器+常显按钮 · 7-1 EditModal 丢字段 · 2-1/2-2 KPI 路由与锁说明。

**批次 3 — P1「一致性与安全动作」**
2-4/2-5 抽屉接真实动作 · 2-6+4-3 退款审批闭环 · 5-1 过敏进 Header · 5-2/6-2/6-3/10-1 破坏性确认统一 · 6-1 权限只读矩阵 · 6-7 按钮文案 · 2-3 队列行真实患者路由。

**批次 4 — P2「数据对账 + 视觉语义」**
C-1 全部对账 · C-2 颜色语义统一 · C-3 术语/大小写 · 6-8~6-12、8-1~8-3、9-4~9-9、4-6~4-10、5-4~5-8、3-9~3-13、7-2~7-4、C-4 圆角收敛 · 1-5 删死文件 · 1-6 触控垫高 · 切换过渡（tab/segmented 150ms fade，低风险统一加）。

每批完成后：`npm run build` + Playwright 四角色走查 + 小结改动点。

---

## 五、明确不做（守住硬约束）

- 不改任何业务规则/状态机（预约流转、check-in gate 条件、审批规则、单会话互斥）——P0-3 恰是**恢复**被违反的规则。
- 不新增大功能模块：Results/权限矩阵均按"最小可用/只读"落地；Digital Twin、真实日历翻月数据等保持 Coming soon 但不再挡住任务主路径。
- 不引入新视觉语言：Profile 的 frosted 风格是既有决定，保留；其余全部沿用 classic 卡片语言。
- 不动路由结构（仅删 SiteMap 死链与 `/approval/REQ-1` 残留，报告已单列）。
