# Phenome Portal 员工端 PRD — 第一步交付

> 版本 v0.1 · 2026-07-07 · 状态：待确认
> 本文档是两步协作的第一步：(a) 产品理解概述 → (b) PRD 整体大纲 → (c) 最关键的待确认问题与三份材料冲突点。你确认/修正后，我按「业务主干优先」顺序展开完整 PRD。

---

## A. 产品理解概述

**Phenome Portal** 是一家位于伊斯坦布尔的高端预防医学/长寿诊所（longevity clinic）的**员工端管理系统**，不含患者端 App。业务特征：身体扫描（Body Scan）、基因/多组学检测（7-Omics Package ₺24,000）、采样、视频与线下问诊；货币 ₺TRY，时区 Europe/Istanbul，语言 English (UK) / Türkçe，前台主要在 **iPad 13" 横屏（1366×1024）** 上操作。

**四个角色**：Admin（管理员）、Reception（前台）、Nurse（护士）、Clinician（医生）。每个角色有独立的侧边栏、Dashboard、Calendar 视图和 Patients 列表变体；Patient Record 按角色显示不同 Tab。

**业务主干**（原型已完整走通）：

```
预约（Booked）→ 患者到店（Arrived）→ 门控校验【付款完成 且 必需表单全部已签】
→ 前台签到（Checked In）→ 就诊中（In Clinic，Journey 步骤推进，护士执行）
→ 签出/完成（Completed）；分支：Cancelled / No Show
```

核心业务对象是 **Journey（患者就诊旅程）**：Consent → Changing Room → Scan → Sample Collection（可跳过）→ Home Kit（可跳过），护士逐步标记「开始/完成」，每步三态（未开始/进行中/已完成），可加 note 和 attachment。（步骤命名与顺序在三份材料中不一致，见问题 Q2。）

**外围模块**：Availability（周模板 + 单日 Override + 请假，带 Admin 审批流）、Staff 管理（单个新增 + 批量导入 + 白名单激活注册）、Billing（单表 + 详情侧栏 + 退款）、Feedback（患者/员工双源，支持匿名）、Timesheet（考勤汇总导出）、Clinic Settings（同意书模板版本管理）、Profile（个人信息/安全/通知偏好）、Notifications、Approval（审批队列）。

**三份材料的可信度分工**（按你的指示）：

| 材料 | 定位 | 评估 |
|---|---|---|
| 老板 xlsx（3 表） | 参考起点，已知不完整 | 页面清单大体准确，但缺 Approval/Notifications 独立页、无 Arrived 状态、Patients 缺 Nurse 变体、Clinic Settings 描述与原型不符、自身也有矛盾（如 Clinician 的 Patient Record 未列 Results，但 KPI 有 Results To Review） |
| 原型代码 | 主要事实来源 | 完成度远超"雏形"：签到门控、Availability 三类请求的审批状态机、白名单注册激活、同意书版本快照等已可直接反推为需求；但考勤打卡完全缺失，Feedback 缺 tab/历史/Google Review，无 skip 步骤功能 |
| 你的 MD 笔记 | 主要事实来源 + 新需求 | 新增考勤打卡；多处比原型走得远（退款阈值、Google Review）；个别条目已过时（如"缺失员工注册流程"——原型其实已实现，见 Q11） |

---

## B. PRD 整体大纲（第二步将按此展开）

按你指定的 16 章结构，展开顺序为业务主干优先：**5→6→7（Calendar+Drawer+签到 → Journey → Patient Record → Billing → 审批流 → 外围页面）→ 8 → 其余**。

1. **文档信息**：版本/修订记录占位；**术语表**（统一 Journey 步骤、预约 7 状态、角色名 Reception vs Receptionist、表单/付款状态等全部命名）
2. **产品概述**：定位、目标用户、核心问题与价值、In/Out of Scope
3. **角色与权限**：四角色职责边界；权限矩阵细化到「页面 × 区块 × 操作」（以原型 Staff Permissions 的 4 组矩阵为基线：Patient Record Access、Clinic Operations、Data & Export、Communication）；唯一 Admin 规则；primary/secondary role；通知可见范围
4. **信息架构与导航**：页面地图（含原型实际路由树）、各角色侧边栏、跳转关系（KPI 卡→列表、行→Patient Record、块→Drawer 等）
5. **核心业务流程（端到端）**：预约→门控→签到→就诊→完成/收费；请假→审批；退款；考勤打卡。每步标角色/页面/校验/分支
6. **状态机**（均用表格：当前状态|事件|守卫条件|目标状态|备注，含非法转换与界面显隐）：
   - 预约：Booked / Arrived / Checked In / In Clinic / Completed / No Show / Cancelled
   - Journey 及步骤（含可跳过步骤的跳过条件与记录）
   - 支付：Unpaid / Partial / Paid / Refund Pending / Refunded（+ 交易状态）
   - 签署表单：Not Sent / Pending Signature / Signed / Expired
   - 可用时间/请假：草稿 → 待审批 → 通过/驳回（+ 撤回；Expanding 直存规则见 Q6）
   - 考勤打卡：未打卡 → 已上班 → 已下班（+ 忘打卡/跨天/补卡）
   - Feedback：New → In Review → Resolved → Archived
7. **页面级需求（主体，每页 × 每角色变体）**：目的/入口出口/区块/字段清单（字段名|类型|必填|校验|默认值|数据来源|可见角色|说明）/交互/页面状态（空/加载/无权限/错误）/边界异常/埋点
8. **考勤打卡模块**：完整新设计（入口、二次验证、与 Timesheet 的数据关系、异常处理）
9. **数据模型**：患者、预约、Journey、签署表单（模板版本 + 签署实例）、支付/账单、员工、可用时间/请假、考勤记录、反馈、通知、审计日志的属性与关系
10. **KPI/指标规格**：逐卡定义指标类型（period/live/hybrid——原型已有此三分法）、时间维度、刷新、环比、下钻路由、锁定规则
11. **通知与消息**：三类事件（Appointment updates / Result updates / Approval requests）× 触发条件 × 接收人规则 × 渠道（System/SMS/Email）
12. **Design System / UX 规范**：玻璃拟态 + premium 设计原则、组件清单（基于原型 shadcn/ui 组件集）、iPad 侧边栏与抽屉优先规范
13. **非功能需求**：审计日志、KVKK/GDPR 合规（同意管理、10 年留存已写入同意书 v3+）、性能、响应式、可访问性、国际化（₺TRY、en-GB/tr、DD/MM/YYYY、Europe/Istanbul）
14. **待确认问题清单**（编号|问题|涉及|影响|推荐方案|P0/P1/P2）
15. **假设清单**
16. **优化建议**（按优先级）

---

## C. 最关键的 12 个待确认问题 / 冲突 / 缺失

> 每条给出三份材料现状、推荐默认方案与理由。你逐条回复"同意/改为…"即可。

| # | 问题 | 三份材料现状 | 影响 | 推荐方案 | 优先级 |
|---|---|---|---|---|---|
| **Q1** | **唯一 Admin 规则与原型直接矛盾** | MD：只允许一个 Admin。原型：staffData 有 **两个 Active Admin**（Ayşe Hançer、Can Demir），且 Add Staff / Import Staff 的角色下拉均含 Admin，可随意新增 | 权限模型的根基；影响 Staff 页、审批流、Admin 交接 | 按 MD 执行唯一 Admin：Add/Import 移除 Admin 选项；新增「Transfer Admin」流程（现 Admin 发起 → 目标员工接受 → 原 Admin 降级为原角色），不设临时代管【待确认：交接细节】 | P0 |
| **Q2** | **Journey 标准步骤：命名、顺序、数量三处不一致，且原型无「跳过」功能** | MD：consent→changing room→scan→sample collection(可跳)→home kit(可跳)→[consultation?]。xlsx（Reception drawer）：…blood collection、other samples 分列，consultation 在 test kit 前，共 7 步。原型内部就有 3 套：Admin 版 5 步含 **Check Out**；Reception 版 6 步 Consultation 在 Test Kit 前；Patient Record 数据 6 步 Consultation 在 Home Test Kit 前。原型 Journey 详情页只有 Mark as Started/Complete，**无 Skip 按钮** | 状态机、护士工作流、所有 Journey 展示组件 | 统一为 6 步：**Consent → Changing Room → Scan → Sample Collection（可跳过）→ Consultation → Home Kit（可跳过）**；血液/其他采样合并为 Sample Collection 的子记录；Check Out 不算 Journey 步骤（归预约状态）；新增 Skip 交互：仅可跳过步骤显示 Skip 按钮，需选跳过原因（枚举+备注），记录操作人/时间，可撤销跳过 | P0 |
| **Q3** | **患者信息范围（隐私/合规）** | 原型注册表单已有基线：Title/姓名/DOB/性别/国籍；手机(+90)/邮箱/紧急联系人/语言；分配医生护士/分组(VIP·Corporate·Insurance·Walk-in)/初始备注。Patient Record 另有过敏警示、诊断、用药、biomarkers | 直接决定 Patients 与 Patient Record 的字段清单（第 7 章主体） | 以原型字段为 v1 基线出字段清单，敏感医疗字段（诊断/用药/biomarkers/过敏）标记「仅 Clinician+Admin 可见」，整体标注【需法务/合规按 KVKK 确认】；国籍与身份证号（同意书签名块含 ID number 开关）单独确认是否采集 | P0 |
| **Q4** | **签到门控细节：Partial 付款放不放行？「必需表单」如何界定？** | 三方一致：付款完成 + 必需表单已签才可 Check In。但原型代码 `payment === "Paid"` 才放行（**Partial 不行**）；门控看的是该预约的 forms 数组全部 Signed，而哪些表单算"必需"未定义；无例外放行（override）机制 | 前台每一次签到 | Partial 不放行（余额必须为 0），与原型一致；「必需表单」= 按预约类型在 Clinic Settings 配置的表单集（如 Scan 需 Scan Safety Checklist）；不提供门控例外放行，特殊情况走 Admin 现场处理【待确认是否需要 Admin override】 | P0 |
| **Q5** | **考勤打卡（Clock in/out）——净新增，全部关键决策待定** | MD 要求设计；原型完全没有；Timesheet 的 actual start/end 目前是假数据、无来源 | 新模块 + Timesheet 数据来源 | 入口：Dashboard 顶部问候区常驻打卡卡片 + 顶栏状态点；无二次验证（登录+2FA 已足够），但**绑定诊所 Wi-Fi/IP 或设备白名单**防远程打卡【待确认】；**Admin 也打卡**（数据完整性，可配置豁免）；打卡记录直接驱动 Timesheet 的 actual 列；忘打卡→次日标异常，员工提交补卡申请→Admin 在 Approval 审批；跨天 23:59 自动切断并标异常 | P0 |
| **Q6** | **员工自助修改 vs 需审批的边界（Save 按钮规则）** | 原型已实现一套明确规则：无改动 Save 置灰；**扩大可用时间或无冲突的缩减 → 直接保存生效；有冲突预约的缩减 → 提交 Admin 审批；请假一律审批**；审批页 Approve 按钮在全部冲突预约逐条 Reschedule/Cancel 前禁用（与你"先取消冲突预约才允许通过"一致，且多了改期选项） | Availability 全模块 + Approval 页 | **将原型规则确认为正式规则**（它已回答了你的 P0 问题）；补充：驳回必填理由（原型已有）、员工可撤回 Pending 请求（原型已有）、同一日期不可重复 Override（原型已有） | P0 |
| **Q7** | **KPI 时间维度：天/月/年 vs 原型 Today/7d/30d** | MD：天/月/年。原型：全局 Today/7d/30d 切换器，锁定卡也跟随切换；live 类卡数值不变仅显示"LIVE"徽标+期间均值（已实现"实时类不挂周期切换"的精神）；另有 hybrid 类（Samples To Collect 今日=待办存量，7d/30d 变为 Samples Collected 期间总量） | Dashboard 全部 KPI 卡 | 采用原型的 **Today / 7d / 30d**（诊所运营看月/年粒度太粗，7d/30d 更贴运营节奏）；保留 period/live/hybrid 三分法与锁定卡跟随切换；跨角色命名统一（xlsx 的 Admin "Checked In Now"(live) vs Reception "Checked In"(period 累计) 是两个不同指标，术语表分别定义 | P1 |
| **Q8** | **Approval 页范围：xlsx 里根本没有这个页面** | 原型：Admin 的 Approval = Availability 审批队列（已实现）；Clinician 也有 Approval 入口 = 「申请访问非分配患者」占位（仅 wireframe 提到，含审批后写审计日志）；MD 只提了 availability 审批 | 信息架构 + Clinician 权限模型 | Approval 本期收敛为：Admin 队列 = Availability 三类请求 + 补卡申请（Q5）；**Clinician 访问非分配患者的申请流列入本期？**【待确认——若做，需定义申请理由、时效、审计记录；若不做，Clinician 侧边栏移除 Approval】 | P0 |
| **Q9** | **退款与支付配置** | MD：默认仅 Admin 可退款，可配置阈值允许 Reception 小额退款（₺500 以下）。原型：Reception 的 Issue Refund 写死禁用（tooltip "Only Admin can issue refunds"），**无阈值配置**；Clinic Settings 里也没有放配置的地方。支付方式原型已有：Card / Online(链接) / Cash / Voucher / 组合 | Billing + Clinic Settings | 按 MD 做可配置阈值：Clinic Settings 新增「Billing 设置」区（退款阈值 ₺、开关"允许 Reception 小额退款"）；退款一律二次确认+理由必填+审计；支付类型确认为原型的 4 种+组合【待确认是否有保险直付】；Billing 状态补 Partial（原型 Billing 页缺，但预约数据有 Partial，自相矛盾） | P0 |
| **Q10** | **Feedback 三个 MD 需求原型全缺** | MD：分 tab、Admin hover 查看操作历史时间线（产生/解决/归档时间）、同步 Google Review、匿名提交。原型：筛选下拉而非 tab；只有 internalNotes 无状态变更时间线；无 Google Review；匿名已实现（真实身份内部保留但任何 Admin 界面不显示——注意这与"姓名置灰"的纯前端做法不同，更安全） | Feedback 页重构 | Tab 按来源分：**All / Patient / Staff / Google Reviews**（状态仍用筛选器）；每条反馈记录 status_history（时间+操作人+动作），卡片 hover 显示时间线 tooltip；Google Review 只读同步（评分/内容/时间，不可改状态，仅可标记已读/回复跳转 Google）【待确认 Google 账号接入方式】；匿名沿用原型机制并在 PRD 明确"匿名=展示层隐藏，非数据层删除" | P1 |
| **Q11** | **员工注册/激活：MD 说缺失，原型其实已实现——请确认以原型为准** | 原型完整链路：Admin 单个新增（两步表单，Clinician 加专科/执照号/默认问诊时长，Nurse 加分配医生）或批量导入（粘贴/CSV，模板 email,role,first_name,last_name，重复/无效行校验）→ 员工状态 Invited → 员工在 /register 输邮箱（**白名单校验**：不在名单报"not authorised"，已激活报"already active"）→ 6 位验证码 → 设密码（8+位/大写/数字/特殊字符四条实时校验）→ 激活；首次登录另有 Enrollment 接受条款页；2FA 强制启用不可关（邮箱验证码渠道） | Authentication 章 | 确认原型流程为正式需求并补充：验证码有效期/重发限频/错误次数锁定文案、邀请过期时长、Admin 重发邀请入口；2FA 是否永远强制【待确认】 | P1 |
| **Q12** | **primary / secondary role 机制原型完全没有** | MD：Profile 支持主/次角色【待确认次角色如何叠加权限】。原型：每员工单一角色，无叠加概念 | 权限矩阵复杂度大增 | 建议**本期不做**双角色，用原型已有的「按人微调权限矩阵」覆盖同类需求（如护士长=Nurse 角色+额外开几个权限位）；若必须做，规则=权限并集，通知按主角色 | P1 |

### 次要不一致（术语表将统一，逐条列出备查）

| 类别 | 现状 → 建议 |
|---|---|
| 角色名 | Reception（登录角色）vs Receptionist（员工档案）→ 界面统一 Receptionist 指人、Reception 指角色/工位，术语表定死 |
| 预约到店状态 | 原型 `Arrived` vs patients 页 `Waiting` → 统一 **Arrived**（xlsx 无此状态，需补入状态机） |
| 采样/居家检测命名 | Sample Collection vs Blood Collection vs blood/other samples；Home Kit vs Test Kit vs Home Test Kit → 统一 **Sample Collection** / **Home Kit**（见 Q2） |
| Clinic Settings 范围 | xlsx 说含 Reports/diagnoses/templates；原型只有 Consent Form Template（版本快照+对比，已很完善），diagnoses 子页已删（数据仅供笔记诊断标签用）→ 本期范围以原型为准 + Q9 的 Billing 设置区【Reports 模板待确认是否本期】 |
| Notifications 独立页 | 原型侧边栏各角色都有 Notifications 页（仅骨架）；xlsx 无此页只有铃铛+Profile 配置 → 保留独立页（筛选/已读未读），第二步给字段 |
| Patients 页角色 | xlsx 只给 Admin/Reception/Clinician；原型+你的整理有完整 Nurse 变体 → 以 4 角色为准 |
| Mock 数据自相矛盾 | 同一患者年龄 34/38/岁数与 DOB 对不上、Body Scan ₺4,800 vs ₺18,000 → 不影响需求，PRD 数据模型将定义唯一事实源，改原型时一并修 |
| Dashboard AI Insight | wireframe 提到 Admin 仪表盘 AI Insight 占位卡，原型与 xlsx 均无 → 默认不做【待确认】 |
| 顶栏搜索 | 原型 placeholder "Search patients, staff..."，未实现 → 建议范围=患者+员工+预约，下拉分组结果，回车进列表页带筛选；权限内可见 |
| No Show 操作权 | 原型仅 Clinician drawer 有 Mark No Show → 建议 Reception/Admin 也可标记【待确认】 |
| Availability slot type | xlsx 有 in person/video/both 槽位类型；原型编辑器无此选择器（Team Availability 只读视图倒是区分了 Clinic/Video）→ 建议编辑器补 slot type |

---

## D. 下一步

请逐条回复 Q1–Q12（"同意推荐方案"或给出修正），以及次要清单中带【待确认】的 4 处。收到确认后我按 **Calendar+Drawer+签到闸门 → Journey → Patient Record → Billing → 审批流 → 考勤打卡 → 外围页面** 的顺序输出完整 PRD 章节。
