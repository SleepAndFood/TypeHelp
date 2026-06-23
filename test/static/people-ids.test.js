import { describe, test, expect } from 'vitest';
import { findInvalidPeopleIds } from '../../src/static/l1-helpers.js';
import { forAllGames } from './_matrix.js';

describe('people-ids (人物编号在白名单内)', () => {
  test('所有剧本无非法人物编号（仅检查末位 token，避免误报）', async () => {
    await forAllGames(({ key, config, passages }) => {
      if (!config.peopleIds?.length) return; // 剧本无 peopleIds 列表 → 跳过检查
      const invalid = findInvalidPeopleIds(passages, config);
      if (invalid.length) {
        throw new Error(`[${key}] 非法人物编号: ${JSON.stringify(invalid.slice(0, 5))}`);
      }
    });
  });
});
