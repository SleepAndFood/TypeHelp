/**
 * TDD RED 阶段：parse.js 的测试驱动
 * 目的：在实现前先定义行为契约
 */
import { describe, test, expect } from 'vitest';
import { parsePassages, parsePassagesFromFiles } from './parse.js';

describe('parsePassages(htmlPath)', () => {
  test('合法 SugarCube HTML：返回数组，每项含 pid/name/tags/text', async () => {
    const result = await parsePassages('tests-fixtures/minimal.html');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);

    const box = result.find((p) => p.name === 'Box');
    expect(box).toBeDefined();
    expect(box.pid).toBe('1');
    expect(Array.isArray(box.tags)).toBe(true);
    expect(box.tags).toContain('01-LR-1-2');
    expect(box.tags).toContain('02-BR-1-3');
    expect(typeof box.text).toBe('string');
    expect(box.text).toContain('Box content');
  });

  test('不存在文件：抛错', async () => {
    await expect(parsePassages('tests-fixtures/not-exist.html')).rejects.toThrow();
  });

  test('无 tw-passagedata：返回空数组', async () => {
    const html = '<!doctype html><html><body><p>nothing</p></body></html>';
    const fs = await import('node:fs/promises');
    const tmp = 'tests-fixtures/_empty.html';
    await fs.writeFile(tmp, html, 'utf-8');
    try {
      const result = await parsePassages(tmp);
      expect(result).toEqual([]);
    } finally {
      await fs.unlink(tmp);
    }
  });
});

describe('parsePassagesFromFiles(files)', () => {
  test('从分片文件构造 passages（用于无 HTML 的剧本）', async () => {
    // 使用 minimal.html 内容直接当 fragment
    const fragA = '<tw-passagedata pid="10" name="A" tags="">A</tw-passagedata>';
    const fragB = '<tw-passagedata pid="11" name="B" tags="A">B</tw-passagedata>';
    const result = await parsePassagesFromFiles([
      { name: 'A', content: fragA },
      { name: 'B', content: fragB },
    ]);
    expect(result.length).toBe(2);
    expect(result.map((p) => p.name).sort()).toEqual(['A', 'B']);
  });
});
