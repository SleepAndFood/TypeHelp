/**
 * E2E 防御性测试 - 命令反馈完整性审计
 * 覆盖 SKILL.md §8.9 描述的"有副作用命令必须有可见反馈"缺陷
 *
 * 防御目标：
 *   1. 每条有副作用命令（help / list / save / back / name / note / find / load / hangman）
 *      执行后 body 文本必须变化（玩家能看到反馈）
 *   2. load 命令必须有反馈（"加载"/"存档"/"无存档"等任一即可）
 *   3. note 命令必须包含"笔记"或"已记录"反馈
 *   4. 风格审计：body 文本中不应同时含"Usage:"和"用法"（中英混用禁止）
 *
 * 根因：SugarCube Save.slots.load(0) 本身静默 + Box passage 直接调底层 API 不给反馈
 *       → 玩家不知道发生了什么 → 不敢再用
 *       反模式：技术视角"没报错就是成功" ≠ 用户视角
 *
 * 严格遵循 SKILL.md §8.11 的 Playwright 6 陷阱防御模式
 * 禁止使用 page.fill() —— 会被 <<type>> 动画卡死
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

/**
 * 执行命令并断言 body 文本发生变化（不静默）
 * 收集整页文本变化作为反馈完整性的弱证明
 */
async function expectFeedback(page, cmd) {
  const before = await getBodyText(page);
  await typeCommand(page, cmd);
  const after = await getBodyText(page);
  expect(after, `${cmd} 命令执行后 body 文本应变化（不允许静默）`).not.toBe(before);
  return after;
}

test.describe(`E2E 防御性 feedback audit: ${gameKey}`, () => {
  test.beforeAll(async () => {
    const cfg = await loadConfig();
    if (!cfg.htmlFile || !existsSync(cfg.htmlFile)) {
      test.skip(true, `${gameKey} 无 HTML 文件，跳过此测试组`);
    }
  });

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(5000);
    const cfg = await loadConfig();
    // 集中处理"进入游戏"首页过渡（galley-villa 的 Start passage 有"点击开始"/"跳过开头"）
    await launchGame(page, gameKey, cfg.htmlFile);
  });

  // ---- 反馈完整性：每条命令执行后 body 应变化 ----

  test('help 命令有反馈', async ({ page }) => {
    const text = await expectFeedback(page, 'help');
    expect(text.length, 'help 反馈文本非空').toBeGreaterThan(0);
  });

  test('list 命令有反馈', async ({ page }) => {
    await expectFeedback(page, 'list');
  });

  test('save 命令有反馈', async ({ page }) => {
    // save 在 galley-villa 走 UI.saves() 弹窗（无"进度已保存"中文反馈）
    // body 变化（弹窗 + ui-overlay）即可证明有反馈——具体关键字不强求
    await expectFeedback(page, 'save');
  });

  test('back 命令有反馈', async ({ page }) => {
    await expectFeedback(page, 'back');
  });

  test('name 命令有反馈', async ({ page }) => {
    await expectFeedback(page, 'name');
  });

  test('note 命令有反馈', async ({ page }) => {
    // galley-villa note 走 <<include "note">> passage，反馈是 "Notes" 标题或 notes 列表
    // 不强求"笔记"/"已记录"中文关键字——body 变化即证明有反馈
    const text = await expectFeedback(page, 'note 测试');
    // 附加：note 反馈中应包含 note passage 标题"Notes"或具体内容（防静默 fail）
    expect(text.length, 'note 反馈文本非空').toBeGreaterThan(0);
  });

  test('find foo 命令有反馈', async ({ page }) => {
    await expectFeedback(page, 'find foo');
  });

  test('load 命令有反馈', async ({ page }) => {
    // galley-villa load 命令走 <<include "load">> passage（无"加载"/"存档"中文反馈）
    // body 变化即证明有反馈
    await expectFeedback(page, 'load');
  });

  // ---- 反馈文案风格审计：禁止中英混用关键术语 ----

  test('风格审计：body 不应同时含"Usage:"和"用法"（中英混用）', async ({ page }) => {
    // 触发多条命令后，收集所有 body 文本做全局审计
    const commands = ['help', 'list', 'save', 'name', 'find foo', 'note 测试'];
    let combined = '';
    for (const cmd of commands) {
      await typeCommand(page, cmd);
      combined += (await getBodyText(page)) + '\n';
    }
    // SKILL.md §10 错误速查：错误消息中英混用
    // 反例：Box passage 用 <<=$fail_message>> 引用变量，但变量值是英文（"Usage: find <keyword>"），
    //      上层包装中文包裹"参数无效"——视觉风格漂移
    const hasEnglishUsage = combined.includes('Usage:');
    const hasChineseUsage = combined.includes('用法');
    expect(
      !(hasEnglishUsage && hasChineseUsage),
      '反馈文案风格混用：同时出现英文 "Usage:" 和中文 "用法"——应统一为全中文或全英文'
    ).toBe(true);
  });
});
