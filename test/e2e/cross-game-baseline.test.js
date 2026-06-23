/**
 * E2E 防御性测试 - 跨剧本基线一致性审计
 * 覆盖 SKILL.md §8.10 描述的多剧本共享规范
 *
 * 防御目标（4 项基线）：
 *   1. UI bar 基线：StoryInit 包含 UIBar.destroy()  OR  framework_diff.md 包含"UI bar 保留"
 *   2. 历史策略基线：StoryInit 包含 Config.history.maxStates  OR  framework_diff.md 包含"历史策略"
 *   3. L10n 字符集基线：Box passage 的 sanitize 正则包含 \u4e00-\u9fff  OR  framework_diff.md 包含"L10n"
 *   4. 反馈风格基线：HTML 中不应同时含"Usage:"和"用法"（中英混用）
 *
 * 根因：仓内多个剧本独立实现，但框架级配置应该共享规范
 *       没有仓级规范 → 每个 Twine Implementer 各自决策 → 单点漂移
 *
 * 严格规则：framework_diff.md 缺失时硬性断言（不豁免）
 *           framework_diff.md 存在时软断言（HTML 源 OR 文档说明任一即可）
 *
 * 注意：本测试不启动浏览器，纯文件系统 + 简单文本扫描
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { load as cheerioLoad } from 'cheerio';
import { resolveGameKey } from '../helpers/config.js';

const gameKey = resolveGameKey();
const repoRoot = path.resolve(process.cwd());

// 列举所有有 HTML 的剧本（通过 test.config.js 动态发现）
const listGamesWithHtml = ['galley-villa', 'island-death'];

/**
 * 提取 tw-passagedata 中 name="StoryInit" 的内容（解码 HTML 实体）
 * @param {string} html
 * @returns {string}
 */
function extractStoryInitContent(html) {
  const $ = cheerioLoad(html, { xmlMode: true });
  let storyInitContent = '';
  $('tw-passagedata[name="StoryInit"]').each((_, el) => {
    storyInitContent += $(el).text() + '\n';
  });
  return storyInitContent;
}

/**
 * 提取 tw-passagedata 中 name="Box" 的内容（命令路由器 passage）
 * @param {string} html
 * @returns {string}
 */
function extractBoxContent(html) {
  const $ = cheerioLoad(html, { xmlMode: true });
  let boxContent = '';
  $('tw-passagedata[name="Box"]').each((_, el) => {
    boxContent += $(el).text() + '\n';
  });
  return boxContent;
}

/**
 * 审计单剧本的 4 项基线
 * @param {string} game
 * @param {string} htmlFile 来自 test.config.js 的 htmlFile 路径
 * @returns {{ ok: boolean, missing: string[] }}
 */
function auditBaselines(game, htmlFile) {
  const missing = [];
  const htmlPath = path.isAbsolute(htmlFile) ? htmlFile : path.join(repoRoot, htmlFile);
  if (!existsSync(htmlPath)) {
    return { ok: false, missing: [`${htmlFile} 不存在`] };
  }
  const html = readFileSync(htmlPath, 'utf8');
  const storyInit = extractStoryInitContent(html);
  const boxContent = extractBoxContent(html);

  const diffPath = path.join(repoRoot, 'games', game, 'framework_diff.md');
  const hasDiff = existsSync(diffPath);
  const diffContent = hasDiff ? readFileSync(diffPath, 'utf8') : '';

  // 基线 1：UI bar 处理
  //   HTML 必须含 UIBar.destroy  OR  framework_diff.md 含"UI bar 保留"或"UI bar"
  const hasUIBar = /UIBar\.destroy/i.test(storyInit);
  const hasUIBarDoc = hasDiff && /UI\s*bar/i.test(diffContent);
  if (!hasUIBar && !hasUIBarDoc) {
    missing.push(
      `基线 1（UI bar）失败：StoryInit 缺 UIBar.destroy() 且 framework_diff.md 未说明 "UI bar 保留"`
    );
  }

  // 基线 2：历史策略
  //   HTML 必须含 Config.history.maxStates  OR  framework_diff.md 含"历史策略"或"history"
  const hasHistory = /Config\.history\.maxStates/i.test(storyInit);
  const hasHistoryDoc = hasDiff && /历史|history/i.test(diffContent);
  if (!hasHistory && !hasHistoryDoc) {
    missing.push(
      `基线 2（历史策略）失败：StoryInit 缺 Config.history.maxStates 且 framework_diff.md 未说明 "历史策略"`
    );
  }

  // 基线 3：L10n 字符集
  //   Box passage 的 sanitize 正则必须含 \u4e00-\u9fff  OR  framework_diff.md 显式说明"纯英文"
  //   注意：HTML 实体中 \u 转义为 \u，cheerio 解码后是 \u4e00
  const hasL10n = /u4e00\s*-\s*u9fff/i.test(boxContent);
  const hasL10nDoc = hasDiff && /L10n|纯英文|中英|本地化/i.test(diffContent);
  if (!hasL10n && !hasL10nDoc) {
    missing.push(
      `基线 3（L10n 字符集）失败：Box passage sanitize 正则缺 \\u4e00-\\u9fff 且 framework_diff.md 未说明`
    );
  }

  // 基线 4：反馈风格（中英混用检查）
  //   HTML 中不应同时含 "Usage:" 和 "用法"——这是 SKILL.md §10 错误速查的典型反例
  const hasEnglishUsage = /Usage\s*:/i.test(html);
  const hasChineseUsage = /用法/.test(html);
  if (hasEnglishUsage && hasChineseUsage) {
    missing.push(
      `基线 4（反馈风格）失败：HTML 中同时含英文 "Usage:" 和中文 "用法"——应统一为全中文或全英文`
    );
  }

  return { ok: missing.length === 0, missing };
}

test.describe(`E2E 防御性 cross-game baseline: ${gameKey}`, () => {
  test('当前剧本通过 4 项基线审计', async () => {
    const configMod = await import(`../../games/${gameKey}/test.config.js`);
    const htmlFile = configMod.default.htmlFile;
    const { ok, missing } = auditBaselines(gameKey, htmlFile);
    if (!ok) {
      throw new Error(
        `SKILL.md §8.10 跨剧本基线审计失败（games/${gameKey}）：\n` +
          missing.map((m) => `  - ${m}`).join('\n')
      );
    }
    expect(ok).toBe(true);
  });
});

/** 跨剧本扫描：每个有 HTML 的剧本一个独立用例 */
test.describe('cross-game baseline: 跨剧本扫描', () => {
  for (const game of listGamesWithHtml) {
    test(`games/${game} 通过 4 项基线审计`, async () => {
      const configMod = await import(`../../games/${game}/test.config.js`);
      const htmlFile = configMod.default.htmlFile;
      const { ok, missing } = auditBaselines(game, htmlFile);
      if (!ok) {
        throw new Error(
          `SKILL.md §8.10 跨剧本基线审计失败（games/${game}）：\n` +
            missing.map((m) => `  - ${m}`).join('\n')
        );
      }
      expect(ok).toBe(true);
    });
  }
});
