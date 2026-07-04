构建 Patients 页面（/patients），Admin、Reception、Clinician、Nurse 四个角色可访问，同一页面根据角色展示不同的工具栏、表格列和操作。iPad 13" 横屏（1366×1024），界面语言英文，保持现有 app shell。

一、页面整体布局（所有角色共享）

上下结构：
- 顶部：页面标题行 + 工具栏（角色自适应）
- 中部：快捷统计卡片行（角色自适应）
- 下部：患者表格（主体，角色自适应列）

页面标题根据角色不同：
- Admin："Patients" + "All clinic patients"
- Reception："Patients" + "Patient check-in and registration"
- Clinician："My Patients" + "Patients assigned to you"
- Nurse："My Patients" + "Patients assigned to you today"

二、工具栏 — Admin

左侧：
- 搜索框（280px）"Search by name, ID, email, or phone..."

筛选器组：
- Status 下拉多选："All" | "Active"（绿色）| "Inactive"（灰色）| "New"（蓝色，注册 < 30 天）| "Pending Onboarding"（橙色，已注册但未完成首诊）
- Assigned Clinician 下拉多选：列出所有 clinician 姓名，可多选，用于按医生查看患者分布
- Assigned Nurse 下拉多选：列出所有 nurse 姓名
- Registration Date 日期范围选择器
- Group / Tag 下拉多选："All" | "VIP" | "Corporate" | "Insurance" | "Walk-in"（患者分组标签）

右侧：
- "Export" 按钮（下拉：Export as Excel / Export as CSV）
- "+ New Patient" 按钮（主要按钮样式）

二、工具栏 — Reception

左侧：
- 搜索框 "Search by name, phone, or appointment..."

筛选器组：
- Today 快捷 Tab 切换："All Patients" | "Today's Appointments"（默认选中，显示今天有预约的患者）| "Awaiting Check-in"
- Consent Status 下拉："All" | "Signed" | "Pending" | "Not Sent"
- Payment Status 下拉："All" | "Paid" | "Partially Paid" | "Unpaid"

右侧：
- "+ Register New Patient" 按钮（主要按钮样式）

二、工具栏 — Clinician

左侧：
- 搜索框 "Search my patients..."

筛选器组：
- Review Status 下拉："All" | "Results Pending Review"（有结果等待审阅）| "Awaiting Sign-off"（等待签字）| "Follow-up Due"（需要安排随访）| "No Action Needed"
- Flag 下拉："All" | "Urgent"（红色旗帜）| "Follow-up"（橙色旗帜）| "Watch"（黄色旗帜）| "No Flag"
- Next Appointment 下拉："All" | "This Week" | "This Month" | "No Upcoming"

右侧：
无按钮（Clinician 不能新建患者）

二、工具栏 — Nurse

左侧：
- 搜索框 "Search my patients..."

筛选器组：
- 快捷 Tab："Today's Patients"（默认）| "All Assigned"
- Journey Status 下拉："All" | "In Progress" | "Awaiting Start" | "Completed Today"

右侧：
无按钮

三、快捷统计卡片行

Admin 看到 4 张卡片：

卡片 1："Total Patients"
- 大数字 "247"
- 副标题 "12 new this month"

卡片 2："Active Patients"
- 大数字 "189"
- 副标题 "76% of total"

卡片 3："Unassigned"
- 大数字 "3"
- 副标题 "no clinician assigned"
- 如果 > 0 显示橙色高亮（需要 Admin 处理）

卡片 4："Pending Onboarding"
- 大数字 "8"
- 副标题 "registered but no first visit"

Reception 看到 3 张卡片：

卡片 1："Today's Appointments"
- 大数字 "14"
- 副标题 "6 checked in · 3 waiting · 5 upcoming"

卡片 2："Awaiting Check-in"
- 大数字 "3"
- 副标题 "consent or payment pending"

卡片 3："New Registrations Today"
- 大数字 "2"
- 副标题 "registered today"

Clinician 看到 3 张卡片：

卡片 1："My Patients"
- 大数字 "24"
- 副标题 "assigned to you"

卡片 2："Results to Review"
- 大数字 "5"
- 副标题 "2 urgent" (红色)

卡片 3："Follow-ups Due"
- 大数字 "3"
- 副标题 "within next 7 days"

Nurse 看到 2 张卡片：

卡片 1："My Patients Today"
- 大数字 "6"
- 副标题 "assigned to you today"

卡片 2："Active Journeys"
- 大数字 "4"
- 副标题 "2 awaiting you"

四、患者表格 — Admin

表格列（从左到右）：

| 列名 | 宽度 | 说明 |
|------|------|------|
| Patient | 180px, 固定 | 头像圆（首字母）+ 姓名（粗体）+ Patient ID 小字灰色（如 "PH-2026-0042"），点击跳转 Patient Record |
| Contact | 140px | 手机号 + 邮箱（两行，邮箱灰色小字）|
| Age / Sex | 70px | "34 · M" 或 "28 · F" |
| Group | 80px | 分组标签 pill："VIP"（金色）/ "Corporate"（蓝色）/ "Insurance"（绿色）/ "Walk-in"（灰色）/ 无标签显示 "—" |
| Assigned Clinician | 120px | 医生名，如 "Dr. Claudia"。未分配显示 "Unassigned"（橙色文字）|
| Assigned Nurse | 110px | 护士名。未分配显示 "—" |
| Status | 90px | 状态 pill：Active（绿色）/ Inactive（灰色）/ New（蓝色）/ Pending Onboarding（橙色）|
| Last Visit | 90px | 日期 "1 Jul 2026" 或 "Never"（灰色斜体）|
| Next Appt | 90px | 日期 + 类型，如 "3 Jul · Scan" 或 "—" |
| Registered | 90px | 注册日期 "15 Mar 2026" |
| Actions | 60px | ⋯ 三点菜单 → View Record / Edit Details / Assign Clinician / Assign Nurse / Change Status / Delete |

表格交互：
- 表头可排序（默认按姓名 A–Z）
- 行 hover 高亮
- 点击行任意位置跳转 Patient Record（除了 Actions 菜单和联系信息可复制）
- Unassigned 的行左边缘有 3px 橙色竖条作为视觉提醒
- 表格底部固定："Showing 1–25 of 247 patients" + 分页控件
- 表头和 Patient 列固定 sticky

批量操作：
- 每行左侧有勾选框，勾选后顶部出现批量操作栏："X selected" + "Assign Clinician" + "Assign Nurse" + "Change Group" + "Export Selected" + "Deselect All"

五、患者表格 — Reception

| 列名 | 宽度 | 说明 |
|------|------|------|
| Patient | 180px, 固定 | 头像 + 姓名 + Patient ID 小字 |
| Phone | 110px | 手机号（点击可拨打图标）|
| Today's Appt | 130px | 预约时间 + 类型，如 "10:00 · Body Scan"。无今日预约显示 "—" |
| Clinician | 100px | 分配的医生名 |
| Consent | 90px | 状态 pill：✅ Signed（绿色）/ ⏳ Pending（橙色）/ ❌ Not Sent（红色）。如果今天的预约不需要新 consent 显示 "N/A"（灰色）|
| Payment | 90px | 状态 pill：✅ Paid（绿色）/ 🔶 Partial（橙色）/ ❌ Unpaid（红色）/ "N/A" |
| Check-in | 100px | 状态 pill：✅ Checked In（绿色）/ ⏳ Waiting（橙色）/ — Not Arrived（灰色）/ ✅ Completed（蓝色）|
| Journey | 120px | 当前旅程步骤，如 "Consent → Changing Room"（当前步骤加粗）。无旅程显示 "—" |
| Actions | 80px | 根据状态显示不同的主要操作按钮（不是三点菜单，是直接的按钮）：未到达 → "—" / Waiting + consent & payment done → "Check In"（绿色按钮）/ Waiting + consent 或 payment 未完成 → "Check In"（灰色禁用）+ hover tooltip "Complete consent and payment first" / Checked In → "Check Out"（蓝色按钮）|

特殊行为：
- "Today's Appointments" 快捷 Tab 默认选中时，表格自动按预约时间排序
- Consent 或 Payment 为红色状态的行背景微加浅红提醒
- 表格右上角小字显示今日概况："14 appointments · 6 checked in · 3 awaiting check-in"

六、患者表格 — Clinician

| 列名 | 宽度 | 说明 |
|------|------|------|
| Patient | 180px, 固定 | 头像 + 姓名 + Patient ID |
| Age / Sex | 70px | "34 · M" |
| Flag | 60px | 旗帜图标：🔴 Urgent / 🟠 Follow-up / 🟡 Watch / 无旗帜。点击可快速切换旗帜 |
| Review Status | 120px | 状态 pill：🔬 Results Pending（蓝色）/ ✍️ Awaiting Sign-off（橙色）/ 📋 Follow-up Due（紫色）/ ✅ Up to Date（绿色）|
| Last Visit | 90px | 日期 |
| Next Appt | 110px | 日期 + 类型 + 倒计时，如 "3 Jul · Consult · in 2 days" |
| Last Result | 100px | 最近一次结果类型 + 日期，如 "Blood Panel · 28 Jun" |
| Active Journey | 110px | 当前进行中的旅程名称 + 进度条（如 "7-Omics Premium" + 60% 进度条）|
| Notes Count | 70px | 临床笔记数量图标 "📝 12" |
| Actions | 60px | ⋯ → View Record / Start Consultation / Add Flag / Schedule Follow-up |

特殊行为：
- Results Pending 和 Awaiting Sign-off 的行左边缘有蓝色/橙色竖条
- Flag 列的旗帜图标可以直接点击在行内切换（弹出小选择器：Urgent / Follow-up / Watch / Remove Flag），不需要进入详情页
- 默认排序：有 Flag 的排最前（Urgent > Follow-up > Watch），然后按 Review Status 排（Results Pending > Awaiting Sign-off > Follow-up Due > Up to Date）

七、患者表格 — Nurse

| 列名 | 宽度 | 说明 |
|------|------|------|
| Patient | 180px | 头像 + 姓名 |
| Today's Appt | 120px | 时间 + 类型 |
| Clinician | 100px | 分配的医生 |
| Journey Status | 130px | 当前旅程步骤进度条：5 个步骤的小圆点（Consent · Changing · Scan · Sample · Check Out），已完成绿色、当前步骤蓝色脉动、未完成灰色 |
| Current Step | 110px | 当前步骤名称加粗，如 "Sample Collection" |
| Waiting Since | 80px | 等候时长 "12 min" 或 "—" |
| Room | 70px | 当前诊室 "Room 3" 或 "—" |
| Actions | 80px | 主要操作按钮："Start" / "Continue" / "Complete"（根据旅程状态）|

特殊行为：
- 默认按等候时长倒序（等最久的在最前，帮 Nurse 优先处理）
- Waiting Since 超过 15 分钟的行显示橙色背景提醒
- Waiting Since 超过 30 分钟的行显示红色背景提醒

八、"+ New Patient" / "+ Register New Patient" 弹窗（Admin 和 Reception 共用）

点击按钮弹出模态弹窗，标题 "Register New Patient"。

表单分为三个步骤（步骤条显示在弹窗顶部）：

Step 1 — Personal Information：
- Title 下拉（Mr / Mrs / Ms / Dr / 空）
- First Name（必填）
- Last Name（必填）
- Date of Birth 日期选择器（必填）
- Sex 下拉 "Male" / "Female" / "Other"（必填）
- Nationality 下拉
- "Next" 按钮

Step 2 — Contact Details：
- Mobile Phone（必填，带国际区号选择，默认 +90 Turkey）
- Email（必填）
- Emergency Contact Name（选填）
- Emergency Contact Phone（选填）
- Preferred Language 下拉 "English" / "Türkçe"
- "Back" + "Next" 按钮

Step 3 — Clinic Assignment：
- Assign Clinician 下拉（选填，可稍后在 Admin 的 Staff Management 里分配）
- Assign Nurse 下拉（选填）
- Patient Group 下拉 "VIP" / "Corporate" / "Insurance" / "Walk-in" / "None"（选填）
- Initial Notes 多行文本框（选填，如 "Referred by Dr. Smith" 或 "Corporate wellness program"）
- "Back" + "Register Patient"（主要按钮）

注册成功后：
- Toast 提示 "Patient registered successfully"
- 弹窗关闭
- 新患者出现在表格顶部并短暂高亮
- 可选：弹出后续动作提示 "Would you like to book an appointment for this patient?"（"Book Now" 跳转日历 + "Later" 关闭）

九、空状态

Clinician 无分配患者时：
- 表格居中显示："No patients assigned to you yet"
- 副标题 "Your clinic administrator will assign patients to you"

Nurse 今日无患者时：
- "No patients assigned to you today"
- 副标题 "Check back when today's appointments begin"

搜索/筛选无结果时：
- "No patients match your search"
- "Try adjusting your filters or search terms" + "Clear Filters" 按钮

十、Mock 数据（12 个患者，覆盖各种状态）

1. Mackenzie Messineo · PH-2026-0042 · 34 · F · VIP · Dr. Claudia · Berna Koç · Active · Last: 1 Jul · Next: 3 Jul Scan · ✅ Consent ✅ Paid ✅ Checked In · Journey: Scan step · 🟡 Watch
2. Penny Pelargonium · PH-2026-0038 · 28 · F · Corporate · Dr. Higgs · Aylin Demir · Active · Last: 28 Jun · Next: 3 Jul Consult · ✅ Consent ❌ Unpaid · ⏳ Waiting · 🔴 Urgent
3. Riley Guarana · PH-2026-0051 · 42 · M · Walk-in · Dr. Claudia · Berna Koç · Active · Last: 30 Jun · Next: 3 Jul Scan · ⏳ Consent Pending · ❌ Unpaid · — Not Arrived · No flag
4. Arysse Arcerola · PH-2026-0015 · 55 · F · VIP · Dr. Chad · Berna Koç · Active · Last: 2 Jul · Next: 10 Jul Consult · Results Pending · 🟠 Follow-up
5. Gustavo Propolis · PH-2026-0063 · 61 · M · Insurance · Dr. Felix · Aylin Demir · Active · Last: 2 Jul · Next: — · Awaiting Sign-off · No flag
6. Bob Bromelain · PH-2026-0029 · 38 · M · Corporate · Dr. Adobe · — (unassigned nurse) · Active · Last: 1 Jul · Next: 8 Jul Scan · Up to Date · No flag
7. Dylan Daniel · PH-2026-0071 · 45 · M · Walk-in · Dr. Adobe · Aylin Demir · Active · Last: 1 Jul · Next: — · Follow-up Due · 🟠 Follow-up
8. Sophia Ascorbic · PH-2026-0044 · 31 · F · VIP · Dr. Chad · Berna Koç · Active · Last: 30 Jun · Next: 5 Jul Consult · Up to Date · No flag
9. Oliver Folate · PH-2026-0088 · 50 · M · Insurance · Dr. Felix · — · Active · Last: 30 Jun · Next: — · Results Pending · 🔴 Urgent
10. Cynthia Cromium · PH-2026-0092 · 29 · F · — · — (unassigned clinician) · — · Pending Onboarding · Last: Never · Next: — · No data
11. Noah Nac · PH-2026-0055 · 36 · M · Corporate · Dr. Chad · Aylin Demir · New · Last: Never · Next: 7 Jul Scan · No data
12. Benny Betaine · PH-2026-0033 · 47 · M · Walk-in · Dr. Higgs · — · Inactive · Last: 20 May · Next: — · No data

十一、权限汇总
- Admin：全部患者可见，可新建、可编辑、可分配、可导出、可删除
- Reception：全部患者可见，可新建，不可编辑基本信息（由 Admin 管理），不可删除、不可导出
- Clinician：仅分配给自己的患者可见，不可新建、不可编辑，可添加 Flag
- Nurse：仅今天分配给自己的患者可见，不可新建、不可编辑
- 其他角色无法访问 /patients