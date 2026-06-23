import { describe, test, expect } from 'vitest';
import { findBrokenRefs } from '../../src/static/l1-helpers.js';
import { loadL1, loadL1FromConfig } from './_fixture.js';

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

  test('galley-villa 实际剧本无悬空引用', async () => {
    const { passages } = await loadL1FromConfig('galley-villa');
    const broken = findBrokenRefs(passages, {});
    if (broken.length) {
      console.warn('Galley Villa 悬空引用:', broken);
    }
    expect(broken).toEqual([]);
  });
});
