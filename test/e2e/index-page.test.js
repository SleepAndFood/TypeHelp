/**
 * E2E 防御性测试 - 项目首页 (index.html)
 * 覆盖 SKILL.md §8 心法中"vibe coding 项目全部 CI 化"在首页的落地：
 *   1. 正常加载：3 个剧本卡片、2 可玩、1 disabled、stats 正确
 *   2. XSS 注入：恶意 games.json（含 <script>alert(1)</script> / javascript: / 目录遍历）
 *      不会触发 XSS、不会进入正常链接
 *   3. fetch 失败（删除 games.json）：FALLBACK_GAMES 渲染 + 错误提示条出现
 *   4. 整个流程 console.error / pageerror 监听保持干净
 *
 * 与 scripts/verify-index.py 一一对应，但用 @playwright/test 重写并集成进 npm test / run-all.js。
 * 防御目标（解决"孤立 Python 脚本不入 CI"的反模式）：
 *   - 由 npm run test:e2e 自动触发，不再依赖"开发人员手动跑 Python"
 *   - 由 run-all.js 的 L5 阶段拉起，与现有 l10n-sanitize / stale-state / feedback-audit 一致风格
 *   - 用 beforeAll / afterAll 严格备份 + 还原 games.json（任何 abort 路径都要 try/finally）
 *
 * 严格规则：
 *   - 必须用 HTTP 服务启动（不能 file:// 协议，否则 ES module 被 CORS 拦截，XSS 场景失效）
 *   - 不修改 games.json 真实内容（用临时文件 + route.fulfill 在浏览器层拦截 games.json fetch）
 *     → 实际更稳：因 fetch URL 是 './games.json'，通过 webServer 启的 HTTP 服务直接吃 games.json
 *     → 但本测试需"替换 games.json 内容"和"删除 games.json"两种场景，必须改真实文件
 *     → 严格 beforeAll 备份 + afterAll 还原（even on failure），确保不入仓
 *   - 与 SKILL.md §8.11 防御风格一致：page.setDefaultTimeout(5000)
 *   - 不调 page.fill()（首页没有 input[type="text"]，本测试不涉及）
 */
import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, writeFileSync, unlinkSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import net from 'node:net';
import http from 'node:http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const GAMES_JSON = path.join(repoRoot, 'games.json');
const GAMES_JSON_BAK = path.join(repoRoot, '.games.json.e2e.bak');
const ARTIFACTS = path.join(repoRoot, 'test-results', 'index-page');
mkdirSync(ARTIFACTS, { recursive: true });

/**
 * 找一个空闲端口（避免与开发服务器冲突）。失败回退到一个固定端口。
 * @returns {Promise<number>}
 */
function getFreePort() {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', () => resolve(4321));
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

/**
 * 启动 python -m http.server，提供 index.html 渲染所需的 HTTP 服务（绕过 file:// 的 CORS 限制）。
 * 失败时抛错。
 * @param {number} port
 * @returns {Promise<{ proc: import('node:child_process').ChildProcess, url: string }>}
 */
function startServer(port) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      process.platform === 'win32' ? 'python' : 'python3',
      ['-m', 'http.server', String(port), '--bind', '127.0.0.1'],
      { cwd: repoRoot, stdio: ['ignore', 'ignore', 'pipe'] },
    );
    let started = false;
    const timer = setTimeout(() => {
      if (!started) {
        proc.kill();
        reject(new Error(`http.server 启动超时（10s）`));
      }
    }, 10000);
    // 通过主动探活判定启动成功（避免依赖 stdout）
    const tryProbe = (attempt = 0) => {
      if (attempt > 30) {
        clearTimeout(timer);
        proc.kill();
        reject(new Error('http.server 端口探测超时'));
        return;
      }
      const req = http.get(
        { hostname: '127.0.0.1', port, path: '/', timeout: 1000 },
        (res) => {
          res.resume();
          if (res.statusCode === 200) {
            started = true;
            clearTimeout(timer);
            resolve({ proc, url: `http://127.0.0.1:${port}/index.html` });
          } else {
            setTimeout(() => tryProbe(attempt + 1), 300);
          }
        },
      );
      req.on('error', () => setTimeout(() => tryProbe(attempt + 1), 300));
      req.on('timeout', () => req.destroy());
    };
    setTimeout(() => tryProbe(), 300);
    proc.on('exit', () => {
      if (!started) {
        clearTimeout(timer);
        reject(new Error('http.server 进程在启动前已退出'));
      }
    });
  });
}

/**
 * 等到 selector 出现或 timeout（包装 locator.waitFor）。
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {number} [timeout]
 */
async function waitForSelector(page, selector, timeout = 5000) {
  await page.waitForSelector(selector, { timeout });
}

// ===== 全局 fixtures =====
let serverProc = null;
let serverUrl = null;
const XSS_PAYLOAD = {
  generatedAt: '2026-07-05T00:00:00.000Z',
  games: [
    {
      codename: 'xss-game',
      title: '<script>window.__xssTitle=true;alert(1)</script>',
      subtitle: '<img src=x onerror=window.__xssSubtitle=true>',
      genre: '<b>genre</b>',
      status: '状态<b>XSS</b>',
      description: '"><img src=x onerror=window.__xssDesc=true>',
      htmlFile: 'javascript:window.__xssHref=true',
    },
    {
      codename: 'traversal',
      title: '目录遍历',
      subtitle: 'test',
      genre: 'x',
      status: 'x',
      description: 'x',
      htmlFile: '../../../etc/passwd.html',
    },
  ],
};

test.beforeAll(async () => {
  // 1) 备份真实 games.json（若存在）
  if (existsSync(GAMES_JSON)) {
    copyFileSync(GAMES_JSON, GAMES_JSON_BAK);
  } else {
    // 标记备份缺失：afterAll 据此判断是否需要还原
    writeFileSync(GAMES_JSON_BAK, '__MISSING__', 'utf-8');
  }
  // 2) 启动 HTTP 服务
  const port = await getFreePort();
  const srv = await startServer(port);
  serverProc = srv.proc;
  serverUrl = srv.url;
});

test.afterAll(async () => {
  // 1) 关 HTTP 服务
  if (serverProc && !serverProc.killed) {
    serverProc.kill();
  }
  // 2) 还原 games.json
  if (existsSync(GAMES_JSON_BAK)) {
    const bak = readFileSync(GAMES_JSON_BAK, 'utf-8');
    if (bak === '__MISSING__') {
      // 测试期间没创建 games.json → 删除（避免污染）
      if (existsSync(GAMES_JSON)) unlinkSync(GAMES_JSON);
    } else {
      writeFileSync(GAMES_JSON, bak, 'utf-8');
    }
    unlinkSync(GAMES_JSON_BAK);
  }
});

/**
 * 给 page 装 console.error / pageerror 监听。
 * 严格遵循 SKILL.md §8.11：拿证据再断言，不脑补。
 */
function attachLogCollectors(page) {
  const errors = { pageErrors: [], consoleErrors: [] };
  page.on('pageerror', (err) => errors.pageErrors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.consoleErrors.push(msg.text());
  });
  return errors;
}

async function expectStatsText(page, expected) {
  await waitForSelector(page, '#stats');
  const text = await page.locator('#stats').innerText();
  expect(text, `stats 应包含 "${expected}"`).toContain(expected);
}

test.describe('首页 E2E: 正常加载', () => {
  test('渲染 3 张卡片 / 2 可玩 / 1 disabled / stats 正确', async ({ page }) => {
    page.setDefaultTimeout(5000);
    const errors = attachLogCollectors(page);
    await page.goto(serverUrl);

    // 等首页数据加载完毕（stats 由 renderStats 写入）
    await page.waitForFunction(
      () => document.getElementById('stats') && /\d+ 个剧本/.test(document.getElementById('stats').textContent || ''),
      null,
      { timeout: 5000 },
    );

    const cards = page.locator('article.card');
    await expect(cards).toHaveCount(3);
    const disabled = page.locator('article.card.disabled');
    await expect(disabled).toHaveCount(1);

    const titles = await page.locator('article.card h2').allInnerTexts();
    expect(titles, '标题应包含全部 3 个剧本').toEqual(
      expect.arrayContaining(['嘉利别墅', '岛主之死', '沈家山庄事件']),
    );

    const stats = await page.locator('#stats').innerText();
    expect(stats, 'stats 应说明 3 个剧本 / 2 个可玩').toContain('3 个剧本');
    expect(stats, 'stats 应说明 3 个剧本 / 2 个可玩').toContain('2 个可玩');

    // 嘉利别墅可玩，链接指向 games/galley-villa/TypeHelp.html
    const galleyHref = await page
      .locator('article.card[data-codename="galley-villa"] a.launch')
      .getAttribute('href');
    expect(galleyHref, '嘉利别墅 href').toBe('games/galley-villa/TypeHelp.html');

    // 沈家山庄不可玩（htmlFile=null），链接指向 README.md
    const termHref = await page
      .locator('article.card[data-codename="terminal-mystery"] a.launch')
      .getAttribute('href');
    expect(termHref, '沈家山庄 href').toBe('games/terminal-mystery/README.md');
    const termClass = await page
      .locator('article.card[data-codename="terminal-mystery"]')
      .getAttribute('class');
    expect(termClass, '沈家山庄 class 应含 disabled').toContain('disabled');

    await page.screenshot({ path: path.join(ARTIFACTS, '01-normal.png'), fullPage: true });

    expect(errors.pageErrors, `未捕获 JS 异常: ${errors.pageErrors.join('; ')}`).toHaveLength(0);
    expect(errors.consoleErrors, `意外 console.error: ${errors.consoleErrors.join('; ')}`).toHaveLength(0);
  });
});

test.describe('首页 E2E: XSS 注入 fixture', () => {
  test('恶意 games.json 不触发 XSS，不出现 javascript:/../ 链接', async ({ page }) => {
    page.setDefaultTimeout(5000);
    const errors = attachLogCollectors(page);
    // 替换 games.json 为 XSS payload
    writeFileSync(GAMES_JSON, JSON.stringify(XSS_PAYLOAD, null, 2), 'utf-8');

    await page.goto(serverUrl);
    await page.waitForFunction(
      () => document.getElementById('stats') && /\d+ 个剧本/.test(document.getElementById('stats').textContent || ''),
      null,
      { timeout: 5000 },
    );

    // 1) 任何 XSS flag 都没被设置
    for (const flag of ['__xssTitle', '__xssSubtitle', '__xssDesc', '__xssHref']) {
      const triggered = await page.evaluate((f) => window[f] === true, flag);
      expect(triggered, `XSS 标志 window.${flag} 不应被触发`).toBe(false);
    }

    // 2) 渲染出的 HTML 中 <script> 必须被转义
    const gridHtml = await page.locator('#games-grid').innerHTML();
    expect(gridHtml, '<script> 不应原样出现').not.toContain('<script>window.__xssTitle');
    expect(gridHtml, '<script> 应被转义为 &lt;script&gt;').toContain('&lt;script&gt;');
    // 3) 不应出现 onerror 作为 HTML 属性
    expect(gridHtml, 'onerror 不应成为 HTML 属性').not.toMatch(/<[^>]*\sonerror=/i);

    // 4) xss-game 的 javascript: URL 被清洗 → 走 README + disabled
    const xssCard = page.locator('article.card[data-codename="xss-game"]');
    await expect(xssCard).toHaveCount(1);
    const xssClass = await xssCard.getAttribute('class');
    expect(xssClass, 'xss-game 应被标记为 disabled').toContain('disabled');
    const xssHref = await xssCard.locator('a.launch').getAttribute('href');
    expect(xssHref, 'xss-game href 不应含 javascript:').not.toMatch(/javascript:/i);
    expect(xssHref, 'xss-game 应走 README.md').toBe('games/xss-game/README.md');

    // 5) traversal 的 ../ 被清洗 → 走 README + disabled
    const travCard = page.locator('article.card[data-codename="traversal"]');
    await expect(travCard).toHaveCount(1);
    const travClass = await travCard.getAttribute('class');
    expect(travClass, 'traversal 应被标记为 disabled').toContain('disabled');
    const travHref = await travCard.locator('a.launch').getAttribute('href');
    expect(travHref, 'traversal href 不应含 ../').not.toContain('../');
    expect(travHref, 'traversal 应走 README.md').toBe('games/traversal/README.md');

    // 6) 全部恶意链接被清洗 → 0 个可玩
    await expectStatsText(page, '0 个可玩');

    await page.screenshot({ path: path.join(ARTIFACTS, '02-xss.png'), fullPage: true });

    expect(errors.pageErrors, `未捕获 JS 异常: ${errors.pageErrors.join('; ')}`).toHaveLength(0);
    expect(errors.consoleErrors, `意外 console.error: ${errors.consoleErrors.join('; ')}`).toHaveLength(0);
  });
});

test.describe('首页 E2E: fetch 失败 → FALLBACK', () => {
  test('删除 games.json 后 FALLBACK 渲染 + 警告条出现', async ({ page }) => {
    page.setDefaultTimeout(5000);
    const errors = attachLogCollectors(page);
    // 删除 games.json → fetch 必失败
    if (existsSync(GAMES_JSON)) unlinkSync(GAMES_JSON);

    await page.goto(serverUrl);
    // 等警告条出现
    await waitForSelector(page, '.error', 5000);

    const errText = await page.locator('.error').innerText();
    expect(errText, '警告条应含 [WARN]').toContain('[WARN]');
    expect(errText, '警告条应说明无法加载 games.json').toContain('无法加载 games.json');

    // FALLBACK 渲染 3 张卡片
    const cards = page.locator('article.card');
    await expect(cards).toHaveCount(3);
    const titles = await page.locator('article.card h2').allInnerTexts();
    expect(titles, 'FALLBACK 标题应含全部 3 个剧本').toEqual(
      expect.arrayContaining(['嘉利别墅', '岛主之死', '沈家山庄事件']),
    );

    // stats 应说明正在使用备用列表
    const stats = await page.locator('#stats').innerText();
    expect(stats, 'stats 应说明备用列表').toContain('备用');

    await page.screenshot({ path: path.join(ARTIFACTS, '03-fallback.png'), fullPage: true });

    expect(errors.pageErrors, `未捕获 JS 异常: ${errors.pageErrors.join('; ')}`).toHaveLength(0);
    // fetch 失败 + 主动 console.error 是预期内的，仅断言没有"其他意外错误"
    const unexpected = errors.consoleErrors.filter(
      (e) => !/Failed to load resource/.test(e) && !/加载 games.json 失败/.test(e),
    );
    expect(unexpected, `仅允许 fetch 失败相关 console.error，其他: ${unexpected.join('; ')}`).toHaveLength(0);
  });
});
