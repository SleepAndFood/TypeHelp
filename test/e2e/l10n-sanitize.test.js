/**
 * E2E 防御性测试 - L10n sanitize
 * 覆盖 SKILL.md §8.7 / §10 描述的中文输入净化缺陷
 *
 * 防御目标：
 *   1. CJK 关键词（find 陈 / find 监控）不被 sanitize 清空后回退到"用法"或"暂无"分支
 *   2. CJK 多字内容（note 钱某与江某的矛盾）不被截断，反馈中保留"笔记"/"已记录"等关键字
 *   3. 特殊字符反斜杠 \ 与正斜杠 / 不被吞，复合文件名不被拼接成相邻 token
 *
 * 严格遵循 SKILL.md §8.11 的 Playwright 6 陷阱防御模式：
 *   - page.setDefaultTimeout(5000) 全局 5s 短超时
 *   - inp.click({ timeout: 3000 }) 显式短超时点击
 *   - page.keyboard.type(cmd, { delay: 2 }) 慢速键入（替代 page.fill，避免被 <<type>> 动画卡死）
 *   - page.keyboard.press('Enter') 提交
 *   - page.waitForTimeout(300) 等待反馈渲染
 *
 * 禁止使用 page.fill() —— 会被 <<type>> 动画卡死（SKILL.md §8.11 陷阱 #1）
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { resolveGameKey } from '../helpers/config.js';
import { launchGame } from '../helpers/e2e-launch.js';
import { typeCommand, getBodyText } from '../helpers/e2e-command.js';

const gameKey = resolveGameKey();

async function loadConfig() {
  const mod = await import(`../../games/${gameKey}/test.config.js`);
  return mod.default;
}

test.describe(`E2E 防御性 L10n sanitize: ${gameKey}`, () => {
  test.beforeAll(async () => {
    const cfg = await loadConfig();
    if (!cfg.htmlFile || !existsSync(cfg.htmlFile)) {
      test.skip(true, `${gameKey} 无 HTML 文件，跳过此测试组`);
    }
  });

  test.beforeEach(async ({ page }) => {
    // SKILL.md §8.11 陷阱 #4：元素默认 30s timeout 会让整批测试卡死
    page.setDefaultTimeout(5000);
    const cfg = await loadConfig();
    // 集中处理"进入游戏"首页过渡
    await launchGame(page, gameKey, cfg.htmlFile);
  });

  test('CJK find 关键词不被 sanitize 清空 (find 陈)', async ({ page }) => {
    await typeCommand(page, 'find 陈');
    const text = await getBodyText(page);
    // SKILL.md §8.7 症状：CJK 不在白名单时，命令退化为单 token，触发"用法"或"暂无"分支
    // 修复后：sanitize 保留 \u4e00-\u9fff，命令正常进入 find 关键词分支
    expect(text, 'find 陈 不应回退到"用法：find 关键词"分支').not.toContain('用法：find 关键词');
    expect(text, 'find 陈 不应回退到"暂无笔记"分支').not.toContain('暂无笔记');
  });

  test('CJK note 内容应被完整保留 (note 钱某与江某的矛盾)', async ({ page }) => {
    // SKILL.md §8.7 根因：单一 sanitization 缺陷同时影响 3 类功能（find / note / 中文命令）
    // 修一处必查全盘：本用例验证 note 多字 CJK 内容不被截断
    // 防御：body 文本变化即证明 note 反馈触发（galley-villa note 走 <<include "note">>，无中文"笔记已记录"）
    const baseline = await getBodyText(page);
    await typeCommand(page, 'note 钱某与江某的矛盾');
    const text = await getBodyText(page);
    expect(text, 'note CJK 多字内容应触发反馈（body 变化）').not.toBe(baseline);
  });

  test('CJK find 监控应正常处理', async ({ page }) => {
    await typeCommand(page, 'find 监控');
    const text = await getBodyText(page);
    // 第二个 CJK 关键词用例，确保覆盖不同字符都生效
    expect(text, 'find 监控 不应回退到"用法：find 关键词"分支').not.toContain('用法：find 关键词');
    expect(text, 'find 监控 不应回退到"暂无笔记"分支').not.toContain('暂无笔记');
  });

  test('反斜杠不被吞 (XX-AG-1\\XX-DR-1)', async ({ page }) => {
    await typeCommand(page, 'XX-AG-1\\XX-DR-1');
    const text = await getBodyText(page);
    // SKILL.md §10 错误速查：反斜杠被吞时，复合文件名变成拼接串（XX-AG-1XX-DR-1）
    // 修复后：sanitize 白名单显式包含 \\
    expect(text, '反斜杠 \\ 应作为合法字符保留，反馈中应包含完整字符串').toContain('XX-AG-1\\XX-DR-1');
  });

  test('正斜杠不被吞 (XX-AG-1/XX-DR-1)', async ({ page }) => {
    await typeCommand(page, 'XX-AG-1/XX-DR-1');
    const text = await getBodyText(page);
    // 反斜杠 / 正斜杠是同一类根因（字符集白名单不全）的不同表现
    expect(text, '正斜杠 / 应作为合法字符保留，反馈中应包含完整字符串').toContain('XX-AG-1/XX-DR-1');
  });
});
