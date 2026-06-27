/**
 * E2E 防御性测试 - framework drift
 * 覆盖 SKILL.md §8.6 描述的"框架性配置漂移"问题
 *
 * 防御目标：
 *   1. 每个有 HTML 的剧本必须存在 games/<name>/framework_diff.md
 *   2. framework_diff.md 必须包含至少 5 个 `## ` 章节标题
 *      （StoryInit / StoryMenu / StoryCaption / PassageHeader / 决策理由）
 *
 * 根因：Twine Implementer 阶段只关注实现 file_index.md，不关注和参考实现的框架级配置对齐
 *       "能跑"≠"和原版行为一致"
 *
 * 注意：本测试不启动浏览器，纯文件系统检查
 *       但为了统一放在 test/e2e/ 下，使用 test() 而非 test.describe()
 *       Playwright 仍会启动 chromium（test fixture 默认行为），但用例内不调用 page
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { resolveGameKey } from '../helpers/config.js';
import { browsersAvailable } from '../helpers/browsers.js';

const gameKey = resolveGameKey();
const repoRoot = path.resolve(process.cwd());

/**
 * 列举所有有 HTML 的剧本（framework_diff 仅对有 HTML 的剧本有意义）
 * 硬编码剧本清单（同步函数避免 beforeAll 异步问题）
 */
function listGamesWithHtml() {
  const candidates = ['galley-villa', 'island-death', 'terminal-mystery'];
  return candidates.filter((g) => {
    const cfgPath = path.join(repoRoot, 'games', g, 'test.config.js');
    if (!existsSync(cfgPath)) return false;
    // 同步读 config 不便（ESM），保守起见用文件存在性 + 命名约定判断
    // 已知 terminal-mystery 无 HTML，galley-villa / island-death 有 HTML
    return g !== 'terminal-mystery';
  });
}

test.describe(`E2E 防御性 framework drift: ${gameKey}`, () => {
  test.beforeAll(async () => {
    if (!(await browsersAvailable())) {
      test.skip(true, 'Playwright 浏览器未安装（运行 `npx playwright install` 启用）');
    }
  });
  test('当前剧本 framework_diff.md 存在且包含 5 个章节', () => {
    const target = path.join(repoRoot, 'games', gameKey, 'framework_diff.md');
    if (!existsSync(target)) {
      // SKILL.md §8.6 强制产出：Twine Implementer 完成后必须写 framework_diff.md
      expect.fail(
        `SKILL.md §8.6: 缺少 games/${gameKey}/framework_diff.md（Twine Implementer 必产，参考 games/framework_diff.template.md）`
      );
    }
    const content = readFileSync(target, 'utf8');
    // 校验包含 5 个章节标题（## 开头）
    const sectionCount = content.split('\n').filter((line) => line.trim().startsWith('## ')).length;
    expect(
      sectionCount,
      `framework_diff.md 应包含至少 5 个 ## 章节（StoryInit / StoryMenu / StoryCaption / PassageHeader / 决策理由），实际 ${sectionCount} 个`
    ).toBeGreaterThanOrEqual(5);
  });
});

/**
 * 跨剧本扫描：检查所有有 HTML 的剧本
 * 使用 test() 而非 test.describe() 因为这些是独立检查（每个剧本一个用例）
 */
test.describe('framework drift: 跨剧本扫描', () => {
  test.beforeAll(async () => {
    if (!(await browsersAvailable())) {
      test.skip(true, 'Playwright 浏览器未安装（运行 `npx playwright install` 启用）');
    }
  });
  for (const game of listGamesWithHtml()) {
    test(`games/${game}/framework_diff.md 存在且完整`, () => {
      const target = path.join(repoRoot, 'games', game, 'framework_diff.md');
      if (!existsSync(target)) {
        expect.fail(
          `SKILL.md §8.6: 缺少 games/${game}/framework_diff.md（Twine Implementer 必产）`
        );
      }
      const content = readFileSync(target, 'utf8');
      const sectionCount = content.split('\n').filter((line) => line.trim().startsWith('## ')).length;
      expect(sectionCount, `games/${game}/framework_diff.md 应包含至少 5 个 ## 章节`).toBeGreaterThanOrEqual(5);
    });
  }
});
