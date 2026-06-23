import { describe, test, expect } from 'vitest';
import { findNamingViolations } from '../../src/static/l1-helpers.js';
import { loadL1 } from './_fixture.js';
import { forAllGames } from './_matrix.js';

describe('naming (passage 命名规则)', () => {
  test('minimal fixture 名称合规（galley-villa 风格 pattern）', async () => {
    // minimal fixture 的 passage 名称沿用 galley-villa 风格（NN-AA-N-N）
    const { passages } = await loadL1('tests-fixtures/minimal.html');
    const config = { namingPattern: '^[0-9]{2}-[A-Za-z]{2,3}(-[0-9A-Za-z@]+)+$', metaPrefix: '00-', commandRouterPassage: 'Box' };
    const violations = findNamingViolations(passages, config);
    expect(violations).toEqual([]);
  });

  // 系统性覆盖：3 剧本 × 各自动态 pattern
  test('所有剧本场景 passage 均符合 namingPattern', async () => {
    await forAllGames(({ key, config, passages }) => {
      const violations = findNamingViolations(passages, config);
      if (violations.length) {
        throw new Error(
          `[${key}] 命名违规 ${violations.length} 个，样本: ${JSON.stringify(violations.slice(0, 8))}` +
          (violations.length > 8 ? '...' : '')
        );
      }
    });
  });
});
