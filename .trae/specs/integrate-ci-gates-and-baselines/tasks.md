# Tasks

> 实施顺序遵循 TDD：先 RED 写失败测试，再 GREEN 写最小实现。
> 任务间存在依赖；无依赖任务以 `[P]` 标记可并行。
> 完成态由 commit message 记录（本文件不勾选）。

---

- [ ] Task 0: 复盘违反 + 回滚历史 spec（已在上一 commit 完成）
  - [ ] setup-twine-test-framework/{spec.md, tasks.md, checklist.md} 回滚到未勾选原貌
  - [ ] 历史 spec 头部加 AGENTS.md §4 规则 4 引用

- [ ] Task 1: 集成 3 个 python 门禁到 run-all.js
  - [ ] SubTask 1.1: 跑通 `python .trae/scripts/check_twine_escape.py games/galley-villa/TypeHelp.html`（手动验证可工作）
  - [ ] SubTask 1.2: 跑通 `python .trae/scripts/verify_embed.py games/galley-villa/TypeHelp.html`
  - [ ] SubTask 1.3: 跑通 `python .trae/scripts/check_twine_macro_stack.py games/galley-villa/TypeHelp.html`
  - [ ] SubTask 1.4: 写 `scripts/run-all.js` 在 L1 之前按 A/B/C 顺序跑 3 步，失败立即中止
  - [ ] SubTask 1.5: terminal-mystery（无 HTML）跳过 A/B/C

- [ ] Task 2: 跨剧本 L1 静态 + framework_diff 解析
  - [ ] SubTask 2.1: 写 `test/static/framework-baseline.test.js`，对每个剧本检查 4 项基线（UI bar / 历史 / L10n / 反馈）
  - [ ] SubTask 2.2: 写 `test/helpers/framework-diff.js` 解析 `games/<key>/framework_diff.md`
  - [ ] SubTask 2.3: 用 forAllGames 强制遍历 3 剧本

- [ ] Task 3: L2 单元加 L10n 字符集
  - [ ] SubTask 3.1: `src/commandRouter.js` 中 `note` 命令加 L10n 检查（默认 reject 混合 CJK+ASCII）
  - [ ] SubTask 3.2: 写 `test/unit/l10n-sanitize.test.js`：覆盖（纯 CJK / 纯 ASCII / 混合 → reject）
  - [ ] SubTask 3.3: `commandRouter.test.js` 中加 CJK 输入用例

- [ ] Task 4: L5 E2E 加 3 个专业测试
  - [ ] SubTask 4.1: `test/e2e/l10n-sanitize.test.js`：note CJK + find CJK 真实复现
  - [ ] SubTask 4.2: `test/e2e/stale-state.test.js`：执行命令 → reload → 验证重置
  - [ ] SubTask 4.3: `test/e2e/feedback-audit.test.js`：help 完整性 + 错误输入反馈 + 中英混用检测

- [ ] Task 5: CI yml 集成 4 步门禁
  - [ ] SubTask 5.1: 在 `.github/workflows/test.yml` 中加 3 个 python 门禁 step
  - [ ] SubTask 5.2: 把 L5 的 3 个专业测试列为必要 step（`npm run test:e2e`）
  - [ ] SubTask 5.3: matrix 3 剧本各跑一次

- [ ] Task 6: 跨剧本全量验证
  - [ ] SubTask 6.1: galley-villa: A/B/C → L1-L5 全过
  - [ ] SubTask 6.2: island-death: A/B/C → L1-L5 全过
  - [ ] SubTask 6.3: terminal-mystery: 跳过 A/B/C，L1+L2+L3+L5（无 HTML 跳过 L4）
  - [ ] SubTask 6.4: 记录各剧本全量耗时

---

# Task Dependencies

- Task 1 → Task 6（A/B/C 集成后才能跑全量）
- Task 2 → Task 6（framework-baseline 必须在 L1 之后）
- Task 3 → Task 4（L10n 单元是 E2E 的前提）
- Task 4 → Task 6（E2E 必须在 L1-L5 全过前完成）
- Task 5 → Task 6（CI yml 是最终交付）
