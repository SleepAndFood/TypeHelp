import { describe, test, expect } from 'vitest';
import { findNamingViolations } from '../../src/static/l1-helpers.js';
import { loadL1FromConfig, loadL1 } from './_fixture.js';

describe('naming (passage 命名规则)', () => {
  test('默认配置下 minimal fixture 名称合规', async () => {
    // minimal 的 Box 会被 systemNames 豁免；场景 passage 符合 ^\d\d-[A-Za-z]+-\d+
    const { config, passages } = await loadL1('tests-fixtures/minimal.html');
    const violations = findNamingViolations(passages, config);
    expect(violations).toEqual([]);
  });

  test('galley-villa 场景 passage 全部符合命名规则', async () => {
    const { config, passages } = await loadL1FromConfig('galley-villa');
    const violations = findNamingViolations(passages, config);
    if (violations.length) {
      console.warn('Galley Villa 命名违规:', violations);
    }
    expect(violations).toEqual([]);
  });
});
