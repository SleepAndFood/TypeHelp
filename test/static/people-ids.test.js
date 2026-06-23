import { describe, test, expect } from 'vitest';
import { findInvalidPeopleIds } from '../../src/static/l1-helpers.js';
import { loadL1FromConfig, loadL1 } from './_fixture.js';

describe('people-ids (人物编号在白名单内)', () => {
  test('galley-villa 实际剧本无非法人物编号', async () => {
    const { config, passages } = await loadL1FromConfig('galley-villa');
    const invalid = findInvalidPeopleIds(passages, config);
    if (invalid.length) {
      console.warn('Galley Villa 非法人物编号:', invalid);
    }
    expect(invalid).toEqual([]);
  });

  test('island-death 实际剧本无非法人物编号', async () => {
    const { config, passages } = await loadL1FromConfig('island-death');
    const invalid = findInvalidPeopleIds(passages, config);
    if (invalid.length) {
      console.warn('Coral Bay 非法人物编号:', invalid);
    }
    expect(invalid).toEqual([]);
  });
});
