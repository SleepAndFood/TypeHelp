import { describe, test, expect } from 'vitest';
import { findHiddenFileIssues } from '../../src/static/l1-helpers.js';
import { loadL1FromConfig } from './_fixture.js';

describe('hidden-files (隐藏文件存在且被 list 排除)', () => {
  test('galley-villa 隐藏文件存在且未在 list 中', async () => {
    const { config, passages } = await loadL1FromConfig('galley-villa');
    const issues = findHiddenFileIssues(passages, config);
    if (issues.length) {
      console.warn('Galley Villa 隐藏文件问题:', issues);
    }
    expect(issues).toEqual([]);
  });
});
