构建 Feedback 页面（/feedback），仅 Admin 可见和访问。iPad 13" 横屏（1366×1024），界面语言英文，保持现有 app shell。这个页面是反馈的管理中枢——所有来源的反馈汇集于此，Admin 查看、分类、标记处理状态。

一、页面整体布局

上下结构：
- 顶部：页面标题 + 工具栏
- 中部：汇总统计卡片行
- 下部：左侧反馈列表（约 55%）+ 右侧详情面板（约 45%，选中某条后展开）

二、页面标题行

左侧：
- 标题 "Feedback"
- 副标题 "Patient and staff feedback records"

右侧：
- "Export" 按钮（导出当前筛选的反馈记录为 Excel）
- "Settings" 齿轮图标按钮（点击弹出设置 popover：管理反馈分类标签、设置自动提醒规则——留占位即可）

三、工具栏（标题下方，水平排列）

筛选器 1 — 来源（Source）下拉多选：
"All Sources" 默认 | "Patient (App)" | "Clinician" | "Nurse" | "Receptionist"

筛选器 2 — 类型（Type）下拉多选：
"All Types" 默认 | "Visit Feedback"（患者就诊评价）| "Complaint"（投诉）| "Suggestion"（建议）| "System Issue"（系统问题）| "Incident Report"（事件上报）| "Compliment"（表扬）

筛选器 3 — 状态（Status）下拉多选：
"All" 默认 | "New"（未读）| "In Review"（处理中）| "Resolved"（已解决）| "Archived"（已归档）

筛选器 4 — 日期范围选择器：
与 Timesheet 相同的日期范围选择组件，默认 "This Month"

筛选器 5 — 搜索框：
"Search by patient name, staff name, or keyword..."

筛选器 6 — 评分筛选（仅对有评分的反馈生效）：
星级选择器：显示 1-5 星，可点击选择 "3 stars & below" 快速找差评

四、汇总统计卡片行（4 张卡片）

卡片 1："Total Feedback"
- 大数字 "47"
- 副标题 "this month"
- 对比 "↑ 12 vs last month"

卡片 2："Avg. Rating"
- 大数字 "4.3" + 星星图标
- 副标题 "from 38 patient reviews"
- 对比 "↑ 0.2 vs last month"（绿色）或 "↓ 0.3"（红色）

卡片 3："Open Issues"
- 大数字 "5"
- 副标题 "3 new · 2 in review"
- 如果有超过 48h 未处理的，显示红色警告 "1 overdue"

卡片 4："Staff Feedback"
- 大数字 "9"
- 副标题 "this month"
- 分类小字 "4 suggestions · 3 system issues · 2 incidents"

五、反馈列表（左侧，页面主体）

列表每条反馈为一张横向卡片，纵向排列可滚动。默认按时间倒序（最新在上）。

每张卡片包含：
- 左边缘 4px 色条表示来源：患者 = 蓝色 / Clinician = 紫色 / Nurse = 绿色 / Receptionist = 橙色
- 第一行：来源标签 pill（"Patient" 蓝色 / "Dr. Claudia Reis" 紫色 等）+ 类型 pill（"Visit Feedback" / "Complaint" 红色 / "Suggestion" 蓝色 / "System Issue" 橙色 / "Incident Report" 红色 / "Compliment" 绿色）+ 时间 "2 hours ago"
- 第二行：反馈标题或摘要（一行截断，如 "Excellent care during my body scan appointment" 或 "Reception check-in process too slow"）
- 第三行：如果是患者就诊评价，显示星级评分 ★★★★☆（4/5）；如果是其他类型无评分则不显示
- 第四行：关联信息小字——如果是患者反馈显示 "Patient: Mackenzie Messineo · Visit: 1 Jul 2026 · Clinician: Dr. Claudia"；如果是员工反馈显示 "Submitted by: Berna Koç · Nurse"
- 右上角：状态 pill — "New"（蓝色实心）/ "In Review"（橙色）/ "Resolved"（绿色）/ "Archived"（灰色）

未读的 "New" 状态卡片左侧有一个蓝色小圆点标记（类似未读消息）。

列表底部：显示 "Showing 1–20 of 47" + 加载更多按钮或分页控件。

六、详情面板（右侧，点击列表中某条后展开）

未选中任何反馈时，右侧面板显示空状态：
- 灰色消息图标
- "Select a feedback to view details"

选中后，面板展示完整反馈详情：

顶部区域：
- 来源标签 + 类型标签 + 状态下拉（Admin 可在此处修改状态：New → In Review → Resolved → Archived）
- 提交时间 "1 Jul 2026, 14:30"

反馈者信息卡片（灰底圆角卡片）：
- 如果是患者反馈：
  · 患者头像 + 姓名 "Mackenzie Messineo"
  · 关联就诊信息："Visit: 1 Jul 2026 · Body Scan + Consultation"
  · 负责医生："Clinician: Dr. Claudia Reis"
  · 负责护士："Nurse: Berna Koç"
  · "View Patient Record" 链接（点击跳转患者档案）
- 如果是员工反馈：
  · 员工头像 + 姓名 + 角色 pill
  · "View Staff Profile" 链接

评分区域（仅患者就诊评价有）：
- 总评星级 ★★★★☆ 4/5
- 分项评分（如果有）：
  · "Overall Experience" ★★★★☆
  · "Staff Friendliness" ★★★★★
  · "Wait Time" ★★★☆☆
  · "Facility Cleanliness" ★★★★☆

反馈正文：
- 完整的文字内容，自然换行展示
- 如果有附件（图片等），在正文下方显示缩略图，可点击放大

Admin 操作区域（底部固定）：
- "Internal Note" 区块：一个文本输入框，Admin 可以添加内部备注（如处理记录、跟进说明），不对反馈提交者可见。已有的备注按时间倒序显示在输入框上方，每条备注显示：Admin 姓名 + 时间 + 内容。
- 操作按钮行：
  · "Mark as Resolved" 绿色按钮（如果当前状态是 New 或 In Review）
  · "Archive" 灰色按钮
  · "Flag for Follow-up" 橙色按钮（标记后在列表中显示一个 🚩 标记，提醒需要跟进）

七、员工提交反馈的入口（非 Feedback 页面本身，但需要补建）

在所有角色的 sidebar 底部的 "Help" 旁边，或 Top Bar 的帮助图标下拉菜单里，增加一个 "Submit Feedback" 入口。点击后弹出一个模态弹窗：

弹窗标题："Submit Feedback"
弹窗内容：
- Type 下拉单选："Suggestion" | "System Issue" | "Incident Report" | "Compliment" | "Other"
- Subject 单行文本输入："Brief summary..."
- Description 多行文本输入："Describe in detail..."
- Urgency 单选："Low" | "Medium" | "High"（默认 Low）
- "Submit" 按钮 + "Cancel" 按钮

提交后显示 toast "Feedback submitted. Your clinic administrator will review it."
这条反馈立即出现在 Admin 的 Feedback 列表中，状态为 "New"。

八、Mock 数据（10 条，覆盖各种类型和来源）

1. Patient · Visit Feedback · ★★★★★ · "Excellent care during my body scan" · Mackenzie Messineo · Dr. Claudia · 2h ago · New
2. Patient · Complaint · ★★☆☆☆ · "Waited over 40 minutes past appointment time" · Penny Pelargonium · Dr. Higgs · 5h ago · New · 🚩
3. Patient · Visit Feedback · ★★★★☆ · "Very thorough consultation, minor wait" · Riley Guarana · Dr. Claudia · 1 day ago · In Review
4. Nurse · Suggestion · "iPad freezes when updating journey checklist" · Berna Koç · 1 day ago · In Review · 内部备注："Engineering team notified, ticket #2847"
5. Patient · Compliment · ★★★★★ · "Berna was incredibly attentive throughout" · Arysse Arcerola · Berna Koç · 2 days ago · Resolved
6. Receptionist · System Issue · "Payment terminal disconnects intermittently" · Elif Yıldız · 3 days ago · In Review
7. Clinician · Incident Report · "Patient reported dizziness after blood draw" · Dr. Chad · 3 days ago · Resolved · 内部备注："Followed up with patient, no further issues"
8. Patient · Visit Feedback · ★★★☆☆ · "Good results explanation but facility felt rushed" · Bob Bromelain · Dr. Adobe · 4 days ago · Archived
9. Nurse · Suggestion · "Need a way to message clinician when patient is ready" · Aylin Demir · 5 days ago · New
10. Patient · Visit Feedback · ★★★★★ · "Life-changing health insights" · Dylan Daniel · Dr. Felix · 6 days ago · Resolved

九、权限
- 仅 Admin 可访问 /feedback 页面
- 员工通过 "Submit Feedback" 弹窗提交，不进入 Feedback 管理页面
- 患者反馈从 App 侧提交，Portal 只做展示和管理