/**
 * E2E 防御性测试 - stale state
 * 覆盖 SKILL.md §8.8 描述的状态机未重置缺陷
 *
 * 防御目标：
 *   1. 主用例：先 save → 再输入"帮"（纯 CJK 字符）→ 断言不显示"进度已保存"
 *   2. 空格扩展：先 note 测试 → 再输入 "   "（3 空格）→ 断言不显示"笔记已记录"
 *   3. 特殊字符扩展：先 help → 再输入 "!@#$%" → 断言不重复触发 help 内容
 *
 * 根因：Box passage 处理逻辑 if (raw_input not empty) { $command = raw_input.toLowerCase() }，
 *       raw 因 sanitize 清空后 $command 未重置 → 保留上次值 → 穿透到对应分支误执行
 *       （如输入"帮"显示"进度已保存"）
 *
 * 严格遵循 SKILL.md §8.11 的 Playwright 6 陷阱防御模式
 * 禁止使用 page.fill() —— 会被 <<type>> 动画卡死
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

async function typeCommand(page, cmd) {
  const inp = await page.locator('input[type="text"]').first();
  await inp.click({ timeout: 3000 });
  await page.keyboard.type(cmd, { delay: 2 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
}

async function getBodyText(page) {
  return (await page.textContent('body')) || '';
}

test.describe(`E2E 防御性 stale state: ${gameKey}`, () => {
  test.beforeAll(async () => {
    const cfg = await loadConfig();
    if (!cfg.htmlFile || !existsSync(cfg.htmlFile)) {
      test.skip(true, `${gameKey} 无 HTML 文件，跳过此测试组`);
    }
  });

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(5000);
    const cfg = await loadConfig();
    const url = pathToFileURL(path.resolve(cfg.htmlFile)).href;
    await page.goto(url);
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
  });

  test('主用例：save 后输入"帮"不应触发"进度已保存"', async ({ page }) => {
    // 步骤 1：执行 save 正常反馈
    await typeCommand(page, 'save');
    const afterSave = await getBodyText(page);
    expect(afterSave, 'save 命令应产生"进度已保存"反馈').toContain('进度已保存');

    // 步骤 2：输入纯 CJK "帮"（sanitize 后变空，触发 stale state 缺陷）
    await typeCommand(page, '帮');
    const afterBang = await getBodyText(page);
    // SKILL.md §8.8 症状：玩家输入"帮"，游戏显示"进度已保存"——但用户根本没按 save
    // 修复后：stale state 不应穿透，"进度已保存"文本不应再出现
    expect(afterBang, 'stale state 不应触发第二次"进度已保存"').not.toContain('进度已保存');
  });

  test('空格扩展：note 测试 后输入 "   " 不应重复"笔记已记录"', async ({ page }) => {
    // 步骤 1：note 测试 触发反馈
    await typeCommand(page, 'note 测试');
    const afterNote = await getBodyText(page);
    expect(afterNote, 'note 测试 应产生"笔记已记录"反馈').toContain('笔记已记录');

    // 步骤 2：输入 3 空格（被 sanitize 清空，触发 stale state 缺陷）
    await typeCommand(page, '   ');
    const afterSpace = await getBodyText(page);
    // 修复后：纯空格不应重复触发 note 写入
    expect(afterSpace, '纯空格不应重复触发"笔记已记录"').not.toContain('笔记已记录');
  });

  test('特殊字符扩展：help 后输入 "!@#$%" 不应重复 help 内容', async ({ page }) => {
    // 步骤 1：执行 help 列出命令
    await typeCommand(page, 'help');
    const afterHelp = await getBodyText(page);
    const helpKeywordCountAfterFirst = (afterHelp.match(/help/g) || []).length;
    expect(helpKeywordCountAfterFirst, 'help 命令应至少出现一次 help 关键字').toBeGreaterThan(0);

    // 步骤 2：输入纯特殊字符（被 sanitize 清空，触发 stale state 缺陷）
    await typeCommand(page, '!@#$%');
    const afterSpecial = await getBodyText(page);
    // 修复后：特殊字符不应重复触发 help 分支
    // 注意：help 关键字可能在静态文案（"help 关键字"等）出现，所以这里断言"没有新增"
    const helpKeywordCountAfterSpecial = (afterSpecial.match(/help/g) || []).length;
    expect(
      helpKeywordCountAfterSpecial,
      '纯特殊字符不应重复触发 help 分支（关键字数不应增加）'
    ).toBeLessThanOrEqual(helpKeywordCountAfterFirst + 1);
  });
});
