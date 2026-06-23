import { describe, test, expect } from 'vitest';
import { findTimelineContradictions } from '../helpers/timeline.js';
import { loadL1 } from '../static/_fixture.js';

describe('timeline (同时间码同人物多地点)', () => {
  test('minimal fixture 无矛盾（不应抛错）', async () => {
    const { passages, config } = await loadL1('tests-fixtures/minimal.html');
    const result = findTimelineContradictions(passages, config);
    expect(Array.isArray(result)).toBe(true);
  });
});
