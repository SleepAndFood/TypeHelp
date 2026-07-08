# TxtGame 首页实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为 TxtGame 创建一个风格统一的静态首页入口，可自动发现 `games/` 下的子剧本并跳转启动。

**架构：** 纯静态 `index.html` 通过 `fetch('./games.json')` 加载剧本元数据并渲染卡片；`games.json` 由 `scripts/generate-games-json.js` 扫描各剧本 `README.md` 自动生成；整体采用暗色终端风格，支持 GitHub Pages 部署。

**技术栈：** 原生 HTML/CSS/JS，Node.js 20+，Vitest，Playwright。

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `index.html` | 项目首页入口，渲染 Hero、剧本卡片网格、页脚 |
| `games.json` | 剧本元数据（生成产物），被 `index.html` 加载 |
| `scripts/generate-games-json.js` | 扫描 `games/` 目录，从 `README.md` 提取元数据，写入 `games.json` |
| `test/unit/generate-games-json.test.js` | 验证生成脚本的解析逻辑 |
| `test/e2e/homepage.test.js` | 验证首页加载、卡片渲染、跳转 |
| `package.json` | 新增 `build:games` npm script |

---

## 任务 1：实现 generate-games-json.js

**文件：**
- 创建：`scripts/generate-games-json.js`

**步骤：**

- [ ] **步骤 1.1：编写脚本主体**

```javascript
// scripts/generate-games-json.js
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GAMES_DIR = path.join(ROOT, 'games');
const OUT_FILE = path.join(ROOT, 'games.json');

function readReadme(dir) {
  const p = path.join(dir, 'README.md');
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf-8');
}

function extractTitle(content) {
  const m = content.match(/^#\s+(.+)$/m);
  if (!m) return null;
  const raw = m[1].trim();
  // 分离中文名和英文名，如 "嘉利别墅 (Galley Villa)"
  const bracket = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (bracket) {
    return { title: bracket[1].trim(), subtitle: bracket[2].trim() };
  }
  return { title: raw, subtitle: '' };
}

function extractGenre(content) {
  // 首段 blockquote 中第一行作为题材/基调
  const m = content.match(/^>\s*(.+)$/m);
  return m ? m[1].trim() : '';
}

function extractStatus(content) {
  const m = content.match(/\*\*状态\*\*[:：]\s*(.+)/i);
  return m ? m[1].trim() : '未知';
}

function extractDescription(content) {
  const m = content.match(/^##\s+简介\s*\n+([\s\S]+?)(?=^##\s|\z)/m);
  if (!m) return '';
  return m[1]
    .replace(/^>\s*/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 280);
}

function extractPlayableFile(content, dir, codename) {
  const m = content.match(/\*\*可玩文件\*\*[:：]?\s*\[`?([^\]`\n]+)`?\]\([^\)]*\)/i);
  if (m) {
    const f = m[1].trim();
    if (existsSync(path.join(dir, f))) return f;
  }
  const htmlFiles = readdirSync(dir).filter(f => f.endsWith('.html') && !f.includes('_embedded'));
  if (htmlFiles.length === 1) return htmlFiles[0];
  const named = htmlFiles.find(f => f === `${codename}.html`);
  if (named) return named;
  return null;
}

function discoverGame(codename) {
  const dir = path.join(GAMES_DIR, codename);
  const content = readReadme(dir);
  if (!content) {
    console.warn(`[warn] ${codename}: README.md 不存在`);
    return null;
  }
  const titleInfo = extractTitle(content);
  const htmlFile = extractPlayableFile(content, dir, codename);
  const status = htmlFile ? extractStatus(content) : (extractStatus(content).replace('不完整', '早期探索 / 不可启动'));
  return {
    codename,
    title: titleInfo.title,
    subtitle: titleInfo.subtitle,
    genre: extractGenre(content),
    status,
    description: extractDescription(content),
    htmlFile: htmlFile ? `games/${codename}/${htmlFile}` : null,
  };
}

function main() {
  const entries = readdirSync(GAMES_DIR)
    .map(name => {
      const full = path.join(GAMES_DIR, name);
      try {
        return statSync(full).isDirectory() ? name : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const games = [];
  for (const codename of entries) {
    const game = discoverGame(codename);
    if (game) games.push(game);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    games,
  };

  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  console.log(`[ok] 已生成 ${OUT_FILE}，共 ${games.length} 个剧本`);
}

main();
```

- [ ] **步骤 1.2：运行脚本验证输出**

```bash
node scripts/generate-games-json.js
```

预期：
- 命令成功退出
- 生成 `games.json`
- 控制台输出 `[ok] 已生成 .../games.json，共 3 个剧本`

- [ ] **步骤 1.3：检查 games.json 内容**

```bash
node -e "console.log(JSON.stringify(require('./games.json'), null, 2))"
```

预期：
- 包含 `galley-villa`、`island-death`、`terminal-mystery`
- `galley-villa.htmlFile` 为 `games/galley-villa/TypeHelp.html`
- `island-death.htmlFile` 为 `games/island-death/island-death.html`
- `terminal-mystery.htmlFile` 为 `null`，状态包含"不可启动"

- [ ] **步骤 1.4：Commit**

```bash
git add scripts/generate-games-json.js games.json
git commit -m "feat: add games.json generator script

- scans games/ directories
- extracts metadata from README.md
- generates games.json with fallback rules for HTML discovery"
```

---

## 任务 2：为生成脚本添加单元测试

**文件：**
- 创建：`test/unit/generate-games-json.test.js`

**步骤：**

- [ ] **步骤 2.1：编写测试**

```javascript
// test/unit/generate-games-json.test.js
import { describe, it, expect } from 'vitest';

// 简单内联测试辅助函数；若后续脚本拆分为可导入模块，可替换为实际导入
function extractTitle(raw) {
  const bracket = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (bracket) return { title: bracket[1].trim(), subtitle: bracket[2].trim() };
  return { title: raw.trim(), subtitle: '' };
}

function extractStatus(line) {
  const m = line.match(/\*\*状态\*\*[:：]\s*(.+)/i);
  return m ? m[1].trim() : '未知';
}

describe('generate-games-json helpers', () => {
  it('extracts title with subtitle', () => {
    expect(extractTitle('嘉利别墅 (Galley Villa)')).toEqual({
      title: '嘉利别墅',
      subtitle: 'Galley Villa',
    });
  });

  it('extracts title without subtitle', () => {
    expect(extractTitle('嘉利别墅')).toEqual({
      title: '嘉利别墅',
      subtitle: '',
    });
  });

  it('extracts status from README line', () => {
    expect(extractStatus('> **状态**：完整可玩（原版 TypeHelp 译版）')).toBe(
      '完整可玩（原版 TypeHelp 译版）',
    );
  });
});
```

- [ ] **步骤 2.2：运行测试验证失败到通过**

```bash
npx vitest run test/unit/generate-games-json.test.js
```

预期：3 个测试全部 PASS。

- [ ] **步骤 2.3：Commit**

```bash
git add test/unit/generate-games-json.test.js
git commit -m "test: add unit tests for games.json generator helpers"
```

---

## 任务 3：实现 index.html

**文件：**
- 创建：`index.html`

**步骤：**

- [ ] **步骤 3.1：编写首页**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TxtGame · 多剧本文字推理游戏合集</title>
  <style>
    :root {
      --bg: #0a0a0a;
      --surface: #141414;
      --border: #2a2a2a;
      --text: #e0e0e0;
      --muted: #888888;
      --accent: #33ff33;
      --accent-dim: #1a801a;
      --warning: #ffb000;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: "Courier New", Consolas, "SF Mono", monospace;
      line-height: 1.6;
      min-height: 100vh;
    }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; }
    header { border-bottom: 1px dashed var(--border); padding-bottom: 1.5rem; margin-bottom: 2rem; }
    header h1 { margin: 0 0 0.5rem; font-size: 2rem; color: var(--accent); }
    header p { margin: 0; color: var(--muted); }
    .stats { margin-top: 1rem; color: var(--accent); }
    .section-title { color: var(--accent); margin: 2rem 0 1rem; font-size: 1.1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 1.25rem;
      transition: border-color 0.2s, transform 0.1s;
    }
    .card:hover { border-color: var(--accent-dim); }
    .card h2 { margin: 0 0 0.25rem; font-size: 1.2rem; }
    .card .subtitle { color: var(--muted); font-size: 0.85rem; margin-bottom: 0.5rem; }
    .card .genre { color: var(--warning); font-size: 0.85rem; margin-bottom: 0.75rem; }
    .card .desc { color: var(--muted); font-size: 0.9rem; margin-bottom: 1rem; }
    .card .status { font-size: 0.8rem; color: var(--accent); }
    .card a.launch { display: inline-block; margin-top: 0.75rem; padding: 0.35rem 0.75rem; border: 1px solid var(--accent-dim); }
    .card a.launch:hover { background: var(--accent-dim); color: var(--bg); text-decoration: none; }
    .card.disabled { opacity: 0.6; pointer-events: none; }
    .error { color: var(--warning); border: 1px dashed var(--warning); padding: 1rem; margin-bottom: 1rem; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px dashed var(--border); color: var(--muted); font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>&gt; TxtGame</h1>
      <p>基于 SugarCube / Twine 的纯文本交互式推理游戏合集</p>
      <p class="stats" id="stats">正在连接数据终端...</p>
    </header>

    <main>
      <div class="section-title">&gt; 选择剧本</div>
      <div id="games-grid" class="grid">加载中...</div>
    </main>

    <footer>
      <p>[?] 每个剧本独立运行，输入 help 查看游戏内命令。</p>
      <p><a href="https://github.com/MrSun/txtgame" target="_blank" rel="noopener">GitHub</a> · <a href="README.md">项目说明</a></p>
    </footer>
  </div>

  <script>
    const FALLBACK_GAMES = [
      {
        codename: 'galley-villa',
        title: '嘉利别墅',
        subtitle: 'Galley Villa',
        genre: '1936 英国古堡暴风雪山庄 + meta 心理恐怖',
        status: '完整可玩',
        description: '你是一名调查员，面前是一台从已故同僚处回收的旧计算机。',
        htmlFile: 'games/galley-villa/TypeHelp.html',
      },
      {
        codename: 'island-death',
        title: '岛主之死',
        subtitle: 'Coral Bay',
        genre: '2017-2024 南海私人岛屿 / 法律推理',
        status: '设计完成',
        description: '5 幕社会派 + meta 悬疑 + 法律推理。',
        htmlFile: 'games/island-death/island-death.html',
      },
      {
        codename: 'terminal-mystery',
        title: '沈家山庄事件',
        subtitle: 'Case Recovery System',
        genre: '暴风雪山庄 / 早期探索',
        status: '早期探索 / 不可启动',
        description: 'Solo Agent 早期对 TypeHelp 引擎的探索项目。',
        htmlFile: null,
      },
    ];

    function renderCard(game) {
      const playable = !!game.htmlFile;
      const href = playable ? game.htmlFile : `games/${game.codename}/README.md`;
      const label = playable ? '[ 开始游戏 ]' : '[ 查看说明 ]';
      return `
        <article class="card ${playable ? '' : 'disabled'}">
          <h2>${game.title}</h2>
          ${game.subtitle ? `<div class="subtitle">${game.subtitle}</div>` : ''}
          <div class="genre">${game.genre}</div>
          <div class="desc">${game.description}</div>
          <div class="status">状态：${game.status}</div>
          <a class="launch" href="${href}">${label}</a>
        </article>
      `;
    }

    function render(games) {
      const grid = document.getElementById('games-grid');
      const stats = document.getElementById('stats');
      const playableCount = games.filter(g => g.htmlFile).length;
      grid.innerHTML = games.map(renderCard).join('');
      stats.textContent = `当前收录 ${games.length} 个剧本 · ${playableCount} 个可玩`;
    }

    async function load() {
      try {
        const res = await fetch('./games.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data.games)) throw new Error('games.json 格式异常');
        render(data.games);
      } catch (err) {
        console.error('加载 games.json 失败：', err);
        const grid = document.getElementById('games-grid');
        grid.innerHTML = `
          <div class="error" style="grid-column: 1 / -1;">
            [WARN] 无法加载 games.json，使用本地备用列表。<br>
            错误：${err.message}
          </div>
          ${FALLBACK_GAMES.map(renderCard).join('')}
        `;
        document.getElementById('stats').textContent = '当前使用备用列表';
      }
    }

    load();
  </script>
</body>
</html>
```

- [ ] **步骤 3.2：本地预览**

```bash
npx serve .
```

打开终端输出的 URL（通常是 `http://localhost:3000`），验证：
- 页面显示终端风格
- 显示 3 个剧本卡片
- "嘉利别墅"和"岛主之死"卡片可点击跳转
- "沈家山庄事件"显示为不可启动

- [ ] **步骤 3.3：Commit**

```bash
git add index.html
git commit -m "feat: add terminal-style homepage

- dark terminal visual style matching SugarCube
- loads games.json via fetch with fallback list
- renders game cards with status and launch links"
```

---

## 任务 4：添加 npm script

**文件：**
- 修改：`package.json`

**步骤：**

- [ ] **步骤 4.1：在 scripts 中新增 build:games**

```json
"scripts": {
  "test": "node scripts/run-all.js",
  "diagnose": "node scripts/diagnose.js",
  "postinstall": "node scripts/copy-playwright-fallback.js",
  "build:games": "node scripts/generate-games-json.js",
  "test:static": "vitest run test/static test/helpers",
  ...
}
```

- [ ] **步骤 4.2：验证命令**

```bash
npm run build:games
```

预期：重新生成 `games.json`，控制台输出 `[ok] 已生成 .../games.json，共 3 个剧本`。

- [ ] **步骤 4.3：Commit**

```bash
git add package.json
git commit -m "chore: add build:games npm script"
```

---

## 任务 5：添加首页 E2E 测试

**文件：**
- 创建：`test/e2e/homepage.test.js`

**步骤：**

- [ ] **步骤 5.1：编写 E2E 测试**

```javascript
// test/e2e/homepage.test.js
import { test, expect } from '@playwright/test';

test.describe('首页', () => {
  test('加载并显示所有剧本卡片', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('TxtGame');
    await expect(page.locator('.card')).toHaveCount(3);
  });

  test('可玩剧本卡片链接正确', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('.card a.launch').first();
    await expect(link).toHaveAttribute('href', /\.html$/);
  });

  test('terminal-mystery 显示为不可启动', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('.card');
    const last = cards.last();
    await expect(last).toContainText('不可启动');
    await expect(last.locator('a.launch')).toHaveAttribute('href', /README\.md$/);
  });
});
```

- [ ] **步骤 5.2：运行测试**

```bash
npx playwright test test/e2e/homepage.test.js
```

预期：3 个测试全部 PASS。

- [ ] **步骤 5.3：Commit**

```bash
git add test/e2e/homepage.test.js
git commit -m "test: add homepage E2E tests"
```

---

## 任务 6：全量回归验证

**步骤：**

- [ ] **步骤 6.1：重新生成 games.json**

```bash
npm run build:games
```

- [ ] **步骤 6.2：运行首页 E2E 测试**

```bash
npx playwright test test/e2e/homepage.test.js
```

- [ ] **步骤 6.3：运行单剧本全量测试（确保未破坏现有功能）**

```bash
npm test -- --game=island-death --skip-l5
npm test -- --game=galley-villa --skip-l5
```

预期：全部通过。

- [ ] **步骤 6.4：Commit 生成产物**

```bash
git add games.json
git commit -m "chore: regenerate games.json"
```

---

## 任务 7：文档更新与收尾

**文件：**
- 修改：`README.md`（可选，添加首页入口说明）

**步骤：**

- [ ] **步骤 7.1：更新 README.md 中的"如何运行"段落**

在 README.md "统一游戏机制"或"剧本索引"附近添加：

```markdown
## 快速开始

1. 克隆仓库
2. 运行 `npm run build:games` 生成首页数据
3. 运行 `npx serve .` 启动本地服务器
4. 浏览器打开首页，点击任意剧本卡片开始游戏
```

- [ ] **步骤 7.2：Commit**

```bash
git add README.md
git commit -m "docs: update README with homepage quickstart"
```

---

## 自检

- [ ] 规格覆盖度：`index.html`、生成脚本、`games.json`、测试、npm script 均有任务对应。
- [ ] 占位符扫描：无 TODO/待定/后续实现。
- [ ] 类型一致性：所有代码中字段名（`codename`, `title`, `subtitle`, `genre`, `status`, `description`, `htmlFile`）保持一致。
- [ ] 无遗漏：README 更新、生成产物 commit、回归验证均包含在计划中。
