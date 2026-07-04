构建 Billing 页面（/billing），Reception 和 Admin 两个角色可访问，使用同一个页面结构但按角色展示不同的功能权限。iPad 13" 横屏（1366×1024），界面语言英文，保持现有 app shell。这是一个单表格页面，不拆分成 invoice / payment / transaction 等子页面。

一、页面整体布局
上下结构：
- 顶部：标题行 + 工具栏
- 中部：汇总统计卡片行（Admin 可见全部 4 张，Reception 可见 2 张）
- 下部：Billing 表格（主体）+ 右侧操作面板（点击某行后展开）

二、标题行
左侧：
- 标题 "Billing"
- 副标题：
  · Admin 看到 "Payment oversight and reconciliation"
  · Reception 看到 "Patient payments and transactions"

右侧（仅 Admin 可见）：
- "Export" 按钮（下拉：Export as Excel / Export as CSV）— 导出当前筛选的账单记录
- "Daily Summary" 按钮 — 点击弹出今日日结摘要弹窗（见第八节）

三、工具栏（标题下方，水平排列）
搜索框（左侧，约 280px）：
"Search patient, appointment, or transaction ID..."
筛选器组（水平排列）：
筛选器 1 — Payment Status 下拉多选：
"All" 默认 | "Unpaid"（红色点）| "Paid"（绿色点）| "Refunded"（紫色点）

筛选器 2 — Payment Method 下拉多选：
"All" | "Card  | "Online Payment" | "Voucher" 

筛选器 3 — Date Range 日期选择器：
复用 Timesheet 的日期范围选择器组件（双月日历 + 快捷预设今天本周、本月、近三月）

筛选器 4 — 快捷 Tab 切换（水平 pill 按钮）：
"All" | "Today" | "This Week" 
Admin 、Reception 默认激活 "Today"

四、汇总统计卡片行
Reception 看到 2 张卡片：
卡片 1："Today's Collections"
- 大数字 "₺12,400"
- 副标题 "8 payments received"

卡片 2："Awaiting Payment"
- 大数字 "3"
- 副标题 "₺4,200 outstanding"
- 如果有今日预约未付款，红色小字 "2 due before check-in"

Admin 看到 4 张卡片（包含 Reception 的 2 张 + 额外 2 张）：
卡片 3："Monthly Revenue"
- 大数字 "₺186,500"
- 副标题 "Jul 2026"
- 对比 "↑ 8% vs Jun"

卡片 4："Outstanding Balance"
- 大数字 "₺24,800"
- 副标题 "across 14 patients"
- 红色小字 "3 overdue > 30 days"

五、Billing 表格
表格列定义（从左到右）：
| 列名 | 宽度 | 说明 |
| Patient | 160px, 固定 | 头像圆 + 姓名，点击跳转患者档案 |
| Appointment | 140px | 预约类型 + 日期，如 "Body Scan · 3 Jul"。
| Clinician | 100px | 分配的医生名（Admin 用于按医生筛查收入）|
| Amount | 90px | 总金额 "₺2,400"，右对齐 |
| Paid | 90px | 已付金额 "₺1,200"，右对齐，绿色 |
| Voucher | 80px | 如有 voucher 显示 "V-2026-041" 蓝色链接，hover 显示 voucher 详情 tooltip（面值、剩余额度、有效期）
| Payment Status | 110px | 状态 pill：Unpaid（红色）/  Paid（绿色）/ Refunded（紫色）
| Method | 90px | 图标 + 文字：💳 Card / 🔗 Online  / 🎫 Voucher 
| Transaction | 100px | 交易状态 pill：Pending / Processing / Completed / Failed / Refund Pending |
| Invoice | 70px | 发票状态图标：✅ Issued / ⏳ Pending / — Not required |
| Date | 90px | 创建日期 "1 Jul 2026" |
| Actions | 60px | "⋯" 三点菜单（详见下方）|

表格交互：
- 表头可点击排序（默认按日期倒序）
- 行 hover 高亮
- Unpaid 行左边缘有 3px 红色/橙色竖条作为视觉提醒
- 今日预约关联的行背景微加深（Reception 需要快速识别今天要处理的收款）
- 表格底部固定合计行：Total Amount / Total Paid / Total Balance 的列合计

表格分页：
- 底部显示 "Showing 1–25 of 89 records" + 分页控件
- 表头和 Patient 列固定（sticky），横向如果放不下可水平滚动

六、行操作（⋯ 三点菜单）
Reception 能看到的操作：
- "View Payment History" — 查看该笔账单的所有交易记录（在右侧面板展示）

Admin 额外能看到的操作（在 Reception 基础上增加）：
- "Issue Refund" — 发起退款（弹出：选择退款金额（全额/部分）、退款原因下拉、确认。退款后 Payment Status 变为 Refunded）
- "Generate Invoice" — 生成发票（弹出：确认开票信息，发票号自动生成）

七、右侧详情面板（点击表格某行后展开，约 380px 宽）
未选中时显示空状态："Select a billing record to view details"
选中后展示：
顶部 — 患者与预约信息：
- 患者头像 + 姓名 + "View Patient Record" 链接
- 预约信息："Body Scan · 3 Jul 2026 · Dr. Claudia Reis"
- 预约状态 pill（Booked / Checked In / Completed）

中部 — 收费明细（Line Items）：
以表格形式展示该笔账单的构成：
| Item | Qty | Unit Price | Total |
| 7-Omics Premium Package | 1 | ₺18,000 | ₺18,000 |
| Additional Blood Panel | 1 | ₺2,400 | ₺2,400 |
| Voucher Discount (V-2026-041) | | | −₺5,000 |
| **Total** | | | **₺15,400** |

下部 — 交易历史（Payment History）：
按时间倒序列出该笔账单的所有交易记录：
- "1 Jul 2026, 09:15 · Card payment · ₺10,000 · Completed · Terminal #1"
- "15 Jun 2026, 14:30 · Online payment · ₺3,000 · Completed · Payment link"
- "10 Jun 2026, 10:00 · Voucher applied · ₺5,000 · V-2026-041"
每条交易显示：时间、方式、金额、状态、备注

底部 — 余额与操作：
- 大字显示 "Balance: ₺2,400"（红色，如有余额）或 "Fully Paid ✓"（绿色）
- 操作按钮（与三点菜单相同，但更直观的按钮形式）：
  · Reception："Start Transaction" | "Send Link" | "Record Cash" | "Apply Voucher"
  · Admin 额外："Issue Refund" | "Void" | "Generate Invoice"

八、Admin 专属 — Daily Summary 弹窗
点击顶部 "Daily Summary" 按钮弹出模态弹窗，标题 "Daily Summary · 3 Jul 2026"：
左侧 — 今日收款汇总：
- Total Collected: ₺42,600
- By Method:
  · 💳 Card: ₺28,000 (12 transactions)
  · 🔗 Online: ₺9,600 (4 transactions)
  · 💵 Cash: ₺5,000 (3 transactions)
- Vouchers Applied: ₺8,000 (2 vouchers)
- Refunds: ₺2,400 (1 refund)
- Net Revenue: ₺40,200

右侧 — 待处理事项：
- Unpaid Today: 3 appointments (₺7,200)
- Overdue (past appointments): 2 patients (₺4,800)
- Pending Transactions: 1 (processing)
- Invoices to Issue: 4

底部："Export Daily Report" 按钮 + "Close"

九、Mock 数据
1. Mackenzie Messineo · Body Scan · 3 Jul · Dr. Claudia · ₺18,000 · ₺18,000 · ₺0 · Paid · Card · Completed · ✅ Issued
2. Penny Pelargonium · Consultation · 3 Jul · Dr. Higgs · ₺4,800 · ₺0 · ₺4,800 · Unpaid · — · Pending · ⏳
4. Arysse Arcerola · 7-Omics Package · 2 Jul · Dr. Chad · ₺24,000 · ₺24,000 · ₺0 · Paid · Online · Completed · ✅
5. Gustavo Propolis · Consultation · 2 Jul · Dr. Felix · ₺4,800 · ₺4,800 · ₺0 · Paid · Cash · Completed · ✅
7. Dylan Daniel · Sample Collection · 1 Jul · Dr. Adobe · ₺3,600 · ₺3,600 · ₺0 · Paid · Online · Completed · ✅
8. Sophia Ascorbic · Consultation · 30 Jun · Dr. Chad · ₺4,800 · ₺4,800 · ₺0 · Refunded · Card · Refund Completed · ✅（预约取消退款）
9. Oliver Folate · Body Scan · 30 Jun · Dr. Felix · ₺18,000 · ₺18,000 · ₺0 · Paid · Card + Voucher · Completed · ✅
10. Cynthia Cromium · Consultation · 28 Jun · Dr. Adobe · ₺4,800 · ₺0 · ₺4,800 · Unpaid · — · — · —（overdue）

十、权限差异汇总
- Reception：可查看、可筛选 / Record Cash / Apply Voucher），可查看交易历史。不能退款、不能作废、不能调账、不能导出、不能看 Daily Summary。
- Admin：全部功能可用。
- 其他角色：不可访问 /billing，重定向 + toast。

十一、不要的内容
- 不要拆成多个子页面（invoice 页、payment 页、transaction 页等）——全部在一个表格内完成
- 不要让 Clinician 或 Nurse 看到任何收费信息
- 不要在表格里直接内联编辑金额——所有金额修改通过操作弹窗完成