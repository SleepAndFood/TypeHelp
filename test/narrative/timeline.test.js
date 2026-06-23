import { describe, test, expect } from 'vitest';
import { findTimelineContradictions } from '../helpers/timeline.js';
import { forAllGames } from './_fixture.js';

describe('timeline (同时间码同人物多地点)', () => {
  test('timeline helper 默认 opt-in（不开启时不报矛盾）', () => {
    const sample = [
      { name: '01-LR-1-2', text: "''Living room''" },
      { name: '01-DR-1-2', text: "''Dining room''" },
    ];
    const config = { timeline: { /* enabled 默认 false */ } };
    expect(findTimelineContradictions(sample, config)).toEqual([]);
  });

  test('opt-in 后按 personFromTail 检查', () => {
    const sample = [
      { name: '01-LR-1', text: "''Living room''" },
      { name: '01-DR-1', text: "''Dining room''" },
    ];
    const config = { timeline: { enabled: true, personFromTail: [1], timeCodePosition: 0, timeCodeLength: 2, locationPattern: "''([^']+)''" } };
    const r = findTimelineContradictions(sample, config);
    expect(r).toEqual([{ time: 1, person: '1', locations: ['Living room', 'Dining room'] }]);
  });

  test('所有剧本在 timeline 未开启时不报矛盾（避免误报淹没）', async () => {
    await forAllGames(({ key, config, passages }) => {
      const r = findTimelineContradictions(passages, config);
      if (r.length) {
        throw new Error(`[${key}] 时间线矛盾: ${JSON.stringify(r.slice(0, 5))}`);
      }
    });
  });
});
