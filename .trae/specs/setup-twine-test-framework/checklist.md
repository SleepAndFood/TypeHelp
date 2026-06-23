# Checklist

## 工程脚手架

- [x] `package.json` 在根目录，含 vitest/cheerio/jsdom/@playwright/test
- [x] `package.json` 暴露 6 个 npm script：`test` / `test:static` / `test:unit` / `test:narrative` / `test:render` / `test:e2e`
- [x] `vitest.config.js` 启用 globals，指向 `test/**`
- [x] `playwright.config.js` 指向 `test/e2e/**`
- [x] `npm install` 在干净仓库能成功

## 通用化与配置

- [x] 根 `game.config.js` 存在，字段与 spec 中定义一致
- [x] `games/galley-villa/test.config.js` 存在并指向 `TypeHelp.html`
- [x] `games/island-death/test.config.js` 存在并指向 `island-death.html`
- [x] `games/terminal-mystery/test.config.js` 存在，`htmlFile: null` + `passageFiles` 指向分片
- [x] 测试代码 / helper / src 模块中无任何剧本特定字面量（人物名、命令名、文件名前缀）

## 第 1 层 静态内容分析

- [x] `test/helpers/parse.js` 实现 `parsePassages(htmlPath)` 与 `parsePassagesFromFiles(files)`
- [x] `test/static/passage-refs.test.js` 通过：所有 passage 的 tags 引用都存在
- [x] `test/static/naming.test.js` 通过：场景 passage 名称符合 namingPattern
- [x] `test/static/people-ids.test.js` 通过：人物编号在 peopleIds 白名单内
- [x] `test/static/hidden-files.test.js` 通过：隐藏文件存在（默认不强制 list 排除）
- [x] `test/static/dead-links.test.js` 通过：passage 内部 ASCII 链接目标存在
- [x] L1 15 tests passed in ~1.3s
- [x] 对抗性注入验证：故意改 1 个 passage 名 → naming + passage-refs 测试同时捕获（含 3 个连锁悬空引用）
- [x] forAllGames 强制 3 剧本全跑，杜绝"全过假象"

## 第 2 层 命令路由单元测试

- [x] `src/commandRouter.js` 实现 `parseCommand(rawInput, state)` 纯函数
- [x] `test/unit/commandRouter.test.js` 通过：8/8 用例
- [x] L2 8 tests in 7ms

## 第 3 层 叙事一致性

- [x] `test/helpers/timeline.js` 暴露 `extractTimeCode` / `extractLocations` / `findTimelineContradictions`
- [x] `test/helpers/clue.js` 暴露 `findUncoveredClues`
- [x] `test/helpers/character.js` 暴露 `findPronounIssues`
- [x] `test/narrative/timeline.test.js` 通过
- [x] `test/narrative/clue-coverage.test.js` 通过
- [x] `test/narrative/character-consistency.test.js` 通过
- [x] L3 4/4 passed in ~600ms

## 第 4 层 渲染正确性

- [x] `test/render/setup.js` 暴露 `createGameEnv` / `teardown` / `isRenderSupported`
- [x] `test/render/passage-render.test.js` 通过：jsdom 加载无错 + 引擎 init 降级为 warn
- [x] L4 2/2 passed in ~500ms
- [x] terminal-mystery 剧本下 L4 自动 skipped

## 第 5 层 E2E 冒烟

- [x] `test/e2e/smoke.test.js` 含 3 条关键路径 + 浏览器可用性预检
- [x] galley-villa / island-death 全部断言（启动/help/打开文件）；浏览器缺失时优雅 skip
- [x] terminal-mystery 剧本下 L5 自动 skipped

## 跨剧本可移植性

- [x] galley-villa `npm test` 5 层全过，26.5s
- [x] island-death `npm test` 5 层全过，26s
- [x] terminal-mystery `npm test` L1+L3 全过（L4/L5 skipped），15s
- [x] 任一剧本全量耗时 ≤ 30s
- [x] CI 配置示例 `.github/workflows/test.yml` 包含 5 层 step + matrix 3 剧本

## TDD 合规性

- [x] 每个 src/ 模块在写入前已有对应失败测试（parse.test.js → parse.js; commandRouter.test.js → commandRouter.js）
- [x] 测试失败原因均为"功能缺失"而非"拼写/import 错误"
- [x] 全量测试通过时控制台无 error（jsdom 引擎初始化超时降级为 warn）
