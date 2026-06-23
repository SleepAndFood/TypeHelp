import { describe, test, expect } from 'vitest';
import { findUncoveredClues } from '../helpers/clue.js';
import { forAllGames } from './_fixture.js';

describe('clue-coverage (关键线索出现次数)', () => {
  test('所有剧本关键线索覆盖度', async () => {
    await forAllGames(({ key, config, passages }) => {
      if (!config.criticalClues?.length) return;
      const uncovered = findUncoveredClues(passages, config);
      if (uncovered.length) {
        throw new Error(`[${key}] 未覆盖线索: ${JSON.stringify(uncovered)}`);
      }
    });
  });
});
