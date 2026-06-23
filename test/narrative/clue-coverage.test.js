import { describe, test, expect } from 'vitest';
import { findUncoveredClues } from '../helpers/clue.js';
import { loadL1FromConfig } from '../static/_fixture.js';

describe('clue-coverage (关键线索出现次数)', () => {
  test('galley-villa 关键线索覆盖度', async () => {
    const { passages, config } = await loadL1FromConfig('galley-villa');
    const uncovered = findUncoveredClues(passages, config);
    if (uncovered.length) {
      console.warn('Galley Villa 未覆盖线索:', uncovered);
    }
    expect(uncovered).toEqual([]);
  });

  test('island-death 关键线索覆盖度（空配置应为 0 违规）', async () => {
    const { passages, config } = await loadL1FromConfig('island-death');
    const uncovered = findUncoveredClues(passages, config);
    expect(uncovered).toEqual([]);
  });
});
