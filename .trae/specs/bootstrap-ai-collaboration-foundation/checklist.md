# Checklist：AI 协作基础设施与项目框架补齐

> 本清单按 `spec.md` 的 9 个 Requirement + 3 个 MODIFIED Requirement 逐项验证。每项含**具体验证命令 / 文件路径 / 通过标准**。

---

## A. `.trae/` 共享方法论入仓（Task 0）

- [ ] **A.1** `.gitignore` 含 `!.trae/skills/` / `!.trae/specs/` / `!.trae/scripts/` 3 行反项
- [ ] **A.2** `git check-ignore -v .trae/skills/typehelp-novel-design/SKILL.md` 返回**非忽略**（空输出 = 非忽略；`!.gitignore:XX:.trae/...` = 忽略）
- [ ] **A.3** `git check-ignore -v .trae/specs/typehelp-novel-design/prompts/director.md` 返回非忽略
- [ ] **A.4** `git check-ignore -v .trae/scripts/embed_sugarcube_engine.py` 返回非忽略
- [ ] **A.5** `git check-ignore -v .trae/scripts/verify_embed.py` 返回非忽略
- [ ] **A.6** `git check-ignore -v .trae/scripts/check_twine_escape.py` 返回非忽略
- [ ] **A.7** `git check-ignore -v .trae/scripts/check_twine_macro_stack.py` 返回非忽略
- [ ] **A.8** `git ls-files .trae/skills/typehelp-novel-design/SKILL.md` 返回真实路径（非空）
- [ ] **A.9** `git ls-files .trae/specs/typehelp-novel-design/example-blackbox/TypeHelp_NewGame_embedded.html` 返回真实路径
- [ ] **A.10** `.trae/documents/` 仍被忽略（如存在）
- [ ] **A.11** `.trae/.tmp/` 仍被忽略（如存在）

---

## B. AGENTS.md 仓级入口（Task 1）

- [ ] **B.1** 仓根存在 `AGENTS.md`
- [ ] **B.2** AGENTS.md 包含 5 个章节
  - [ ] **B.2.1** §1 项目一句话定位（≤ 50 字）
  - [ ] **B.2.2** §2 AI 必读顺序（5 个文件，编号 1-5）
  - [ ] **B.2.3** §3 仓级规范速查（4 张子表）
  - [ ] **B.2.4** §4 禁止行为清单（5 条，编号 1-5）
  - [ ] **B.2.5** §5 入口指向（指向 SKILL.md §6 / §8 / §10）
- [ ] **B.3** AGENTS.md ≤ 200 行
- [ ] **B.4** AGENTS.md 引用路径使用相对路径或 `file:///` 锚点
- [ ] **B.5** `node scripts/agents-md-lint.js`（Task 7 产出）PASS

---

## C. README.md "AI 协作入口"章节（Task 2）

- [ ] **C.1** README.md 顶部"AI 协作入口"章节存在
- [ ] **C.2** 章节位于"剧本索引"表**之前**
- [ ] **C.3** 章节包含 3 个子项
  - [ ] **C.3.1** 指向 `AGENTS.md` 的相对路径
  - [ ] **C.3.2** 指向 `.trae/skills/typehelp-novel-design/SKILL.md` 的相对路径
  - [ ] **C.3.3** "AI 协作者必读顺序"列表
- [ ] **C.4** 章节 ≤ 30 行
- [ ] **C.5** 现有"剧本索引"表 + "如何贡献新剧本"章节内容**不变**

---

## D. CI workflow 4 步强制门禁（Task 3）

- [ ] **D.1** `.github/workflows/test.yml` 在 `L1 静态分析`步骤**之前**有 4 个新增步骤
- [ ] **D.2** Step A 调用 `python .trae/scripts/check_twine_escape.py games/${{ matrix.game }}/*.html`
- [ ] **D.3** Step B 调用 `python .trae/scripts/verify_embed.py games/${{ matrix.game }}/*.html`
- [ ] **D.4** Step C 调用 `python .trae/scripts/check_twine_macro_stack.py games/${{ matrix.game }}/*.html`
- [ ] **D.5** Step D 调用 `npx playwright test test/e2e/l10n-sanitize.test.js test/e2e/stale-state.test.js test/e2e/feedback-audit.test.js`
- [ ] **D.6** terminal-mystery matrix（无 HTML）跳过 Step A/B/C，仅跑 Step D
- [ ] **D.7** 现有 L1–L5 步骤**未删除**
- [ ] **D.8** workflow 整体可被 GitHub Actions 解析（语法合法）

---

## E. framework_diff.template.md 模板（Task 4）

- [ ] **E.1** `games/framework_diff.template.md` 存在
- [ ] **E.2** 模板包含 5 个必填章节
  - [ ] **E.2.1** §1 StoryInit 差异
  - [ ] **E.2.2** §2 StoryMenu 差异
  - [ ] **E.2.3** §3 StoryCaption 差异
  - [ ] **E.2.4** §4 PassageHeader / PassageFooter 差异
  - [ ] **E.2.5** §5 决策理由
- [ ] **E.3** 模板给出 3 类判定规则的填写示例（必须对齐 / 保留设计差异 / 修复原版 bug）
- [ ] **E.4** 模板 ≤ 80 行

---

## F. 5 个 e2e 防御性测试（Task 5）

### F.1 L10n sanitize 测试

- [ ] **F.1.1** `test/e2e/l10n-sanitize.test.js` 存在
- [ ] **F.1.2** 覆盖 3 个 CJK 用例：`find 陈` / `note 钱某与江某的矛盾` / `find 监控`
- [ ] **F.1.3** 覆盖 2 个特殊字符用例：`XX-AG-1\XX-DR-1` / `XX-AG-1/XX-DR-1`
- [ ] **F.1.4** 每个用例用 Playwright 抓取 `body` 文本断言
- [ ] **F.1.5** 对 galley-villa + island-death 跑（terminal-mystery 无 HTML 跳过）
- [ ] **F.1.6** `npx playwright test test/e2e/l10n-sanitize.test.js` PASS

### F.2 stale state 测试

- [ ] **F.2.1** `test/e2e/stale-state.test.js` 存在
- [ ] **F.2.2** 主用例：先 `save` → 再输入 `帮` → 断言不显示"进度已保存"
- [ ] **F.2.3** 扩展用例：先 `note 测试` → 再输入 ` `（纯空格）→ 断言不显示"笔记已记录"
- [ ] **F.2.4** 扩展用例：先 `help` → 再输入 `!@#$%` → 断言不触发 help 内容
- [ ] **F.2.5** `npx playwright test test/e2e/stale-state.test.js` PASS

### F.3 命令反馈完整性审计

- [ ] **F.3.1** `test/e2e/feedback-audit.test.js` 存在
- [ ] **F.3.2** 覆盖所有有副作用命令：`help` / `list` / `save` / `back` / `name` / `note` / `find` / `load` / `hangman`
- [ ] **F.3.3** 每个命令执行后断言 body 文本变化
- [ ] **F.3.4** 反馈文案风格审计（中英混用检查）
- [ ] **F.3.5** `npx playwright test test/e2e/feedback-audit.test.js` PASS

### F.4 framework drift 测试

- [ ] **F.4.1** `test/e2e/framework-drift.test.js` 存在
- [ ] **F.4.2** 检查所有有 HTML 剧本的 `framework_diff.md` 存在
- [ ] **F.4.3** 缺失时 CI 失败（不阻塞 L1–L5，仅追加 check）
- [ ] **F.4.4** `npx playwright test test/e2e/framework-drift.test.js` PASS

### F.5 跨剧本基线审计

- [ ] **F.5.1** `test/e2e/cross-game-baseline.test.js` 存在
- [ ] **F.5.2** 审计 4 项基线
  - [ ] **F.5.2.1** UI bar 处理（`UIBar.destroy()` 或 framework_diff.md 说明）
  - [ ] **F.5.2.2** 历史策略（`Config.history.maxStates` 或 framework_diff.md 说明）
  - [ ] **F.5.2.3** L10n 字符集（sanitize 正则含 CJK 或 framework_diff.md 说明）
  - [ ] **F.5.2.4** 反馈文案风格（中英混用检查）
- [ ] **F.5.3** `npx playwright test test/e2e/cross-game-baseline.test.js` PASS

---

## G. handoff JSON 校验工具（Task 6）

- [ ] **G.1** `scripts/handoff-validate.js` 存在
- [ ] **G.2** 入口 `node scripts/handoff-validate.js <game-name>` 可执行
- [ ] **G.3** 校验 `games/<game-name>/handoffs/*.json` 必填字段（`from` / `to` / `deliverables` / `assumptions` / `open_questions` / `blockers` / `next_step`）
- [ ] **G.4** Agent 名称白名单检查（8 个 Agent：`director` / `truth-designer` / `inference-architect` / `file-designer` / `tag-graph-designer` / `meta-tutorial-designer` / `formal-verifier` / `twine-implementer` / `playtester`）
- [ ] **G.5** `deliverables` 文件路径存在性检查
- [ ] **G.6** 空目录（无 handoff 文件）退出码 0 + 友好提示
- [ ] **G.7** 错误 JSON 退出码 1 + JSON 报告
- [ ] **G.8** 对 `galley-villa` 跑（无 handoff 目录）应退出 0

---

## H. AGENTS.md 漂移 linter（Task 7）

- [ ] **H.1** `scripts/agents-md-lint.js` 存在
- [ ] **H.2** 入口 `node scripts/agents-md-lint.js` 可执行
- [ ] **H.3** 校验 5 个规范锚点
  - [ ] **H.3.1** C1–C9 表格存在
  - [ ] **H.3.2** 5 层测试金字塔表存在
  - [ ] **H.3.3** 4 步门禁链存在
  - [ ] **H.3.4** 多剧本基线表存在
  - [ ] **H.3.5** 禁止行为清单存在
- [ ] **H.4** 现行 AGENTS.md（Task 1 产出）通过
- [ ] **H.5** 删除某章节后脚本退出 1

---

## I. 跨剧本 framework_diff.md 产出（Task 8）

- [ ] **I.1** `games/galley-villa/framework_diff.md` 存在
- [ ] **I.2** `games/island-death/framework_diff.md` 存在
- [ ] **I.3** `games/terminal-mystery/framework_diff.md` 存在（标记 N/A）
- [ ] **I.4** 3 个 framework_diff.md 均覆盖 5 个必填章节
- [ ] **I.5** `test/e2e/framework-drift.test.js` PASS
- [ ] **I.6** `test/e2e/cross-game-baseline.test.js` PASS

---

## J. 端到端验证（Task 9）

- [ ] **J.1** 本地 `npm test`（galley-villa）全 PASS
  - 4 步门禁 PASS + L1–L5 PASS + 5 个新 e2e PASS
- [ ] **J.2** `GXT_GAME=island-death npm test` 全 PASS
- [ ] **J.3** `GXT_GAME=terminal-mystery npm test` 全 PASS（HTML 跳过）
- [ ] **J.4** `node scripts/agents-md-lint.js` 退出 0
- [ ] **J.5** `node scripts/handoff-validate.js galley-villa` 退出 0（无 handoff 友好提示）
- [ ] **J.6** `git status` 无未提交文件
- [ ] **J.7** `git log --oneline -15` 含 10–12 个 feat/docs/ci/test commit

---

## 验收门（Go / No-Go）

- [ ] **A 全 PASS** → 基础设施入仓完成
- [ ] **B + C PASS** → AI 协作入口可见
- [ ] **D PASS** → CI 强制门禁链就位
- [ ] **E + I PASS** → framework_diff 模板与跨剧本产出就位
- [ ] **F + G + H PASS** → 防御性测试 + 校验工具就位
- [ ] **J 全 PASS** → 端到端 CI 全过

**Go 条件**：A–J 全部 PASS，**且** `git clone` 后的全新仓库能看到 AGENTS.md + SKILL.md + 4 步 CI 门禁。

---

## SKILL.md 9 项硬约束 + 11 条经验教训 防御映射

> 验证本 spec 的防御覆盖度。

### 9 项硬约束

| # | 约束 | 本 spec 防御 | 验证项 |
|---|---|---|---|
| C1 | 单一文本框 | `test/e2e/feedback-audit.test.js` | F.3 |
| C2 | 无 inventory | L1 静态分析（既有） | （既有） |
| C3 | 文件名 = 元数据 | L1 静态分析 `naming.test.js`（既有） | （既有） |
| C4 | tag 互引 | L1 静态分析 `passage-refs.test.js`（既有） | （既有） |
| C5 | 进度 = 收集数 | L1 静态分析（既有） | （既有） |
| C6 | meta 元素 | L1 静态分析 `hidden-files.test.js`（既有） | （既有） |
| C7 | 教程渐进 | `test/e2e/feedback-audit.test.js` | F.3 |
| C8 | 多视角多文件 | L3 叙事测试（既有） | （既有） |
| C9 | 唯一结局 | L1 + L3（既有） | （既有） |

### 11 条经验教训

| # | 教训 | 本 spec 防御 | 验证项 |
|---|---|---|---|
| §8.1 | 症状导向诊断陷阱 | AGENTS.md 禁止行为清单第 1 条 | B.2.4 |
| §8.2 | 静态分析必要不充分 | D.5（Step D = Playwright 强制） | D.5 |
| §8.3 | 流程链断裂 | E + I（framework_diff 强制） | E + I |
| §8.4 | 文档自指污染 | H（AGENTS.md 漂移 linter） | H |
| §8.5 | 引擎知识盲区 | F.5（跨剧本基线 UI bar 审计） | F.5.2.1 |
| §8.6 | 框架配置漂移 | E + F.4（framework_diff 模板 + 测试） | E + F.4 |
| §8.7 | L10n sanitize | F.1（CJK + 特殊字符测试） | F.1 |
| §8.8 | stale state | F.2（空净化输入测试） | F.2 |
| §8.9 | 反馈完整性 | F.3（命令反馈审计） | F.3 |
| §8.10 | 跨剧本一致性 | F.5（4 项基线审计） | F.5 |
| §8.11 | Playwright 6 陷阱 | D.5（统一在 Playwright 中跑） + `playwright.config.js` 已配置 timeout | D.5 + 既有 |

### 12 条错误速查（§10）

| # | 错误 | 本 spec 防御 | 验证项 |
|---|---|---|---|
| §10.1 | 卡在命令不会用 | F.3（教程反馈审计） | F.3 |
| §10.2 | 文件名不会输入 | （既有 00-readme 设计） | （既有） |
| §10.3 | 多解 | （既有 L3 唯一性） | （既有） |
| §10.4 | 死链 | （既有 L1 dead-links） | （既有） |
| §10.5 | 幽灵线索 | （既有 L3 完备性） | （既有） |
| §10.6 | 玩家无法推理 | （既有 L3 双证据） | （既有） |
| §10.7 | meta 触发率低 | （既有 hidden-files） | （既有） |
| §10.8 | Verifier 总 FAIL | （既有 verification_report） | （既有） |
| §10.9 | 双击 HTML 只看到裸 ui-bar | D.3（verify_embed.py CI 强制） | D.3 |
| §10.10 | `<<elseif>>` 报错 | D.4（check_twine_macro_stack.py CI 强制） | D.4 |
| §10.11 | 想覆盖左下角标题 | F.5.2.1（UI bar 基线审计） | F.5.2.1 |
| §10.12 | 想汉化菜单 | F.5.2.4（反馈风格审计） | F.5.2.4 |
| §10.13 | 中文 find/note 失败 | F.1（L10n sanitize 测试） | F.1 |
| §10.14 | stale state 误触发 | F.2（stale state 测试） | F.2 |
| §10.15 | 框架级配置漂移 | E + F.4（framework_diff 模板 + 测试） | E + F.4 |
| §10.16 | load 静默无反馈 | F.3（反馈审计） | F.3 |
| §10.17 | 错误消息中英混用 | F.3 + F.5.2.4（风格审计） | F.3 + F.5.2.4 |
| §10.18 | 反斜杠被吞 | F.1.3（特殊字符测试） | F.1.3 |

**覆盖度**：9 项硬约束 100% 覆盖；11 条经验教训 100% 覆盖；18 条错误速查（§10 实际 12 条主错误 + 6 条衍生）100% 覆盖。

---

## 一句话验收

> 任何 `git clone` 后的协作者 5 分钟内**应能**：
> 1. 读 `AGENTS.md` 知道入口在哪
> 2. 读 `SKILL.md` 知道方法论
> 3. 跑 `npm test` 看到 4 步门禁 + L1–L5 + 5 个新 e2e 全 PASS
> 4. 知道修改任何文件前**必须**参照的规范
