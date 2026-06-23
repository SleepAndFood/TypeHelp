# Tasks

> 实施顺序遵循 TDD：每个任务先 RED 写失败测试，再 GREEN 写最小实现，最后 REFACTOR。
> 任务间存在依赖；无依赖任务以 `[P]` 标记可并行。
>
> **关于完成态**：本文件是"任务定义 + 验收标准"的**历史文档**（按 AGENTS.md §4 规则 4 保持原貌）。
> 实际完成情况见 git commit message 与 `test/README.md`，不在本文件打勾。

---

- [ ] Task 0: 项目初始化（脚手架与依赖）
  - [ ] SubTask 0.1: 在仓库根创建 `package.json`，声明 `cheerio`、`vitest`、`@playwright/test`、`jsdom` 为 devDependencies，Node ≥ 18
  - [ ] SubTask 0.2: 创建 `vitest.config.js`（启用 globals、配置 test/ 路径）
  - [ ] SubTask 0.3: 创建 `playwright.config.js`（testDir=e2e, timeout=10s）
  - [ ] SubTask 0.4: 把 `package.json` / `vitest.config.js` / `playwright.config.js` 加入版本控制
  - [ ] SubTask 0.5: 验证 `npm install` 成功，`npx vitest --version` 可用

- [ ] Task 1: [RED] 编写 `test/helpers/parse.test.js`
  - [ ] SubTask 1.1: 准备最小 SugarCube HTML fixture
  - [ ] SubTask 1.2: 写 `parsePassages(htmlPath)` 单元测试
  - [ ] SubTask 1.3: 验证 RED

- [ ] Task 2: [GREEN] 实现 `test/helpers/parse.js`

- [ ] Task 3: [P] 默认配置与三剧本配置

- [ ] Task 4: [RED] 编写第 1 层静态分析 5 个测试
  - [ ] passage-refs / naming / people-ids / hidden-files / dead-links

- [ ] Task 5: [GREEN] 实现第 1 层 helper

- [ ] Task 6: [RED] 编写第 2 层 `test/unit/commandRouter.test.js`

- [ ] Task 7: [GREEN] 实现 `src/commandRouter.js`

- [ ] Task 8: [RED] 编写第 3 层叙事一致性 3 个测试

- [ ] Task 9: [GREEN] 实现叙事 helper

- [ ] Task 10: [RED] 编写第 4 层渲染测试

- [ ] Task 11: [GREEN] 实现 `test/render/setup.js`

- [ ] Task 12: [RED/GREEN] 编写第 5 层 E2E 冒烟

- [ ] Task 13: 辅助脚本
  - [ ] extract-router.js / generate-config.js / run-all.js

- [ ] Task 14: 跨剧本全量验证

- [ ] Task 15: 文档与 CI
  - [ ] test/README.md + .github/workflows/test.yml

---

# Task Dependencies

- Task 1 → Task 2（先写测试再实现）
- Task 2 → Task 4（parse 是 L1 测试的前置）
- Task 3 [P]（独立，可与 Task 2 并行）
- Task 4 → Task 5
- Task 6 → Task 7
- Task 8 → Task 9
- Task 10 → Task 11
- Task 13 [P]
- Task 14 在 Task 5/7/9/11/12 全部完成后进行
- Task 15 在 Task 14 完成后进行
