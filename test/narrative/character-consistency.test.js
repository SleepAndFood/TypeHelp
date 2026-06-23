import { describe, test, expect } from 'vitest';
import { findPronounIssues } from '../helpers/character.js';
import { forAllGames } from './_fixture.js';

describe('character-consistency (人物代词一致性)', () => {
  test('所有剧本均无人物代词违规（默认空约束自动通过）', async () => {
    await forAllGames(({ key, config, passages }) => {
      if (!config.characterConstraints?.length) return;
      const issues = findPronounIssues(passages, config);
      if (issues.length) {
        throw new Error(`[${key}] 代词违规: ${JSON.stringify(issues.slice(0, 5))}`);
      }
    });
  });
});
