# Checklist

> 本文件是"验收标准"的**历史文档**（按 AGENTS.md §4 规则 4 保持原貌）。
> 实际验收结果见 git commit message + `npm test` 输出。
> 剧本适配与 L3 timeline opt-in 等新增约束由后续 spec（如 `integrate-ci-gates-and-baselines`）补充。

## 工程脚手架

- [ ] `package.json` 在根目录，含 vitest/cheerio/jsdom/@playwright/test
- [ ] `package.json` 暴露 6 个 npm script
- [ ] `vitest.config.js` 启用 globals
- [ ] `playwright.config.js` 指向 `test/e2e/**`
- [ ] `npm install` 在干净仓库能成功

## 通用化与配置

- [ ] 根 `game.config.js` 存在
- [ ] `games/galley-villa/test.config.js` 存在并指向 `TypeHelp.html`
- [ ] `games/island-death/test.config.js` 存在并指向 `island-death.html`
- [ ] `games/terminal-mystery/test.config.js` 存在，`htmlFile: null` + `passageFiles`
- [ ] 测试代码无任何剧本特定字面量

## 第 1 层 静态内容分析

- [ ] `test/helpers/parse.js` 实现 `parsePassages` + `parsePassagesFromFiles`
- [ ] `test/static/passage-refs.test.js` 通过
- [ ] `test/static/naming.test.js` 通过
- [ ] `test/static/people-ids.test.js` 通过
- [ ] `test/static/hidden-files.test.js` 通过
- [ ] `test/static/dead-links.test.js` 通过

## 第 2 层 命令路由单元测试

- [ ] `src/commandRouter.js` 实现 `parseCommand`
- [ ] `test/unit/commandRouter.test.js` 通过

## 第 3 层 叙事一致性

- [ ] `test/helpers/timeline.js / clue.js / character.js` 实现
- [ ] `test/narrative/{timeline,clue-coverage,character-consistency}.test.js` 通过

## 第 4 层 渲染正确性

- [ ] `test/render/setup.js` 暴露 `createGameEnv` / `teardown` / `isRenderSupported`
- [ ] `test/render/passage-render.test.js` 通过

## 第 5 层 E2E 冒烟

- [ ] `test/e2e/smoke.test.js` 含 3 条关键路径
- [ ] 浏览器缺失时优雅 skip

## 跨剧本可移植性

- [ ] 切换 3 剧本 `npm test` 全过
- [ ] 任一剧本全量耗时 ≤ 30s
- [ ] CI 配置示例 `.github/workflows/test.yml` 存在

## TDD 合规性

- [ ] 每个 src/ 模块在写入前已有对应失败测试
- [ ] 测试失败原因均为"功能缺失"而非"拼写/import 错误"
- [ ] 全量测试通过时控制台无 error
