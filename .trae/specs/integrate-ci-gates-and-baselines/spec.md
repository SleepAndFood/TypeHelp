# 集成 CI 门禁与多剧本基线 Spec

## Why

第一版测试框架（`setup-twine-test-framework`）已实现 5 层金字塔与跨剧本可移植性，但**未按 AGENTS.md / SKILL.md 完整方法论**集成：

- **AGENTS.md §4 规则 2**：跳过 SKILL.md 流程（CI 门禁链是 §6 工作流的**必要部分**）
- **AGENTS.md 表 3**：3 个 python 门禁脚本（`check_twine_escape.py` / `verify_embed.py` / `check_twine_macro_stack.py`）**未集成**到 `npm test`
- **AGENTS.md 表 3**：3 个 Playwright 专业测试（`l10n-sanitize` / `stale-state` / `feedback-audit`）**未实现**
- **AGENTS.md 表 4**：多剧本共享基线（UI bar / 历史策略 / L10n / 反馈风格）**无 L1 静态检查**
- **AGENTS.md §4 规则 4**：spec.md / tasks.md / checklist.md 是历史文档，**已修复**（第一版 spec 已回滚到未勾选原貌）
- **SKILL.md §8 经验教训**：11 条实测教训中仅 §8.1 被部分对抗性验证覆盖，其余（§8.5/8.7/8.8/8.9/8.10/8.11）**无显式检查**

本 spec 修复这些系统性问题，让 `npm test` 真正等价于"AGENTS.md 强制门禁链 + 5 层金字塔"。

## What Changes

- 集成 `.trae/scripts/check_twine_escape.py` / `verify_embed.py` / `check_twine_macro_stack.py` 到 `scripts/run-all.js`（作为 A/B/C 3 步在 L1 之前跑）
- 新增 `test/static/framework-baseline.test.js`：检查 `<<run UIBar.destroy()>>` + `<<set Config.history.maxStates to N>>` + L10n 字符集 + 反馈风格
- 新增 `test/unit/l10n-sanitize.test.js`：单元测试 sanitize 正则含 `\u4e00-\u9fff`（中文剧本）或 framework_diff.md 显式说明英文
- 新增 `test/e2e/l10n-sanitize.test.js`：在 Playwright 中真实输入含 CJK 字符的关键词，验证不卡死
- 新增 `test/e2e/stale-state.test.js`：执行 3-4 条命令后 reload，验证 state 正确重置（按 SKILL.md §8.8）
- 新增 `test/e2e/feedback-audit.test.js`：验证反馈文案（无中英混用、错误输入有反馈、help 列表完整）
- `src/commandRouter.js` 中加 L10n 字符集检查：note / find 内容必须全部 CJK 或全部 ASCII，不能混用
- `.github/workflows/test.yml` 增加 3 个 job（python 门禁 / L10n 单元 / Playwright 冒烟）
- **不修改** `setup-twine-test-framework` 的历史 spec 文档（已回滚到原貌）

## Impact

- **Affected specs**：
  - 受影响：`setup-twine-test-framework`（新增依赖 4 个测试 / 不修改历史 spec）
  - 不受影响：`typehelp-novel-design`（剧本方法论）
- **Affected code**：
  - 修改：`scripts/run-all.js`, `package.json`, `src/commandRouter.js`, `.github/workflows/test.yml`
  - 新增：`test/static/framework-baseline.test.js`, `test/unit/l10n-sanitize.test.js`, `test/e2e/l10n-sanitize.test.js`, `test/e2e/stale-state.test.js`, `test/e2e/feedback-audit.test.js`
  - 不修改：`games/**/*.html`（遵守 AGENTS.md §4 规则 1：先复现后改源；本 spec 不直接改剧本）

## ADDED Requirements

### Requirement: CI 强制门禁链（A/B/C 在 L1 之前）

系统 SHALL 在 `npm test` 启动时按顺序执行：

- **Step A**: `python .trae/scripts/check_twine_escape.py <htmlFile>` — 退出码 0
- **Step B**: `python .trae/scripts/verify_embed.py <htmlFile>` — 退出码 0
- **Step C**: `python .trae/scripts/check_twine_macro_stack.py <htmlFile>` — 退出码 0

任一失败 → 整个 job 失败，L1-L5 不执行。无 HTML 的剧本（`terminal-mystery`）跳过 A/B/C。

#### Scenario: galley-villa 门禁全过
- **WHEN** `npm test -- --game=galley-villa`
- **THEN** A/B/C 全部 exit 0，L1-L5 全部执行
- **AND** A/B/C 详细输出被 [AGENTS.md §6](file:///d:/WorkSpace/projects/TxtGame/AGENTS.md) 期望

#### Scenario: island-death 某门禁失败
- **WHEN** `check_twine_macro_stack.py` 报 1 error
- **THEN** `npm test` 立即中止
- **AND** stdout 报告"Step C 失败" + 错误位置

### Requirement: 多剧本共享基线 L1 静态检查

系统 SHALL 在 L1 静态层增加 `test/static/framework-baseline.test.js`，对每个剧本检查：

- **UI bar**: 存在 `<<run UIBar.destroy()>>` 或 `framework_diff.md` 显式说明
- **历史策略**: 存在 `<<set Config.history.maxStates to N>>`（N ≤ 阈值）或 `framework_diff.md` 显式说明
- **L10n 字符集**: 出现 `Sanitize.replace(/_|\\\\/g, ' ')` 或 sanitize 正则含 `\u4e00-\u9fff`（中文剧本），或 `framework_diff.md` 显式说明"本剧本为纯英文"
- **反馈风格**: 反馈文案中不能"中英混用"（即同一段落同时含中文汉字与英文单词）

#### Scenario: island-death UI bar 缺失
- **WHEN** `island-death.html` 中无 `UIBar.destroy()` 且无 `framework_diff.md`
- **THEN** `framework-baseline.test.js` 失败
- **AND** 报告"`[island-death] UI bar 缺失`"

#### Scenario: galley-villa framework_diff.md 显式说明
- **WHEN** `games/galley-villa/framework_diff.md` 含 "本剧本为纯英文"
- **THEN** L10n 字符集检查视为通过

### Requirement: L10n sanitize 单元与 E2E 检查

系统 SHALL 在 L2 增加 `test/unit/l10n-sanitize.test.js`（jsdom 中执行 sanitize 函数），在 L5 增加 `test/e2e/l10n-sanitize.test.js`（Playwright 中真实输入）。

#### Scenario: 中文剧本 sanitize 不卡死 CJK 字符
- **WHEN** 玩家输入 `note 钢琴在客厅`（含 CJK）
- **THEN** sanitized 后保留全部 CJK 字符
- **AND** `notes` 列表渲染该条

#### Scenario: 纯英文剧本
- **WHEN** 玩家输入 `note piano in living room`
- **THEN** sanitized 行为按 framework_diff.md 说明

### Requirement: stale-state E2E 测试

系统 SHALL 在 L5 增加 `test/e2e/stale-state.test.js`，验证：

- 打开游戏 → 输入若干命令 → 刷新页面 → 状态应按剧本的"重置策略"恢复（默认从 `<<set>>` 初始化）
- 不应保留上一次的 `$cache` / `$seen_xxx` 等

#### Scenario: 重置策略验证
- **WHEN** 执行 `name 1 张三` + `note 测试笔记` + reload
- **THEN** 启动 passage 无 `name 1 张三` 痕迹
- **AND** 无 `note 测试笔记` 痕迹

### Requirement: feedback-audit E2E 测试

系统 SHALL 在 L5 增加 `test/e2e/feedback-audit.test.js`，验证：

- 错误输入有可见反馈（如 "无效指令" / "Invalid command"）
- `help` 命令输出包含至少 alwaysAvailable 的所有命令
- 反馈文案中**无中英混用**（按 AGENTS.md 表 4）

#### Scenario: 中英混用反馈
- **WHEN** 反馈文案中同时含中文汉字与英文单词
- **THEN** `feedback-audit.test.js` 失败
- **AND** 报告违规段落位置

### Requirement: commandRouter L10n 检查

系统 SHALL 在 `src/commandRouter.js` 的 `note` 命令中检查：note 内容必须全部 CJK 或全部 ASCII。

#### Scenario: note 混入 CJK + ASCII
- **WHEN** 输入 `note piano在客厅`
- **THEN** `parseCommand` 返回 `action: 'note'`, `args.content` 仅保留 CJK 部分（`在客厅`）或全部保留但发出 warning
- **AND** 测试覆盖两种策略

## MODIFIED Requirements

### Requirement: 命令路由单元测试（来自 setup-twine-test-framework）

完整原内容保留，新增 L10n 子章节。

#### Scenario: note 命令 CJK 字符集
- **WHEN** 输入 `note piano在客厅`（混合）
- **THEN** `parseCommand` 拒绝或 sanitize（具体策略在 `config.l10nPolicy` 中可配）
- **AND** 默认策略：`reject`（混合输入返回 `action: 'error'`）

## REMOVED Requirements

无
