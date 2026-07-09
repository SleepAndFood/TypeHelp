import { describe, test, expect } from 'vitest';
import { buildTagGraph, buildUnlockGraph, bfsReachable, detectUnreachableFiles, detectDeadEndFiles, checkEvidenceSufficiency, analyzeFacts, analyzeReasoning, parseExposesFromIndex } from '../helpers/reasoning.js';

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

describe('bfsReachable', () => {
  test('从起点 BFS 返回所有可达节点', () => {
    const graph = {
      nodes: ['A', 'B', 'C', 'D'],
      edges: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
      ],
    };
    const reachable = bfsReachable(graph, 'A');
    expect(reachable).toEqual(new Set(['A', 'B', 'C']));
    expect(reachable.has('D')).toBe(false);
  });
});

describe('detectUnreachableFiles', () => {
  test('无入边且非起点非结局的文件 = 不可达', () => {
    const tagGraph = {
      nodes: ['00-readme', '01-ST-1', '02-BR-1', '03-OR-1'],
      edges: [
        { from: '00-readme', to: '01-ST-1' },
        { from: '01-ST-1', to: '02-BR-1' },
      ],
    };
    const unlockGraph = { nodes: tagGraph.nodes, edges: [] };
    const result = detectUnreachableFiles(tagGraph, unlockGraph, {
      startPassage: '00-readme',
      endingPassages: ['02-BR-1'],
    });
    expect(result).toEqual(['03-OR-1']);
  });

  test('结局文件和起始文件不算不可达', () => {
    const tagGraph = {
      nodes: ['00-readme', '01-ST-1'],
      edges: [{ from: '00-readme', to: '01-ST-1' }],
    };
    const unlockGraph = { nodes: tagGraph.nodes, edges: [] };
    const result = detectUnreachableFiles(tagGraph, unlockGraph, {
      startPassage: '00-readme',
      endingPassages: ['01-ST-1'],
    });
    expect(result).toEqual([]);
  });
});

describe('detectDeadEndFiles', () => {
  test('无出边且非结局的文件 = 死胡同', () => {
    const tagGraph = {
      nodes: ['00-readme', '01-ST-1', '02-END-1'],
      edges: [
        { from: '00-readme', to: '01-ST-1' },
        { from: '01-ST-1', to: '02-END-1' },
      ],
    };
    const unlockGraph = { nodes: tagGraph.nodes, edges: [] };
    const result = detectDeadEndFiles(tagGraph, unlockGraph, {
      endingPassages: ['02-END-1'],
    });
    expect(result).toEqual([]); // 01-ST-1 有出边到 02-END-1
  });

  test('有入边但无出边的非结局文件 = 死胡同', () => {
    const tagGraph = {
      nodes: ['00-readme', '01-ST-1', '02-DEAD-1', '03-END-1'],
      edges: [
        { from: '00-readme', to: '01-ST-1' },
        { from: '01-ST-1', to: '02-DEAD-1' }, // 02-DEAD-1 有入边但无出边
        { from: '01-ST-1', to: '03-END-1' },
      ],
    };
    const unlockGraph = { nodes: tagGraph.nodes, edges: [] };
    const result = detectDeadEndFiles(tagGraph, unlockGraph, {
      endingPassages: ['03-END-1'],
    });
    expect(result).toEqual(['02-DEAD-1']);
  });
});

describe('checkEvidenceSufficiency', () => {
  test('可达揭露文件数 < 2 → 证据不足', () => {
    const facts = [
      { fId: 'F1', exposesIn: ['01-ST-1', '02-BR-1'], requiredForEnding: true },
      { fId: 'F2', exposesIn: ['03-OR-1'], requiredForEnding: false },
    ];
    const reachable = new Set(['00-readme', '01-ST-1', '02-BR-1']);
    const result = checkEvidenceSufficiency(facts, reachable);
    // F1: 2 个揭露文件都可达 → OK
    // F2: 仅 1 个揭露文件且不可达 → 证据不足
    expect(result.insufficient).toEqual([
      { fId: 'F2', reachableExposesCount: 0, totalExposesCount: 1 },
    ]);
  });

  test('所有 F 的揭露文件都可达且 >= 2 → 空', () => {
    const facts = [
      { fId: 'F1', exposesIn: ['01-ST-1', '02-BR-1'], requiredForEnding: true },
    ];
    const reachable = new Set(['01-ST-1', '02-BR-1']);
    const result = checkEvidenceSufficiency(facts, reachable);
    expect(result.insufficient).toEqual([]);
  });
});

describe('analyzeFacts', () => {
  test('所有揭露文件可达 → reachable=true', () => {
    const facts = [
      { fId: 'F1', exposesIn: ['01-ST-1', '02-BR-1'], requiredForEnding: true, verifiableClaims: ['A', 'B'] },
    ];
    const reachable = new Set(['00-readme', '01-ST-1', '02-BR-1']);
    const result = analyzeFacts(facts, reachable, { maxSteps: 30 });
    expect(result[0].reachable).toBe(true);
    expect(result[0].shortestPath).toBeLessThanOrEqual(30);
  });

  test('揭露文件不可达 → reachable=false', () => {
    const facts = [
      { fId: 'F2', exposesIn: ['99-XX-9'], requiredForEnding: false, verifiableClaims: ['C'] },
    ];
    const reachable = new Set(['00-readme']);
    const result = analyzeFacts(facts, reachable, { maxSteps: 30 });
    expect(result[0].reachable).toBe(false);
  });
});

describe('analyzeReasoning', () => {
  test('汇总分析：unreachableFacts + unreachableFiles + deadEndFiles', () => {
    const tagGraph = {
      nodes: ['00-readme', '01-ST-1', '02-BR-1', '03-OR-1'],
      edges: [
        { from: '00-readme', to: '01-ST-1' },
        { from: '01-ST-1', to: '02-BR-1' },
      ],
    };
    const unlockGraph = { nodes: tagGraph.nodes, edges: [] };
    const facts = [
      { fId: 'F1', exposesIn: ['01-ST-1', '02-BR-1'], requiredForEnding: true, verifiableClaims: ['A'] },
      { fId: 'F2', exposesIn: ['03-OR-1'], requiredForEnding: false, verifiableClaims: ['B'] },
    ];
    const result = analyzeReasoning(tagGraph, unlockGraph, facts, {
      startPassage: '00-readme',
      endingPassages: ['02-BR-1'],
      maxSteps: 30,
    });
    expect(result.unreachableFacts).toEqual(['F2']);
    expect(result.unreachableFiles).toEqual(['03-OR-1']);
    expect(result.deadEndFiles).toEqual([]); // 02-BR-1 是结局，不算死胡同
  });
});

describe('parseExposesFromIndex', () => {
  test('从 file_index.md 内容解析每个文件的 exposes 标注', () => {
    const indexContent = `### 11-11-MV-1
- **tags**: \`10-11-MV-1, 12-12-CH-1\`
- **exposes**: \`F1, F2\`
- **内容类型**: 玩家日志

### 21-SR-1
- **tags**: \`20-11-MV-1\`
- **exposes**: \`F1\`
- **内容类型**: 监控室`;
    const result = parseExposesFromIndex(indexContent);
    expect(result['11-11-MV-1']).toEqual(['F1', 'F2']);
    expect(result['21-SR-1']).toEqual(['F1']);
  });

  test('无 exposes 字段的文件不出现', () => {
    const indexContent = `### 00-readme
- **tags**: \`01-ST-1\`
- **内容类型**: meta教程`;
    const result = parseExposesFromIndex(indexContent);
    expect(result['00-readme']).toBeUndefined();
  });
});
