import { describe, test, expect } from 'vitest';
import { buildTagGraph, buildUnlockGraph } from '../helpers/reasoning.js';

describe('buildTagGraph', () => {
  test('从 passages 构建 tag 图（含双向边）', () => {
    const passages = [
      { pid: '1', name: '00-readme', tags: ['01-ST-1'] },
      { pid: '2', name: '01-ST-1', tags: ['00-readme', '02-BR-1'] },
      { pid: '3', name: '02-BR-1', tags: ['01-ST-1'] },
    ];
    const graph = buildTagGraph(passages);
    expect(graph.nodes).toEqual(['00-readme', '01-ST-1', '02-BR-1']);
    // 00-readme 的 tags 含 01-ST-1 → 边 00-readme→01-ST-1
    expect(graph.edges).toContainEqual({ from: '00-readme', to: '01-ST-1' });
    // 01-ST-1 的 tags 含 00-readme 和 02-BR-1 → 两条边
    expect(graph.edges).toContainEqual({ from: '01-ST-1', to: '00-readme' });
    expect(graph.edges).toContainEqual({ from: '01-ST-1', to: '02-BR-1' });
    // 02-BR-1 的 tags 含 01-ST-1
    expect(graph.edges).toContainEqual({ from: '02-BR-1', to: '01-ST-1' });
  });

  test('过滤 self-loop（文件的 tag 引用自己）', () => {
    const passages = [
      { pid: '1', name: '00-readme', tags: ['00-readme', '01-ST-1'] },
      { pid: '2', name: '01-ST-1', tags: ['00-readme'] },
    ];
    const graph = buildTagGraph(passages);
    expect(graph.edges).not.toContainEqual({ from: '00-readme', to: '00-readme' });
  });

  test('过滤不存在的 tag 目标（tag 引用不在 passages 中的文件名）', () => {
    const passages = [
      { pid: '1', name: '00-readme', tags: ['01-ST-1', '99-XX-9'] },
      { pid: '2', name: '01-ST-1', tags: ['00-readme'] },
    ];
    const graph = buildTagGraph(passages);
    expect(graph.edges).not.toContainEqual({ from: '00-readme', to: '99-XX-9' });
  });
});

describe('buildUnlockGraph', () => {
  test('从 passage body 提取 $cache.push("filename") 构建解锁边', () => {
    const passages = [
      { name: '00-readme', text: '欢迎<<run $cache.push("01-ST-1")>>结束' },
      { name: '01-ST-1', text: '内容<<run $cache.push("02-BR-1")>>结尾' },
      { name: '02-BR-1', text: '结局' },
    ];
    const graph = buildUnlockGraph(passages);
    expect(graph.edges).toContainEqual({ from: '00-readme', to: '01-ST-1' });
    expect(graph.edges).toContainEqual({ from: '01-ST-1', to: '02-BR-1' });
  });

  test('匹配多种 cache.push 写法（单引号/双引号/无空格）', () => {
    const passages = [
      { name: 'A', text: "<<run $cache.push('B')>>" },
      { name: 'B', text: '<<run $cache.push("C")>>' },
      { name: 'C', text: '<<run $cache.push("D") >>' },
      { name: 'D', text: 'end' },
    ];
    const graph = buildUnlockGraph(passages);
    expect(graph.edges).toHaveLength(3);
  });

  test('过滤不存在的目标文件', () => {
    const passages = [
      { name: 'A', text: '<<run $cache.push("ZZ-NO")>>' },
      { name: 'B', text: 'end' },
    ];
    const graph = buildUnlockGraph(passages);
    expect(graph.edges).toHaveLength(0);
  });
});
