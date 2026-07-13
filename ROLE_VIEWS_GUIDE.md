# Phenome Portal 角色视图说明文档

> 本文档基于当前原型的实际代码逻辑整理，讲解 4 个角色（Admin / Reception / Clinician / Nurse）
> 在系统中分别"看到什么、能做什么"。适合新人快速了解产品，或作为设计/开发对齐的参考。
>
> 切换角色的方式：顶部导航栏右侧的 **DEMO ROLE** 下拉框，选择后整个界面（导航菜单、
> Dashboard、日历视角等）都会跟着切换 —— 这是原型演示专用的机制，不代表真实登录系统。

---

## 一、一句话总览

同一套数据（预约、患者、日程），**四个角色看到的是完全不同的界面**，各自只保留自己
工作时真正需要的信息和操作，而不是一个大而全的后台。

| 角色 | 一句话定位 | 核心问题 |
|---|---|---|
| **Admin** 管理员 | 掌控全局，看经营数据、协调资源 | "诊所今天整体运转得怎么样？" |
| **Reception** 前台 | 高频循环：来了→收钱→签字→进诊 | "谁到了、谁能进、谁没付钱？" |
| **Clinician** 医生 | 看诊 + 审结果 | "现在看谁、下一个是谁、还有多少报告要签？" |
| **Nurse** 护士 | 带患者走完院内流程 | "我现在该带这个患者做什么？" |

---

## 二、导航菜单对比

| 菜单项 | Admin | Reception | Clinician | Nurse |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Calendar › Schedule | ✓ | ✓ | ✓ | ✓ |
| Calendar › My Availability | — | — | ✓ | ✓ |
| Calendar › Team Availability | ✓ | ✓ | ✓ | ✓ |
| Patients | ✓ | ✓ | ✓ | ✓ |
| Staff | ✓ | — | — | — |
| Clinic Settings | ✓ | — | — | — |
| Billing | ✓ | ✓ | — | — |
| Feedback | ✓ | — | — | — |
| Timesheet | ✓ | — | — | — |
| Approval | ✓ | — | ✓ | — |
| Notifications / Profile | ✓ | ✓ | ✓ | ✓ |

几个关键差异点：
- **Staff / Clinic Settings / Feedback / Timesheet** 只有 Admin 能看到 —— 这些是"管理诊所"
  而不是"服务患者"的功能。
- **My Availability**（个人排班自助编辑）只有 Clinician 和 Nurse 有，因为只有他们的排班
  会影响能不能约到诊。Admin 用的是 **Team Availability**（看全员，不是编辑自己）。
- **Approval**（审批队列）目前只有 Admin 和 Clinician 能看到（Clinician 侧的排班变更/请假
  也会走审批，因此需要能看审批状态）。

---

## 三、Admin（诊所管理员）

### Dashboard 首页
- 顶部是可自定义的 **KPI 卡片**（今日预约数、待审结果、当前在诊人数、利用率等），
  点击卡片右上角的 "Customise KPIs" 可以换成自己关心的指标。
- 中间是 **Today's Schedule** —— 一张"以房间为视角"的日历（Scan A/B、Room 1/2/3、
  Lab 1/2 共 7 个房间），每个预约块显示"患者姓名 · 项目 · 负责医生"，每个患者占用
  房间 1–2 小时（贴近真实业务：房间是按时段整段预留的，不是按检查项目精确到分钟）。
- 下方左右两栏：**Results Queue**（按超期天数排序，越久没处理的越靠前）、
  **Waiting Room**（按等待时长排序，实时显示患者正走到护士流程的哪一站）。
- 最底部是**折叠起来的 Recent Activity**（诊所内今天发生的事：签到、收款、改约……），
  默认不占地方，需要时点开看。

**为什么是"房间视角"而不是"医生视角"**：Admin 关心的是"这个房间现在有没有空、
下一个几点能用"，而不是某个医生个人的日程安排（那是 Clinician 自己 Dashboard 该管的事）。

### Approval 审批队列
Admin 是审批人，队列里只会出现两类请求：
1. **排班变更**（Clinician/Nurse 调整每周固定工时，且与已有预约冲突）；
2. **请假**（半天/全天/多天）。

每条请求都是"改前 vs 改后"对照展示，如果有预约冲突，Admin 可以逐条标记
"已改约"或"已取消"来解除冲突，冲突全部解除后 Approve 按钮才会点亮。

---

## 四、Reception（前台接待）

### Dashboard 首页
这是本次改动最大的一个角色页面。核心理念：**同一个患者今天只出现一行，
一行只给一个"下一步该做什么"的按钮**，前台不需要在好几张卡片之间来回对照。

- 顶部 4 个 **Live Counter**（本身不是 KPI，是可点击的筛选器）：
  - `Awaiting Action`（到了但没满足签到条件，红点提示）
  - `Ready to Check In`（到了且条件都满足，可以签到了）
  - `In Clinic`（已经在诊内，前台暂时不用管）
  - `Unpaid Today`（今天有欠费的，附带欠费总额）
  点一下某个数字，下方队列会自动只显示对应的那批人，再点一次取消筛选。

- 中间是唯一的一张 **Front Desk Queue**（前台队列），按"需要前台动手的程度"从上到下排：
  1. 到了但卡在某个条件上的（黄色，最靠前）
  2. 到了且条件都满足、可以签到的（绿色）
  3. 还没到店的预约（按时间排列，安静地待着）
  4. 已经在诊内的（只读，显示护士流程走到第几步了）
  5. 已经看完/已结束的（置底、划线变灰）

  每一行右侧的按钮会**自动切换**：欠费 → "Take Payment"；表格没签 → "Send Form"；
  两个条件都满足 → "Check In"；还没到店 → "Mark Arrived"；视频问诊的"未到店"则
  没有按钮（线上问诊本来就不存在"到店"这个动作）。
  行内还有 Consent/Payment 两个小标签，红色的可以直接点击去解决（点付款标签会弹出
  "Start Transaction / Send Payment Link" 的小面板）。

- **Check Out 不是前台的动作了**：患者的出诊/离店由护士那边完成，前台这里看到的是
  "In Clinic · Awaiting nurse checkout" 这样的只读提示，不会再有前台手动点的
  "Check Out" 按钮。

- 底部同样是折叠的 Recent Activity。

---

## 五、Clinician（医生）

### Dashboard 首页
核心理念同样是"去重复"：原来分散的 My Patients / Review Queue / Today's
Consultations 三张卡片信息有重叠，现在合并重构为：

- 顶部 3 个纯数字计数（不是 KPI 卡，没有趋势线）：
  - `Results to Review`（待审结果数）
  - `Awaiting Sign-off`（待签字报告数）
  - `Today's Patients · next HH:MM`（今日患者数 + 下一位几点）

- 一张 **Now / Up Next 卡**（全页唯一的"大行动卡"）：
  - 如果现在正在看诊：显示 "NOW"，患者姓名 + 过敏等关键提示 + "Open Record" /
    "Complete Consultation" 两个按钮。
  - 如果当前没有正在看的患者：显示 "UP NEXT"，用一个进度条展示下一位患者
    的院内流程走到哪一步（Consent → Changing Room → Scan → … → Consultation），
    "Start Consultation"（面诊）按钮只有当患者真的走到"问诊"这一站时才会点亮，
    否则显示"Patient currently in Scan"这样的原因说明。
  - **同一时刻只允许一个视频通话可以加入**：只要还有一个患者在看（无论线下线上），
    其余所有视频问诊行都会显示"Queued · starts after current session"且按钮禁用。

- 下方是**行式的 Today's Schedule**（不再是色块日历），一行一个患者，中间有一条
  红色"现在"分割线，一眼看出上午/下午分界。

- 右侧是 **Work Queue**，一张卡片里用分段控件切换 `Review` / `Sign-off` 两个队列，
  不再是两张分开的卡片。

---

## 六、Nurse（护士）

护士的 Dashboard 是**完全独立的单患者视图**，跟其他三个角色的多卡片布局不一样 ——
护士同一时刻只服务一位患者，界面就应该只强调"这一位现在走到哪了、下一步按什么"。

- 左侧主区是 **Patient Journey 卡**：当前患者的完整流程条
  （Consent & Payment → Picked up from waiting area → Scan 1 → Scan 2 →
  Machine 1 → Machine 2 → Sample Collection 1/2 → Consultation → Check Out），
  每一步都要护士手动确认"开始/完成"才会往下走，不存在自动跳过。
  完成当前站点后，大按钮变成"Complete — 站点名"。

- 右侧栏从上到下：
  - **My Patients Today**：今天负责几位、进行中几位、已完成几位。
  - **Today's Schedule**：今天的患者列表（时间 + 姓名 + 项目）。
  - **Up Next**：排在后面等待的患者队列，"Start" 按钮只有在当前患者流程走完后
    才会解锁；下方是可折叠的"Completed today"列表。

- 页面右上角有一个 **Demo Moment** 切换器（Day Start / Mid-Shift / Day Wrap），
  纯粹是演示用的，用来快速看到"一天开始时空空如也 / 中途忙碌 / 收尾时大部分
  已完成"这三种典型状态，不影响真实业务逻辑。

---

## 七、四个角色共用的页面

以下页面所有角色都能进，但里面的筛选项/操作权限会按角色收窄（不是四份不同的页面，
是同一份代码根据角色显示不同内容）：

- **Patients**：筛选条件不同——Admin 看 Status/负责医生/客户分组；Reception 看
  Consent/Payment；Clinician 看审结果状态/标记/下次预约；Nurse 看院内流程状态。
- **Calendar › Schedule**：同一张日历，Admin/Reception 看全诊所房间视角，
  Clinician/Nurse 默认看自己相关的预约。
- **Profile**：本次刚重做过，改成"Hero 卡（头像+姓名+角色）+ 只读信息展示"的模式，
  只有点 Edit 才会出现可编辑的输入框；不同角色能编辑的字段不同（例如非 Admin
  的姓名/电话是只读的，联系管理员改）。
- **Notifications / Feedback / Billing / Approval** 等按上面导航表的勾选情况开放。

---

## 八、快速自测

如果想验证自己是否理解了这套角色划分逻辑，可以问自己：

> "如果我是前台，我需要在 Dashboard 上看到医生的审批队列吗？"

答案是不需要 —— 这正是本次重构反复强调的原则：**每个角色的界面只保留他/她
真正要做决策、要采取行动所需要的信息**，其余的一律不出现，哪怕数据本身是共享的。
