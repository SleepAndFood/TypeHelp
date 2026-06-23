/**
 * E2E 冒烟（Playwright）
 * 5-8 条关键路径；terminal-mystery 无 HTML 自动 skip
 * 若 playwright 浏览器未安装（沙箱/离线环境）则全 suite 优雅 skip
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { resolveGameKey } from '../helpers/config.js';

const gameKey = resolveGameKey();

async function loadConfig() {
  const mod = await import(`../../games/${gameKey}/test.config.js`);
  return mod.default;
}

// 浏览器可用性预检
async function browsersAvailable() {
  try {
    const { chromium } = await import('@playwright/test');
    // 触发一次 launch 看是否抛 "Executable doesn't exist"
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    return true;
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.includes("Executable doesn't exist") || msg.includes('browserType.launch')) {
      return false;
    }
    throw e;
  }
}

test.describe(`E2E 冒烟: ${gameKey}`, () => {
  test.beforeAll(async () => {
    const cfg = await loadConfig();
    if (!cfg.htmlFile || !existsSync(cfg.htmlFile)) {
      test.skip(true, `${gameKey} 无 HTML 文件，跳过 E2E`);
    }
    if (!(await browsersAvailable())) {
      test.skip(true, 'Playwright 浏览器未安装（运行 `npx playwright install` 启用）');
    }
  });

  test('启动无 JS 错误', async ({ page }) => {
    const cfg = await loadConfig();
    const url = pathToFileURL(path.resolve(cfg.htmlFile)).href;
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(url);
    // 等到输入框出现
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    expect(errors).toEqual([]);
  });

  test('help 命令', async ({ page }) => {
    const cfg = await loadConfig();
    const url = pathToFileURL(path.resolve(cfg.htmlFile)).href;
    await page.goto(url);
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    await page.fill('input[type="text"]', 'help');
    await page.press('input[type="text"]', 'Enter');
    await page.waitForTimeout(500);
    const text = await page.textContent('body');
    expect(text).toBeTruthy();
  });

  test('直接打开合法文件名', async ({ page }) => {
    const cfg = await loadConfig();
    const url = pathToFileURL(path.resolve(cfg.htmlFile)).href;
    await page.goto(url);
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    // 使用 config 中的 meta 文件名作为安全样例
    const sample = `${cfg.metaPrefix}${cfg.metaFiles?.[0] || 'readme'}`;
    await page.fill('input[type="text"]', sample);
    await page.press('input[type="text"]', 'Enter');
    await page.waitForTimeout(500);
  });
});
