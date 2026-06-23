# AI 协作基础设施与项目框架补齐 Spec

> 本 spec 修复"vibe coding 项目基础设施缺失"问题。核心根因：项目的 AI 协作入口 `.trae/skills/typehelp-novel-design/SKILL.md` 与其引用的全部方法论、Agent 提示词、worked example、强制脚本**均被 `.gitignore` 屏蔽**——这导致任何 `git clone` 后的协作者（人类或 AI）都看不到方法论，只能凭 README 自由发挥。本 spec 系统性补齐此问题。

---

## Why

TxtGame 是"多剧本文字推理游戏合集"，**AI Agent 协作是项目核心交付方式**（README §"设计方法论"明确说明 9 阶段 + 8 Agent）。但当前仓内存在 4 类问题：

1. **方法论不可见**：SKILL.md / 8 个 Agent prompt / spec.md / worked example 全部在 `.trae/` 下，被 `.gitignore` 屏蔽 → 新协作者无入口
2. **强制门禁缺位**：SKILL.md §6 强制 4 步门禁（`check_twine_escape.py` → `verify_embed.py` → `check_twine_macro_stack.py` → Playwright）**未纳入 CI** → 按 SKILL.md 流程走与不走的剧本在 CI 上无差异
3. **经验教训无防御**：SKILL.md §8 的 11 条实测教训、§10 的 12 条错误速查**未转成测试** → 同样的错误会反复出现
4. **仓级规范空缺**：SKILL.md §8.10 要求"仓根 README 加多剧本规范" → 当前 README 仅按"项目说明"组织，无规范章节

---

## What Changes

- **新增根 `AGENTS.md`**：作为仓级 AI 协作入口，引用 `.trae/skills/typehelp-novel-design/SKILL.md` 并列出仓级规范（C1–C9、5 层测试、CI 门禁链）
- **修改 `.gitignore`**：把 `.trae/skills/` / `.trae/specs/` / `.trae/scripts/` 从屏蔽清单移除（保留 `.trae/documents/` 可选）；一次性 commit 当前 `.trae/` 下所有共享内容
- **修改 `.github/workflows/test.yml`**：在现有 L1–L5 矩阵之上，新增 4 个强制门禁步骤（`check_twine_escape.py` / `verify_embed.py` / `check_twine_macro_stack.py` / `playwright_check.py`）
- **修改 `README.md`**：顶部新增"AI 协作入口"章节，显式指向 `AGENTS.md` 和 SKILL.md
- **新增 `games/<name>/framework_diff.md` 模板**：Twine Implementer 完成后的强制产出，参照 SKILL.md §8.6
- **新增 `test/e2e/l10n-sanitize.test.js`**：覆盖 SKILL.md §8.7 / §10（中文 find / note / 反斜杠 / 全角符号）
- **新增 `test/e2e/stale-state.test.js`**：覆盖 SKILL.md §8.8（"帮"等空净化输入不应触发 save）
- **新增 `test/e2e/feedback-audit.test.js`**：覆盖 SKILL.md §8.9（每条命令执行后必须有可见反馈）
- **新增 `test/e2e/framework-drift.test.js`**：覆盖 SKILL.md §8.6（StoryInit / StoryMenu / StoryCaption / PassageHeader 框架级 diff）
- **新增 `test/e2e/cross-game-baseline.test.js`**：覆盖 SKILL.md §8.10（多剧本共享规范：UI bar / 历史策略 / L10n 字符集 / 反馈风格）
- **新增 `scripts/handoff-validate.js`**：校验 `games/<name>/handoffs/*.json` 是否符合 SKILL.md §4.2 handoff 协议
- **新增 `scripts/agents-md-lint.js`**：CI 阶段校验 `AGENTS.md` 是否包含所有规范锚点（防漂移）

> **不修改**：`games/**/*.html` / `games/**/*.md` / `src/commandRouter.js` / `test/static/**` / `test/unit/**` / `test/narrative/**` / `test/render/**` / `test/helpers/**` / 现有 5 层测试

---

## Impact

- **Affected specs**：
  - 受影响：`.trae/specs/typehelp-novel-design/`（SKILL.md §6 / §8 / §10 变更为可强制执行）
  - 受影响：`.trae/specs/setup-twine-test-framework/`（5 层测试之外新增"门禁层 + AI 协作层"）
  - 不受影响：仓内 3 个剧本的 HTML 与设计文档
- **Affected code**：
  - 新增：根 `AGENTS.md`、`.trae/specs/bootstrap-ai-collaboration-foundation/`（本目录）、`games/<name>/framework_diff.template.md`、`test/e2e/l10n-sanitize.test.js`、`test/e2e/stale-state.test.js`、`test/e2e/feedback-audit.test.js`、`test/e2e/framework-drift.test.js`、`test/e2e/cross-game-baseline.test.js`、`scripts/handoff-validate.js`、`scripts/agents-md-lint.js`
  - 修改：`.gitignore`（移除 `.trae/skills/`、`.trae/specs/`、`.trae/scripts/`）、`.github/workflows/test.yml`（新增 4 步门禁）、`README.md`（新增"AI 协作入口"章节）
- **影响面**：
  - **正向**：任何 `git clone` 后的协作者都能看到完整方法论；CI 强制 SKILL.md 门禁链；新错误有防御性测试
  - **风险**：`.trae/` 入仓后体积可能增大（worked example 约 1MB+）；CI 跑 `.py` 脚本需 Python 环境（GitHub Actions ubuntu-latest 默认有）

---

## ADDED Requirements

### Requirement: AGENTS.md 仓级入口

系统 SHALL 在仓根提供 `AGENTS.md`，作为所有 AI Agent（Claude / Cursor / Trae / 其他）协作的**首选入口**。该文件 SHALL 包含：

1. **项目一句话定位**：用 1 句话说明 TxtGame 是什么（多剧本文字推理游戏合集 + 9 阶段 + 8 Agent 协作）
2. **AI 必读顺序**：按优先级列出 AI 进入项目后必须先读的文件
   - 第 1：`AGENTS.md`（本文件）
   - 第 2：`README.md`（项目总览）
   - 第 3：`.trae/skills/typehelp-novel-design/SKILL.md`（设计方法论入口）
   - 第 4：`.trae/specs/typehelp-novel-design/spec.md`（完整方法论推导）
   - 第 5：`games/<target>/README.md`（目标剧本）
3. **仓级规范速查表**：列出 4 类必须遵守的规范
   - **方法论 9 项硬约束 C1–C9**（表格形式）
   - **5 层测试金字塔**（L1 静态 / L2 单元 / L3 叙事 / L4 渲染 / L5 E2E）
   - **CI 门禁链**（check_twine_escape → verify_embed → check_twine_macro_stack → playwright）
   - **多剧本共享基线**（UI bar / 历史策略 / L10n 字符集 / 反馈风格）
4. **禁止行为清单**：列出 5 类禁止动作（凭直觉改源 / 跳过 SKILL.md 流程 / 复制粘贴其他剧本设计 / 改 `.trae/specs/` 历史文档 / 提交 `.trae/.tmp/` 中间产物）
5. **入口指向**：显式指向 SKILL.md 的关键章节（§6 工作流 / §8 经验教训 / §10 错误速查）

#### Scenario: AI Agent 进入项目后第一步
- **WHEN** AI Agent 接到"为 TxtGame 添加新剧本"任务并首次进入项目
- **THEN** 优先读取 `AGENTS.md` 第 2 节"AI 必读顺序"
- **AND** 按顺序读取 5 个文件后再开始设计
- **AND** 不直接修改任何 `games/<existing-game>/` 下的设计文档或 HTML

#### Scenario: AGENTS.md 防漂移
- **WHEN** CI 跑 `scripts/agents-md-lint.js`
- **THEN** 校验 AGENTS.md 包含所有规范锚点（C1–C9 / 5 层 / 4 步门禁 / 多剧本基线）
- **AND** 任一锚点缺失 → CI 失败

---

### Requirement: `.trae/` 共享方法论入仓

系统 SHALL 解除 `.gitignore` 对 `.trae/skills/` / `.trae/specs/` / `.trae/scripts/` 的屏蔽，并一次性 commit 当前内容到版本控制。

#### Scenario: 全新克隆仓库后 AI 可见方法论
- **WHEN** 协作者 `git clone` 仓库
- **THEN** 仓根存在 `AGENTS.md`、`.trae/skills/typehelp-novel-design/SKILL.md`、`.trae/specs/typehelp-novel-design/spec.md`、`.trae/specs/typehelp-novel-design/prompts/*.md`、`.trae/specs/typehelp-novel-design/example-blackbox/`、`.trae/scripts/*.py`
- **AND** `.trae/documents/` 与 `.trae/.tmp/` 保持屏蔽（如果存在）

#### Scenario: 仓根可见脚本不被泄露
- **WHEN** `.trae/.tmp/` 或 `.trae/documents/` 下有开发期中间产物或私密记录
- **THEN** 保持 gitignore，不入仓
- **AND** `.trae/skills/` / `.trae/specs/` / `.trae/scripts/` 全部入仓

---

### Requirement: CI 门禁链强制执行

系统 SHALL 在 `.github/workflows/test.yml` 中**在 L1–L5 测试之前**新增 4 步强制门禁：

| 步骤 | 命令 | 失败后果 |
|---|---|---|
| 1 | `python .trae/scripts/check_twine_escape.py games/<game>/<game>.html` | 0 errors 视为 PASS |
| 2 | `python .trae/scripts/verify_embed.py games/<game>/<game>.html` | 5/5 PASS 视为 PASS |
| 3 | `python .trae/scripts/check_twine_macro_stack.py games/<game>/<game>.html` | 0 errors 视为 PASS |
| 4 | `playwright test test/e2e/l10n-sanitize.test.js test/e2e/stale-state.test.js test/e2e/feedback-audit.test.js` | 全 PASS 视为 PASS |

#### Scenario: 强制门禁之一失败
- **WHEN** 任意 4 步门禁之一失败
- **THEN** CI 在该步立即退出
- **AND** 后续 L1–L5 测试不执行
- **AND** GitHub PR 上显示失败步骤与错误详情

#### Scenario: 剧本无 HTML
- **WHEN** 目标剧本 `htmlFile: null`（如 `terminal-mystery`）
- **THEN** 门禁 1/2/3 跳过，门禁 4 仅跑 `feedback-audit.test.js`（不依赖 HTML 的部分）

---

### Requirement: framework_diff.md 强制产出

系统 SHALL 在 `games/<name>/framework_diff.template.md` 提供模板，并要求 Twine Implementer 完成后**必须**产出 `games/<name>/framework_diff.md` 记录与参考实现（`galley-villa/TypeHelp.html`）的框架级差异决策。

#### Scenario: 模板存在
- **WHEN** 协作者查看 `games/<name>/framework_diff.template.md`
- **THEN** 模板包含 5 个必填章节：StoryInit 差异 / StoryMenu 差异 / StoryCaption 差异 / PassageHeader 差异 / 决策理由
- **AND** 每章节给出"必须对齐 / 保留设计差异 / 修复原版 bug"3 类判定规则

#### Scenario: 强制产出验证
- **WHEN** `test/e2e/framework-drift.test.js` 跑 CI
- **THEN** 对每个有 HTML 的剧本检查 `framework_diff.md` 是否存在
- **AND** 缺失则视为 CI 失败（仅在 L4/L5 之后追加 check，不阻塞 L1–L5）

---

### Requirement: L10n sanitize 防御性测试

系统 SHALL 在 `test/e2e/l10n-sanitize.test.js` 中覆盖 SKILL.md §8.7 / §10 描述的中文输入净化缺陷。

测试 SHALL 覆盖以下输入：
- `find 陈`（CJK 关键词） → 应正常返回结果或"未找到"，不应回退到"用法：find 关键词"
- `note 钱某与江某的矛盾` → 应被记录为完整内容，不应被截断
- `find 监控` → 同上
- 输入 `XX-AG-1\XX-DR-1`（反斜杠）→ 应识别为文件名，不应被拼成 `XX-AG-1XX-DR-1`
- 输入 `XX-AG-1/XX-DR-1`（正斜杠）→ 同上

#### Scenario: 中文 find 关键词
- **WHEN** 玩家输入 `find 钢琴`（前提：HTML 状态机中已有 `00-readme` 进入）
- **THEN** 游戏给出有效反馈（命中 / 未命中 / 用法说明），**不**因 sanitize 清空 CJK 而回退到"用法：find 关键词"
- **AND** Playwright 抓取 `body` 文本断言不含"用法：find 关键词"或"暂无笔记"

#### Scenario: 反斜杠被吞导致文件名拼接
- **WHEN** 玩家输入 `XX-AG-1\XX-DR-1`
- **THEN** 游戏应识别反斜杠为合法字符，**不**应将 `\` 替换为空
- **AND** 反馈中应包含 `XX-AG-1\XX-DR-1` 完整字符串

---

### Requirement: stale state 防御性测试

系统 SHALL 在 `test/e2e/stale-state.test.js` 中覆盖 SKILL.md §8.8 描述的状态机未重置缺陷。

测试 SHALL 覆盖：
- 步骤 1：玩家输入 `save` → 正常反馈
- 步骤 2：玩家输入 `帮`（纯 CJK 字符，sanitize 后变空）
- 步骤 3：断言页面**不**显示"进度已保存"（即不应触发 save 逻辑）

#### Scenario: sanitize 后变空不应触发上次命令
- **WHEN** 玩家先输入 `save`，再输入 `帮`
- **THEN** 第 2 次输入后页面显示"未知命令"或类似"未识别输入"反馈
- **AND** **不**显示"进度已保存"

---

### Requirement: 命令反馈完整性审计

系统 SHALL 在 `test/e2e/feedback-audit.test.js` 中覆盖 SKILL.md §8.9 描述的"有副作用命令必须有可见反馈"。

测试 SHALL 覆盖所有有副作用的命令：`help` / `list` / `save` / `back` / `name` / `note` / `find` / `load` / `hangman`。

#### Scenario: load 命令必须有反馈
- **WHEN** 玩家输入 `load`
- **THEN** 页面必须出现"进度已加载。"或"没有可加载的存档"中的一种
- **AND** **不**允许静默无反馈（页面文本变化前 = 页面文本变化后）

#### Scenario: note 写入后必须可见
- **WHEN** 玩家输入 `note 测试笔记`
- **THEN** 页面必须出现"笔记已记录"或类似反馈
- **AND** 输入 `note`（无内容）必须出现"暂无笔记"或"用法：note <内容>"中的一种

---

### Requirement: 跨剧本基线一致性审计

系统 SHALL 在 `test/e2e/cross-game-baseline.test.js` 中覆盖 SKILL.md §8.10 描述的多剧本共享规范。

测试 SHALL 覆盖所有有 HTML 的剧本（`galley-villa` / `island-death`）：
- **UI bar 处理**：每个剧本的 `StoryInit` 必须包含 `<<run UIBar.destroy()>>` 或等价配置（**或** 显式说明"保留 UI bar 是设计选择"并写入 `framework_diff.md`）
- **历史策略**：每个剧本的 `StoryInit` 必须设置 `Config.history.maxStates` ≤ 某阈值（**或** 显式说明）
- **L10n 字符集**：每个剧本的 `Box` passage 的 sanitize 正则必须包含 `\u4e00-\u9fff`（**或** 显式说明"本剧本为纯英文"）
- **反馈文案风格**：所有命令反馈文案必须全中文或全英文（不允许中英混用）

#### Scenario: galley-villa 与 island-death 基线一致
- **WHEN** CI 跑 cross-game-baseline.test.js
- **THEN** 两个剧本的 `framework_diff.md` 必须存在并覆盖所有 4 项基线
- **AND** 任一剧本缺少 `framework_diff.md` 或某基线未明确 → CI 失败

---

### Requirement: handoff JSON 协议校验

系统 SHALL 在 `scripts/handoff-validate.js` 提供 handoff 校验工具，对 `games/<name>/handoffs/*.json` 校验是否符合 SKILL.md §4.2 handoff 协议。

校验 SHALL 包含：
- JSON 文件存在且可解析
- 必填字段：`from` / `to` / `deliverables` / `assumptions` / `open_questions` / `blockers` / `next_step`
- `from` 与 `to` 必须是 `prompts/README.md` 中已定义的 8 个 Agent 之一
- `deliverables` 中的文件路径必须存在

#### Scenario: handoff JSON 格式校验
- **WHEN** CI 跑 `node scripts/handoff-validate.js <game-name>`
- **THEN** 对 `games/<game-name>/handoffs/` 下所有 JSON 文件逐个校验
- **AND** 任一字段缺失 / Agent 名称未识别 / 文件路径不存在 → 报错并退出码 1

---

## MODIFIED Requirements

### Requirement: 项目根 README.md 含 AI 协作入口

> 来源：原 README.md §"如何贡献新剧本"

原 README 仅说明"创建目录 → 写文档 → 改索引表"3 步。本 spec 要求新增 §"AI 协作入口"章节，**第一步必须改为"读 AGENTS.md"**。

#### Scenario: README 顶部新增 AI 协作入口章节
- **WHEN** 协作者查看 README.md 顶部
- **THEN** 在"剧本索引"表之前有"AI 协作入口"章节
- **AND** 章节显式指向 `AGENTS.md` 与 `.trae/skills/typehelp-novel-design/SKILL.md`
- **AND** 给出"AI 协作者必读顺序"列表

---

### Requirement: CI workflow 含 SKILL.md §6 强制门禁

> 来源：原 `.github/workflows/test.yml`

原 workflow 仅跑 L1–L5 五层测试。本 spec 要求在 L1 之前新增 4 步门禁（见"CI 门禁链强制执行"）。

#### Scenario: workflow 包含 4 步门禁
- **WHEN** CI 触发（push / PR）
- **THEN** 在 `L1 静态分析`步骤之前有 4 个新增步骤
- **AND** 每步使用 `python .trae/scripts/*.py` 或 `playwright test` 命令
- **AND** 任一步失败 → 整个 job 失败

---

### Requirement: `.gitignore` 不再屏蔽 `.trae/` 共享方法论

> 来源：原 `.gitignore` 第 2 行 `.trae/`

原 `.gitignore` 把整个 `.trae/` 屏蔽。本 spec 要求精细化屏蔽：保留 `.trae/documents/`（私密记录）与 `.trae/.tmp/`（中间产物）的屏蔽，**移除** `.trae/skills/` / `.trae/specs/` / `.trae/scripts/` 的屏蔽。

#### Scenario: `.gitignore` 精细化
- **WHEN** 协作者查看 `.gitignore`
- **THEN** 存在 `!.trae/skills/` / `!.trae/specs/` / `!.trae/scripts/` 3 行反项
- **AND** `.trae/documents/` / `.trae/.tmp/` 保持屏蔽（如存在）
- **AND** `git check-ignore` 对 `.trae/skills/typehelp-novel-design/SKILL.md` 返回非忽略

---

## REMOVED Requirements

无（无功能删除）

---

## 验收门（Go / No-Go）

- [ ] **A. AGENTS.md 存在**且包含 5 个规范锚点（C1–C9 / 5 层 / 4 步门禁 / 多剧本基线 / 禁止行为）
- [ ] **B. `.trae/skills/` / `.trae/specs/` / `.trae/scripts/` 入仓**，且现有内容无任何修改
- [ ] **C. CI workflow 包含 4 步门禁**，且在 L1 之前
- [ ] **D. 5 个新 e2e 测试文件**全部存在且可执行
- [ ] **E. `framework_diff.template.md` 存在**
- [ ] **F. `scripts/handoff-validate.js` 与 `scripts/agents-md-lint.js` 存在**
- [ ] **G. README.md 顶部"AI 协作入口"章节存在**且指向 AGENTS.md
- [ ] **H. 全新克隆仓后 `AGENTS.md` 立即可见**（无需额外配置）
- [ ] **I. 现有 3 剧本 CI 全部仍 PASS**（不破坏既有 5 层测试）

---

## 反模式防御清单（来自 SKILL.md §8 经验教训）

| 经验教训 | 本 spec 对应防御 |
|---|---|
| §8.1 症状导向诊断陷阱 | Requirement: AGENTS.md 禁止行为清单第 1 条"凭直觉改源" |
| §8.2 静态分析必要不充分 | Requirement: CI 门禁链强制执行（4 步覆盖静态 + Playwright） |
| §8.3 流程链断裂（仓内 vs 仓外） | Requirement: framework_diff.md 强制产出 + M.4 流程链门禁 |
| §8.4 文档自指污染 | Requirement: AGENTS.md 防漂移 + 禁止行为清单第 4 条 |
| §8.5 引擎知识盲区 | Requirement: 跨剧本基线一致性审计（UI bar 章节） |
| §8.6 框架配置漂移 | Requirement: framework_diff.md + framework-drift.test.js |
| §8.7 L10n sanitize | Requirement: L10n sanitize 防御性测试 |
| §8.8 stale state | Requirement: stale state 防御性测试 |
| §8.9 反馈完整性 | Requirement: 命令反馈完整性审计 |
| §8.10 跨剧本一致性 | Requirement: 跨剧本基线一致性审计 |
| §8.11 Playwright 6 陷阱 | Requirement: CI 门禁链第 4 步（统一在 Playwright 中跑，避免分散脚本） |
| §10 错误速查（12 条） | Requirement: L10n sanitize + stale state + feedback audit 三类测试覆盖 §10 中 6 条 |

---

## 一句话心法

> **vibe coding 项目 = 把方法论 + Agent 入口 + 强制门禁 + 防御性测试"全部入仓 + 全部 CI 化"——任何一步留在仓外或留在口头，就一定会随时间漂移。**
