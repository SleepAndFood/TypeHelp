/**
 * E2E 测试启动 helper
 * 统一处理"打开游戏 HTML → 跳过首页过渡 → 进入 Box passage"的流程
 *
 * 防御目标（解决 SKILL.md §8.11 之外的一个跨剧本共性问题）：
 *   1. galley-villa 的 Start passage 有"点击开始"/"跳过开头"过渡界面
 *   2. 多个 E2E 套件（feedback-audit / l10n-sanitize / stale-state）共享同一份 beforeEach
 *      若各自处理首页过渡，未来新增剧本若也加首页过渡 → 3 套测试都要改
 *   3. 集中在这里 → 未来扩展只改一处
 *
 * 严格规则：
 *   - 必须配合 page.setDefaultTimeout(5000) 使用，避免卡死
 *   - 不能调 page.fill()（SKILL.md §8.11 陷阱 #1）
 *   - 优先点 "(跳过开头)" 链接（直接到 Box），其次 "点击开始"（经 Background 再到 Box）
 *
 * 跨剧本基线：
 *   每个有 HTML 的剧本理论上都应该有"跳过开头"或等价入口
 *   若某个剧本没有，launchGame 会超时（10s）后 fail — 这是 expected behavior，提示该剧本不符合"测试可达性"基线
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * 计算当前 gameKey 的 HTML 文件 URL
 * @param {string} gameKey
 * @param {string} htmlFile test.config.js 里的相对路径
 * @returns {string} file:// URL
 */
export function gameUrl(gameKey, htmlFile) {
  const abs = path.isAbsolute(htmlFile) ? htmlFile : path.resolve(process.cwd(), htmlFile);
  return pathToFileURL(abs).href;
}

/**
 * 启动游戏并进入 Box passage（命令输入框）
 *
 * 流程：
 *   1. goto HTML 文件
 *   2. 若首页有"跳过开头"链接 → click（最高优先级，直接到 Box）
 *   3. 否则若首页有"点击开始"链接 → click（经 Background 再到 Box）
 *   4. 等 input[type="text"] 出现（Box passage 渲染完毕）
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} gameKey
 * @param {string} htmlFile
 * @param {{ timeout?: number }} [opts] timeout 默认 10000ms
 */
export async function launchGame(page, gameKey, htmlFile, opts = {}) {
  const timeout = opts.timeout ?? 10000;
  const url = gameUrl(gameKey, htmlFile);
  await page.goto(url);

  // Twine 渲染 [[link]] 为 <a href="Target">label</a>
  // 优先"跳过开头"——直接跳 Box
  const skipLink = page.locator('a:has-text("跳过开头")');
  if ((await skipLink.count()) > 0) {
    await skipLink.first().click({ timeout: 5000 });
  } else {
    // 备选"点击开始"——经 Background passage 再到 Box
    const startLink = page.locator('a:has-text("点击开始")');
    if ((await startLink.count()) > 0) {
      await startLink.first().click({ timeout: 5000 });
    }
    // 若两者都没有，可能是已经直达 Box 的剧本（少见），什么都不做继续等 input
  }

  // Box passage 渲染完成后会出 input[type="text"]
  await page.waitForSelector('input[type="text"]', { timeout });
}
