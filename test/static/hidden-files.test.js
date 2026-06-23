import { describe, test, expect } from 'vitest';
import { findHiddenFileIssues } from '../../src/static/l1-helpers.js';
import { forAllGames } from './_matrix.js';

describe('hidden-files (隐藏文件存在)', () => {
  test('所有剧本 hiddenFiles 中每个文件均存在', async () => {
    await forAllGames(({ key, config, passages }) => {
      if (!config.hiddenFiles?.length) return;
      const issues = findHiddenFileIssues(passages, config);
      const missing = issues.filter((i) => i.kind === 'missing');
      if (missing.length) {
        throw new Error(`[${key}] hidden 缺失: ${JSON.stringify(missing)}`);
      }
    });
  });
});
