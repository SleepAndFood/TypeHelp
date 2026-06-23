# Checklist

> 完成态由 commit message 记录（本文件不勾选）。
> 验收方法：跑 `npm test -- --game=<key>` 全过。

## CI 强制门禁（A/B/C）

- [ ] `scripts/run-all.js` 在 L1 之前按 A/B/C 顺序跑 3 个 python 脚本
- [ ] 任何 python 脚本非零退出 → 整个 job 立即中止
- [ ] terminal-mystery（无 HTML）跳过 A/B/C
- [ ] `npm test -- --game=galley-villa` 跑通 A/B/C
- [ ] `npm test -- --game=island-death` 跑通 A/B/C

## 多剧本共享基线（AGENTS.md 表 4）

- [ ] `test/static/framework-baseline.test.js` 存在
- [ ] 检查 UI bar: `<<run UIBar.destroy()>>` 或 framework_diff.md 显式说明
- [ ] 检查历史策略: `<<set Config.history.maxStates to N>>` 或 framework_diff.md 显式说明
- [ ] 检查 L10n 字符集: sanitize 含 `\u4e00-\u9fff` 或 framework_diff.md 显式说明英文
- [ ] 检查反馈风格: 反馈文案无中英混用
- [ ] 用 forAllGames 强制遍历 3 剧本

## L10n sanitize

- [ ] `src/commandRouter.js` note 命令加 L10n 检查
- [ ] `test/unit/l10n-sanitize.test.js` 覆盖（纯 CJK / 纯 ASCII / 混合 → reject）
- [ ] `test/e2e/l10n-sanitize.test.js` 在 Playwright 中真实输入

## stale-state

- [ ] `test/e2e/stale-state.test.js` 验证命令后 reload 状态正确重置

## feedback-audit

- [ ] `test/e2e/feedback-audit.test.js` 验证 help 完整性 + 错误反馈 + 中英混用

## CI yml

- [ ] `.github/workflows/test.yml` 含 3 个 python 门禁 step
- [ ] 含 3 个 Playwright E2E step
- [ ] matrix 3 剧本

## 跨剧本全量

- [ ] galley-villa: A/B/C → L1 → L2 → L3 → L4 → L5 全过
- [ ] island-death: A/B/C → L1 → L2 → L3 → L4 → L5 全过
- [ ] terminal-mystery: L1 → L2 → L3 → L5（无 HTML → A/B/C/L4 跳过）
- [ ] 任一剧本全量耗时 ≤ 60s（增加 L5 3 个 E2E 后允许放宽到 60s）

## 历史 spec 文档

- [ ] `setup-twine-test-framework/spec.md / tasks.md / checklist.md` 全部回滚到未勾选原貌
- [ ] 头部加 AGENTS.md §4 规则 4 引用
