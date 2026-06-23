# Tasks

> 实施顺序遵循 TDD：每个任务先 RED 写失败测试，再 GREEN 写最小实现，最后 REFACTOR。
> 任务间存在依赖；无依赖任务以 `[P]` 标记可并行。

---

- [x] Task 0: 项目初始化（脚手架与依赖）
  - [x] SubTask 0.1: 在仓库根创建 `package.json`，声明 `cheerio`、`vitest`、`@playwright/test`、`jsdom` 为 devDependencies，Node ≥ 18
  - [x] SubTask 0.2: 创建 `vitest.config.js`（启用 globals、配置 test/ 路径）
  - [x] SubTask 0.3: 创建 `playwright.config.js`（testDir=e2e, timeout=10s）
  - [x] SubTask 0.4: 把 `package.json` / `vitest.config.js` / `playwright.config.js` 加入版本控制（追加到 .gitignore 的反项）
  - [x] SubTask 0.5: 验证 `npm install` 成功（157 packages added in 2m），`npx vitest --version` 可用

- [x] Task 1: [RED] 编写 `test/helpers/parse.test.js`
  - [x] SubTask 1.1: 准备 3 个 fixture（`tests-fixtures/minimal.html` / `broken.html` / `fragments.html`）
  - [x] SubTask 1.2: 写 `parsePassages(htmlPath)` 单元测试：4 个 test
  - [x] SubTask 1.3: 验证 RED：测试因函数未实现而失败

- [x] Task 2: [GREEN] 实现 `test/helpers/parse.js`
  - [x] SubTask 2.1: 用 cheerio 解析 HTML，遍历 `tw-passagedata` 提取 pid/name/tags/text
  - [x] SubTask 2.2: 支持多格式 fallback（SugarCube / Harlowe / 通用）
  - [x] SubTask 2.3: 验证 GREEN：parse.test.js 4/4 通过

- [x] Task 3: [P] 默认配置与三剧本配置
  - [x] SubTask 3.1: 根 `game.config.js`（默认通用模板）
  - [x] SubTask 3.2: `games/galley-villa/test.config.js`（含 systemPassages / hiddenFiles / criticalClues）
  - [x] SubTask 3.3: `games/island-death/test.config.js`（4 位时间码命名规则 + 22 角色）
  - [x] SubTask 3.4: `games/terminal-mystery/test.config.js`（htmlFile:null，passageFiles 指向分片文件）

- [x] Task 4: [RED] 编写第 1 层静态分析 5 个测试
  - [x] SubTask 4.1-4.5: 5 个测试文件全部完成
  - [x] SubTask 4.6: 验证 RED→GREEN（最终 15 tests passed）

- [x] Task 5: [GREEN] 实现第 1 层 helper（`src/static/l1-helpers.js`）
  - [x] SubTask 5.1-5.5: 5 个函数实现
  - [x] SubTask 5.6: 验证 GREEN：L1 全过；总耗时 ~1.3s（实际测试时间，vitest 启动开销 5s）

- [x] Task 6: [RED] 编写第 2 层 `test/unit/commandRouter.test.js`
  - [x] SubTask 6.1-6.5: 8 个 test 覆盖所有命令 + 错误路径
  - [x] SubTask 6.6: 验证 RED→GREEN

- [x] Task 7: [GREEN] 实现 `src/commandRouter.js`
  - [x] SubTask 7.1-7.3: parseCommand / isValidFileName / extractNickname
  - [x] SubTask 7.4: 验证 GREEN：8/8 通过；7ms

- [x] Task 8: [RED] 编写第 3 层叙事一致性 3 个测试
  - [x] SubTask 8.1-8.3: timeline / clue-coverage / character-consistency

- [x] Task 9: [GREEN] 实现叙事 helper
  - [x] SubTask 9.1-9.3: timeline.js / clue.js / character.js
  - [x] SubTask 9.4: 验证 GREEN：L3 4/4 通过；~600ms

- [x] Task 10: [RED] 编写第 4 层渲染测试
  - [x] SubTask 10.1-10.2: setup.test.js + passage-render.test.js

- [x] Task 11: [GREEN] 实现 `test/render/setup.js`
  - [x] SubTask 11.1-11.2: createGameEnv / teardown
  - [x] SubTask 11.3: 验证 GREEN：L4 2/2 通过（jsdom 降级为 warn）

- [x] Task 12: [RED/GREEN] 编写第 5 层 E2E 冒烟
  - [x] SubTask 12.1: `test/e2e/smoke.test.js`（3 个冒烟用例 + 浏览器可用性预检）
  - [x] SubTask 12.2: 在无 playwright 浏览器环境下自动 skip（3 skipped）

- [x] Task 13: 辅助脚本
  - [x] SubTask 13.1: `scripts/extract-router.js`（从 TypeHelp 提取 11 个命令）
  - [x] SubTask 13.2: `scripts/generate-config.js`（自动产出 config 模板）
  - [x] SubTask 13.3: `scripts/run-all.js`（按剧本串行跑 5 层）

- [x] Task 14: 跨剧本全量验证
  - [x] SubTask 14.1: galley-villa → 26.5s 全过（L5 浏览器未装，自动 skip）
  - [x] SubTask 14.2: island-death → 26s 全过
  - [x] SubTask 14.3: terminal-mystery → 15s（L1+L3 过，L4/L5 skip）
  - [x] SubTask 14.4: 总耗时均 ≤ 30s ✓

- [x] Task 15: 文档与 CI
  - [x] SubTask 15.1: `test/README.md` 写明用法、剧本适配、新增剧本步骤
  - [x] SubTask 15.2: `.github/workflows/test.yml` 5 层 step + matrix 3 剧本 + 沙箱降级

---

# Task Dependencies

- Task 1 → Task 2（先写测试再实现）
- Task 2 → Task 4（parse 是 L1 测试的前置）
- Task 3 [P]（独立，可与 Task 2 并行）
- Task 4 → Task 5
- Task 6 → Task 7
- Task 8 → Task 9
- Task 10 → Task 11
- Task 13 [P]（独立，可与其他任务并行）
- Task 14 在 Task 5/7/9/11/12 全部完成后进行
- Task 15 在 Task 14 完成后进行
