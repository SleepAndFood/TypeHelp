import { describe, test, expect } from 'vitest';
import { findDeadLinks } from '../../src/static/l1-helpers.js';
import { loadL1 } from './_fixture.js';
import { forAllGames } from './_matrix.js';

describe('dead-links (passage 内部链接目标存在)', () => {
  test('minimal fixture 无死链', async () => {
    const { passages } = await loadL1('tests-fixtures/minimal.html');
    expect(findDeadLinks(passages, {})).toEqual([]);
  });

  test('broken fixture 报告死链', async () => {
    const { passages } = await loadL1('tests-fixtures/broken.html');
    expect(findDeadLinks(passages, {})).toEqual([{ from: '01-LR-1-2', target: 'missing-scene' }]);
  });

  test('所有剧本均无死链（仅检查 ASCII 形如 passage 名的 target）', async () => {
    await forAllGames(({ key, config, passages }) => {
      const dead = findDeadLinks(passages, config);
      if (dead.length) {
        throw new Error(`[${key}] 死链 ${dead.length} 条，样本: ${JSON.stringify(dead.slice(0, 5))}`);
      }
    });
  });
});
