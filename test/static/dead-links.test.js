import { describe, test, expect } from 'vitest';
import { findDeadLinks } from '../../src/static/l1-helpers.js';
import { loadL1, loadL1FromConfig } from './_fixture.js';

describe('dead-links (passage 内部链接目标存在)', () => {
  test('minimal fixture 无死链', async () => {
    const { passages } = await loadL1('tests-fixtures/minimal.html');
    expect(findDeadLinks(passages, {})).toEqual([]);
  });

  test('broken fixture 报告死链', async () => {
    const { passages } = await loadL1('tests-fixtures/broken.html');
    const dead = findDeadLinks(passages, {});
    expect(dead).toEqual([{ from: '01-LR-1-2', target: 'missing-scene' }]);
  });

  test('galley-villa 实际剧本无死链', async () => {
    const { passages, config } = await loadL1FromConfig('galley-villa');
    const dead = findDeadLinks(passages, config);
    if (dead.length) {
      console.warn('Galley Villa 死链:', dead);
    }
    expect(dead).toEqual([]);
  });
});
