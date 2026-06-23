# Tasks：AI 协作基础设施与项目框架补齐

> 实施顺序遵循"基础设施先行 → 入口文档 → CI 门禁 → 防御性测试 → 模板与校验工具"。任务间存在依赖；可并行的标 `[P]`。

---

## Task 0：解除 `.trae/` 共享方法论屏蔽（基础）

- [ ] 0.1 修改 `.gitignore`：在 `.trae/` 行后追加 `!.trae/skills/` / `!.trae/specs/` / `!.trae/scripts/` 3 行反项
- [ ] 0.2 验证 `git check-ignore -v .trae/skills/typehelp-novel-design/SKILL.md` 返回非忽略
- [ ] 0.3 验证 `git check-ignore -v .trae/scripts/embed_sugarcube_engine.py` 返回非忽略
- [ ] 0.4 验证 `git check-ignore -v .trae/specs/typehelp-novel-design/prompts/director.md` 返回非忽略
- [ ] 0.5 验证 `.trae/documents/`（如存在）仍被忽略
- [ ] 0.6 `git add .trae/skills/ .trae/specs/ .trae/scripts/` 一次性加入追踪
- [ ] 0.7 `git commit -m "feat(infra): un-ignore .trae shared methodology (skills/specs/scripts)"`

**验证**：
- `git ls-files .trae/skills/typehelp-novel-design/SKILL.md` 返回真实路径
- `git status` 无 `.trae/` 下未追踪文件

---

## Task 1：创建根 `AGENTS.md`（AI 协作入口）

- [ ] 1.1 在仓根创建 `AGENTS.md`，5 个章节齐全
  - [ ] 1.1.1 §1 项目一句话定位
  - [ ] 1.1.2 §2 AI 必读顺序（5 个文件，注明优先级）
  - [ ] 1.1.3 §3 仓级规范速查（4 张子表：C1–C9 / 5 层 / 4 步门禁 / 多剧本基线）
  - [ ] 1.1.4 §4 禁止行为清单（5 条）
  - [ ] 1.1.5 §5 入口指向（SKILL.md 关键章节 §6 / §8 / §10）
- [ ] 1.2 引用路径全部使用相对路径，并加 `file:///` 锚点
- [ ] 1.3 `git add AGENTS.md && git commit -m "feat(agents): add AGENTS.md as AI collaboration entry point"`

**验证**：
- AGENTS.md ≤ 200 行
- `scripts/agents-md-lint.js` 通过（见 Task 7）

---

## Task 2：README.md 顶部新增"AI 协作入口"章节

- [ ] 2.1 在 README.md "剧本索引"表**之前**插入 §"AI 协作入口"
- [ ] 2.2 章节包含 3 个子项：AGENTS.md 指向 / SKILL.md 指向 / AI 协作者必读顺序
- [ ] 2.3 现有"剧本索引"表 + "如何贡献新剧本"章节不变
- [ ] 2.4 `git add README.md && git commit -m "docs(readme): add AI collaboration entry section"`

**验证**：
- README.md 顶部"AI 协作入口"章节 ≤ 30 行
- 不破坏现有目录树

---

## Task 3：CI workflow 新增 4 步强制门禁

- [ ] 3.1 修改 `.github/workflows/test.yml`
- [ ] 3.2 在 matrix 步骤中、`L1 静态分析`之前新增 4 步
  - [ ] 3.2.1 Step A：`python .trae/scripts/check_twine_escape.py games/${{ matrix.game }}/*.html`
  - [ ] 3.2.2 Step B：`python .trae/scripts/verify_embed.py games/${{ matrix.game }}/*.html`
  - [ ] 3.2.3 Step C：`python .trae/scripts/check_twine_macro_stack.py games/${{ matrix.game }}/*.html`
  - [ ] 3.2.4 Step D：`npx playwright test test/e2e/l10n-sanitize.test.js test/e2e/stale-state.test.js test/e2e/feedback-audit.test.js`
- [ ] 3.3 无 HTML 的剧本（terminal-mystery）跳过 Step A/B/C，仅跑 Step D 中不依赖 HTML 的部分
- [ ] 3.4 现有 L1–L5 步骤保持不变
- [ ] 3.5 `git add .github/workflows/test.yml && git commit -m "ci: add 4 mandatory gates from SKILL.md §6"`

**验证**：
- workflow 包含 4 步门禁
- terminal-mystery matrix 不报错
- 现有 3 剧本 L1–L5 仍 PASS

---

## Task 4 [P]：创建 `framework_diff.template.md` 模板

- [ ] 4.1 在 `games/` 根创建 `framework_diff.template.md`（注：模板放仓根，所有剧本共用）
- [ ] 4.2 模板包含 5 个必填章节
  - [ ] 4.2.1 §1 StoryInit 差异（UI bar / history.maxStates / $cache_max）
  - [ ] 4.2.2 §2 StoryMenu 差异
  - [ ] 4.2.3 §3 StoryCaption 差异
  - [ ] 4.2.4 §4 PassageHeader / PassageFooter 差异
  - [ ] 4.2.5 §5 决策理由（必须对齐 / 保留设计差异 / 修复原版 bug 三类判定）
- [ ] 4.3 模板给出 3 个判定规则的填写示例
- [ ] 4.4 `git add games/framework_diff.template.md && git commit -m "feat(framework): add framework_diff.md template"`

**验证**：
- 模板 ≤ 80 行
- 任一剧本可复制该模板到 `games/<name>/framework_diff.md` 并填写

---

## Task 5：5 个 e2e 防御性测试

> 5 个测试相互独立，可 `[P]` 并行开发。

### Task 5.1 [P] `test/e2e/l10n-sanitize.test.js`

- [ ] 5.1.1 覆盖 `find 陈` / `note 钱某与江某的矛盾` / `find 监控` 3 个 CJK 用例
- [ ] 5.1.2 覆盖 `XX-AG-1\XX-DR-1`（反斜杠）/ `XX-AG-1/XX-DR-1`（正斜杠）2 个特殊字符用例
- [ ] 5.1.3 每个用例用 Playwright 抓取 `body` 文本断言反馈
- [ ] 5.1.4 对所有有 HTML 的剧本（galley-villa / island-death）跑
- [ ] 5.1.5 `git add test/e2e/l10n-sanitize.test.js && git commit -m "test(e2e): add L10n sanitize defensive tests from SKILL.md §8.7"`

### Task 5.2 [P] `test/e2e/stale-state.test.js`

- [ ] 5.2.1 测试流程：先 `save` → 再输入 `帮` → 断言不显示"进度已保存"
- [ ] 5.2.2 扩展用例：先 `note 测试` → 再输入 ` `（纯空格）→ 断言不显示"笔记已记录"
- [ ] 5.2.3 扩展用例：先 `help` → 再输入 `!@#$%`（纯特殊字符）→ 断言不触发 help 内容
- [ ] 5.2.4 `git add test/e2e/stale-state.test.js && git commit -m "test(e2e): add stale state defensive tests from SKILL.md §8.8"`

### Task 5.3 [P] `test/e2e/feedback-audit.test.js`

- [ ] 5.3.1 覆盖所有有副作用命令：`help` / `list` / `save` / `back` / `name` / `note` / `find` / `load` / `hangman`
- [ ] 5.3.2 每个命令的反馈断言：执行后 body 文本必须变化（除非"无消息"显式提示）
- [ ] 5.3.3 反馈文案风格审计：全中文 / 全英文（不允许中英混用）
- [ ] 5.3.4 `git add test/e2e/feedback-audit.test.js && git commit -m "test(e2e): add command feedback audit tests from SKILL.md §8.9"`

### Task 5.4 [P] `test/e2e/framework-drift.test.js`

- [ ] 5.4.1 检查所有有 HTML 的剧本是否存在 `framework_diff.md`
- [ ] 5.4.2 缺失视为 CI 失败（不阻塞 L1–L5，仅追加 check）
- [ ] 5.4.3 `git add test/e2e/framework-drift.test.js && git commit -m "test(e2e): add framework drift tests from SKILL.md §8.6"`

### Task 5.5 [P] `test/e2e/cross-game-baseline.test.js`

- [ ] 5.5.1 审计所有有 HTML 剧本的 4 项基线
  - [ ] 5.5.1.1 UI bar 处理（`UIBar.destroy()` 或 framework_diff.md 说明）
  - [ ] 5.5.1.2 历史策略（`Config.history.maxStates` 或 framework_diff.md 说明）
  - [ ] 5.5.1.3 L10n 字符集（sanitize 正则含 CJK 或 framework_diff.md 说明）
  - [ ] 5.5.1.4 反馈文案风格（中英混用检查）
- [ ] 5.5.2 `git add test/e2e/cross-game-baseline.test.js && git commit -m "test(e2e): add cross-game baseline tests from SKILL.md §8.10"`

---

## Task 6 [P]：创建 `scripts/handoff-validate.js`

- [ ] 6.1 脚本入口：`node scripts/handoff-validate.js <game-name>`
- [ ] 6.2 校验 `games/<game-name>/handoffs/*.json`
- [ ] 6.3 必填字段检查：`from` / `to` / `deliverables` / `assumptions` / `open_questions` / `blockers` / `next_step`
- [ ] 6.4 Agent 名称白名单检查（8 个 Agent 来自 `prompts/README.md`）
- [ ] 6.5 `deliverables` 文件路径存在性检查
- [ ] 6.6 错误时退出码 1 + JSON 报告
- [ ] 6.7 `git add scripts/handoff-validate.js && git commit -m "feat(scripts): add handoff JSON validator"`

**验证**：
- 对空目录（无 handoff 文件）给出友好提示，退出码 0
- 对错误 JSON 立即报错并退出码 1

---

## Task 7 [P]：创建 `scripts/agents-md-lint.js`

- [ ] 7.1 脚本入口：`node scripts/agents-md-lint.js`
- [ ] 7.2 校验 AGENTS.md 包含 5 个规范锚点
  - [ ] 7.2.1 锚点 1：C1–C9 表格
  - [ ] 7.2.2 锚点 2：5 层测试金字塔表
  - [ ] 7.2.3 锚点 3：4 步门禁链
  - [ ] 7.2.4 锚点 4：多剧本基线
  - [ ] 7.2.5 锚点 5：禁止行为清单
- [ ] 7.3 缺失任一锚点 → 退出码 1 + 报告
- [ ] 7.4 `git add scripts/agents-md-lint.js && git commit -m "feat(scripts): add AGENTS.md drift linter"`

**验证**：
- 现行 AGENTS.md（Task 1 产出）通过
- 故意删除某个章节后脚本失败

---

## Task 8：跨剧本补充 `framework_diff.md`

> 3 个剧本独立，可 `[P]` 并行。

- [ ] 8.1 [P] `games/galley-villa/framework_diff.md`：从 `TypeHelp.html` 自身产出（基线 = 0 差异）
- [ ] 8.2 [P] `games/island-death/framework_diff.md`：与 `galley-villa/TypeHelp.html` 对比，记录差异决策
- [ ] 8.3 [P] `games/terminal-mystery/framework_diff.md`：标记 N/A（无 HTML）
- [ ] 8.4 `git add games/*/framework_diff.md && git commit -m "docs(framework): add framework_diff.md for all 3 games"`

**验证**：
- `test/e2e/framework-drift.test.js` PASS
- `test/e2e/cross-game-baseline.test.js` PASS

---

## Task 9：端到端验证

- [ ] 9.1 本地 `npm test`（galley-villa）全 PASS（含 4 步门禁 + L1–L5 + 5 个新 e2e）
- [ ] 9.2 `GXT_GAME=island-death npm test` 全 PASS
- [ ] 9.3 `GXT_GAME=terminal-mystery npm test` 全 PASS（HTML 跳过）
- [ ] 9.4 `node scripts/agents-md-lint.js` PASS
- [ ] 9.5 `node scripts/handoff-validate.js galley-villa` PASS（无 handoff 时友好提示）
- [ ] 9.6 `git status` 无未提交文件
- [ ] 9.7 `git log --oneline -15` 看到 8 个 feat/docs/ci/test commit

---

# Task Dependencies

- [Task 1] 依赖 [Task 0]（AGENTS.md 引用 `.trae/skills/...` 路径必须先入仓）
- [Task 2] 依赖 [Task 1]（README 引用 AGENTS.md）
- [Task 3] 依赖 [Task 0]（CI 调用 `.trae/scripts/*.py` 必须先入仓）
- [Task 4] 无依赖（独立模板）
- [Task 5.1–5.5] 依赖 [Task 0]（部分测试引用 `.trae/` 路径）；5 个子任务可 `[P]` 并行
- [Task 6] 无依赖（独立脚本）
- [Task 7] 依赖 [Task 1]（linter 校验 AGENTS.md）
- [Task 8.1–8.3] 依赖 [Task 4]（模板先存在）；3 个子任务可 `[P]` 并行
- [Task 9] 依赖 [Task 1, 2, 3, 4, 5, 6, 7, 8]（所有前置）

---

# 执行总结（实施时填写）

**预估改动量**：
- 1 个 AGENTS.md（~150 行）
- 1 个 framework_diff.template.md（~80 行）
- 3 个 framework_diff.md（每剧本 1 个，~30 行/个）
- 1 个 .gitignore 微调（+3 行）
- 1 个 README.md 章节插入（+25 行）
- 1 个 CI workflow 4 步（+60 行）
- 5 个 e2e 测试（每文件 ~50–100 行）
- 2 个 scripts/ 工具（每文件 ~80–120 行）
- `.trae/` 一次性 commit（worked example 约 1MB+）

**预估提交数**：10–12 个 commit，每个 commit 单一职责

**预估 CI 耗时**：在 ubuntu-latest 跑 3 剧本 × 5 层 + 4 步门禁 ≈ 3 分钟
