import { describe, test, expect } from 'vitest';
import { findPronounIssues } from '../helpers/character.js';
import { loadL1FromConfig } from '../static/_fixture.js';

describe('character-consistency (人物代词一致性)', () => {
  test('galley-villa 无人物代词违规（默认空约束）', async () => {
    const { passages, config } = await loadL1FromConfig('galley-villa');
    const issues = findPronounIssues(passages, config);
    expect(issues).toEqual([]);
  });
});
