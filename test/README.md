# TxtGame 测试框架

本目录是 SugarCube/Twine 多剧本文字推理游戏的**5 层测试金字塔**实现。

## 5 层结构

| 层 | 工具 | 入口 | 速度 | 覆盖 |
|---|---|---|---|---|
| L1 静态分析 | cheerio + Vitest | `test/static/*.test.js` | < 100ms | passage 引用、命名、人物编号、链接 |
| L2 单元 | Vitest | `test/unit/*.test.js` | < 50ms | 命令路由纯函数 |
| L3 叙事 | Node + Vitest | `test/narrative/*.test.js` | < 2s | 时间线、线索、人物代词 |
| L4 渲染 | jsdom + Vitest | `test/render/*.test.js` | < 5s | SugarCube 引擎初始化、passage 渲染 |
| L5 E2E | Playwright | `test/e2e/*.test.js` | < 15s | 真实浏览器关键路径冒烟 |

## 快速开始

```bash
# 装依赖（首次）
npm install

# 装 Playwright 浏览器（首次）
npx playwright install chromium

# 跑全量（默认 galley-villa）
npm test
# 或
node scripts/run-all.js

# 切剧本
GXT_GAME=island-death node scripts/run-all.js
node scripts/run-all.js --game=terminal-mystery

# 单层跑
npm run test:static
npm run test:unit
npm run test:narrative
npm run test:render
npm run test:e2e
```

## 适配新剧本

在 `games/<your-game>/` 下创建 `test.config.js`：

```js
export default {
  gameName: 'Your Game',
  htmlFile: 'games/your-game/your-game.html', // 或 null + passageFiles（无 HTML）
  engine: 'SugarCube',
  namingPattern: '<your-regex>',
  metaPrefix: '00-',
  metaFiles: ['readme', 'list-of-names'],
  peopleIds: ['1','2','3','K','@'],
  hiddenFiles: [],
  commands: { alwaysAvailable: ['help','list','save','back'], unlockable: [] },
  commandRouterPassage: 'Box',
  timeline: { extractFrom: 'passageName', timeCodePosition: 0, timeCodeLength: 2, locationPattern: "''([^']+)''" },
  criticalClues: [],
  characterConstraints: [],
};
```

然后用 `node scripts/generate-config.js <your-game.html>` 快速生成模板。

## 通用化原则

- 测试代码 / helper / src 中**禁止**硬编码任何剧本特定字面量（人物名、命令名、文件名前缀）
- 所有剧本差异通过 `game.config.js` + `games/<key>/test.config.js` 注入
- 同一份测试代码可对 3 个剧本直接复用

## 目录结构

```
test/
├── helpers/                # 通用辅助（配置加载、解析、叙事分析）
│   ├── config.js           # 合并 game.config.js + games/<key>/test.config.js
│   ├── parse.js            # cheerio 解析 SugarCube HTML
│   ├── timeline.js         # 时间线/地点提取
│   ├── clue.js             # 关键线索覆盖度
│   └── character.js        # 人物代词一致性
├── static/                 # L1
├── unit/                   # L2
├── narrative/              # L3
├── render/                 # L4
└── e2e/                    # L5
```
