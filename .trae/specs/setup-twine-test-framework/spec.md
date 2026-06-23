# Twine 测试框架搭建 Spec

## Why

TxtGame 项目下三个剧本（galley-villa / island-death / terminal-mystery）都是 SugarCube/Twine 引擎生成的 HTML 单文件，目前缺乏自动化测试。手工验证上百个 passage 的引用、命名、时间线、线索、人物一致性既耗时又易遗漏。需搭建一个**通用、配置驱动**的测试框架，覆盖所有剧本，并能在 20 秒内跑完全量测试。

## What Changes

- 新建根级 `package.json` + `vitest.config.js` + `playwright.config.js`，引入测试依赖（cheerio / vitest / jsdom / @playwright/test）
- 新建 `src/` 目录存放从游戏 HTML 中提取出的纯函数（`commandRouter.js` 等）
- 新建 `test/` 目录，按 5 层金字塔组织测试用例
- 新建 `game.config.js`（默认配置） + `games/<game>/test.config.js`（每剧本专属配置）
- 新建 `scripts/extract-router.js` 与 `scripts/generate-config.js` 辅助脚本
- 新建 `tests-fixtures/` 目录存放不可解析/死链等异常 fixture
- 不修改任何游戏 HTML 或设计文档

## Impact

- **Affected specs**：无（不破坏现有 typehelp-novel-design）
- **Affected code**：
  - 新增：`package.json`, `vitest.config.js`, `playwright.config.js`, `game.config.js`, `src/`, `test/`, `scripts/`, `tests-fixtures/`
  - 不修改：`games/**/*.html`, `games/**/*.md`, `README.md`
- **影响面**：测试基础设施，CI 后续可接入

## ADDED Requirements

### Requirement: 项目级测试依赖

系统 SHALL 在仓库根目录提供 `package.json`，声明 `cheerio`、`vitest`、`jsdom`、`@playwright/test` 为开发依赖，并暴露 `npm test` / `npm run test:static` / `npm run test:unit` / `npm run test:narrative` / `npm run test:render` / `npm run test:e2e` 脚本。

#### Scenario: 全新克隆仓库后能运行测试
- **WHEN** 用户执行 `npm install && npm test`
- **THEN** 全部测试在 ≤ 30 秒内跑完并通过
- **AND** 控制台无未处理错误

### Requirement: 第 1 层 — 静态内容分析

系统 SHALL 使用 cheerio 解析任意 SugarCube HTML，输出所有 `tw-passagedata` 的结构化数据，并提供以下测试（毫秒级）：

- `test/static/passage-refs.test.js` — 验证所有 passage 的 `tags` 属性引用的 passage 名称都真实存在
- `test/static/naming.test.js` — 验证所有非 meta 前缀的场景 passage 名称符合 `game.config.js` 中的 `namingPattern`
- `test/static/people-ids.test.js` — 验证 passage 名称中所有人物编号都在 `peopleIds` 列表内
- `test/static/hidden-files.test.js` — 验证 `hiddenFiles` 列表中的文件存在且被 `list` passage 排除
- `test/static/dead-links.test.js` — 验证 passage 文本中 `[[target|...]]` 链接目标全部存在

#### Scenario: 引用了一个不存在的 passage
- **WHEN** 任意 passage 的 `tags` 中出现未定义的 passage 名
- **THEN** `passage-refs.test.js` 失败，并报告 `{ from, missing }`
- **AND** 测试给出可定位的修复指引

### Requirement: 第 2 层 — 命令路由单元测试

系统 SHALL 提供 `src/commandRouter.js` 导出 `parseCommand(rawInput, state)` 纯函数，配套 `test/unit/commandRouter.test.js` 用 Vitest 覆盖以下命令：

- `help` / `list [N]` / `back` / `save`
- `name [N] [昵称]` / `name # [用户名]` / `name` / `name N`（删除）
- `note [内容]` / `find [关键词]`
- 文件名直接输入（cache 命中 / 合法新名 / 非法名）
- 错误路径（空输入 / 参数过多 / 未知命令）

#### Scenario: 空输入与大小写不敏感
- **WHEN** 用户输入 `""`、`"   "`、`"HELP"`、`"Help"`
- **THEN** `parseCommand` 分别返回 `{ action: 'noop' }` / `noop` / `help` / `help`

#### Scenario: name 命令四种模式
- **WHEN** 输入 `name` / `name 1 约翰` / `name 1` / `name 99 x` / `name # 玩家`
- **THEN** 返回 `list` / `set` / `delete` / `error` / `setUsername` 模式
- **AND** `newState` 正确反映 `nicknames` / `username` 变更

### Requirement: 第 3 层 — 叙事一致性验证

系统 SHALL 提供 `test/narrative/` 下的 Vitest 测试，秒级运行：

- `timeline.test.js` — 同一时间码下同一人物不应出现在 ≥ 2 个不同地点
- `clue-coverage.test.js` — `criticalClues` 中每条关键词至少在 `minAppearances` 个 passage 出现
- `character-consistency.test.js` — 人物 passage 中不出现 `forbiddenPatterns` 列表中的代词

#### Scenario: 关键线索出现次数不足
- **WHEN** 配置中某条线索 `minAppearances: 3`，但 HTML 中只出现 2 次
- **THEN** `clue-coverage.test.js` 失败，报告 `{ keyword, actualCount, minAppearances }`

### Requirement: 第 4 层 — 渲染正确性测试

系统 SHALL 用 jsdom 在 Node.js 中加载 SugarCube HTML，验证引擎初始化与 passage 渲染（百毫秒级）：

- `test/render/setup.js` — 暴露 `createGameEnv(htmlPath)` 与 `teardown()`
- `test/render/passage-render.test.js` — 验证 `window.Story` / `window.State` / `window.SugarCube` 存在；能通过 `Story.get(name)` 取得 passage

#### Scenario: 引擎初始化成功
- **WHEN** `createGameEnv` 加载一个合法 SugarCube HTML
- **THEN** 等待 ≤ 2 秒后 `window.Story` 非空
- **AND** `Story.get('00-list-of-names')` 返回非空文本

### Requirement: 第 5 层 — E2E 冒烟测试

系统 SHALL 用 Playwright 在真实浏览器中跑 5-8 条关键路径冒烟（秒级）：

- 启动无 JS 错误
- `help` 命令显示帮助
- `name 1 测试` 设置昵称后渲染为 `[1 测试]`
- `note 文本` 笔记列表出现该条目
- `find 关键词` 返回含关键词的文件
- 打开合法文件名 cache 更新
- `save` 弹出存档界面
- `back` 返回上一页

#### Scenario: 完整冒烟
- **WHEN** Playwright 依次执行 5-8 条关键命令
- **THEN** 全部断言通过且 `pageerror` 监听器无错误

### Requirement: 通用化配置驱动

系统 SHALL 通过 `game.config.js`（根级默认）+ `games/<game>/test.config.js`（剧本级覆盖）注入所有游戏特定信息：

```js
{
  gameName, htmlFile, engine,
  namingPattern, metaPrefix, metaFiles,
  peopleIds, hiddenFiles, narratorId,
  commands: { alwaysAvailable, unlockable },
  commandRouterPassage,
  timeline: { extractFrom, timeCodePosition, timeCodeLength, locationPattern },
  criticalClues: [{ keyword, minAppearances, description }],
  characterConstraints: [{ id, name, pronouns, forbiddenPatterns }],
  hasTestingMode, testingVariable, testingPassage,
}
```

系统 SHALL 不在任何测试代码、helper、src 模块中硬编码任何剧本的人物名、命令名、文件名前缀。

#### Scenario: 切换到 island-death 剧本
- **WHEN** 在 `package.json` 中将默认 config 切换为 `games/island-death/test.config.js`
- **THEN** 全部 5 层测试在不改任何测试代码的情况下对 island-death 通过

#### Scenario: 适配 terminal-mystery（无 HTML）
- **WHEN** terminal-mystery 仅含分片 passage 文件
- **THEN** `parsePassages` 通过 `htmlFile: null` + `passageFiles: [...]` 走 fallback 路径，仅跑 L1+L3，跳过 L4/L5

## MODIFIED Requirements

无

## REMOVED Requirements

无
