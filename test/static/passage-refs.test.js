import { describe, test, expect } from 'vitest';
import { findBrokenRefs } from '../../src/static/l1-helpers.js';
import { loadL1, loadL1FromConfig } from './_fixture.js';
import { forAllGames, getAllGames } from './_matrix.js';

describe('passage-refs (tags 引用完整性)', () => {
  test('minimal fixture 无悬空引用', async () => {
    const { passages } = await loadL1('tests-fixtures/minimal.html');
    expect(findBrokenRefs(passages, {})).toEqual([]);
  });

  test('broken fixture 报告悬空引用', async () => {
    const { passages } = await loadL1('tests-fixtures/broken.html');
    const broken = findBrokenRefs(passages, {});
    expect(broken).toEqual([{ from: 'Box', missing: 'ghost-passage' }]);
  });

  // 系统性覆盖：3 个剧本都跑，避免单剧本漏检
  test('所有剧本均无悬空引用', async () => {
    await forAllGames(({ key, config, passages }) => {
      const broken = findBrokenRefs(passages, config);
      if (broken.length) {
        throw new Error(`[${key}] 悬空引用: ${JSON.stringify(broken.slice(0, 5))}${broken.length > 5 ? '...' : ''}`);
      }
    });
  });
});
