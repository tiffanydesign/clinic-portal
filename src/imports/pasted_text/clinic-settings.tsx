构建 Clinic Settings 页面（/clinic-settings），仅 Admin 可访问。iPad 13" 横屏（1366×1024），界面语言英文，保持现有 app shell。

一、页面整体布局

采用左侧子导航 + 右侧内容区的经典设置页布局：

左侧子导航（约 220px 宽，灰色背景卡片）：
- 页面标题 "Clinic Settings" + 齿轮图标
- 副标题 "Manage clinic templates and configurations"
- 分隔线
- 四个纵向排列的导航项，每项带图标 + 标签：
  · 📄 "Reports" — 报告与文档模板
  · 🏷️ "Diagnoses" — 诊断库
  · ✍️ "Signed Form Templates" — 签署表单模板
  · 📁 "Consent Files" — 同意文件管理
- 当前选中项高亮（左边缘蓝色竖条 + 浅蓝底色）
- 默认选中第一项 Reports

右侧内容区（剩余宽度，白色背景）：
- 根据左侧选中的导航项展示对应内容
- 每个子页面顶部有标题 + 说明文字 + 操作按钮

路由结构：
- /clinic-settings → 重定向到 /clinic-settings/reports
- /clinic-settings/reports
- /clinic-settings/diagnoses
- /clinic-settings/form-templates
- /clinic-settings/consent-files

二、子页面 1：Reports（报告与文档模板）

顶部标题栏：
- 左侧标题 "Report & Document Templates"
- 副标题 "Manage templates used to generate patient reports and clinic documents"
- 右侧 "+ Upload Template" 按钮

两个表格区块，纵向排列：

区块 A — Report Templates（临床报告模板）
区块标题 "Report Templates" + 徽标显示数量 "4"
说明 "Templates used by clinicians to generate patient-facing clinical reports"

表格列：
| Template Name | Category | Version | Last Updated | Status | Actions |
| 200px | 120px | 80px | 120px | 90px | 80px |

- Template Name：模板名称，如 "7-Omics Result Report"
- Category：下拉分类 pill — "Blood Panel" / "Body Scan" / "Genomics" / "General"
- Version：版本号 "v2.3"
- Last Updated：日期 "1 Jul 2026"
- Status：开关 toggle — Active（绿色）/ Inactive（灰色）
- Actions：三点菜单 ⋯ → Preview / Edit Details / Upload New Version / Download / Deactivate / Delete

表格行 hover 高亮。Active 模板正常展示，Inactive 模板整行文字灰色。

区块 B — Document Templates（运营文档模板）
区块标题 "Document Templates" + 徽标 "3"
说明 "Templates for operational documents such as visit summaries and referral letters"

同样的表格结构，Category 选项不同："Visit Summary" / "Referral Letter" / "Medical Certificate" / "Other"

"+ Upload Template" 按钮点击后弹出模态弹窗：
- 标题 "Upload Template"
- 表单字段：
  · Template Name（必填文本输入）
  · Type 单选："Report Template" / "Document Template"
  · Category 下拉（根据 Type 切换选项）
  · Version（文本输入，默认 "v1.0"）
  · Description（多行文本，选填）
  · File Upload 拖拽区域（支持 .docx, .pdf, .html 格式，最大 10MB）+ "Browse files" 文字链接
  · 一行提示 "Uploaded templates will be set to Inactive by default. Activate them when ready."
- 底部按钮："Cancel" + "Upload"（上传后新模板以 Inactive 状态出现在对应表格中）

Mock 数据 — Report Templates：
1. "7-Omics Premium Report" · Genomics · v3.1 · 28 Jun 2026 · Active
2. "Body Scan Result Report" · Body Scan · v2.0 · 15 Jun 2026 · Active
3. "Blood Panel Summary" · Blood Panel · v1.4 · 10 Jun 2026 · Active
4. "Genetic Risk Assessment" · Genomics · v1.0 · 1 Jun 2026 · Inactive

Mock 数据 — Document Templates：
1. "Visit Summary" · Visit Summary · v2.1 · 20 Jun 2026 · Active
2. "Specialist Referral Letter" · Referral Letter · v1.2 · 5 Jun 2026 · Active
3. "Medical Fitness Certificate" · Medical Certificate · v1.0 · 1 May 2026 · Inactive

三、子页面 2：Diagnoses（诊断库）

顶部标题栏：
- 标题 "Diagnosis Library"
- 副标题 "Manage the diagnosis codes and categories available to clinicians"
- 右侧两个按钮："+ Add Diagnosis"（添加自定义诊断）+ "Import" 按钮（批量导入 ICD-10 码，占位）

搜索和筛选工具栏：
- 搜索框 "Search by name or ICD code..."（约 300px）
- Category 下拉筛选："All Categories" | "Cardiovascular" | "Metabolic" | "Genetic" | "Oncology" | "Musculoskeletal" | "Neurological" | "Other"
- Status 下拉："All" | "Active" | "Inactive"

诊断表格：
| Diagnosis Name | ICD-10 Code | Category | Frequency | Status | Actions |
| 220px | 100px | 120px | 90px | 90px | 80px |

- Diagnosis Name：诊断名称，如 "Essential Hypertension"
- ICD-10 Code：国际诊断编码 "I10"
- Category：分类 pill
- Frequency：过去 30 天内被选用的次数 "12 uses"（帮助 Admin 了解哪些诊断常用）
- Status：toggle Active / Inactive
- Actions：⋯ → Edit / Deactivate / Delete

"+ Add Diagnosis" 弹窗：
- Diagnosis Name（必填）
- ICD-10 Code（选填，手动输入或从标准库搜索匹配）
- Category 下拉（必填）
- Description（选填多行文本）
- Status 默认 Active
- "Cancel" + "Save"

表格支持拖拽排序（调整诊断在 Clinician 下拉列表中的显示顺序）。常用诊断可以被置顶（Actions 菜单里 "Pin to top"），置顶的诊断在表格顶部显示并带 📌 标记。

Mock 数据（8 条）：
1. 📌 "Essential Hypertension" · I10 · Cardiovascular · 23 uses · Active
2. 📌 "Type 2 Diabetes Mellitus" · E11 · Metabolic · 18 uses · Active
3. "Hyperlipidemia" · E78.5 · Metabolic · 15 uses · Active
4. "BRCA1 Gene Mutation" · Z15.01 · Genetic · 8 uses · Active
5. "Vitamin D Deficiency" · E55.9 · Metabolic · 12 uses · Active
6. "Osteoporosis, unspecified" · M81.0 · Musculoskeletal · 6 uses · Active
7. "Anxiety Disorder" · F41.9 · Neurological · 4 uses · Active
8. "Iron Deficiency Anemia" · D50.9 · Metabolic · 2 uses · Inactive

四、子页面 3：Signed Form Templates（签署表单模板）

顶部标题栏：
- 标题 "Signed Form Templates"
- 副标题 "Manage templates that patients must sign before or during their visit"
- 右侧 "+ Upload Template" 按钮

表格：
| Form Name | Form Type | Version | Required At | Last Updated | Signed Count | Status | Actions |
| 180px | 110px | 70px | 100px | 100px | 80px | 80px | 70px |

- Form Name：表单名称
- Form Type：类型 pill — "Consent Form" / "Privacy Agreement" / "Waiver" / "Questionnaire"
- Version：版本号 "v3.0"。版本号旁边有一个小时钟图标，点击弹出版本历史 popover（列出所有历史版本，每个版本：版本号 + 上传日期 + uploaded by + "Download" 链接）
- Required At：在哪个环节需要签署 — "Before Check-in" / "Before Scan" / "Before Consultation" / "Optional"
- Last Updated：日期
- Signed Count：过去 30 天被签署的次数 "142 signed"
- Status：toggle Active / Inactive。Inactive 的表单不会出现在 Reception 的签署流程中
- Actions：⋯ → Preview / Edit Details / Upload New Version / Download Current / View Version History / Deactivate / Delete

重要逻辑提示（表格上方黄色信息条）：
"⚠ Deactivating or deleting a form template does not affect already signed records. Active forms are automatically included in the check-in flow based on their 'Required At' setting."

"+ Upload Template" 弹窗：
- Form Name（必填）
- Form Type 下拉
- Version（默认 "v1.0"）
- Required At 下拉（必填）
- Linked Consent Files 多选下拉（可选择 Consent Files 子页面里的文件，作为患者签署前需要阅读的附件）
- Description（选填）
- File Upload 拖拽区域（支持 .pdf 格式）
- "Cancel" + "Upload"

Mock 数据（5 条）：
1. "Informed Consent — Body Scan" · Consent Form · v3.0 · Before Check-in · 20 Jun 2026 · 142 signed · Active
2. "Informed Consent — Genetic Testing" · Consent Form · v2.1 · Before Scan · 15 Jun 2026 · 89 signed · Active
3. "Privacy & Data Processing Agreement" · Privacy Agreement · v4.0 · Before Check-in · 1 Jun 2026 · 156 signed · Active
4. "Health History Questionnaire" · Questionnaire · v1.3 · Before Consultation · 10 Jun 2026 · 134 signed · Active
5. "Liability Waiver — Physical Assessment" · Waiver · v1.0 · Before Scan · 1 May 2026 · 45 signed · Inactive

五、子页面 4：Consent Files（同意文件管理）

顶部标题栏：
- 标题 "Consent & Supporting Files"
- 副标题 "Upload and manage informational documents that patients may review before signing forms"
- 右侧 "+ Upload File" 按钮

顶部说明卡片（浅蓝底，带 ℹ️ 图标）：
"These files are not signed by patients. They are supporting documents (e.g. full privacy policy text, procedure descriptions) that can be linked to Signed Form Templates for patient review."

文件管理采用卡片网格布局（不是表格），每行 3 张卡片：

每张文件卡片：
- 文件类型大图标（PDF 红色图标 / DOCX 蓝色图标 / 图片缩略图）
- 文件名 "Privacy Policy — Full Text.pdf"
- 文件分类 pill："Privacy Policy" / "Procedure Guide" / "Terms of Service" / "Patient Information" / "Other"
- 文件大小 "2.4 MB" + 上传日期 "1 Jun 2026"
- 关联表单标签（如果被链接到 Signed Form Template）："Linked to: Privacy & Data Processing Agreement"（蓝色文字）。未关联显示 "Not linked to any form"（灰色）
- 底部操作行：👁 "Preview" | ⬇️ "Download" | ✏️ "Edit" | 🗑 "Delete"

筛选工具栏：
- 搜索框 "Search files..."
- Category 下拉："All" | "Privacy Policy" | "Procedure Guide" | "Terms of Service" | "Patient Information" | "Other"
- 排序下拉："Newest First" | "Oldest First" | "Name A–Z" | "Name Z–A"

"+ Upload File" 弹窗：
- File Name（必填，默认取上传文件名）
- Category 下拉（必填）
- Description（选填）
- File Upload 拖拽区域（支持 .pdf, .docx, .png, .jpg 格式，最大 20MB）
- Link to Form Template 多选下拉（可选择 Signed Form Templates 里的表单，建立关联）
- "Cancel" + "Upload"

Mock 数据（6 张卡片）：
1. 📄 "Privacy Policy — Full Text.pdf" · Privacy Policy · 2.4 MB · 1 Jun 2026 · Linked to: Privacy & Data Processing Agreement
2. 📄 "Genetic Testing Information Guide.pdf" · Procedure Guide · 1.8 MB · 15 May 2026 · Linked to: Informed Consent — Genetic Testing
3. 📄 "Body Scan Procedure Overview.pdf" · Procedure Guide · 3.1 MB · 10 May 2026 · Linked to: Informed Consent — Body Scan
4. 📄 "Terms of Service — 2026.pdf" · Terms of Service · 1.2 MB · 1 Apr 2026 · Not linked to any form
5. 📄 "Patient Rights & Responsibilities.pdf" · Patient Information · 0.8 MB · 1 Mar 2026 · Not linked to any form
6. 📄 "Physical Assessment Risk Disclosure.docx" · Procedure Guide · 0.5 MB · 1 Feb 2026 · Linked to: Liability Waiver — Physical Assessment

六、权限
- 仅 Admin 可访问 /clinic-settings 及所有子页面
- 其他角色访问时重定向到 /dashboard + "No access" toast

七、不要的内容
- 不要把四个子模块做成顶部 Tab 切换——用左侧子导航
- 不要在这个页面内嵌入实际的模板编辑器（如富文本编辑器）——模板的编辑通过上传新文件替换实现
- 不要做实时预览渲染——Preview 操作打开一个简单的 PDF/文档查看弹窗占位即可