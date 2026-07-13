# Phenome Portal 员工端 — 产品需求文档（PRD）

| 项 | 内容 |
|---|---|
| 版本 | v1.0（首个完整版） |
| 日期 | 2026-07-07 |
| 状态 | 草案 · 待评审 |
| 作者 | Tiffany（产品）· 由 PRD 协作生成 |
| 上游输入 | ① 老板版页面清单 xlsx（参考）② 原型代码（主要事实源）③ 页面级需求笔记 + 第一步 Q1–Q12 答复（主要事实源） |
| 修订记录 | v0.1 第一步交付（理解概述+待确认问题）→ v1.0 依据 Q1–Q12 答复展开全文 |

**符号约定**：`【待确认】`= 需要你/老板/合规拍板；`【假设】`= 我为闭环逻辑做的前提，汇总在第 14 章；**P0/P1/P2** = 优先级（P0 本期必须、P1 本期应做、P2 后续迭代）。涉及与原型不一致处，均标注「**改原型**」，方便后续把本文档当作改原型的 prompt 真相源。

**阅读路径建议**：改原型前先读 §2（权限）§5（状态机）§6.1–6.3（主干页面）；做视觉走 §11；排期看 §15。

---

## 目录

1. [产品概述](#1-产品概述)
2. [角色与权限](#2-角色与权限)
3. [信息架构与导航](#3-信息架构与导航)
4. [核心业务流程（端到端）](#4-核心业务流程)
5. [状态机](#5-状态机)
6. [页面级需求（主体）](#6-页面级需求)
7. [KPI / 指标规格](#7-kpi指标规格)
8. [考勤打卡模块](#8-考勤打卡模块)
9. [数据模型](#9-数据模型)
10. [通知与消息](#10-通知与消息)
11. [Design System / iPad UX 规范](#11-design-system--ipad-ux规范)
12. [非功能需求（含患者数据合规）](#12-非功能需求)
13. [待确认问题清单](#13-待确认问题清单)
14. [假设清单](#14-假设清单)
15. [优化建议与分期](#15-优化建议与分期)

---

## 0. 术语表（Glossary）

> 界面语言为英文，本表定义**唯一合法界面用词**；任何页面/文案/代码命名与本表冲突时以本表为准（**改原型**处已标注）。

### 0.1 角色

| 界面词 | 中文 | 定义 |
|---|---|---|
| Admin | 管理员 | 全系统唯一（§2.2）。运营与配置的最终责任人 |
| Receptionist | 前台 | 角色名在界面统一用 **Receptionist**（原型登录角色枚举 "Reception" 仅作代码值保留，界面展示一律 Receptionist。**改原型**） |
| Nurse | 护士 | 执行 Journey 到店步骤（更衣→扫描→采样→发放检测盒） |
| Clinician | 医生 | 问诊、结果审阅（Review）、报告签发（Sign-off） |

### 0.2 预约（Appointment）

| 界面词 | 中文 | 定义 |
|---|---|---|
| Booked | 已预约 | 创建成功、未到店 |
| Arrived | 已到店 | 前台标记患者到达，等待完成签到闸门（统一用 Arrived，废弃 "Waiting"。**改原型**：Patients 页 Reception 列） |
| Checked In | 已签到 | 通过签到闸门（§6.2.4），Journey 自动开始 |
| In Clinic | 就诊中 | Journey 任一到店步骤进入 In Progress 后自动流转 |
| Completed | 已完成 | 前台执行 Check Out |
| No Show | 爽约 | 患者未到店，超时后人工标记 |
| Cancelled | 已取消 | 到店前取消（Checked In 后不可取消，只能完成） |
| Appointment Type | 预约类型 | Body Scan / Consultation (in-person) / Consultation (video) / Sample Collection / Follow-up / 7-Omics Package |

### 0.3 Journey（就诊旅程）—— 标准版（Q2 定稿）

| # | 步骤（界面词） | 中文 | 执行角色 | 可跳过 |
|---|---|---|---|---|
| S0 | Check-in | 签到 | 系统自动（前台触发签到时生成） | 否（起点） |
| S1 | Changing Room | 更衣 | Nurse | 否 |
| S2 | Scan | 扫描 | Nurse | 否 |
| S3 | Sample Collection | 采样 | Nurse | **是** |
| S4 | Home Kit | 居家检测盒 | Nurse | **是** |
| S5 | Consultation | 问诊 | Clinician | **是** |

> **废弃命名**（全部替换为上表。**改原型**）：~~Consent（作为 Journey 步骤）~~、~~Blood Collection~~、~~Other Samples~~、~~Test Kit~~、~~Home Test Kit~~、~~Check Out（作为 Journey 步骤）~~、~~Changing~~/~~Sample~~ 缩写版。
> **Consent 不是 Journey 步骤**：同意书由前台在签到闸门中处理（Q2），护士不经手。Check Out 是预约状态动作，不是 Journey 步骤。
> Journey 按预约类型套用**模板**（步骤子集，见 §5.2/§6.3.2），并非每次都出现全部 6 步。

步骤状态：Pending（未开始）/ In Progress（进行中）/ Completed（已完成）/ **Skipped（已跳过）**（新增。**改原型**）。

### 0.4 表单与支付

| 界面词 | 中文 | 定义 |
|---|---|---|
| Required Forms | 必需表单 | 按预约类型配置的、签到前必须完成签署的表单集合（§6.11 ②） |
| Not Sent / Pending Signature / Signed / Expired | 未发送/待签署/已签署/已过期 | 签署表单实例状态（§5.4） |
| Unpaid / Paid / Refunded | 未付/已付/已退款 | 支付状态。**无 Partial（Q4 定稿）**：不存在部分付款，任何页面不得出现 Partial（**改原型**：dashboardData、Patients 页、Billing 均需清除） |
| Payment Method | 支付方式 | Card（刷卡终端）/ Payment Link（在线支付链接）/ Cash / Voucher（代金券，可与其他方式组合） |

### 0.5 可用时间（Availability）—— 重命名（Q6 定稿）

| 新界面词 | 旧词（废弃） | 中文 | 定义 |
|---|---|---|---|
| Weekly Hours | Schedule / Weekly Template | 每周固定排班 | 周一至周日的常规可用时段模板 |
| **Day Adjustment** | ~~Override~~ | 单日调整 | 对某个具体日期的一次性时段调整（如"下周三只上上午"） |
| Leave | Leave | 请假 | 一段日期范围的不可用（年假/病假等） |
| Pending / Approved / Rejected / Withdrawn | 同 | 待审批/已通过/已驳回/已撤回 | 请求状态（§5.5） |

### 0.6 其他

| 界面词 | 中文 | 定义 |
|---|---|---|
| Results Review | 结果审阅 | 医生对新到检测/扫描结果的首次审阅 |
| Sign-off | 报告签发 | 医生对最终报告的签字确认（Review 的下游动作，两者是不同队列） |
| Approval Center | 审批中心 | Admin 处理全部待审批请求的统一页面（§6.8，重设计） |
| Clock In / Clock Out | 上班打卡/下班打卡 | 考勤动作（§8） |
| Patient Group | 患者分组 | VIP / Corporate / Insurance / Walk-in |
| Flag | 患者旗标 | Urgent / Follow-up / Watch（医生设置） |
| Audit Log | 审计日志 | 敏感操作的不可篡改记录（§12.1） |

---

## 1. 产品概述

### 1.1 定位

Phenome Portal 是一家伊斯坦布尔高端预防医学/长寿诊所的**员工端一体化管理系统**，覆盖「预约 → 到店签到 → 就诊旅程 → 收费 → 结果审阅」的完整门店运营闭环，外加排班请假、员工管理、反馈、考勤。**不含患者端 App**（患者触点：短信/邮件里的支付链接与表单签署、到店 iPad 签字）。

### 1.2 目标用户与核心场景

| 角色 | 一天中的高频动作 | 系统要解决的问题 |
|---|---|---|
| Receptionist（iPad 站立操作） | 看今日到店 → 收款 → 发起签署 → 签到 → 签出 | 到店流转快、**闸门防漏**（未付款/未签字不得进入就诊） |
| Nurse | 看我的患者 → 按 Journey 逐步执行并标记 | 当前该做什么一目了然，步骤留痕 |
| Clinician | 看待审结果/待签报告 → 问诊 → 写笔记 | 两个队列清晰、患者上下文完整 |
| Admin | 看全局 KPI → 审批 → 管员工/账务/配置 | 唯一权威账号，一切例外经我 |

### 1.3 核心价值

单一事实源（同一患者/预约在所有页面数据一致）、状态机驱动（每个对象的流转有明确守卫条件，杜绝"口头流程"）、角色最小可见（数据按角色裁剪）、iPad 优先（触控规范 §11）。

### 1.4 In / Out of Scope

| 范围 | 内容 |
|---|---|
| **In（本期）** | 四角色全部页面（§6）；签到闸门；Journey 新 6 步模板体系（含 Skip）；Availability 三类请求 + Approval Center 重设计；Billing（退款仅 Admin，Q9）；Feedback 完整版（tab/历史时间线/Google Reviews/匿名，Q10）；Notifications 页 + 通知偏好；员工注册激活（已实现，形式化验收）；Clinic Settings（同意书模板 + 必需表单映射）；Timesheet；KPI 体系 |
| **In（本期设计、后期实现，P2）** | 考勤打卡 Clock In/Out（Q5：功能要有、优先级不高，§8 完整设计 + 分期）；Secondary Role 权限模型（Q12：写入设计思考 §2.5，暂不实现） |
| **Out（本期不做）** | 患者端 App；Results / Digital Twin 页（仅保留占位 Tab）；Reception 小额退款（Q9 删除）；库存/耗材管理；多诊所（单诊所假设，见 §14） |

---

## 2. 角色与权限

### 2.1 权限设计原则

权限 = **角色基线**（本章矩阵）+ **数据范围**（全诊所 / 分配给我 / 与我相关）。本期不做按人微调的开关矩阵（Q12，原型 Staff → Permissions Tab 的 4 组开关**下线**，改为只读展示角色基线 + 未来 Secondary Role 入口，见 §2.5。**改原型**）。

### 2.2 唯一 Admin 规则（Q1 定稿，贯穿性规则）

> **系统中有且仅有一个 Admin 账号。** 以下为该规则在全系统的落点清单，改原型时逐条核对：

| # | 落点 | 规则 |
|---|---|---|
| A1 | Staff → Add Staff | 角色下拉**移除 Admin 选项**（**改原型**：AddStaffModal 第 112 行） |
| A2 | Staff → Import Staff | 批量导入角色解析遇到 "Admin" → 该行标记 invalid，提示 "Admin role cannot be imported"（**改原型**） |
| A3 | Staff 列表 | Admin 分组有且只有 1 人（**改原型**：删除 mock 第二 Admin "Can Demir"）；Admin 行不提供 Deactivate/Delete 操作 |
| A4 | Staff 详情 | Admin 自己的详情页不显示 Permissions 编辑；角色字段不可改 |
| A5 | 注册白名单 | 白名单条目角色不可为 Admin |
| A6 | Admin 交接 | 唯一新增 Admin 的途径 = **Transfer Admin**（见下），无"新建第二个 Admin"路径 |
| A7 | 打卡/Timesheet | Admin 出现在考勤体系中（§8，可配置豁免） |
| A8 | 审批 | 所有审批的唯一决策人 = Admin；不存在多级审批 |
| A9 | Feedback | 员工提交反馈的接收人恒为 Admin |
| A10 | 通知 | "Approval requests" 事件仅 Admin 可订阅 |

**Transfer Admin（管理员交接）流程**：

| 步 | 角色 | 操作 | 校验/结果 |
|---|---|---|---|
| 1 | 现 Admin | Profile → Danger Zone → "Transfer Admin Role" | 二次确认弹窗（红色主按钮，需输入登录密码。§11.4 确认规范 L3 级） |
| 2 | 现 Admin | 选择目标员工（必须为 Active 状态的现有员工） | 显示后果说明："You will become a {targetRole} account and lose Admin access immediately after the transfer is accepted." |
| 3 | 目标员工 | 收到系统通知 + 邮件，24h 内在弹窗中接受/拒绝 | 拒绝或超时 → 交接取消，通知发起人 |
| 4 | 系统 | 接受后原子切换：目标 → Admin；原 Admin → 降级为其原始角色（受聘时角色） | 双方全部会话强制重新登录；写审计日志（§12.1） |

【待确认 OQ-1】Admin 突发不可用（离职/失联）时的兜底：建议由系统供应商后台执行受控转移，产品层不做"临时代管"。

### 2.3 角色权限总表（页面 × 操作级）

图例：✅ 完整 · 👁 只读 · 🔸 受限（备注列说明范围）· — 无权限（页面不可达或区块隐藏）

| 页面 / 操作 | Admin | Receptionist | Nurse | Clinician | 备注 |
|---|---|---|---|---|---|
| Dashboard | ✅ 全局版 | ✅ 前台版 | ✅ 精简版 | ✅ 医生版 | 布局见 §6.9 |
| Calendar · 查看 | ✅ 全诊所 | ✅ 全诊所（今日为主） | 🔸 仅自己当日 | 🔸 自己 + 只读诊所叠加层 | §6.1 |
| Calendar · 新建/编辑/改期预约 | ✅ | ✅ | — | 🔸 仅自己的预约可改期；可 Block Time | 医生不新建预约 |
| Calendar · 重新分配医生/房间 | ✅ | — | — | — | Reassign 仅 Admin |
| Calendar · 取消预约 | ✅ | ✅ | — | — | 需理由，§6.2.6 |
| 签到 Check In / 签出 Check Out | — | ✅ | — | — | 闸门规则 §6.2.4 |
| 标记 No Show | ✅ | ✅ | — | ✅（仅自己的预约） | §5.1 |
| Patients 列表 | ✅ 全部 | ✅ 全部 | 🔸 今日分配给我 | 🔸 分配给我 | §6.5 |
| 新建患者 | ✅ | ✅ | — | — | |
| 编辑患者基础信息 | ✅ | 🔸 仅联系方式 | — | — | 【待确认 OQ-2】前台可改电话/邮箱？推荐：可 |
| 删除/停用患者 | ✅ | — | — | — | 软删除，审计 |
| 患者导出 | ✅ | — | — | — | KVKK 敏感，§12.2 |
| Patient Record · Tabs | 全部 6 | Overview/Journeys/Signed Forms/Appointments | Journeys/Signed Forms/Appointments | Overview/Results/Journeys/Notes/Appointments | §6.4.2 |
| Journey · 标记 S1–S4 | ✅（代操作） | — | ✅ | — | §6.3.4 |
| Journey · 标记 S5 Consultation | ✅ | — | — | ✅ | |
| Journey · Skip 可跳过步骤 | ✅ | — | ✅（S3/S4） | ✅（S5） | 需理由，§6.3.5 |
| Clinician Notes | ✅ 👁（不可代写）【待确认 OQ-3】 | — | — | ✅ 写自己的 | 他人笔记只读 |
| Billing · 查看 | ✅ 全部 | ✅ 全部 | — | — | |
| Billing · 收款（Start Transaction / Payment Link / Voucher） | ✅ | ✅ | — | — | |
| Billing · 退款 | ✅ | — | — | — | **Q9：仅 Admin**，需理由+确认 |
| Billing · 导出 | ✅ | — | — | — | |
| My Availability（Weekly Hours / Day Adjustment / Leave） | —（无需） | 🔸【待确认 OQ-4】 | ✅ | ✅ | 前台是否纳入排班体系，推荐：纳入（考勤联动） |
| Team Availability | ✅ | 👁 | 👁 | 👁 | 前台订预约需看医生可用性 |
| Approval Center | ✅ | — | — | — | §6.8；Clinician 侧边栏 Approval 入口**移除**（**改原型**，其"访问非分配患者"申请流列为 P2，OQ-5） |
| Staff Management | ✅ | — | — | — | |
| Clinic Settings | ✅ | — | — | — | |
| Feedback（管理端） | ✅ | — | — | — | |
| Feedback（提交端 Help 入口） | — | ✅ | ✅ | ✅ | 支持匿名 |
| Timesheet | ✅ | — | — | — | 员工看自己的考勤在 Profile（P2，§8.6） |
| Notifications 页 | ✅ | ✅ | ✅ | ✅ | 内容按可见范围过滤 §10 |
| Profile | ✅ | ✅ | ✅ | ✅ | 非 Admin 个人信息只读（找 Admin 改） |
| 打卡 Clock In/Out | ✅ | ✅ | ✅ | ✅ | P2 实现，§8 |

**数据范围规则**（引用于上表 🔸 处）：

| 规则名 | 定义 |
|---|---|
| 全诊所 | 无过滤 |
| 分配给我（Clinician） | patient.assignedClinician = 我 |
| 今日分配给我（Nurse） | 当日预约中 appointment.nurse = 我 的患者 |
| 与我相关（通知用） | 预约的 clinician/nurse = 我，或我提交的请求 |

### 2.4 越权行为的统一表现

- 直接输入无权限 URL → 重定向 Dashboard + toast "No access: {Role} cannot view this page."（沿用原型 RoleGuard）。
- 有页面权限但区块无权限 → 区块整体隐藏（不渲染骨架，避免"这里有东西你看不到"的暗示）；例外：Patient Record 的 Results 占位 Tab 对有权角色显示"Digital Twin — coming later"。
- 操作按钮无权限 → **隐藏**而非置灰。置灰仅用于"有权限但条件未满足"（如 Check In 闸门未过），此时必须给出原因文案。这是全系统一致原则（§11.3）。

### 2.5 Primary / Secondary Role 设计思考（Q12：仅文档化，暂不实现）

**现状问题**（原型 Staff → Permissions 的开关矩阵）：① 每人一套开关使权限审计变成 N 个特例，KVKK 审计时无法回答"谁能看健康数据"这种角色级问题；② 开关语义与页面实际行为脱节（如 "billing-pay" 开给护士，页面并没有护士的收款 UI）；③ Admin 配置成本高、易错。真实诊所的诉求其实只有一种："她主要是护士，但也顶前台班"。

**目标模型**：每员工 1 个 Primary Role + 至多 1 个 Secondary Role（可空）。

| 维度 | 规则 |
|---|---|
| 页面可达性 | 两角色并集 |
| 操作权限 | 并集 |
| 数据范围 | 按各自角色规则分别取，再并集（如 Nurse+Receptionist：Patients 页 = 全部患者，因前台规则更宽） |
| Dashboard / 侧边栏排序 / KPI | 按 **Primary**；顶栏提供"视图切换"快捷（复用现 Demo Role Switcher 的交互位，仅在有 Secondary 时出现） |
| 通知 | 两角色事件并集，去重 |
| 约束 | Admin 不可作为 Primary 或 Secondary 被赋予（唯一 Admin，§2.2）；变更 Secondary Role 写审计日志 |
| UI | Staff 详情 → Overview 的 Role 区块：Primary（必填）+ Secondary（可选下拉）；Permissions Tab 改为**只读**展示合成后的权限清单（本章矩阵的两列并集视图），不再提供开关 |

**实现分期**：本期界面仅保留 Primary Role（现状）+ Permissions Tab 改只读；Secondary Role 逻辑 P1/P2 再上。

---

## 3. 信息架构与导航

### 3.1 页面地图（路由树）

```
/login → /login/2fa → /enrollment(首次) → /dashboard
/forgot-password → /verify → /reset-password → /done
/register → /verify → /set-password → /done          （白名单激活，§6.16）

/dashboard
  /dashboard/appointment/:apptId                      （抽屉深链）
/calendar
  /calendar/schedule (+ /appointment/:apptId)
  /calendar/my-availability                           （Nurse/Clinician[/Receptionist OQ-4]）
  /calendar/team-availability
/patients
  /patients/new
  /patients/:id/{overview|results|journeys|journeys/:jid|signed-forms|notes|appointments}
/staff                                                （Admin）
  /staff/:id/{overview|availability|permissions|workload}
/clinic-settings                                      （Admin）
/billing                                              （Admin/Receptionist）
/feedback                                             （Admin）
/timesheet                                            （Admin）
/approval                                             （Admin，Approval Center）
/notifications
/profile
```

### 3.2 各角色侧边栏（定稿）

| 顺序 | Admin | Receptionist | Nurse | Clinician |
|---|---|---|---|---|
| 1 | Dashboard | Dashboard | Dashboard | Dashboard |
| 2 | Calendar ▾ | Calendar ▾ | Calendar ▾ | Calendar ▾ |
| 3 | Patients | Patients | Patients | Patients |
| 4 | Staff | Billing | Notifications | Notifications |
| 5 | Approval `●n` | Notifications | Profile | Profile |
| 6 | Billing | Profile | | |
| 7 | Clinic Settings | | | |
| 8 | Feedback | | | |
| 9 | Timesheet | | | |
| 10 | Notifications | | | |
| 11 | Profile | | | |
| 尾部 | Logout | Logout | Logout | Logout |

Calendar 子菜单：Schedule（全员）· My Availability（Nurse/Clinician[/Receptionist]）· Team Availability（全员）。
`●n` = 待审批数徽标（>0 时显示，上限 99+）。**改原型**：① Clinician 侧边栏移除 Approval；② Admin 的 Approval 提升到 Staff 之后第 5 位（审批是 Admin 高频动作）；③ 移除顶栏 Demo Role Switcher（上线版）与 Site Map。

### 3.3 关键跳转关系

| 从 | 触发 | 到 | 说明 |
|---|---|---|---|
| Dashboard KPI 卡 | 点按 | 对应预筛选列表 | 每卡的下钻目标见 §7 各卡定义 |
| Dashboard/Calendar 预约块、Arrivals/Waiting 行 | 点按 | 右侧 Appointment Drawer | 深链 URL 可分享/返回还原 |
| Drawer "Open Patient Record" | 点按 | /patients/:id/{角色默认 tab} | 默认 tab：Nurse→journeys，其余→overview |
| Patients 行 | 点按行 | Patient Record | Actions 列与可复制字段除外 |
| Journeys Tab 行/卡 | 点按 | Journey Detail | |
| Billing 行 | 点按 ⋯ | 右侧详情面板（页内，非路由） | |
| Approval 列表项 | 点按 | 右侧详情面板 | 冲突预约条目 → "Reschedule" 跳 Calendar 并带预填（§6.8.4） |
| 顶栏铃铛 | 点按 | 通知面板（popover）→ "View all" → /notifications | §10.4 |
| 通知条目 | 点按 | 事件对应实体页 | 每类通知的落地页见 §10.2 |

### 3.4 顶栏全局搜索【待确认 OQ-6】

推荐规格：范围 = 患者（姓名/ID/电话/邮箱）+ 员工（Admin 可见）+ 预约（患者名→今日优先）。交互：聚焦后输入 ≥2 字符实时下拉，分组显示（Patients / Staff / Appointments，每组前 3 条 + "View all in {列表页}"），点选患者 → Patient Record，点选预约 → 对应日历日期并打开 Drawer。无结果态："No matches — check spelling or try patient ID."。数据范围遵守 §2.3（Nurse/Clinician 搜患者仅命中自己范围内的）。

---

## 4. 核心业务流程

### 4.1 主干：预约 → 到店 → 签到 → 就诊 → 完成/收费

| # | 阶段 | 角色 | 页面 | 关键校验（守卫） | 结果 |
|---|---|---|---|---|---|
| 1 | 建预约 | Receptionist/Admin | Calendar → New Appointment | 医生时段无冲突（硬阻断）；房间无冲突（警告可继续【假设 AS-6】）；患者存在 | Appointment=Booked；按类型生成待办：Required Forms 置 Not Sent、Payment=Unpaid |
| 2 | 行前准备 | Receptionist | Billing / Drawer | — | 发送 Payment Link / 发送表单签署（可远程完成） |
| 3 | 患者到店 | Receptionist | Dashboard-Arrivals / Calendar | 预约日期=今日 | 标记 **Arrived**（记录到店时间，开始计等待时长） |
| 4 | 签到闸门 | Receptionist | Appointment Drawer | **Payment=Paid 且 Required Forms 全部 Signed**（§6.2.4）；缺一则 Check In 禁用并给出原因与就地补救按钮（Start Transaction / Initialize Signing…） | 通过 → **Checked In**；Journey 按模板创建，S0 自动 Completed |
| 5 | 就诊执行 | Nurse | Patient Record → Journey Detail | 步骤操作权限（§6.3.4）；可跳过步骤需理由 | S1–S4 依次/按需标记；首个步骤 In Progress 时预约→**In Clinic** |
| 6 | 问诊 | Clinician | Drawer "Start Consultation" / Journey | S5 在模板中 | S5 Completed 或 Skipped |
| 7 | 签出 | Receptionist | Drawer | 若存在未 Completed/Skipped 步骤 → 警告弹窗列出明细，需确认"Check out anyway"【L2 确认，§11.4】 | 预约→**Completed**；等待/在店时长落账 Timesheet 无关，进运营统计 |
| 分支 A | 取消 | Receptionist/Admin | Drawer | 仅 Booked/Arrived 可取消；需选原因（患者要求/诊所原因/改期合并/其他+备注） | →Cancelled；若已付款 → 提示走退款流程（§4.2） |
| 分支 B | 爽约 | Receptionist/Admin/Clinician(自己的) | Drawer | 仅 Booked/Arrived；建议超过预约开始 15 分钟后才可标记【假设 AS-7】 | →No Show；计入 No Show Rate |

### 4.2 收费与退款

| # | 场景 | 角色 | 步骤 |
|---|---|---|---|
| 1 | 到店收款 | Receptionist | Drawer/Billing → Start Transaction（终端）或收现金 → 成功后 Payment=Paid、Transaction=Completed、自动生成 Invoice【假设 AS-8：发票默认自动开】 |
| 2 | 远程收款 | Receptionist | Send Payment Link → 患者线上支付 → 状态自动回写 |
| 3 | 代金券 | Receptionist | Apply Voucher（输入券码校验：有效期/余额）→ 余额抵扣，差额走 1/2 |
| 4 | 退款（**仅 Admin**，Q9） | Admin | Billing 详情面板 → Issue Refund → L3 确认弹窗（金额+原路退回说明+理由必填）→ Transaction=Refund Pending → 渠道回执 → Refunded；写审计日志；关联预约若未发生 → 提示同时取消 |

### 4.3 可用时间变更 / 请假 → 审批（规则总览，详见 §6.7/§6.8）

```
员工发起（Weekly Hours 修改 / Day Adjustment / Leave）
   │
   ├─ 变更=扩大可用时间，或缩小但不影响任何已约患者 ──→ 立即生效（无审批）
   ├─ 变更=缩小且影响已约患者 ──→ Pending → Admin 在 Approval Center 处理
   │        Admin 必须先对每条受影响预约执行 Reschedule 或 Cancel，Approve 才可点
   └─ Leave（任何情况）──→ Pending → Admin 审批（受影响预约同上处理）
驳回必填理由；员工可在决定前 Withdraw；结果双向通知（§10）
```

### 4.4 考勤打卡（P2，详见 §8）

上班点 Clock In → 下班点 Clock Out → 数据直写 Timesheet actual 列；忘打卡走补卡申请（Approval Center 新类型 Attendance Correction）。

### 4.5 反馈处理（详见 §6.12）

患者（就诊后短信/邮件表单【假设 AS-9】）或员工（顶栏 Help，可匿名）提交 → Admin 列表按 Tab 分流 → 状态 New→In Review→Resolved→Archived，每次变更写入历史时间线 → 高紧急度触发 Admin 通知。

---

## 5. 状态机

> 表式约定：`当前状态 | 事件/操作 | 守卫条件 | 目标状态 | 备注`。未列出的转换均为**非法**，前端不渲染对应按钮、后端拒绝（409）。每个状态下 UI 应显示/隐藏的操作在"备注"或对应页面章节给出。

### 5.1 Appointment（预约）

| 当前 | 事件 | 守卫 | 目标 | 备注 |
|---|---|---|---|---|
| — | 创建预约 | 医生时段无硬冲突 | Booked | 创建人：Receptionist/Admin |
| Booked | 患者到达（Mark Arrived） | 预约日=今日 | Arrived | 记录 arrivedAt，Waiting 计时开始 |
| Booked/Arrived | Check In | **闸门：Payment=Paid ∧ Required Forms 全 Signed** | Checked In | 允许跳过 Arrived 直接签到（患者到了直接办）；生成 Journey |
| Checked In | 任一 Journey 到店步骤 → In Progress | — | In Clinic | 系统自动流转 |
| Checked In / In Clinic | Check Out | 未完成步骤 → L2 警告确认 | Completed | 记录 checkOutAt |
| Booked/Arrived | Cancel | 需选取消原因 | Cancelled | 已付款→提示退款；释放时段 |
| Booked/Arrived | Mark No Show | 超过开始时间 15min【AS-7】 | No Show | Receptionist/Admin/Clinician(own) |
| Booked | 改期 Reschedule | 新时段无硬冲突 | Booked | 状态不变，记录变更历史；触发通知 |
| Cancelled/No Show/Completed | 任何编辑 | — | 非法 | 终态只读；Completed 后账务仍可退款（走 Payment 状态机） |

**每状态可见操作**（Reception Drawer 底部主按钮区）：Booked→[Mark Arrived]；Arrived→[Check In(按闸门置灰/可用)]；Checked In / In Clinic→[Check Out]；终态→无主按钮仅信息。

### 5.2 Journey 与步骤

**Journey 模板（按预约类型）【假设 AS-10，本期硬编码，P1 移入 Clinic Settings 配置】**：

| 预约类型 | 模板步骤 |
|---|---|
| 7-Omics Package | S0 → S1 → S2 → S3 → S4 → S5 |
| Body Scan | S0 → S1 → S2 → S3(可跳) |
| Consultation (in-person) / Follow-up | S0 → S5 |
| Sample Collection | S0 → S3 |
| Consultation (video) | **无 Journey**（不到店；付款闸门改为进入视频前校验 Payment=Paid【假设 AS-11】） |

**Journey 整体**：

| 当前 | 事件 | 守卫 | 目标 | 备注 |
|---|---|---|---|---|
| — | Check In 成功 | — | Active | S0 自动 Completed（by=签到前台，at=签到时刻） |
| Active | 最后一个非 Skipped 步骤 Completed | — | Completed | 自动；completedAt=末步时间 |
| Active | Check Out 时仍有未完成步骤且前台确认强制签出 | L2 确认 | Incomplete（终态） | 在 Journeys Tab 以灰色+警示标显示【新增状态，**改原型**】 |

**JourneyStep**：

| 当前 | 事件 | 守卫 | 目标 | 备注 |
|---|---|---|---|---|
| Pending | Mark as Started | 操作人具备该步角色权限（§6.3.4）；Journey=Active | In Progress | 记录 by/at；不强制顺序，但越过前序未完成步骤时弹 L1 提示"Previous step {X} is not finished — start anyway?"【推荐：不硬锁顺序】 |
| In Progress | Mark as Complete | 同上 | Completed | 记录 at |
| Pending | Skip | 步骤标记为可跳过（S3/S4/S5）；选择原因：Patient declined / Not applicable / Clinician's decision / Rescheduled / Other+备注 | Skipped | 记录 by/at/reason；卡片折叠显示灰色 Skipped 徽标 |
| Skipped | Undo Skip | Journey 仍 Active | Pending | 保留跳过记录于步骤历史 |
| In Progress | 回退 Reopen | 仅 Admin【待确认 OQ-7：护士误点完成如何纠错，推荐 Completed→In Progress 仅 Admin 或本人 5 分钟内】 | — | |

### 5.3 Payment（支付，无 Partial）

| 当前 | 事件 | 守卫 | 目标 | 备注 |
|---|---|---|---|---|
| Unpaid | 全额收款成功（终端/链接/现金/券组合足额） | 金额=应收全额 | Paid | 不足额一律不入账（收银终端侧控制），系统无部分付款概念 |
| Paid | Issue Refund | 仅 Admin；理由必填；L3 确认 | Refund Pending | Transaction=Refund Pending |
| Refund Pending | 渠道回执成功 | — | Refunded | 通知 Admin；Invoice 关联冲销【假设 AS-8】 |
| Refund Pending | 渠道失败 | — | Paid | 显示失败原因，可重试 |
| Unpaid | 取消预约 | — | Unpaid(closed) | 账单关闭，不再出现在待收列表 |

### 5.4 Signed Form（签署表单实例）

| 当前 | 事件 | 守卫 | 目标 | 备注 |
|---|---|---|---|---|
| Not Sent | Send Form（远程） | 患者有邮箱/手机 | Pending Signature | 发送渠道记录 |
| Not Sent/Pending Signature | Initialize Signing（到店 iPad） | — | Pending Signature→Signed | 患者当场签署，见证人=当前前台 |
| Pending Signature | 患者远程完成签署 | — | Signed | 存 PDF 快照 + 模板版本号（§6.11） |
| Signed | 模板发布新版本且该表单被标记"需重签" | Admin 发布时勾选 | Expired | 触发前台待办；旧 PDF 永久留存 |
| Pending Signature | 超过有效期（默认 14 天【假设 AS-12】） | — | Expired | 可重新发送 |

### 5.5 Availability 请求（Weekly Hours 变更 / Day Adjustment / Leave 共用）

| 当前 | 事件 | 守卫 | 目标 | 备注 |
|---|---|---|---|---|
| Draft(编辑中) | Save | 变更=扩大，或缩小且 0 受影响预约 | 立即生效 | 无审批记录，仅审计日志 |
| Draft | Submit for Approval | 缩小且 ≥1 受影响预约；或类型=Leave | Pending | 提交时快照受影响预约清单 |
| Pending | Withdraw（本人） | Admin 未决定 | 已撤回（请求关闭） | 原设置保持生效 |
| Pending | Approve（Admin） | **全部受影响预约已逐条 Reschedule/Cancel** | Approved | 新排班生效；通知本人 |
| Pending | Reject（Admin） | 理由必填 | Rejected | 原设置保持生效；通知本人（含理由） |
| 任意 | 同日期重复 Day Adjustment | 已存在非 Rejected 的同日调整 | 非法 | 提示先撤回/等待 |

### 5.6 Clock Record（考勤，P2，详见 §8.4）

未打卡 → Clock In → 已上班 → Clock Out → 已下班；23:59 未签退 → 自动关闭+Abnormal；补卡申请 → Approval（Attendance Correction）→ 通过后修正记录并保留原始值。

### 5.7 Feedback

| 当前 | 事件 | 守卫 | 目标 | 备注 |
|---|---|---|---|---|
| New | 开始处理（改状态/加内部备注即自动） | Admin | In Review | 每次状态变更写 status_history（from,to,by,at） |
| In Review | Mark as Resolved | — | Resolved | 可附解决说明 |
| New/In Review/Resolved | Archive | — | Archived | 归档后从默认视图隐藏，可筛出 |
| Archived | Reopen | Admin | In Review | 历史时间线连续记录 |
| 任意 | Flag/Unflag | Admin | 状态不变 | 旗标独立于状态 |

### 5.8 Staff Account

Invited（Admin 创建/导入）→ Active（员工完成 /register 激活）→ On Leave（请假期间系统自动标记，期满自动恢复 Active）→ Inactive（Admin 停用：登录立即失效、从分配下拉消失、历史记录保留）。Invited 超 14 天未激活 → 提醒 Admin 可重发邀请【假设 AS-13】。

---

## 6. 页面级需求

> 每节结构：目的 → 入口/出口 → 布局与区块 → 字段表 → 交互与操作 → 页面状态 → 边界与异常。页面状态五态（空/加载/无数据/无权限/错误）遵循 §11.6 统一规范，各节只写特有文案。

### 6.1 Calendar · Schedule（预约日历，主干）

**目的**：全诊所/个人预约的时间视图与操作入口。
**入口**：侧边栏 Calendar→Schedule；Dashboard 日历小组件"View full calendar"。**出口**：Appointment Drawer、Patient Record、New Appointment。

**角色变体**：

| 角色 | 视图 | 列分组 | 编辑能力 |
|---|---|---|---|
| Admin | Day / Week / List | 按医生列（默认）或按房间列切换；医生多选筛选、房间/类型筛选 | 全部：拖动改期、跨列拖动=Reassign（确认弹窗）、纵向拖拽改时长、空白处点按新建 |
| Receptionist | Day（今日聚焦，可切日期）/ List | 按医生列（仅有约医生） | 新建/编辑/改期/取消；不可 Reassign、不可改时长 |
| Nurse | Day（仅自己） | 单列 "My Patients" | 只读 |
| Clinician | Day / Week（自己）+ "Clinic overlay" 开关叠加全诊所只读层 | 自己单列；开叠加后他人列灰显 | 自己的预约可改期；空白处点按=Block Time（个人锁时段）；他人预约只读脱敏抽屉（不显示患者身份） |

**工具栏**：日期切换（‹ 今日 ›+日期选择）、视图切换（Day/Week/List）、筛选组（Admin）、右侧主按钮：Admin/Receptionist=[+ New Appointment]，Clinician=[+ Block Time]。

**预约块**：患者名+类型图标（视频=摄像头）+时间；左边框色=状态（Booked 蓝/Arrived 琥珀/Checked In 绿/In Clinic 橙/Completed 灰/No Show 红虚线/Cancelled 灰划线）；当前时间红线。块最小触控高度 44pt，15 分钟短预约块显示为 44pt 并压缩文字（§11.2）。

**New Appointment 模态（字段表）**：

| 字段 | 类型 | 必填 | 校验/规则 | 默认值 | 来源 |
|---|---|---|---|---|---|
| Patient | 搜索选择器（姓名/ID/电话） | ✅ | 必须为已有患者；找不到 → 内联 "+ Register new patient" 入口 | 空 | 用户输入 |
| Type | 下拉（6 类型） | ✅ | 切换类型联动时长与 Journey 模板预览 | Body Scan | 用户输入 |
| Date + Time | 日期+15min 步进时间 | ✅ | 落在医生可用时间内，否则警告"Outside {Dr.}'s working hours"（可继续，L1）【假设 AS-14】 | 点击空白处带入 | 用户输入 |
| Duration | 下拉 15–90min | ✅ | 类型默认：Scan45/Consult30/Video30/Sample20/Follow-up20/7-Omics90 | 按类型 | 系统计算，可改 |
| Clinician | 下拉 | ✅ | **硬冲突阻断**：与其既有预约重叠 → 红条提示冲突详情，Create 禁用 | 点击列带入 | 用户输入 |
| Nurse | 下拉 | 视频类型隐藏 | 软提示：该护士当时段已有 ≥2 预约 → 黄条 | 空 | 用户输入 |
| Room | 下拉（按类型过滤：Scan 类型仅 Scan 房） | 视频=自动"Video" | 房间冲突 → 黄条警告可继续【AS-6】 | 空 | 用户输入 |
| Notes | 多行 | — | ≤500 字符 | 空 | 用户输入 |

创建成功：toast "Appointment booked — {patient}, {date} {time}"；日历即时渲染新块并短暂高亮 2s。

**页面状态**：加载=列骨架；当日无预约（Nurse）="No patients assigned today"；筛选无结果="No appointments match your filters"+[Clear filters]。

**边界**：并发编辑（他人已改期）→ 保存时 409 → toast "This appointment was just updated — refreshed." 并刷新块位置；跨午夜预约不支持；List 视图列：Time/Patient/Type/Clinician/Room/Status/Payment/Forms，行点按开 Drawer。

### 6.2 Appointment Drawer（右侧预约抽屉，主干）

**通用规格**：右侧滑入 400pt 宽（iPad 横屏保持日历可见——**抽屉优先于弹窗**的核心落点）；遮罩点按/右缘右滑手势/X 关闭；URL 深链 `…/appointment/:id`。头部：患者头像+姓名+年龄性别，右上 X。

#### 6.2.1 区块矩阵（角色 × 区块）

| 区块 | Admin | Receptionist | Nurse | Clinician |
|---|---|---|---|---|
| Patient Summary（DOB/性别/电话/邮箱 + View Record） | ✅ | ✅（+类型/医生/时间） | 🔸 年龄性别/类型/时间/医生 | 🔸 同 Nurse+形式(视频/线下) |
| Appointment Details（类型/时间/时长/房间/状态） | ✅ | 并入上块 | 并入 | 并入 |
| Assigned Staff（医生/护士/房间） | ✅ | — | — | — |
| Journey Today（步骤点条，按该预约模板渲染） | ✅ | ✅ | ✅+Sample/Room 状态格 | — |
| Preparation（表单/采样/扫描/上次就诊） | — | — | — | ✅ |
| Signed Forms（逐表单状态+操作） | 状态汇总 | ✅ 完整操作 | 只读状态 | 并入 Preparation |
| Payment | 状态+金额 | ✅ 完整操作 | — | — |
| 操作区 | Edit/Reassign/Reschedule/Open Record/Cancel | Edit/Reschedule/Open Record/Contact/Cancel | Open Record/Mark Journey Step | Start Consultation 或 Join Video Call（主）/Open Record/Reschedule/Mark No Show |
| 底部固定主按钮 | — | **Check In / Check Out**（§6.2.4） | — | — |

#### 6.2.2 Receptionist 抽屉 — Signed Forms 区块

每行：表单名 + 状态徽标（Signed 绿 → 点按 "View Signed Form" 打开 PDF；Pending 橙；Not Sent 红；Expired 灰红）。存在未 Signed 时显示双按钮：**[Initialize Signing]**（当前 iPad 进入患者签署模式：全屏签署视图，完成/取消后回到抽屉并刷新状态）与 **[Send Form]**（弹渠道选择 Email/SMS → toast "Form sent to {masked contact}"）。

#### 6.2.3 Receptionist 抽屉 — Payment 区块

状态徽标 + 应收金额；Unpaid 时按钮：**[Start Transaction]**（推送到收银终端，行内显示 "Waiting for terminal… ●" 实时态，成功自动刷新为 Paid+绿 toast；失败显示原因+Retry）/ **[Send Payment Link]** / **[Apply Voucher]**（输入券码→显示券面值/余额/有效期→确认抵扣；不足额部分继续走前两种收齐后才置 Paid）。

#### 6.2.4 签到闸门（Check In Gate）— 系统最重要规则

```
Check In 可用 ⟺ appointment.payment == Paid
             ∧ 该预约全部 Required Forms.status == Signed
```

按钮状态矩阵：

| Payment | Forms | Check In 按钮 | 按钮下方提示（红色小字） |
|---|---|---|---|
| Paid | 全 Signed | 绿色可用 | — |
| Paid | 有未签 | 置灰 | "Awaiting consent — collect required signatures" |
| Unpaid | 全 Signed | 置灰 | "Awaiting payment — settle balance to enable check-in" |
| Unpaid | 有未签 | 置灰 | "Complete consent and payment to enable check-in" |

- 置灰按钮**可点按**：点按时不执行，抖动+滚动定位到第一个未满足区块（iPad 无 hover，不能只靠 tooltip 解释，§11.3）。
- 点 Check In（可用态）→ 无二次确认（可逆性低风险+高频操作，L0 级）→ toast "{Patient} checked in" → 预约=Checked In，Journey 创建，抽屉内 Journey 区块即时点亮 S0。
- **Check Out**：Checked In/In Clinic 时替换为蓝色 Check Out；若 Journey 有未完成步骤 → L2 确认弹窗："{n} journey steps are not finished: {列表}. Check out anyway?" [Go back] [Check out anyway]。
- 不提供闸门例外放行【第一步已确认方向；OQ-8 保留给 Admin 现场处理的定义】。

#### 6.2.5 Clinician 只读叠加抽屉（脱敏）

他人预约：仅显示时间/医生/房间 + 顶部灰条 "Read-only — another clinician's appointment"，无患者身份、无操作。

#### 6.2.6 Cancel 弹窗（Receptionist/Admin）

L3 级确认：标题 "Cancel appointment?"；内容：患者/时间摘要 + 原因下拉（必填：Patient request / Clinic reason / Rescheduling / Other+备注）+ 已付款提示条 "Payment of {₺} has been collected — process refund separately after cancelling."；主按钮红色 [Cancel appointment]，次按钮 [Keep appointment]。

### 6.3 Journey（Patient Record → Journeys Tab + Journey Detail，主干）

#### 6.3.1 Journeys Tab（列表）

| 列 | 说明 |
|---|---|
| Journey | 名称（=预约类型/套餐名）+ 开始日期 |
| Status | Active 绿 / Completed 灰 / Incomplete 灰+⚠ |
| Progress | 进度点条：Completed 绿点 / Skipped 灰斜杠点 / In Progress 蓝脉动 / Pending 灰空点 |
| Current Step | 当前步骤名加粗（=首个非 Completed/Skipped 步骤） |
| Assigned | 护士/医生 |
| 操作 | 行点按 → Journey Detail |

Nurse 默认落此 Tab；空态："No journeys yet — journeys start automatically at check-in."

#### 6.3.2 Journey Detail（时间线）

头部：Journey 名 + 状态徽标 + started/completed 时间 + 分配医护。主体：垂直步骤时间线，每步一张可展开卡：

| 元素 | 规格 |
|---|---|
| 步骤图标 | Completed=绿勾圆 / In Progress=蓝钟脉动 / Skipped=灰斜杠圆 / Pending=灰空圆 |
| 标题行 | 步骤名 + 状态文字 + （by {操作人} · {时间}） |
| 展开内容 | 备注列表、附件列表（缩略图/文件名）、操作按钮区 |
| 默认展开 | 当前 In Progress 的步骤 |

#### 6.3.3 步骤操作按钮（状态驱动）

| 步骤状态 | 显示按钮 |
|---|---|
| Pending | [Mark as Started]（主）+ 可跳过步骤加 [Skip step]（次，灰） |
| In Progress | [Mark as Complete]（绿主）+ [Add Note] [Add Attachment] |
| Completed | [Add Note] [Add Attachment]（补录）；Reopen 仅 Admin（OQ-7） |
| Skipped | 跳过原因徽标 + [Undo skip]（Journey Active 时） |

Skip 弹窗（L2）：原因单选（Patient declined / Not applicable for this package / Clinician's decision / Rescheduled / Other→备注必填）+ 确认 "Skip Sample Collection?"。

#### 6.3.4 操作权限

| 步骤 | 可标记角色 |
|---|---|
| S0 Check-in | 系统（签到时自动） |
| S1–S4 | 该预约 assigned Nurse；其他 Nurse 可操作但弹 L1 提示 "You are not the assigned nurse — continue?"【假设 AS-15】；Admin 可代操作 |
| S5 Consultation | 该预约 Clinician（或 Admin 代） |

#### 6.3.5 埋点/指标

step_started/completed/skipped（journeyId, step, by, 时长）；Journey 全程时长（S0→末步）供 Average Wait / 运营分析。

### 6.4 Patient Record

#### 6.4.1 Header（全 Tab 常驻，sticky）

| 字段 | 类型 | 可见角色 | 来源 |
|---|---|---|---|
| 照片/首字母头像、姓名、Patient ID | 文本 | 全部 | 档案 |
| DOB · 年龄 · 性别 | 文本 | 全部 | 档案 |
| 手机 / 邮箱 | 可复制文本 | Admin/Receptionist 完整；Nurse/Clinician 显示但不可导出 | 档案 |
| Assigned Clinician / Nurse | 文本+更换入口（仅 Admin） | 全部 | 档案 |
| Status（Active/Inactive/New/Pending Onboarding） | 徽标 | 全部 | 系统 |
| Medical Alerts（如 Allergy: Penicillin） | 红色徽标组 | Nurse/Clinician/Admin | 临床 |
| Last visit / Next appointment | 文本 | 全部 | 系统计算 |

#### 6.4.2 Tab × 角色（定稿）

| Tab | Admin | Receptionist | Nurse | Clinician | 内容要点 |
|---|---|---|---|---|---|
| Overview | ✅ | ✅（前台视图：联系/预约/付款/表单状态卡） | — | ✅（临床视图：alerts/诊断/用药/biomarkers/近期就诊） | 角色差异化卡片 |
| Results | 占位 | — | — | 占位 | "Digital Twin — coming later"（本期不做） |
| Journeys | ✅ | ✅（运营视角：当前步/签到状态） | ✅ 默认落点 | ✅ | §6.3 |
| Signed Forms | ✅ 完整表 | ✅+发送操作 | 👁 状态确认 | —（并入 Drawer Preparation） | 列：表单名/类型/**模板版本**/状态/签署日期/签署人/View PDF/Resend(仅未签) |
| Clinician Notes | 👁（OQ-3） | — | — | ✅ | 时间线+富文本编辑器+诊断标签（诊断库选择）+附件；仅作者可编辑（发布后 24h 内【假设 AS-16】），之后只读 |
| Appointments | ✅ | ✅+[+ New Appointment] | 🔸 仅今日相关 | ✅+问诊历史 | Upcoming / Previous 两表 |

#### 6.4.3 页面状态

患者不存在/无权限（Clinician 访问非分配患者）→ 整页 "You don't have access to this patient record."+返回；【P2·OQ-5】未来此处为访问申请入口。

### 6.5 Patients 列表

四角色变体的工具栏/统计卡/表格列**沿用你已写定的详细规格**（原型内嵌 patients-page.md），此处仅列**修订项**（其余照单执行）：

| # | 修订 | 原因 |
|---|---|---|
| 1 | Reception 表 Payment 列枚举改为 Paid/Unpaid/N/A（删 Partial） | Q4 |
| 2 | Check-in 列 "Waiting" 改 **Arrived** | 术语统一 §0.2 |
| 3 | Journey 列步骤名按 §0.3 新命名渲染 | Q2 |
| 4 | Admin 行 Actions 的 Delete → 二次确认 L3+改为"Deactivate"（软删除） | 合规 §12 |
| 5 | 行内 Flag 快速切换（Clinician）改为点按弹 popover 选择（无 hover） | §11.3 |
| 6 | 批量操作 Export Selected 仅 Admin | §2.3 |
| 7 | 新患者注册弹窗字段照旧三步，第 2 步手机号默认 +90、Preferred Language(English/Türkçe)；成功后 "Book appointment now?" 引导 | 已有规格确认 |

### 6.6 Billing

**角色**：Admin（全功能）/ Receptionist（收款操作，无退款无导出）。
**布局**：顶部标题+[Export（仅 Admin：Excel/CSV）] → 工具栏（搜索 患者/ID；状态筛选 All/Unpaid/Paid/Refunded；方式筛选；日期范围；快捷 All/Today/This Week）→ KPI 卡（§7.6）→ 主表 + 右侧详情面板（点行 ⋯ 打开，420pt）。

**主表列**：Patient（sticky）/ Appointment（类型+日期）/ Clinician / Amount / Paid / Voucher（点按 popover 显示面值/余额/有效期——原型为 hover tooltip，**改原型**）/ Payment Status（Paid 绿·Unpaid 红·Refunded 紫）/ Method / Transaction（Pending/Processing/Completed/Failed/Refund Pending/Refund Completed）/ Invoice（✅⏳—）/ Date / ⋯。底部合计行 sticky：Amount/Paid/Balance 合计。

**详情面板**：患者+预约摘要 → Line Items（项目/数量/金额、券抵扣负行、合计）→ Payment History 时间线（每笔：金额/方式/交易状态/时间；退款紫色条目）→ 底部操作：

| 按钮 | Admin | Receptionist | 行为 |
|---|---|---|---|
| Collect Payment | ✅(Unpaid) | ✅(Unpaid) | 展开三方式（同 §6.2.3） |
| Issue Refund | ✅(Paid) | **不显示**（Q9：非置灰而是隐藏，遵循 §2.4） | L3 弹窗：显示原支付方式+金额（默认全额，可改小【待确认 OQ-9 是否允许部分退款金额】）+理由必填 → Refund Pending |
| Generate Invoice | ✅ | ✅ | Invoice=Issued，生成 PDF |

**边界**：退款后关联预约未发生 → 面板提示条建议取消预约；同一预约重复收款请求 → 终端侧幂等键防重。

### 6.7 My Availability（可用时间，Q6 重命名版）

**目的**：员工自助管理三类事项——**Weekly Hours**（每周固定排班）、**Day Adjustment**（单日调整，替代 ~~Override~~）、**Leave**（请假），并可查看审批进度。命名取自诊所真实语言："我每周的固定时间"、"某天要调一下"、"请假"。（**改原型**：全部界面词替换）

**页面结构**（单页四区块，自上而下）：

**① Pending Requests（我的待审批请求）**——有 Pending 时置顶显示：

| 元素 | 规格 |
|---|---|
| 请求卡 | 类型徽标（Schedule Change 蓝 / Day Adjustment 紫 / Leave 橙）+ 摘要 + 提交时间 + "Pending approval" 琥珀徽标 + 受影响预约数（红字 "affects {n} booked appointments"） |
| 操作 | [Withdraw]（L2 确认："Withdraw this request? Your current hours stay in effect."） |
| 锁定规则 | Weekly Hours 存在 Pending 变更时，编辑器锁定（顶部提示 "Locked while a request is pending approval."）；Day Adjustment/Leave 仅锁对应条目 |

**② Weekly Hours（每周固定排班编辑器）**：

| 元素 | 规格 |
|---|---|
| 每天一行 | 开关（Available/Unavailable）+ 多时段编辑（start–end，15min 步进，可 [+ Add slot]，时段不可重叠、end>start 内联校验） |
| Slot Type | 每时段类型：In person / Video / Both（xlsx 要求，原型缺失，**改原型**）；影响预约创建时的软校验（视频约落非 Video 时段 → 警告） |
| 时区 | 显示 Europe/Istanbul（只读，Profile 同步） |
| **Save 按钮规则** | 无变更 → 置灰；有变更 → 系统即时（500ms 防抖）判定：扩大或缩小无冲突 → 按钮文案 **[Save changes]**（点击即生效，绿 toast "Hours updated."）；缩小且命中已约患者 → 按钮变 **[Submit for approval]** + 上方黄条 "This change affects {n} booked appointments and needs Admin approval."（点击弹确认，列出受影响预约清单，确认后提交） |
| 取消 | [Discard changes] 恢复已存排班 |

**③ Day Adjustments（单日调整）**：

列表（日期/星期/调整后时段/状态徽标/操作）+ [+ Adjust a day] 按钮 → 弹窗：日期选择（未来 90 天【假设 AS-17】）→ 显示该日模板时段作对比 → 编辑当日时段或整日不可用 → 同 Save 规则分流（影响已约→审批）。同日已有非 Rejected 调整 → 阻断提示。已生效调整可 [Edit]/[Remove]（Remove 若把时间改回去影响预约同样走审批逻辑）。

**④ Leave（请假）**：

[+ Request leave] → 弹窗字段表：

| 字段 | 类型 | 必填 | 规则 |
|---|---|---|---|
| Date from / to | 日期 | ✅ | to ≥ from；单日=同一天 |
| Duration | Full Day / Morning / Afternoon | ✅ | 半天仅当 from=to |
| Reason | Annual Leave / Sick Leave / Conference·Training / Personal / Other | ✅ | Other → 备注必填 |
| 冲突提示 | 系统检测期间已约患者 → 提交前信息条（**不阻断**，随请求带给 Admin） | | |

请假**一律**进入 Pending。列表显示历史（状态/驳回理由可展开）。

**Team Availability（团队可用时间，全员只读）**：周网格（员工行 × 星期列），格内显示时段与类型色条（Clinic/Video）；点格弹 popover 详情；Admin 额外入口 → 该员工 Staff 详情。用途：前台订预约前查看、护士长排协作。

### 6.8 Approval Center（审批中心，Q8 重设计）

**不满意点回应**：原型为单列卡片流，无筛选/历史/扩展性，且 Clinician 侧还挂着占位页。重设计目标：**一个可扩展的统一审批收件箱**——今天装 Availability 三类，后天装补卡（§8）与其他类型，交互模式不变。

**布局（iPad 横屏，主-从两栏）**：左栏列表 360pt + 右栏详情面板（常驻，非弹窗）。

**左栏**：
- 顶部 Tab：**Pending `n`** / Decided（近 90 天）。
- 筛选行：类型多选（Schedule Change / Day Adjustment / Leave [/ Attendance Correction P2]）、员工搜索、排序（最旧优先=默认，避免请求积压）。
- 列表项：类型徽标 + 员工姓名头像 + 一行摘要（如 "Wed unavailable (was 9:00–17:00)" / "22–24 Jul · Full Day · Annual Leave"）+ 提交相对时间 + 冲突红点 "{n} bookings"。**Pending >48h 的项左缘橙条**（SLA 提示）。
- 空态："You're all caught up 🎉 No pending requests."（Decided tab 空态："No decisions in the last 90 days."）

**右栏详情面板**（选中后渲染）：

| 区块 | 内容 |
|---|---|
| 头部 | 员工（头像/姓名/角色，点按 → Staff 详情）+ 类型徽标 + 提交时间 |
| Before / After 对比 | Schedule Change：7 天两列对比，变化行高亮；Day Adjustment：该日模板 vs 调整后；Leave：日期/时长/原因三格 |
| **Affected bookings（受影响预约）** | 每条：患者/日期时间/类型 + 双按钮 **[Reschedule]**（跳转 Calendar 定位该预约并打开改期弹窗，完成后自动返回并标记该条 Resolved 绿色划线）/ **[Cancel]**（走 §6.2.6 取消弹窗）。全部 Resolved 前 Approve 禁用 |
| 决定区（底部固定） | [Reject]（红边框）→ 理由弹窗（必填，≤300 字）；**[Approve]**（绿，禁用时点按 → 抖动+提示 "Resolve all affected bookings before approving"） |
| 决定后 | 面板顶部落决定戳（Approved/Rejected · by · at · 理由）；条目移入 Decided；双向通知（§10） |

**Decided Tab**：只读列表（类型/员工/摘要/结果/决定时间/理由），支持同筛选；点开看快照详情。**审计**：每个决定写 Audit Log（§12.1）。

**边界**：员工在 Admin 审阅中途 Withdraw → 面板即时替换为 "This request was withdrawn by {name}." 并从 Pending 消失；受影响预约在审批期间被独立改期/取消 → 冲突条目自动 Resolved（后台重算）。

### 6.9 Dashboard（四角色）

**共用骨架**：问候区（"Good morning, {name}" + 今日日期 + [打卡胶囊 P2，§8.2]）→ **KPI Bar**（§7：2 锁定+2 可选卡 + 周期切换器 + [Customise]）→ 角色工作区块（下表）→ 点击行为全部下钻（§3.3）。

| 角色 | 区块 1（主，约 2/3 宽） | 区块 2 | 区块 3 |
|---|---|---|---|
| Admin | Today's Clinic：全天时间线（预约块，点按开 Drawer） | Results Queue：待审结果表（行→Patient Record） | Activity：运营事件流（签到/完成/取消/审批…，只读）；Waiting Room 表 |
| Receptionist | Today's Schedule 日历小组件（块→Drawer 含签到闸门） | **Arrivals**：今日应到列表（按时间排序，行内 [Mark Arrived]） | **Check-in Queue**：已到店待签到（行内 Check In 按钮遵循闸门态）；Outstanding Payments 列表 |
| Nurse（精简，MD 要求） | **My Patients Today**：患者行=姓名+时间+Journey 进度点条+当前步+[Continue] 直达 Journey Detail | Journey Queue：等待我操作的步骤（按等待时长倒序，>15min 橙 >30min 红） | Samples 今日采样任务清单 |
| Clinician | Results Review Queue（行→Patient Record→Results/Overview） | Today's Consultations（线下+视频，行→Drawer，视频行 [Join] 直达） | Awaiting My Sign-off 列表 |

**Customise KPIs 弹窗**：可选卡池网格（卡名+类型徽标 Live/Period+一句定义），当前已选 2 张高亮，点选替换（超 2 张 → 提示先取消一张）；锁定卡显示 🔒 不可动；保存 per-user。

### 6.10 Staff Management（Admin）

**列表**：按角色分组（Clinicians/Nurses/Receptionists/Admin(1)）；行：头像姓名/角色徽标/联系方式/状态（Invited 橙/Active 绿/On Leave 琥珀/Inactive 灰）/今日（On Duty·Off·On Leave 圆点）/患者数/负载%/下次排班/最近活跃（>7 天红字）；行尾 ⋯ 菜单：View / Resend Invite(Invited) / Deactivate(L3 确认)。工具栏：搜索/角色筛选/状态筛选 + [Import Staff] + [+ Add Staff]。

**Add Staff（两步弹窗）**：Step1 基本：First/Last Name✅、Email✅（唯一校验，作登录与 2FA 邮箱）、Phone✅（≥7 位）、Role✅（**Clinician/Nurse/Receptionist——无 Admin**，§2.2-A1）、Employee ID（自动生成可改）；Step2 角色附加：Clinician→Specialisation/License No./默认问诊时长；Nurse→Assigned to Clinician(多选)；完成 → 状态 Invited + 邀请邮件 → toast "Invitation sent to {email}"。

**Import Staff**：Bulk 粘贴（email[, role]）或 CSV（模板 email,role,first_name,last_name）→ 预览表逐行校验（valid/duplicate/invalid+原因，行内改角色/删行；**role=Admin → invalid**）→ [Import {n} staff] → 全部置 Invited 进白名单。

**详情 Tabs**：Overview（档案+Primary Role[+Secondary Role 占位下拉，disabled，注 "Coming soon"]）/ Availability（该员工 Weekly Hours+Adjustments+Leave 只读，数据与 §6.7 同源）/ Permissions（**改为只读**角色权限清单视图，§2.5）/ Workload（分配患者表、预约类型分布图、周趋势、容量阈值线）。

### 6.11 Clinic Settings（Admin）

**结构改为左侧二级导航**（原型仅同意书单页，**改原型**扩展）：

**① Consent Form Template（沿用原型，已完善）**：模板编辑（标题/引言/条款 Section 富文本/签名块配置：ID number·witness 开关/页脚）；**版本机制**：每次 Publish 生成完整快照 vN、旧版转 archived；版本历史面板（编辑人/时间/变更摘要/该版签署数）、任意两版 Compare（富文本 diff）；发布弹窗勾选项 "Require existing patients to re-sign"→ 触发 §5.4 Expired 流。

**② Required Forms Mapping（新增，签到闸门配置源）**：

| 字段 | 说明 |
|---|---|
| 预约类型 × 表单 矩阵 | 每类型勾选必需表单（如 Body Scan → Clinic Consent + Scan Safety Checklist + Privacy Notice） |
| 生效规则 | 保存后仅影响**新创建**预约；已有预约的表单集不回溯【假设 AS-18】 |

**③ Journey Templates（P1 占位）**：§5.2 模板表的可视化配置（本期只读展示硬编码模板）。
**④ Billing Settings（预留）**：发票自动开具开关【AS-8 确认后】；~~退款阈值~~（Q9 删除，不做）。

### 6.12 Feedback（Q10 详细设计）

**管理端（Admin）**

**Tab 结构**（顶部，替代原型纯筛选。**改原型**）：

| Tab | 内容 | Badge |
|---|---|---|
| All | Patient + Staff（不含 Google） | New 数 |
| Patient | 患者来源 | New 数 |
| Staff | 员工提交（含匿名） | New 数 |
| **Google Reviews** | 只读同步流 | 未读数 |

Tab 下保留筛选行：Type / Status / Urgency / 日期范围 / 评分（Patient tab）/ 搜索。

**KPI 卡**：Total Feedback（period）/ Avg. Rating（患者+Google 合并均分，标注两源）/ Open Issues（live：New+In Review，附最老一条等待天数）/ Staff Feedback（period 分布）。

**列表卡片**：来源色点+作者（匿名→"Anonymous"+灰色人形图标）/类型徽标/标题/正文两行/评分星（患者）/紧急度（员工）/状态徽标/相对时间/⚑旗标。

**详情面板（右栏）**：

| 区块 | 规格 |
|---|---|
| 正文 | 全文+元数据（关联患者/医生/就诊日期——匿名项**不显示任何身份字段**） |
| **History 时间线** | 每条状态变更/旗标/备注事件：`{事件} · {by} · {时间}`，自动记录（§5.7）。原需求为 hover 查看——iPad 无 hover，改为**详情面板常驻区块** + 列表卡片右下角 🕘 图标点按弹 popover 快览（§11.3 替代表） |
| Internal Notes | Admin 备注流（作者/时间），仅 Admin 可见 |
| 操作区 | 状态下拉（New/In Review/Resolved/Archived）+ [Flag] + [Archive] + [Mark as Resolved]（绿主） |

**Google Reviews Tab**：条目=Google 头像/昵称/星级/内容/时间/回复状态（Replied/Not replied）；操作：[Open in Google]（外链去回复）+ [Mark as handled]；本地状态仅 New→Handled；同步：Google Business Profile API 每小时轮询【假设 AS-19】【待确认 OQ-10：Google 账号接入与授权归属】。Google 数据不进入内部状态机/导出。

**提交端（非 Admin，顶栏 Help → Submit Feedback 弹窗）**：Type（Suggestion/System Issue/Incident Report/Compliment/Other）/ Subject✅ / Description✅ / Urgency(Low·Medium·High) / **Submit anonymously** 勾选 → 勾选后底部 "Submitting as" 行变为 "Anonymous"+锁图标（姓名视觉置灰，满足你"grey box"意图）+ 说明文案 "Your name and role will not be shown to the reviewer."。**匿名机制**：展示层全链路（列表/详情/导出/通知）隐藏身份；数据层保留（严重事件合规追查）——在隐私声明中向员工明示【待确认 OQ-11：是否改为完全匿名不留身份】。提交入口与管理端展示字段一一对应（你的一致性要求）：type/subject/description/urgency/anonymous 在两端同名同义。

**患者反馈来源**【假设 AS-9】：就诊 Completed 后 2h 自动发短信/邮件评价链接（独立网页表单：评分+文本，关联就诊）；不做患者 App。

### 6.13 Timesheet（Admin）

**目的**：按周期查看/导出员工出勤与工时。**数据来源**：排班（§6.7）+ 请假 + **打卡记录（§8，上线前 actual 列显示 "—/Not tracked"）**。

工具栏：员工多选picker（按角色分组全选）/ 日期范围（presets: This Week/Last Week/This Month/自定义）/ 视图 Daily·Weekly / [Export ▾ Excel·CSV]。

**Daily 表列**：Date / Type（Regular·Day Adjustment·Day Off·On Leave）/ Scheduled（时段+小时）/ Actual Start / Actual End / Actual Hours / Variance（±h，负=缺时红、正=超时）/ Overtime / Appointments（当日服务预约数）/ Notes（异常标记：Missing punch·Auto-closed·Corrected）。
**Weekly 汇总**：Days Scheduled/Present/Leave、Total Scheduled/Actual/Variance/Overtime、Appointments、Attendance Rate。

**导出字段（定稿，回答你第一步的待确认）**：员工姓名/ID/角色 + Daily 全列 + 周期汇总行；文件名 `timesheet_{from}_{to}.xlsx`；导出动作写审计日志。

### 6.14 Notifications 页

列表（倒序）：图标（事件类型色）/标题/一行详情/相对时间/未读蓝点。工具栏：Tab All·Unread / 类型筛选（§10.2 目录）/ [Mark all as read]。行点按 → 跳事件落地页并置已读；左滑单条 → Mark read/Delete（iPad 手势，§11.5）。空态："No notifications yet."。保留 90 天【假设 AS-20】。

### 6.15 Profile

区块：① Personal Information（头像/姓名/电话——**非 Admin 只读**+提示 "Managed by your clinic administrator"；邮箱恒只读）② Security（2FA：强制启用不可关，显示 Enabled+验证码接收邮箱掩码；**Change Password**（当前密码+新密码双输入，规则同注册，xlsx 要求原型缺失，**改原型**）；Active Sessions：设备列表+This device 徽标+[Sign out]/[Sign out all other devices]（L2 确认））③ Language & Region（English UK/Türkçe；时区 Europe/Istanbul 只读；日期格式 DD/MM/YYYY 默认）④ Notification Preferences（§10.3 矩阵：System 恒开置灰，SMS/Email 可编辑，Edit→Save 模式）⑤ Support（非 Admin：[Contact Administrator]→反馈弹窗；[Help Centre]）⑥ Recent Activity（个人操作流水，Admin 额外 [View Audit Log] 入口）⑦ Danger Zone（仅 Admin：Transfer Admin Role，§2.2）。

### 6.16 Authentication（已实现，Q11 — 本节为验收基线 + 补齐项）

**Login**：email+password；校验顺序：两项必填 → 凭证校验；错误统一 "Incorrect email or password."（不泄露账号是否存在）；连续 5 次失败锁定 15 分钟【假设 AS-21，补齐】。→ **2FA**：6 位邮箱验证码（分格输入，自动跳格/粘贴分发）；错误 "Invalid code. Please try again."；Resend 60s 倒计时；验证码 10 分钟有效【AS-21】。→ 首次登录 **Enrollment**：条款勾选（未勾选 Continue 置灰）→ Dashboard。
**Forgot Password**：email → 验证码 → 新密码（实时四规则清单：≥8/大写/数字/特殊字符，全绿才可提交）→ Done。
**激活注册 /register**：邮箱 → **白名单校验**（不在名单→"This email is not authorised. Contact your administrator."；已激活→"Already active — please sign in." 引导登录）→ 验证码 → 设密码（同规则+确认密码一致性校验）→ 完成引导登录。步骤守卫：直接访问后续 URL 无状态 → 弹回起点（已实现）。
**全局**：登录态 8h 无操作过期【AS-21】；密码错误提示永不指明具体字段。

---

## 7. KPI／指标规格

> Q7 要求：逐卡想清楚定义与使用场景。本章先定**框架规则**（所有卡共守），再逐角色逐卡给出定义、公式、类型、周期行为与合理性评审（保留/修改/替换）。xlsx 的 26 张卡全部在列。

### 7.1 框架规则

| 规则 | 定义 |
|---|---|
| **指标三类** | **Live**（实时快照：数值不随周期切换变化，卡片角标恒显 "LIVE"，周期仅改变对比参考线为期间均值）/ **Period**（周期总量：数值、环比、迷你趋势线都随周期变）/ **Hybrid**（Today=存量待办，7d/30d 语义切换为期间完成量，标签随之改变） |
| 周期切换器 | 全局单选 **Today / 7d / 30d**，作用于整条 KPI Bar（含锁定卡——锁定=不可移除，不是不可切周期）；选择记忆本会话。~~天/月/年~~ 不采用：诊所运营决策节奏是"今天忙不忙、这周趋势、这个月盘点"，月/年粒度放报表不放仪表盘 |
| 环比基准 | Today vs **上一个相同星期几**（消除周内规律差异，如周五 vs 上周五）；7d vs 前 7 天；30d vs 前 30 天 |
| 反向指标 | inverse=true 的卡（越低越好）↑红↓绿；正向相反；Live 卡期间均值行为灰色信息态（无箭头） |
| 下钻 | 每卡整卡可点按 → 预筛选列表（见各卡 Drill 列）；下钻页顶部显示来源徽标 "From KPI: {卡名}" 便于返回 |
| 刷新 | Live 卡 30s 轮询；Period 卡 5min；手动下拉刷新全部【假设 AS-22】 |
| 锁定卡 | 每角色 2 张（业务底线指标，Admin 在后台定义【P2】，本期硬编码）；可选槽 2 张，员工在 Customise 弹窗自选 |
| 空/异常值 | 数据源不可用 → 卡显示 "—" + 灰色 "Data unavailable"；0 是合法值正常显示 |
| 命名规范 | Live 卡命名含 "Now" 或明确即时语义；Period 卡在 7d/30d 下自动去掉 "Today" 后缀（如 Appointments Today → Appointments） |

### 7.2 Admin（场景：到店高峰前扫一眼全局，周中看趋势）

| 卡 | 锁定 | 类型 | 定义与公式 | 周期行为 | Drill | 评审 |
|---|---|---|---|---|---|---|
| Appointments Today | 🔒 | Period | 当期预约数 = count(状态 ≠ Cancelled 的预约)。**含 No Show**（占用了排程产能） | 7d/30d → "Appointments" | Calendar·当期 | ✅ 保留 |
| Results Pending Review | 🔒 | Live | 全诊所待医生首审的结果数 = count(结果状态=Pending Review) | LIVE+均值参考 | Patients·Results Pending 筛选 | ✅ 保留；与 Sign-off 队列分开（§0.6） |
| Checked In Now | | Live | 当前在店患者数 = count(预约状态 ∈ {Checked In, In Clinic}) | LIVE | Dashboard·Waiting Room 区块 | ✅ 保留。注意与 Reception 的 "Checked In"（period 累计）是**两个指标**，命名已区分 |
| Utilisation | | Live | 产能利用率 = 今日已排预约时长 ÷ 今日全体在班医生可用时长（来源 §6.7 排班） | LIVE | Calendar | ⚠ 修改：xlsx 未定义分母。定义为**医生时段口径**（不是房间口径——房间利用另建 Rooms In Use）【待确认 OQ-12】 |
| Scans Completed Today | | Period | 当期 Scan 步骤 Completed 次数（来源 Journey S2） | → "Scans Completed" | Patients·Journeys | ✅ 保留 |
| No Show Rate | | Period·inverse | 当期 No Show ÷ (No Show+Completed+Checked In+In Clinic)，即实际应到口径 | 同 | Calendar·List 视图 No Show 筛选 | ✅ 保留；分母定义如左，排除 Cancelled |
| New Registrations | | Period | 当期新建患者档案数 | 同 | Patients·按注册日期 | ✅ 保留 |
| Average Wait | | Live·inverse | **当前等待中患者的平均已等时长** = avg(now − arrivedAt)，对象=Arrived 状态 | LIVE | Dashboard·Waiting Room | ⚠ 修改：定义为"现在还在等的人等了多久"（可行动）而非历史均值（历史口径放 30d 参考线） |
| ➕ Revenue Today（新增建议） | | Period | 当期实收 = sum(Paid 交易) − sum(Refunded) | → "Revenue" | Billing | 建议加入可选池：Admin 高频关心，Billing 页已有数据 |

默认可选槽：Checked In Now + Utilisation。

### 7.3 Receptionist（场景：站在前台，眼里只有"谁到了、谁能进、谁没付钱"）

| 卡 | 锁定 | 类型 | 定义与公式 | Drill | 评审 |
|---|---|---|---|---|---|
| Arrivals Expected | 🔒 | Period | 今日应到总数 = count(今日预约，状态≠Cancelled，类型≠视频) | Dashboard·Arrivals | ✅ 保留；排除视频（不"到店"） |
| Checked In | 🔒 | Period | 当期完成签到人次 = count(checkedInAt ∈ 当期) | Patients·Reception 视图 | ✅ 保留 |
| In Clinic Now | | Live | 当前在店 = 同 Admin Checked In Now | Waiting Room | ✅ 保留（与 Admin 卡同源，命名不同角度）⚠ 建议统一命名为 In Clinic Now 双端一致【改 xlsx 口径】 |
| Awaiting Check-in | | Live | 已到店未签到 = count(状态=Arrived) | Check-in Queue | ✅ 保留；前台最强行动信号 |
| Walk-ins | | Period | 当期"当日创建且当日开始"的预约数【假设 AS-23：以此代理无预约到店，系统无独立 walk-in 登记流】 | Calendar·List | ⚠ 修改：需依赖 AS-23 口径，否则删除 |
| Unpaid Balances | | Live·inverse | 今日预约中 Payment=Unpaid 的数量（金额在 Billing 卡看） | Billing·Unpaid | ✅ 保留 |

默认可选槽：Awaiting Check-in + Unpaid Balances（比原型的 In Clinic Now 更具行动性——前台的任务是"清队列"）。

### 7.4 Nurse（场景：两只手都占着，抬头一眼要知道下一个动作；MD 要求精简）

| 卡 | 锁定 | 类型 | 定义与公式 | Drill | 评审 |
|---|---|---|---|---|---|
| My Patients Today | 🔒 | Period | 今日分配给我的预约患者数 | Patients·Nurse 视图 | ✅ 保留 |
| Awaiting Me | 🔒 | Live·inverse | 等待护士动作的步骤数 = count(Journey Active ∧ 当前步 ∈ S1–S4 ∧ 状态=Pending ∧ nurse=我) | Journey Queue | ✅ 保留；核心行动卡 |
| In Journey Now | | Live | 我的患者中 Journey Active 数 | Journey Queue | ✅ 保留 |
| Samples To Collect | | Hybrid·inverse | Today：我的待采样数（S3 Pending）；7d/30d → "Samples Collected" 期间完成数 | Samples 区块 | ✅ 保留；hybrid 设计合理 |
| ~~Consents Pending~~ → **Home Kits Pending** | | Hybrid·inverse | Today：待发放检测盒（S4 Pending）；7d/30d → "Home Kits Handed Out" | Journey Queue·S4 | 🔄 **替换**：Q2 定稿后护士不经手 Consent，原卡与护士职责脱钩；S4 是护士实际待办 |
| Rooms In Use | | Live | 占用房间数/总数（来源：In Clinic 预约的房间） | Calendar·按房间 | ✅ 保留 |

默认可选槽：In Journey Now + Samples To Collect。

### 7.5 Clinician（场景：诊间间隙看积压；两个队列不能混）

| 卡 | 锁定 | 类型 | 定义与公式 | Drill | 评审 |
|---|---|---|---|---|---|
| Results To Review | 🔒 | Live·inverse | 待我首审的结果数 | Patients·Results Pending | ✅ 保留 |
| Awaiting My Sign-off | 🔒 | Live·inverse | 待我签发的报告数（Review 通过后的下游） | Patients·Awaiting Sign-off | ✅ 保留；与上卡在术语表明确两阶段（§0.6） |
| My Appointments | | Period | 当期我的预约数 | Calendar·我 | ✅ 保留 |
| Video Calls Today | | Period | 当期我的视频问诊数 | Consultations 区块 | ✅ 保留 |
| ~~Patients Triaged~~ → **Consultations Completed** | | Period | 当期我完成的问诊数（S5 Completed by 我） | Calendar·List | 🔄 **替换**：系统无 triage 对象/流程，指标无数据来源；问诊完成量是医生真实产出 |
| Follow-ups To Book | | Live | 我标记了 Follow-up 旗标但无未来预约的患者数 | Patients·Follow-up Due | ✅ 保留；公式如左（旗标∧无 nextAppt） |

默认可选槽：My Appointments + Video Calls Today。

### 7.6 页内 KPI（非 Dashboard 卡，随页面固定）

| 页面 | 卡 | 类型 | 定义 |
|---|---|---|---|
| Billing | Today's Collections | Period | 今日实收金额+笔数 |
| Billing | Awaiting Payment | Live | 未付笔数+合计金额+其中今日签到前必收数（红字） |
| Billing(Admin) | Monthly Revenue | Period | 本月实收，环比上月 |
| Billing(Admin) | Outstanding Balance | Live | 全部未收合计+涉及患者数+超 30 天笔数 |
| Feedback | 见 §6.12 | | |
| Patients | 各角色统计卡沿用你既有规格 | | Partial 相关口径删除 |

---

## 8. 考勤打卡模块（Clock In / Clock Out）——完整设计，P2 实现

> Q5 结论：功能要有、设计合理、当前优先级不高。本章为完整可实现设计，标注分期，先不占开发排期；§6.13 Timesheet 已按"打卡未上线"降级显示。

### 8.1 设计原则

打卡是**低摩擦高频动作**（每人每天 2 次），设计目标：3 秒完成、防代打、异常可追溯。**不引入二次验证**（登录+强制 2FA 已确权，再加验证会把 3 秒变 30 秒）；防作弊靠**环境校验**而非身份校验。

### 8.2 入口与交互

| 项 | 规格 |
|---|---|
| 主入口 | Dashboard 问候区右侧**打卡胶囊**：未打卡=描边按钮 [Clock In]；已上班=绿点+"Clocked in at 08:56"+[Clock Out]；已下班=灰色 "Clocked out · 8.2h today" |
| 副入口 | 顶栏头像菜单第一项（任何页面可打卡） |
| 动作 | 点按 → 轻量确认 popover（当前时间大字 + [Confirm Clock In]，L1 级——防误触，不是弹窗轰炸）→ 成功 toast + 胶囊状态即时切换 |
| Admin | **同样打卡**（§2.2-A7；数据完整性），Clinic Settings 可配置豁免开关【待确认 OQ-13】 |
| 环境校验 | 记录设备指纹+IP；仅允许诊所 Wi-Fi 网段打卡（后台配置网段），网段外点击 → 阻断提示 "Clock in is only available on the clinic network."【待确认 OQ-13：是否放开远程打卡给外勤】 |

### 8.3 异常处理

| 场景 | 系统行为 |
|---|---|
| 忘 Clock In（>排班开始 30min 未打） | 推送提醒通知；当日补打时间=实际点击时间（不回填），差异进 Variance |
| 忘 Clock Out | 21:00 提醒；23:59 系统自动关闭记录，Actual End 空、状态=**Abnormal (auto-closed)**，Timesheet 红标 |
| 补卡 | 员工在 Profile→My Attendance（P2 页面）对异常日发起 **Attendance Correction**：修正时间+原因必填 → 进入 Approval Center 新类型 → Admin 批准后生效，**原始记录保留**（修正以叠加层存储，审计可见前后值） |
| 跨天班次 | 本期不支持（诊所无夜班）；23:59 切断规则兜底 |
| 请假日 | 打卡入口隐藏，显示 "On leave today" |

### 8.4 状态机

| 当前 | 事件 | 守卫 | 目标 | 备注 |
|---|---|---|---|---|
| 未打卡 | Clock In | 诊所网络；非请假日 | 已上班 | 记录 at/device/IP |
| 已上班 | Clock Out | — | 已下班 | 计算当日 Actual Hours |
| 已上班 | 23:59 自动关闭 | — | Abnormal | 通知本人+Admin |
| 已下班/Abnormal | Attendance Correction 获批 | Admin 批准 | Corrected | 保留原值+修正值+审批链 |
| 已下班 | 再次 Clock In（同日二段） | 【待确认 OQ-14：是否支持午休分段】推荐 v1 不支持，单段/日 | — | |

### 8.5 与 Timesheet 的关系

Actual Start/End/Hours/Overtime **唯一来源=打卡记录**；Variance=Actual−Scheduled（排班来源 §6.7）；异常/修正状态在 Notes 列徽标化。打卡上线前 Timesheet actual 列显示 "Not tracked"。

### 8.6 分期

Phase A（P2）：打卡+Timesheet 接入+自动关闭；Phase B：补卡审批+My Attendance 页；Phase C：网段配置管理+豁免配置。

---

## 9. 数据模型（文字 ERD）

> 冒号后为关键属性（*=必填）；「1—N」表示一对多。

| 实体 | 关键属性 | 关系 |
|---|---|---|
| Patient | id*, patientId*(PH-YYYY-NNNN), title, firstName*, lastName*, dob*, sex*, nationality, phone*, email*, preferredLanguage, emergencyContact{name,relation,phone}, group, status*, registeredAt*, assignedClinicianId, assignedNurseId, flag, medicalAlerts[], activeDiagnoses[], medications[] | 1—N Appointment / Journey / SignedForm / Payment / ClinicianNote / Feedback(patient 源) |
| StaffMember | id*(EMP-NNN), firstName*, lastName*, email*(唯一), phone*, role*(Primary), secondaryRole(P2), status*, specialisation, licenseNo, defaultConsultDuration, joinedAt | 1—1 WeeklySchedule；1—N DayAdjustment / LeaveRequest / ClockRecord / ApprovalDecision(作为 Admin) |
| Appointment | id*, patientId*, type*, date*, startMin*, durationMin*, clinicianId*, nurseId, room, status*, isVideo, notes, arrivedAt, checkedInAt, checkOutAt, cancelReason, createdBy, 变更历史[] | N—1 Patient/Clinician/Nurse/Room；1—1 Journey；1—1 PaymentRecord；1—N RequiredFormInstance |
| JourneyTemplate | apptType*, steps[]{stepKey, skippable} | 配置源（本期硬编码） |
| Journey | id*, appointmentId*, templateSnapshot*, status*, startedAt, completedAt | 1—N JourneyStep |
| JourneyStep | journeyId*, stepKey*(S0–S5), status*, by, at, skipReason, notes[], attachments[], history[] | |
| FormTemplate | id*, name*, versions[]{vN, status, content 快照, editedBy/At, changeSummary, signedCount} | 1—N SignedForm |
| SignedForm | id*, patientId*, appointmentId, templateId*, templateVersion*, status*, sentVia, signedAt, signedBy, witnessedBy, pdfRef | |
| RequiredFormsMapping | apptType* × formTemplateId*[] | 闸门配置源 |
| PaymentRecord | id*, appointmentId*, amount*, status*(Unpaid/Paid/RefundPending/Refunded), method, transactionStatus, voucherId, invoiceStatus, paidAt, transactions[] | N—1 Voucher |
| Refund | id*, paymentId*, amount*, reason*, by*(AdminId), at*, channelStatus | |
| Voucher | code*, faceValue*, remaining*, expiresAt*, status | |
| WeeklySchedule | staffId*, days[7]{active, slots[]{start,end,type(InPerson/Video/Both)}}, timezone | |
| DayAdjustment | id*, staffId*, date*, slots[], status*, pendingAction, conflictsSnapshot[], submittedAt, decidedBy/At, rejectionReason | |
| LeaveRequest | id*, staffId*, dateFrom*, dateTo*, duration*, reason*, reasonOther, status*, conflictsSnapshot[], … | |
| ApprovalRequest（统一视图） | id*, kind*(ScheduleChange/DayAdjustment/Leave/AttendanceCorrection), staffId*, payloadRef*, status*, submittedAt*, decidedBy/At, rejectionReason | Approval Center 数据源 |
| ClockRecord | id*, staffId*, date*, clockInAt, clockOutAt, device, ip, status*(Normal/Abnormal/Corrected), correction{原值,新值,approvalId} | 派生 → TimesheetEntry |
| Feedback | id*, source*, type*, title*, body*, rating, urgency, isAnonymous, authorId(内部保留), patientId, status*, flagged, internalNotes[], **statusHistory[]{from,to,by,at}** | |
| GoogleReview | id*, author, rating*, text, reviewedAt*, replied, localStatus(New/Handled) | 只读同步 |
| Notification | id*, recipientId*, event*, entityRef*, title, body, channels[], readAt, createdAt | |
| AuditLog | id*, actorId*, action*, entityRef*, before/after 摘要, at*, ip | 只增不改 |

一致性规则：患者姓名/年龄等展示字段一律实时取自 Patient 单一记录（修复原型 mock 中同一患者三处年龄不一致的问题）；金额统一 kuruş 整数存储、₺ 展示。

---

## 10. 通知与消息

### 10.1 渠道

| 渠道 | 说明 |
|---|---|
| System（站内） | 恒开不可关；铃铛+Notifications 页 |
| Email | 用户偏好可关（Profile） |
| SMS | 用户偏好可关；仅高时效事件默认开 |

### 10.2 事件目录（触发 × 接收人 × 默认渠道 × 落地页）

| 事件 | 触发条件 | 接收人规则 | 默认渠道 | 点按落地 |
|---|---|---|---|---|
| Appointment created/rescheduled/cancelled | 状态/时间变更 | Receptionist+Admin：全部；Clinician/Nurse：仅自己相关 | Sys（改期/取消+Email） | Calendar→Drawer |
| Appointment reassigned | Admin 重新分配 | 原+新医生/护士 | Sys+Email | Drawer |
| Patient checked in | 签到成功 | 该预约 Clinician+Nurse | Sys | Drawer |
| No Show marked | 标记爽约 | 该预约 Clinician+Admin | Sys | Drawer |
| Result ready for review | 结果入库 | Admin：全部；Clinician/Nurse：仅自己患者 | Sys+Email | Patient Record |
| Report awaiting sign-off | Review 完成 | 该 Clinician | Sys | Patient Record |
| Approval request submitted | 员工提交（§5.5/§8） | Admin | Sys+Email | Approval Center 该项 |
| Approval decided | Admin 批/驳 | 申请人 | Sys+Email（驳回含理由） | My Availability |
| Form signed | 患者完成签署 | 该预约 Receptionist 组 | Sys | Drawer |
| Payment received（链接支付） | 回调成功 | Receptionist 组 | Sys | Billing |
| Refund completed | 渠道回执 | Admin | Sys | Billing |
| High-urgency feedback | urgency=High 提交 | Admin | Sys+SMS | Feedback 详情 |
| Clock-in reminder / auto-close | §8.3 | 本人（auto-close 抄送 Admin） | Sys | Dashboard |
| Invite pending >14d | AS-13 | Admin | Sys | Staff |

### 10.3 偏好矩阵（Profile 内）

行=事件组（Appointment updates / Result updates / Approval requests[仅 Admin] / Attendance[P2]），列=System(锁定✓)/SMS/Email。角色不可见的事件组整行隐藏。辅助文案沿用原型（Clinician："For your appointments only"）。

### 10.4 铃铛 popover

最新 8 条+未读计数（99+ 封顶）；[Mark all as read] / [View all]；实时推送（websocket 或 30s 轮询【AS-22】）。

---

## 11. Design System / iPad UX 规范

> 目标设备：iPad 13" 横屏 1366×1024pt（@2x）。本章是全部页面共守的交互宪法；视觉细节（色板/字体标尺/组件视觉稿）另起 Design Spec 交付，此处定原则与硬规则。

### 11.1 视觉方向：玻璃拟态 × Premium（原则）

| 原则 | 规则 |
|---|---|
| 玻璃用在"壳"，不用在"内容" | 半透明+背景模糊（blur 20–30、白 65–75% 透明度）仅用于：侧边栏、顶栏、抽屉/弹窗遮罩、popover。**数据卡片/表格一律实底浅色**——医疗数据可读性优先，长文本永不放在毛玻璃上 |
| Premium=克制 | 阴影两级（卡片 sm / 浮层 xl）；圆角体系 8/12/16pt 三档；留白 8pt 栅格；动效 150–250ms ease-out，仅用于进出场与状态切换，不做装饰动画 |
| 色彩 | 保留现有主题色与字体；状态色语义固定：绿=完成/通过、琥珀=等待/待办、红=阻断/危险、蓝=进行中/信息、紫=退款/特殊；同一语义全站同色 |
| 对比度 | 正文与关键数字 ≥ WCAG AA（4.5:1）；玻璃层上的文字必须实测对比度 |

### 11.2 触控硬规则

| 规则 | 值 |
|---|---|
| 最小触控目标 | 44×44pt（图标按钮含热区补足）；表格行高 ≥48pt；日历块最小渲染高 44pt（15min 短约压缩文字不压缩热区） |
| 主按钮 | 高 ≥44pt，页面/抽屉底部固定（拇指区） |
| 间距 | 相邻可点元素间距 ≥8pt，危险按钮与常规按钮间距 ≥16pt（防误触 Cancel appointment） |
| 软键盘 | 数字字段唤起数字键盘、email 字段 email 键盘；抽屉/弹窗内聚焦字段自动 scroll-into-view，提交按钮不被键盘遮挡 |

### 11.3 无 Hover 替代表（全站强制）

> iPad 无可靠 hover。凡设计稿/旧需求出现 "hover" 一律按此表转换（**改原型**逐处核对）：

| 桌面习惯 | iPad 替代 |
|---|---|
| Hover tooltip 解释 | ⓘ 图标点按 popover（点外部关闭）；或直接把说明写成可见小字 |
| Hover 行高亮 | 按压态（pressed 背景，120ms） |
| Hover 出现操作按钮 | 操作常驻显示（表格 Actions 列）或行内主按钮直出（如 Check In） |
| Hover 查看 Voucher 详情 | 点按券码 → popover（§6.6） |
| Hover 查看 Feedback 历史 | 详情面板常驻 History 区块 + 卡片 🕘 点按 popover（§6.12） |
| 禁用按钮 hover 说明原因 | 禁用按钮**保持可点**：点按触发抖动+原因文案+滚动定位到问题区块（签到闸门 §6.2.4 为范式） |
| 拖拽（鼠标按住即拖） | 长按 300ms 拾起（块浮起+震动反馈）→ 拖动 → 15min 网格吸附 → 松手弹确认 |

### 11.4 确认与反馈层级（"二次确认"统一决策树）

> 你的要求"双重弹窗认证确认"落为四级体系。**任何操作只属于一级，绝不弹窗套弹窗**。

| 级别 | 适用 | 形式 | 实例 |
|---|---|---|---|
| **L0 无确认** | 高频+低风险+可逆 | 直接执行+toast | Check In、标记 Journey 步骤完成、已读通知 |
| **L1 轻确认** | 防误触/提示性 | popover 或内联黄条，单击确认 | 打卡 Confirm、跳过前序步骤提示、非分配护士操作提示、房间冲突警告 |
| **L2 标准确认** | 影响他人/需要注意后果 | 居中 alert 弹窗：后果说明+双按钮 | 带未完成步骤的 Check Out、Withdraw 请求、Sign out all devices、拖拽改期确认 |
| **L3 强确认** | 不可逆/资金/权限/合规 | 弹窗+**理由必填或密码**+红色主按钮 | 取消预约（理由）、退款（理由）、驳回审批（理由）、Skip 步骤（理由）、Deactivate 员工、Transfer Admin（密码） |
| Toast 规范 | 成功绿/信息灰/错误红；3s 自淡出；错误 toast 5s+可手动关；可逆操作 toast 附 [Undo]（5s 窗口，如误标 Arrived） | | |

### 11.5 容器选择规则：Drawer > Modal

| 容器 | 使用场景 | 规格 |
|---|---|---|
| **右侧 Drawer（默认优先）** | 查看/操作某个列表项的详情且需保留上下文（预约、审批、账单、反馈详情） | 400–420pt 宽；遮罩 20% 黑；右滑手势可关；URL 深链 |
| 居中 Modal | 创建/编辑类多字段表单（新预约、请假、Add Staff） | max-w 480–640pt；点遮罩不关闭（防误触丢表单），仅 X/Cancel 关，脏表单关闭前 L2 确认 "Discard changes?" |
| Alert Dialog | L2/L3 确认 | 340–400pt |
| Popover | 轻量信息/单选（旗标选择、券详情、打卡确认） | 锚定触发元素 |
| 全屏 Sheet | 患者当面签署模式（Initialize Signing） | 隐藏员工 UI，完成/取消返回 |

### 11.6 页面五态统一规范

| 态 | 规范 |
|---|---|
| 加载 | 骨架屏（与最终布局同构），≥800ms 才出现（防闪烁） |
| 空（业务空） | 图标+一句话+行动按钮（各页文案见 §6） |
| 无结果（筛选后） | "No … match your filters" + [Clear filters] |
| 无权限 | 整页版（§6.4.3）或区块隐藏（§2.4） |
| 错误 | 内联重试卡 "Something went wrong — [Retry]"；写前端错误日志 |

### 11.7 组件清单（基于现有 shadcn/ui 集）

沿用：Button/Input/Select/Checkbox/Radio/Switch/Table/Tabs/Badge(状态徽标)/Card/Dialog/Drawer(Sheet)/Popover/Tooltip(仅桌面降级用)/Toast(sonner)/Calendar/Avatar/Progress/Skeleton/Accordion。
新增规范组件：**StatusPill**（全站唯一状态徽标，色由 §11.1 语义表驱动）、**JourneyDots**（进度点条，含 Skipped 斜杠态）、**KpiCard**（LIVE 角标/趋势线/环比箭头）、**GateButton**（可点禁用态按钮，§11.3）、**ConfirmDialog L2/L3 模板**、**EmptyState**。

### 11.8 iPad 专项

侧边栏：默认展开 256pt；≤1180pt 视口自动收起为图标栏（56pt，点按浮出）；手势：左缘右滑呼出。分屏（Split View）最小支持 981pt 宽降级为图标栏+单列布局【P2】。方向锁定：仅横屏。长列表：惯性滚动+表头 sticky；下拉刷新仪表盘。外接键盘快捷键【P2】：/ 聚焦搜索、⌘K 全局搜索。

---

## 12. 非功能需求

### 12.1 审计日志（Audit Log）

必记操作（actor/at/ip/entity/before→after）：

| 域 | 操作 |
|---|---|
| 患者数据 | 查看 Patient Record（KVKK 访问审计）、编辑档案、导出、停用 |
| 账务 | 收款、退款（含理由）、发票 |
| 预约 | 取消（含理由）、改期、Reassign、No Show |
| Journey | Skip（含理由）、Reopen |
| 审批 | 全部决定（含理由） |
| 权限/账号 | 建号、停用、角色变更、Transfer Admin、白名单变更 |
| 配置 | 同意书模板发布、Required Forms 映射变更 |
| 考勤 | 补卡修正（原值+新值） |

Admin 经 Profile→View Audit Log 查询（筛选：人/域/日期）；日志只增不改，保留 ≥10 年（与健康数据一致）。

### 12.2 患者信息范围与合规（Q3 —— 决策清单）

> 你尚未确定患者信息范围。下表按数据组给出：是否采集、展示范围、KVKK 定性、建议。**KVKK 将健康数据列为"特殊类别个人数据"，处理需患者明示同意（açık rıza）**——同意书模板 §6.11 已含该条款。逐行打 ✓/✗ 即可定稿【待确认 OQ-15，P0】。

| # | 数据组 | 字段 | 建议采集 | 展示范围建议 | 合规注意 |
|---|---|---|---|---|---|
| 1 | 身份 | 姓名、DOB、性别、照片 | ✓ | 全角色（照片可选） | 基本数据；照片需单独同意 |
| 2 | 国籍/证件 | Nationality、TC Kimlik/护照号 | 证件号**待定** | 仅 Admin | 证件号高敏：仅当发票/保险直付法定需要才采集；加密存储、界面掩码显示 |
| 3 | 联系 | 手机、邮箱、地址(?) | 手机/邮箱 ✓，地址待定 | Admin/Receptionist 完整；医护可见不可导出 | 用于支付链接/表单/提醒；营销用途需单独 opt-in |
| 4 | 紧急联系人 | 姓名/关系/电话 | ✓ | Admin/Receptionist/Nurse | 属第三方个人数据，告知义务 |
| 5 | 行政 | 分组(VIP…)、分配医护、注册日期、偏好语言 | ✓ | 全角色 | "VIP" 等标签避免歧视性使用（内部指引） |
| 6 | 临床-警示 | 过敏、Medical Alerts | ✓ | Nurse/Clinician/Admin | 特殊类别；安全必要性高，建议保留 |
| 7 | 临床-记录 | 诊断、用药、biomarkers、结果 | ✓ | Clinician/Admin（Nurse 仅 Journey 所需） | 特殊类别；明示同意覆盖；访问全审计 |
| 8 | 文件 | 签署表单 PDF | ✓ | 按 §6.4.2 | 与模板版本绑定留存（举证） |
| 9 | 财务 | 账单、支付方式（不存卡号） | ✓ | Admin/Receptionist | 卡数据不落库（终端/支付网关持有，PCI 责任外移） |
| 10 | 未成年 | 监护人信息 | 若接诊未成年则必须 | 同紧急联系人 | 监护人同意签署；建议 v1 仅接诊 ≥18 岁【待确认】 |
| 通则 | | 数据最小化（能不采不采）、保留期健康数据 10 年（同意书已载明）、患者行权（查阅/更正/删除申请走线下 Admin 流程 v1）、跨境传输（服务器位置）需法务确认 | | | 全条目【需法务/合规确认】 |

### 12.3 性能

仪表盘首屏 <2s（P75）；列表分页 25/页、虚拟滚动 >100 行；日历日视图渲染 <500ms；Live KPI 轮询不阻塞交互；离线（Wi-Fi 抖动）：只读缓存最近数据+顶栏 "Offline — retrying…"，写操作排队重试或明确失败【P2】。

### 12.4 可访问性

对比度 AA；全部图标按钮带 aria-label；状态不只靠颜色（徽标同时有文字）；字体最小 12pt（次要）/14pt（正文）；VoiceOver 走查关键流程（签到闸门/审批）。

### 12.5 国际化

界面英文（v1），架构预留 tr 语言包；货币 ₺ 千分位（₺4.800 土耳其格式【待确认 OQ-16：₺4,800 还是 ₺4.800】）；日期 DD/MM/YYYY、时区恒 Europe/Istanbul；姓名不拆 First/Last 排序问题（土耳其字符 İıŞş 排序规则用 tr locale）。

---

## 13. 待确认问题清单（Open Questions）

| 编号 | 问题 | 涉及 | 影响 | 推荐方案 | 优先级 |
|---|---|---|---|---|---|
| OQ-1 | Admin 失联/离职的兜底转移机制 | §2.2 | 系统失管风险 | 供应商后台受控转移，产品层不做代管 | P1 |
| OQ-2 | 前台可否编辑患者联系方式 | §2.3 | 前台效率 vs 数据管控 | 允许（改动写审计） | P1 |
| OQ-3 | Admin 是否可读 Clinician Notes | §6.4.2 | 医疗记录隐私边界 | 可读不可写；或加"仅统计不看内容"模式 | P1 |
| OQ-4 | Receptionist 是否纳入 My Availability 排班 | §6.7 | 考勤/Timesheet 完整性 | 纳入（前台也有班表与请假） | P1 |
| OQ-5 | Clinician 申请访问非分配患者的流程是否要做 | §6.4.3/§6.8 | 会诊/代班场景 | P2 做：申请理由+时限 24h+全程审计，进 Approval Center | P2 |
| OQ-6 | 顶栏全局搜索范围与交互 | §3.4 | 全站导航效率 | 按 §3.4 推荐规格 | P1 |
| OQ-7 | 步骤误标完成的纠错权 | §5.2 | 数据准确性 | 本人 5 分钟内可撤销；之后仅 Admin Reopen | P1 |
| OQ-8 | 签到闸门是否给 Admin 例外放行 | §6.2.4 | 现场极端情况 | 不给；极端情况 Admin 改支付/表单状态本身即解锁（留审计） | P1 |
| OQ-9 | 退款是否允许部分金额 | §6.6 | 财务口径 | 允许输入 ≤实收金额（无 Partial 收款 ≠ 无部分退款） | P1 |
| OQ-10 | Google Reviews 接入账号与授权 | §6.12 | 功能可行性 | 诊所 Google Business Profile 管理员授权 OAuth | P1 |
| OQ-11 | 员工匿名反馈是否完全匿名（数据层也不留身份） | §6.12 | 信任 vs 合规追查 | 保留身份+展示层匿名，并向员工明示 | P1 |
| OQ-12 | Utilisation 分母口径（医生时段 vs 房间） | §7.2 | KPI 准确性 | 医生时段口径 | P1 |
| OQ-13 | 打卡网段限制与 Admin 豁免 | §8.2 | 考勤真实性 | 限诊所 Wi-Fi；Admin 不豁免 | P2 |
| OQ-14 | 打卡是否支持一日多段（午休） | §8.4 | 工时精度 | v1 单段 | P2 |
| OQ-15 | **患者信息采集清单逐行确认（§12.2 表）** | 全局 | 字段级需求定稿 | 按表建议列 | **P0** |
| OQ-16 | 货币千分位格式（en 逗号 vs tr 句点） | §12.5 | 全站展示 | 界面英文 → ₺4,800（en 格式） | P2 |

## 14. 假设清单

| 编号 | 假设 |
|---|---|
| AS-1 | 单诊所部署，无多分店切换 |
| AS-2 | 界面语言 v1 仅英文；tr 为 P2 |
| AS-3 | 患者年龄 ≥18（未成年接诊待 OQ-15 一并确认） |
| AS-4 | 房间清单固定 7 间（Scan A/B、Room 1–3、Lab 1–2），配置化 P2 |
| AS-5 | 预约类型固定 6 种（§0.2），新增类型走配置 P2 |
| AS-6 | 房间冲突为软警告（医生冲突硬阻断） |
| AS-7 | No Show 可标记时点=超开始 15min |
| AS-8 | 收款成功自动开发票（土耳其电子发票细节需财务确认） |
| AS-9 | 患者反馈渠道=就诊后 2h 短信/邮件链接表单 |
| AS-10 | Journey 模板按 §5.2 硬编码，P1 配置化 |
| AS-11 | 视频问诊无到店 Journey；进入前校验已付款 |
| AS-12 | 远程签署链接有效期 14 天 |
| AS-13 | 邀请 14 天未激活提醒 Admin |
| AS-14 | 允许把预约建在医生可用时间外（警告不阻断，覆盖临时加号场景） |
| AS-15 | 非分配护士可代操作步骤（弹提示），覆盖换班场景 |
| AS-16 | 医生笔记发布后 24h 内可编辑，之后只读（病历完整性） |
| AS-17 | Day Adjustment 仅允许未来 90 天内日期 |
| AS-18 | Required Forms 映射变更不回溯已有预约 |
| AS-19 | Google Reviews 每小时轮询同步 |
| AS-20 | 通知保留 90 天 |
| AS-21 | 登录 5 次锁 15 分钟；验证码 10 分钟有效；会话 8h 闲置过期 |
| AS-22 | Live 数据 30s 轮询（v1 不上 websocket） |
| AS-23 | Walk-in 口径=当日创建且当日开始的预约 |

## 15. 优化建议与分期（资深 PM 视角）

| # | 建议 | 理由 | 优先级 |
|---|---|---|---|
| 1 | **先改状态与术语，再改功能**：把 §0 术语表+§5 状态机落进原型（删 Partial、Waiting→Arrived、Journey 新 6 步、去掉第二 Admin），这是所有后续改动的地基 | 三份材料的冲突 80% 是命名与状态漂移 | P0 |
| 2 | 签到闸门做成**配置驱动**（Required Forms Mapping §6.11 ②），别硬编码表单名 | 新增预约类型/表单不用改代码 | P0 |
| 3 | Approval Center 按 §6.8 的"统一收件箱"骨架实现，即使本期只有 3 类请求 | 补卡、患者访问申请后续零成本挂入 | P1 |
| 4 | Feedback 的 statusHistory 从第一天就记（哪怕 UI 后做） | 历史时间线无法回溯补录 | P1 |
| 5 | 审计日志先行（§12.1 清单），尤其患者记录查看 | KVKK 检查的第一问 | P0 |
| 6 | KPI 先上锁定卡+默认可选卡（每角色 4 张），Customise 弹窗 P1 | 降低首版复杂度 | P1 |
| 7 | 打卡整体 P2，但 Timesheet 现在就把 actual 列改为 "Not tracked"（别再显示假数据） | 假数据会让老板误信已有考勤 | P0 |
| 8 | Demo Role Switcher 与 Site Map 仅保留在 demo 构建，正式构建移除 | 安全 | P0 |
| 9 | 建立 mock 数据单一事实源（患者/员工/预约各一份），消除年龄/金额三处不一致 | 演示可信度 | P1 |
| 10 | Design Spec（玻璃拟态视觉稿）作为独立交付，先做 3 个代表页：Reception Dashboard、Appointment Drawer、Approval Center | 用最高频页面定调 | P1 |

**建议实施顺序（改原型 Sprint 划分）**：
S1 术语/状态机/唯一 Admin/删 Partial → S2 签到闸门+Journey 新模板+Skip → S3 Availability 重命名+Approval Center → S4 Feedback 完整版+Notifications 页 → S5 KPI 体系+Billing 修订 → S6（P2 池）打卡、Secondary Role、患者访问申请、配置化。

---

*本文档为改原型的真相源：任何「**改原型**」标记处与原型行为不一致时，以本文档为准；任何【待确认】处落定后，更新本文档并升版本号。*

