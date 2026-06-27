/**
 * Playwright Chromium 伪版本兼容补丁（postinstall 钩子）
 *
 * 背景（举一反三）：
 *   阿里云镜像 build/chromium/<rev>/ 经常只同步部分平台（如 linux-arm64），
 *   win64 缺失 → `npx playwright install` 下载 404 → L5 E2E 跑不起来。
 *   之前依赖人工 `Copy-Item chromium-1223 → chromium-1228`，跨机器/新机器易忘。
 *
 * 策略：
 *   1. 读 playwright-core/browsers.json 拿目标版本号
 *   2. 扫本地 ms-playwright/ 下已有 chromium-* 目录
 *   3. 目标已存在 → 退出 0
 *   4. 找一个"最接近目标、且不大于目标"的源版本 → 复制
 *   5. 没有合适源 → 打 warning 并退出 0（**不阻塞 npm install**）
 *
 * 跨平台：纯 Node.js 实现（不依赖 PowerShell）
 * 幂等：目标已存在不覆盖
 *
 * 可调参数（环境变量）：
 *   PLAYWRIGHT_BROWSERS_PATH    浏览器安装根（默认 %LOCALAPPDATA%\ms-playwright）
 *   TXT_GAME_SKIP_FALLBACK_COPY=1   跳过整个逻辑
 */
import { readFileSync, existsSync, cpSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const SKIP = process.env.TXT_GAME_SKIP_FALLBACK_COPY === '1';
if (SKIP) {
  console.log('[pw-fallback] TXT_GAME_SKIP_FALLBACK_COPY=1, 跳过');
  process.exit(0);
}
// dry-run: 允许沙箱内用 PLAYWRIGHT_BROWSERS_PATH 指向 mock 目录做验证
if (process.env.TXT_GAME_FALLBACK_DRY_RUN === '1') {
  console.log('[pw-fallback] DRY-RUN 模式, 不会写入');
}

// browsers.json 在 playwright-core 包内但不在 exports 列表 → 用 createRequire 绕过
const PLAYWRIGHT_CORE_PKG = require.resolve('playwright-core/package.json');
const BROWSERS_JSON = join(dirname(PLAYWRIGHT_CORE_PKG), 'browsers.json');
if (!existsSync(BROWSERS_JSON)) {
  console.log(`[pw-fallback] browsers.json 不存在: ${BROWSERS_JSON}`);
  process.exit(0);
}
const browsers = JSON.parse(readFileSync(BROWSERS_JSON, 'utf8')).browsers;
const targetChromium = browsers.find((b) => b.name === 'chromium');
const targetHeadless = browsers.find((b) => b.name === 'chromium-headless-shell');
if (!targetChromium) {
  console.log('[pw-fallback] browsers.json 无 chromium 条目，跳过');
  process.exit(0);
}
const targetRev = targetChromium.revision;
const targetHeadlessRev = targetHeadless ? targetHeadless.revision : targetRev;

const browsersRoot =
  process.env.PLAYWRIGHT_BROWSERS_PATH ||
  join(process.env.LOCALAPPDATA || join(process.env.HOME || '.', '.cache'), 'ms-playwright');

if (!existsSync(browsersRoot)) {
  console.log(`[pw-fallback] ms-playwright 根目录不存在: ${browsersRoot}`);
  console.log('[pw-fallback] 提示: 跑 `npx playwright install chromium` 一次即可');
  process.exit(0);
}

/** 列本地已装 chromium 主目录版本号（去前缀） */
function listLocalRevs(prefix) {
  if (!existsSync(browsersRoot)) return [];
  return readdirSync(browsersRoot)
    .filter((n) => n.startsWith(prefix + '-'))
    .map((n) => Number(n.slice(prefix.length + 1)))
    .filter((v) => Number.isFinite(v));
}

/** 选最接近且 ≤ target 的源版本 */
function pickSource(localRevs, target) {
  const candidates = localRevs.filter((v) => v <= target);
  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

function copyIfNeeded(prefix, target) {
  const targetDir = join(browsersRoot, `${prefix}-${target}`);
  if (existsSync(targetDir)) {
    return { ok: true, reason: 'already-exists' };
  }
  const local = listLocalRevs(prefix);
  const source = pickSource(local, target);
  if (source === null) {
    return { ok: false, reason: `no-source (本地 ${prefix}-* 没有任何 ≤${target} 版本)` };
  }
  const sourceDir = join(browsersRoot, `${prefix}-${source}`);
  if (process.env.TXT_GAME_FALLBACK_DRY_RUN === '1') {
    return { ok: true, reason: `[dry-run] would copy ${source} → ${target}` };
  }
  try {
    cpSync(sourceDir, targetDir, { recursive: true, force: true });
    return { ok: true, reason: `copied ${source} → ${target}` };
  } catch (e) {
    return { ok: false, reason: `copy failed: ${e.message.split('\n')[0]}` };
  }
}

console.log(`[pw-fallback] 目标版本: chromium=${targetRev}, headless=${targetHeadlessRev}`);
console.log(`[pw-fallback] 浏览器根: ${browsersRoot}`);

const r1 = copyIfNeeded('chromium', targetRev);
const r2 = copyIfNeeded('chromium_headless_shell', targetHeadlessRev);

const labels = [
  ['chromium', r1],
  ['chromium_headless_shell', r2],
];
let anyError = false;
for (const [name, r] of labels) {
  const tag = r.ok ? '✓' : '✗';
  console.log(`[pw-fallback]   ${tag} ${name}: ${r.reason}`);
  if (!r.ok) anyError = true;
}

if (anyError) {
  console.log('[pw-fallback] 部分目标复制失败，可执行:');
  console.log(`            npx playwright install chromium`);
  // 不阻塞 npm install
}
process.exit(0);
