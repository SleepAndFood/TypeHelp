# 推理充分性测试框架 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为 TypeHelp 文字推理游戏剧本构建推理充分性测试框架，包含静态推理图分析（L6a/L6b）、Simulator/Grader Agent 提示词、launcher 脚本，并在 island-death 上验证。

**架构：** 三层分离——L6a 人工构图脚本产出 static-reasoning.json 入仓；L6b CI 消费入仓图重算可达性 + 死胡同 + 双证据并断言；L6 Agent 模拟由 launcher 脚本组装 Simulator + Grader 提示词供人工触发。新增 10 个 Agent 中的第 9（Inference Simulator）和第 10（Inference Grader）。

**技术栈：** Node.js ESM、Vitest、cheerio（HTML 解析）、纯 JS 图算法

**设计文档：** [docs/superpowers/specs/2026-07-09-reasoning-sufficiency-testing-design.md](file:///d:/WorkSpace/projects/TxtGame/docs/superpowers/specs/2026-07-09-reasoning-sufficiency-testing-design.md)

---

## 文件结构

### 新建文件

| 文件 | 职责 |
|---|---|
| `test/helpers/reasoning.js` | 纯函数：图构建 + BFS 可达性 + 不可达文件检测 + 死胡同检测 + 双证据检查 |
| `test/reasoning/helpers.test.js` | reasoning.js 纯函数自测（用合成 fixture） |
| `test/reasoning/static-reasoning.test.js` | L6b CI 测试：消费入仓 static-reasoning.json，重算并断言 |
| `test/reasoning/report-validation.test.js` | L6 报告校验：inference_trace/grades/report 格式 + 存在性 |
| `tests-fixtures/reasoning-graph.html` | 合成的极简剧本 HTML（4 文件 + 2 F + 1 不可达） |
| `tests-fixtures/reasoning-file-index.md` | 合成剧本的 file_index（含 exposes 标注） |
| `scripts/build-reasoning-graph.js` | L6a 脚本：解析 HTML tags + cache.push + file_index exposes → 产出 static-reasoning.json |
| `scripts/reasoning-simulator-launcher.js` | launcher：读 agent_profile.md，剥离 §3/§5，组装 Simulator + Grader 提示词 |
| `.trae/specs/typehelp-novel-design/prompts/inference-simulator.md` | Simulator Agent 提示词 |
| `.trae/specs/typehelp-novel-design/prompts/inference-grader.md` | Grader Agent 提示词 |
| `games/island-death/agent_profile.md` | island-death 的 Simulator 引导文件 |

### 修改文件

| 文件 | 改动 |
|---|---|
| `game.config.js` | 新增 `reasoning` 默认配置字段 |
| `games/island-death/test.config.js` | 新增 `reasoning` 配置 |
| `games/island-death/truth.md` | F 事实表补 `inferability` / `required_for_ending` / `verifiable_claims` |
| `games/island-death/file_index.md` | 每个文件条目补 `exposes` 标注 |
| `package.json` | 新增 `reasoning:build-graph` + `reasoning:simulate` scripts |
| `AGENTS.md` | §3 表 1 追加 C10；§3 表 2 追加 L6 层 |
| `.trae/skills/typehelp-novel-design/SKILL.md` | §3.2 追加 C10；§4 追加 Agent 9/10；§6 追加 Step 19/20 |

---

## 任务 1：reasoning.js 纯函数 — 图构建

**文件：**
- 创建：`test/helpers/reasoning.js`
- 测试：`test/reasoning/helpers.test.js`

- [ ] **步骤 1：编写失败的测试 — buildTagGraph**

```javascript
// test/reasoning/helpers.test.js
import { describe, test, expect } from 'vitest';
import { buildTagGraph } from '../helpers/reasoning.js';

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
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：FAIL，报错 `buildTagGraph is not a function` 或模块不存在

- [ ] **步骤 3：实现 buildTagGraph**

```javascript
// test/helpers/reasoning.js

/**
 * 从 passages 构建 tag 图。
 * 每个 passage 的 tags 属性中的每个 tag 指向另一个 passage name → 形成有向边。
 * 过滤 self-loop 和不存在的目标。
 * @param {Array<{name: string, tags: string[]}>} passages
 * @returns {{nodes: string[], edges: Array<{from: string, to: string}>}}
 */
export function buildTagGraph(passages) {
  const nameSet = new Set(passages.map(p => p.name));
  const nodes = [...nameSet];
  const edges = [];
  for (const p of passages) {
    for (const tag of (p.tags || [])) {
      if (tag === p.name) continue;       // self-loop
      if (!nameSet.has(tag)) continue;     // 目标不存在
      edges.push({ from: p.name, to: tag });
    }
  }
  return { nodes, edges };
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：PASS（3 个 test 全通过）

- [ ] **步骤 5：Commit**

```bash
git add test/helpers/reasoning.js test/reasoning/helpers.test.js
git commit -m "feat(reasoning): buildTagGraph 纯函数 + 测试"
```

---

## 任务 2：reasoning.js — 解锁图构建

**文件：**
- 修改：`test/helpers/reasoning.js`
- 修改：`test/reasoning/helpers.test.js`

- [ ] **步骤 1：编写失败的测试 — buildUnlockGraph**

```javascript
// 追加到 test/reasoning/helpers.test.js
import { buildUnlockGraph } from '../helpers/reasoning.js';

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
      { name: 'A', text: '<<run $cache.push(\'B\')>>' },
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
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：FAIL，`buildUnlockGraph is not a function`

- [ ] **步骤 3：实现 buildUnlockGraph**

```javascript
// 追加到 test/helpers/reasoning.js

const CACHE_PUSH_RE = /<<\s*run\s+\$cache\.push\(\s*['"]([^'"]+)['"]\s*\)\s*>>/g;

/**
 * 从 passage body 的 <<run $cache.push("filename")>> 构建解锁图。
 * 调用方 → 参数文件名 = 有向边。
 * @param {Array<{name: string, text: string}>} passages
 * @returns {{nodes: string[], edges: Array<{from: string, to: string}>}}
 */
export function buildUnlockGraph(passages) {
  const nameSet = new Set(passages.map(p => p.name));
  const nodes = [...nameSet];
  const edges = [];
  for (const p of passages) {
    let match;
    CACHE_PUSH_RE.lastIndex = 0;
    while ((match = CACHE_PUSH_RE.exec(p.text || '')) !== null) {
      const target = match[1];
      if (!nameSet.has(target)) continue;
      edges.push({ from: p.name, to: target });
    }
  }
  return { nodes, edges };
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：PASS（全部 test 通过）

- [ ] **步骤 5：Commit**

```bash
git add test/helpers/reasoning.js test/reasoning/helpers.test.js
git commit -m "feat(reasoning): buildUnlockGraph 纯函数 + 测试"
```

---

## 任务 3：reasoning.js — BFS 可达性 + 不可达文件检测

**文件：**
- 修改：`test/helpers/reasoning.js`
- 修改：`test/reasoning/helpers.test.js`

- [ ] **步骤 1：编写失败的测试 — bfsReachable + detectUnreachableFiles**

```javascript
// 追加到 test/reasoning/helpers.test.js
import { bfsReachable, detectUnreachableFiles } from '../helpers/reasoning.js';

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
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：FAIL，`bfsReachable is not a function`

- [ ] **步骤 3：实现 bfsReachable + detectUnreachableFiles**

```javascript
// 追加到 test/helpers/reasoning.js

/**
 * 从起点 BFS 遍历图，返回所有可达节点（含起点自身）。
 * @param {{nodes: string[], edges: Array<{from: string, to: string}>}} graph
 * @param {string} start
 * @returns {Set<string>}
 */
export function bfsReachable(graph, start) {
  const adj = new Map();
  for (const node of graph.nodes) adj.set(node, []);
  for (const edge of graph.edges) {
    if (!adj.has(edge.from)) adj.set(edge.from, []);
    adj.get(edge.from).push(edge.to);
  }
  const visited = new Set([start]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const next of (adj.get(current) || [])) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return visited;
}

/**
 * 合并 tag 图和解锁图的入边，检测无入边且非起点非结局的文件。
 * @param {object} tagGraph
 * @param {object} unlockGraph
 * @param {{startPassage: string, endingPassages: string[]}} options
 * @returns {string[]} 不可达文件名列表
 */
export function detectUnreachableFiles(tagGraph, unlockGraph, options) {
  const { startPassage, endingPassages } = options;
  const endingSet = new Set(endingPassages);
  // 收集所有有入边的文件
  const hasIncoming = new Set();
  for (const e of tagGraph.edges) hasIncoming.add(e.to);
  for (const e of unlockGraph.edges) hasIncoming.add(e.to);
  // 所有节点
  const allNodes = new Set([...tagGraph.nodes, ...unlockGraph.nodes]);
  const unreachable = [];
  for (const node of allNodes) {
    if (node === startPassage) continue;
    if (endingSet.has(node)) continue;
    if (!hasIncoming.has(node)) unreachable.push(node);
  }
  return unreachable;
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add test/helpers/reasoning.js test/reasoning/helpers.test.js
git commit -m "feat(reasoning): bfsReachable + detectUnreachableFiles + 测试"
```

---

## 任务 4：reasoning.js — 死胡同检测 + 双证据检查

**文件：**
- 修改：`test/helpers/reasoning.js`
- 修改：`test/reasoning/helpers.test.js`

- [ ] **步骤 1：编写失败的测试 — detectDeadEndFiles + checkEvidenceSufficiency**

```javascript
// 追加到 test/reasoning/helpers.test.js
import { detectDeadEndFiles, checkEvidenceSufficiency } from '../helpers/reasoning.js';

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
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：FAIL

- [ ] **步骤 3：实现 detectDeadEndFiles + checkEvidenceSufficiency**

```javascript
// 追加到 test/helpers/reasoning.js

/**
 * 检测死胡同文件：有入边但无出边，且非结局文件。
 * @param {object} tagGraph
 * @param {object} unlockGraph
 * @param {{endingPassages: string[]}} options
 * @returns {string[]} 死胡同文件名列表
 */
export function detectDeadEndFiles(tagGraph, unlockGraph, options) {
  const { endingPassages } = options;
  const endingSet = new Set(endingPassages);
  // 收集所有有出边的文件
  const hasOutgoing = new Set();
  for (const e of tagGraph.edges) hasOutgoing.add(e.from);
  for (const e of unlockGraph.edges) hasOutgoing.add(e.from);
  // 所有节点
  const allNodes = new Set([...tagGraph.nodes, ...unlockGraph.nodes]);
  const deadEnds = [];
  for (const node of allNodes) {
    if (endingSet.has(node)) continue;
    if (!hasOutgoing.has(node)) deadEnds.push(node);
  }
  return deadEnds;
}

/**
 * 检查每个 F 的可达揭露文件数是否 >= 2。
 * @param {Array<{fId: string, exposesIn: string[], requiredForEnding: boolean}>} facts
 * @param {Set<string>} reachableSet - 从起点 BFS 可达的文件集合
 * @returns {{insufficient: Array<{fId: string, reachableExposesCount: number, totalExposesCount: number}>}}
 */
export function checkEvidenceSufficiency(facts, reachableSet) {
  const insufficient = [];
  for (const fact of facts) {
    const reachableExposes = (fact.exposesIn || []).filter(f => reachableSet.has(f));
    if (reachableExposes.length < 2) {
      insufficient.push({
        fId: fact.fId,
        reachableExposesCount: reachableExposes.length,
        totalExposesCount: (fact.exposesIn || []).length,
      });
    }
  }
  return { insufficient };
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add test/helpers/reasoning.js test/reasoning/helpers.test.js
git commit -m "feat(reasoning): detectDeadEndFiles + checkEvidenceSufficiency + 测试"
```

---

## 任务 5：reasoning.js — F 可达性检测 + 汇总分析

**文件：**
- 修改：`test/helpers/reasoning.js`
- 修改：`test/reasoning/helpers.test.js`

- [ ] **步骤 1：编写失败的测试 — analyzeFacts + analyzeReasoning**

```javascript
// 追加到 test/reasoning/helpers.test.js
import { analyzeFacts, analyzeReasoning } from '../helpers/reasoning.js';

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
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：FAIL

- [ ] **步骤 3：实现 analyzeFacts + analyzeReasoning**

```javascript
// 追加到 test/helpers/reasoning.js

/**
 * 分析每个 F 的可达性。
 * @param {Array<{fId: string, exposesIn: string[], requiredForEnding: boolean, verifiableClaims: string[]}>} facts
 * @param {Set<string>} reachableSet
 * @param {{maxSteps: number}} options
 * @returns {Array<object>} 每个 F 的分析结果
 */
export function analyzeFacts(facts, reachableSet, options) {
  const { maxSteps } = options;
  return facts.map(fact => {
    const reachableExposes = (fact.exposesIn || []).filter(f => reachableSet.has(f));
    const reachable = reachableExposes.length > 0;
    return {
      fId: fact.fId,
      exposesIn: fact.exposesIn || [],
      requiredForEnding: fact.requiredForEnding,
      verifiableClaims: fact.verifiableClaims || [],
      reachable,
      reachableExposesCount: reachableExposes.length,
      evidenceCount: (fact.exposesIn || []).length,
    };
  });
}

/**
 * 汇总分析：合并 tag 图 + 解锁图，检测 F 可达性 + 不可达文件 + 死胡同 + 双证据。
 * @param {object} tagGraph
 * @param {object} unlockGraph
 * @param {Array<object>} facts
 * @param {{startPassage: string, endingPassages: string[], maxSteps: number}} options
 * @returns {object} 完整分析报告
 */
export function analyzeReasoning(tagGraph, unlockGraph, facts, options) {
  const { startPassage, endingPassages, maxSteps } = options;
  const reachable = bfsReachable(
    { nodes: [...new Set([...tagGraph.nodes, ...unlockGraph.nodes])], edges: [...tagGraph.edges, ...unlockGraph.edges] },
    startPassage
  );
  const factAnalysis = analyzeFacts(facts, reachable, { maxSteps });
  const unreachableFacts = factAnalysis.filter(f => !f.reachable).map(f => f.fId);
  const unreachableFiles = detectUnreachableFiles(tagGraph, unlockGraph, { startPassage, endingPassages });
  const deadEndFiles = detectDeadEndFiles(tagGraph, unlockGraph, { endingPassages });
  const evidenceCheck = checkEvidenceSufficiency(facts, reachable);
  return {
    facts: factAnalysis,
    unreachableFacts,
    unreachableFiles,
    deadEndFiles,
    evidenceInsufficient: evidenceCheck.insufficient,
    reachableNodes: [...reachable],
  };
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add test/helpers/reasoning.js test/reasoning/helpers.test.js
git commit -m "feat(reasoning): analyzeFacts + analyzeReasoning 汇总分析 + 测试"
```

---

## 任务 6：file_index.md exposes 解析器

**文件：**
- 修改：`test/helpers/reasoning.js`
- 修改：`test/reasoning/helpers.test.js`

- [ ] **步骤 1：编写失败的测试 — parseExposesFromIndex**

```javascript
// 追加到 test/reasoning/helpers.test.js
import { parseExposesFromIndex } from '../helpers/reasoning.js';

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
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：FAIL

- [ ] **步骤 3：实现 parseExposesFromIndex**

```javascript
// 追加到 test/helpers/reasoning.js

const FILE_HEADER_RE = /^###\s+(\S+)/gm;
const EXPOSES_RE = /- \*\*exposes\*\*:\s*`([^`]+)`/;

/**
 * 从 file_index.md 内容解析每个文件的 exposes 标注。
 * @param {string} indexContent - file_index.md 的完整文本
 * @returns {Object<string, string[]>} { 文件名: [F1, F2, ...] }
 */
export function parseExposesFromIndex(indexContent) {
  const result = {};
  const sections = indexContent.split(/^(?=###\s)/m);
  for (const section of sections) {
    const headerMatch = section.match(/^###\s+(\S+)/);
    if (!headerMatch) continue;
    const fileName = headerMatch[1];
    const exposesMatch = section.match(EXPOSES_RE);
    if (exposesMatch) {
      result[fileName] = exposesMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return result;
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add test/helpers/reasoning.js test/reasoning/helpers.test.js
git commit -m "feat(reasoning): parseExposesFromIndex file_index 解析器 + 测试"
```

---

## 任务 7：truth.md F 事实解析器

**文件：**
- 修改：`test/helpers/reasoning.js`
- 修改：`test/reasoning/helpers.test.js`

- [ ] **步骤 1：编写失败的测试 — parseFactsFromTruth**

```javascript
// 追加到 test/reasoning/helpers.test.js
import { parseFactsFromTruth } from '../helpers/reasoning.js';

describe('parseFactsFromTruth', () => {
  test('从 truth.md §2 表格解析 F 事实 + 新标注字段', () => {
    const truthContent = `## 2. 客观事实表 F

| 编号 | 事实 | 物理验证方式 |
|---|---|---|
| **F1** | 江某被赵某推入泳池 | 监控日志 | inferability: medium | required_for_ending: true | verifiable_claims: ["赵某推江某", "23:40", "泳池"] |
| **F2** | 苏某是江某之女 | DNA报告 | inferability: hard | required_for_ending: false | verifiable_claims: ["苏某", "江某之女"] |
`;
    const result = parseFactsFromTruth(truthContent);
    expect(result).toHaveLength(2);
    expect(result[0].fId).toBe('F1');
    expect(result[0].inferability).toBe('medium');
    expect(result[0].requiredForEnding).toBe(true);
    expect(result[0].verifiableClaims).toEqual(['赵某推江某', '23:40', '泳池']);
    expect(result[1].fId).toBe('F2');
    expect(result[1].requiredForEnding).toBe(false);
  });

  test('缺少标注字段的 F 用默认值填充', () => {
    const truthContent = `## 2. 客观事实表 F

| 编号 | 事实 | 物理验证方式 |
|---|---|---|
| **F3** | 某事件 | 某证据 |
`;
    const result = parseFactsFromTruth(truthContent);
    expect(result[0].fId).toBe('F3');
    expect(result[0].inferability).toBe('medium');
    expect(result[0].requiredForEnding).toBe(true);
    expect(result[0].verifiableClaims).toEqual([]);
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：FAIL

- [ ] **步骤 3：实现 parseFactsFromTruth**

```javascript
// 追加到 test/helpers/reasoning.js

const FACT_ROW_RE = /\*\*(F\d+)\*\*\s*\|([^|]+)\|([^|]*)\|?([^]*)/;

/**
 * 从 truth.md §2 表格解析 F 事实列表。
 * 支持可选的 inferability / required_for_ending / verifiable_claims 标注。
 * @param {string} truthContent - truth.md 的完整文本
 * @returns {Array<{fId: string, description: string, evidence: string, inferability: string, requiredForEnding: boolean, verifiableClaims: string[]}>}
 */
export function parseFactsFromTruth(truthContent) {
  const result = [];
  const lines = truthContent.split('\n');
  let inFactTable = false;
  for (const line of lines) {
    if (line.startsWith('## 2.')) { inFactTable = true; continue; }
    if (inFactTable && line.startsWith('## ')) { inFactTable = false; continue; }
    if (!inFactTable) continue;
    if (line.startsWith('|---') || line.startsWith('| 编号')) continue;
    if (!line.startsWith('|')) continue;
    // 解析表格行：| **F1** | 事实 | 证据 | inferability: X | required_for_ending: Y | verifiable_claims: [...] |
    const cells = line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);
    if (cells.length < 1) continue;
    const fIdMatch = cells[0].match(/\*\*(F\d+)\*\*/);
    if (!fIdMatch) continue;
    const fId = fIdMatch[1];
    const description = cells[1] || '';
    const evidence = cells[2] || '';
    // 从剩余 cells 解析标注
    let inferability = 'medium';
    let requiredForEnding = true;
    let verifiableClaims = [];
    const restText = cells.slice(3).join(' ');
    const infMatch = restText.match(/inferability:\s*(\w+)/);
    if (infMatch) inferability = infMatch[1];
    const reqMatch = restText.match(/required_for_ending:\s*(true|false)/);
    if (reqMatch) requiredForEnding = reqMatch[1] === 'true';
    const claimsMatch = restText.match(/verifiable_claims:\s*\[([^\]]*)\]/);
    if (claimsMatch) {
      verifiableClaims = claimsMatch[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
    result.push({ fId, description, evidence, inferability, requiredForEnding, verifiableClaims });
  }
  return result;
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`npx vitest run test/reasoning/helpers.test.js`
预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add test/helpers/reasoning.js test/reasoning/helpers.test.js
git commit -m "feat(reasoning): parseFactsFromTruth truth.md 解析器 + 测试"
```

---

## 任务 8：合成 fixture 文件

**文件：**
- 创建：`tests-fixtures/reasoning-graph.html`
- 创建：`tests-fixtures/reasoning-file-index.md`

- [ ] **步骤 1：创建合成 HTML fixture**

```html
<!-- tests-fixtures/reasoning-graph.html -->
<!-- 合成极简剧本：4 文件 + tag 互引 + 1 不可达文件 -->
<tw-storydata name="reasoning-fixture" startnode="1">
  <tw-passagedata pid="1" name="00-readme" tags="01-ST-1">欢迎。<<run $cache.push("01-ST-1")>></tw-passagedata>
  <tw-passagedata pid="2" name="01-ST-1" tags="00-readme,02-BR-1">第一幕内容。<<run $cache.push("02-BR-1")>></tw-passagedata>
  <tw-passagedata pid="3" name="02-BR-1" tags="01-ST-1">结局文件。</tw-passagedata>
  <tw-passagedata pid="4" name="03-OR-1" tags="">孤儿文件（无入边，不可达）。</tw-passagedata>
</tw-storydata>
```

- [ ] **步骤 2：创建合成 file_index fixture**

```markdown
<!-- tests-fixtures/reasoning-file-index.md -->
# 合成剧本 file_index

### 00-readme
- **tags**: `01-ST-1`
- **exposes**: ``
- **内容类型**: meta教程

### 01-ST-1
- **tags**: `00-readme, 02-BR-1`
- **exposes**: `F1`
- **内容类型**: 玩家日志

### 02-BR-1
- **tags**: `01-ST-1`
- **exposes**: `F1, F2`
- **内容类型**: 结局

### 03-OR-1
- **tags**: ``
- **exposes**: `F2`
- **内容类型**: 孤儿
```

- [ ] **步骤 3：Commit**

```bash
git add tests-fixtures/reasoning-graph.html tests-fixtures/reasoning-file-index.md
git commit -m "test(reasoning): 合成 fixture（4 文件 + 2 F + 1 不可达）"
```

---

## 任务 9：L6a 构图脚本 — build-reasoning-graph.js

**文件：**
- 创建：`scripts/build-reasoning-graph.js`
- 修改：`package.json`

- [ ] **步骤 1：实现 build-reasoning-graph.js**

```javascript
// scripts/build-reasoning-graph.js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { buildTagGraph, buildUnlockGraph, parseExposesFromIndex, parseFactsFromTruth, analyzeReasoning } from '../test/helpers/reasoning.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// 解析 CLI 参数
const gameArg = process.argv.find(a => a.startsWith('--game='));
const gameKey = gameArg ? gameArg.split('=')[1] : null;
if (!gameKey) {
  console.error('用法: node scripts/build-reasoning-graph.js --game=<key>');
  process.exit(1);
}

const gameDir = join(projectRoot, 'games', gameKey);

// 加载 test.config.js 获取 htmlFile 路径
const configModule = await import(join(gameDir, 'test.config.js'));
const config = configModule.default || configModule;
if (!config.htmlFile) {
  console.error(`剧本 ${gameKey} 无 htmlFile 配置，跳过`);
  process.exit(0);
}

// 1. 解析 HTML passages
const htmlPath = join(projectRoot, config.htmlFile);
const html = readFileSync(htmlPath, 'utf-8');
const $ = cheerio.load(html);
const passages = [];
$('tw-passagedata').each((_, el) => {
  const $el = $(el);
  passages.push({
    pid: $el.attr('pid'),
    name: $el.attr('name'),
    tags: ($el.attr('tags') || '').split(' ').filter(Boolean),
    text: $el.text(),
  });
});

// 2. 构建 tag 图 + 解锁图
const tagGraph = buildTagGraph(passages);
const unlockGraph = buildUnlockGraph(passages);

// 3. 解析 file_index.md 的 exposes 标注
const indexContent = readFileSync(join(gameDir, 'file_index.md'), 'utf-8');
const exposesMap = parseExposesFromIndex(indexContent);

// 4. 解析 truth.md 的 F 事实
const truthContent = readFileSync(join(gameDir, 'truth.md'), 'utf-8');
const facts = parseFactsFromTruth(truthContent);
// 给每个 F 补上 exposesIn（从 exposesMap 反查）
for (const fact of facts) {
  fact.exposesIn = Object.entries(exposesMap)
    .filter(([_, fIds]) => fIds.includes(fact.fId))
    .map(([fileName, _]) => fileName);
}

// 5. 汇总分析
const reasoningConfig = config.reasoning || { maxSteps: 30, startPassage: '00-readme', endingPassages: [] };
const analysis = analyzeReasoning(tagGraph, unlockGraph, facts, {
  startPassage: reasoningConfig.startPassage,
  endingPassages: reasoningConfig.endingPassages || [],
  maxSteps: reasoningConfig.maxSteps || 30,
});

// 6. 产出 static-reasoning.json
const report = {
  gameKey,
  generatedAt: new Date().toISOString(),
  tagGraph,
  unlockGraph,
  facts: analysis.facts,
  unreachableFacts: analysis.unreachableFacts,
  unreachableFiles: analysis.unreachableFiles,
  deadEndFiles: analysis.deadEndFiles,
  evidenceInsufficient: analysis.evidenceInsufficient,
  reachableNodes: analysis.reachableNodes,
};

const reportDir = join(projectRoot, 'test', 'reasoning', '_reports');
mkdirSync(reportDir, { recursive: true });
const reportPath = join(reportDir, `${gameKey}.static-reasoning.json`);
writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

console.log(`✓ ${gameKey} 推理图已生成: ${reportPath}`);
console.log(`  - 不可达 F: ${report.unreachableFacts.length}`);
console.log(`  - 不可达文件: ${report.unreachableFiles.length}`);
console.log(`  - 死胡同文件: ${report.deadEndFiles.length}`);
console.log(`  - 证据不足 F: ${report.evidenceInsufficient.length}`);
```

- [ ] **步骤 2：在 package.json 添加 script**

```json
"reasoning:build-graph": "node scripts/build-reasoning-graph.js",
```

- [ ] **步骤 3：验证脚本可执行**

运行：`node scripts/build-reasoning-graph.js --game=island-death`
预期：产出 `test/reasoning/_reports/island-death.static-reasoning.json`（如果 island-death 的 truth.md/file_index.md 还没回填标注，F 的 exposesIn 会为空，unreachableFacts 可能很多——这是预期的，标注回填后重跑）

- [ ] **步骤 4：Commit**

```bash
git add scripts/build-reasoning-graph.js package.json
git commit -m "feat(reasoning): L6a 构图脚本 build-reasoning-graph.js"
```

---

## 任务 10：L6b CI 测试 — static-reasoning.test.js

**文件：**
- 创建：`test/reasoning/static-reasoning.test.js`
- 修改：`game.config.js`（新增 reasoning 默认配置）

- [ ] **步骤 1：在 game.config.js 添加 reasoning 默认配置**

```javascript
// 在 game.config.js 的 module.exports 中追加
reasoning: {
  enabled: true,
  maxSteps: 30,
  startPassage: '00-readme',
  endingPassages: [],
  gracePeriod: false, // 新剧本可设 true 获得 30 天豁免
},
```

- [ ] **步骤 2：编写 static-reasoning.test.js**

```javascript
// test/reasoning/static-reasoning.test.js
import { describe, test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { forAllGames } from '../static/_matrix.js';
import { analyzeReasoning } from '../helpers/reasoning.js';

describe('L6b 静态推理分析 (C10)', () => {
  test('所有剧本：static-reasoning.json 存在且无不可达 F / 无不可达文件', async () => {
    await forAllGames(async ({ key, config }) => {
      if (!config.htmlFile) return; // 跳过无 HTML 的剧本
      if (!config.reasoning?.enabled) return;
      if (config.reasoning?.gracePeriod) return; // 豁免期内跳过

      const reportPath = join(process.cwd(), 'test', 'reasoning', '_reports', `${key}.static-reasoning.json`);
      expect(existsSync(reportPath), `[${key}] 缺少 static-reasoning.json，请运行 npm run reasoning:build-graph -- --game=${key}`).toBe(true);

      const report = JSON.parse(readFileSync(reportPath, 'utf-8'));

      expect(report.unreachableFacts, `[${key}] 存在不可达 F 事实: ${report.unreachableFacts.join(', ')}`)
        .toEqual([]);
      expect(report.unreachableFiles, `[${key}] 存在不可达文件: ${report.unreachableFiles.join(', ')}`)
        .toEqual([]);
    });
  });
});
```

- [ ] **步骤 3：运行测试验证**

运行：`npx vitest run test/reasoning/static-reasoning.test.js`
预期：galley-villa 和 terminal-mystery 跳过（无 HTML 或无设计文档），island-death 如果标注未回填会 FAIL

- [ ] **步骤 4：Commit**

```bash
git add test/reasoning/static-reasoning.test.js game.config.js
git commit -m "feat(reasoning): L6b CI 静态推理分析测试 + reasoning 默认配置"
```

---

## 任务 11：L6 报告校验测试 — report-validation.test.js

**文件：**
- 创建：`test/reasoning/report-validation.test.js`

- [ ] **步骤 1：编写 report-validation.test.js**

```javascript
// test/reasoning/report-validation.test.js
import { describe, test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { forAllGames } from '../static/_matrix.js';

describe('L6 推理报告格式校验', () => {
  test('有 HTML 的剧本必须有 inference_trace.json + inference_grades.json + inference_report.md', async () => {
    await forAllGames(async ({ key, config }) => {
      if (!config.htmlFile) return;
      if (!config.reasoning?.enabled) return;
      if (config.reasoning?.gracePeriod) return;

      const gameDir = join(process.cwd(), 'games', key);
      const tracePath = join(gameDir, 'inference_trace.json');
      const gradesPath = join(gameDir, 'inference_grades.json');
      const reportPath = join(gameDir, 'inference_report.md');

      expect(existsSync(tracePath), `[${key}] 缺少 inference_trace.json`).toBe(true);
      expect(existsSync(gradesPath), `[${key}] 缺少 inference_grades.json`).toBe(true);
      expect(existsSync(reportPath), `[${key}] 缺少 inference_report.md`).toBe(true);
    });
  });

  test('inference_trace.json 结构合规', async () => {
    await forAllGames(async ({ key, config }) => {
      if (!config.htmlFile) return;
      if (!config.reasoning?.enabled) return;
      if (config.reasoning?.gracePeriod) return;

      const tracePath = join(process.cwd(), 'games', key, 'inference_trace.json');
      if (!existsSync(tracePath)) return;

      const trace = JSON.parse(readFileSync(tracePath, 'utf-8'));
      expect(trace.gameKey).toBe(key);
      expect(Array.isArray(trace.steps)).toBe(true);
      expect(trace.finalInference).toBeTypeOf('string');
      expect(trace.outcome).toBeTypeOf('string');
    });
  });

  test('inference_grades.json 结构合规', async () => {
    await forAllGames(async ({ key, config }) => {
      if (!config.htmlFile) return;
      if (!config.reasoning?.enabled) return;
      if (config.reasoning?.gracePeriod) return;

      const gradesPath = join(process.cwd(), 'games', key, 'inference_grades.json');
      if (!existsSync(gradesPath)) return;

      const grades = JSON.parse(readFileSync(gradesPath, 'utf-8'));
      expect(grades.requiredRecall).toBeTypeOf('number');
      expect(grades.optionalRecall).toBeTypeOf('number');
      expect(Array.isArray(grades.factsHit)).toBe(true);
      expect(Array.isArray(grades.factsMissed)).toBe(true);
      expect(Array.isArray(grades.failureCategorization)).toBe(true);
    });
  });
});
```

- [ ] **步骤 2：运行测试验证**

运行：`npx vitest run test/reasoning/report-validation.test.js`
预期：island-death 如果还没有 inference 产出文件会 FAIL——这是预期的，标注回填 + Agent 试玩后产出文件后重跑

- [ ] **步骤 3：Commit**

```bash
git add test/reasoning/report-validation.test.js
git commit -m "test(reasoning): L6 推理报告格式校验测试"
```

---

## 任务 12：island-death truth.md 标注回填

**文件：**
- 修改：`games/island-death/truth.md`

- [ ] **步骤 1：读取 island-death/truth.md 的 §2 F 事实表**

读取：`games/island-death/truth.md`
找到 `## 2. 客观事实表 F` 章节，提取所有 F1-F15 条目。

- [ ] **步骤 2：为每个 F 补充 3 个字段**

对每个 F 事实，在"物理验证方式"列后追加：
- `inferability: easy|medium|hard|trap`
- `required_for_ending: true|false`
- `verifiable_claims: ["关键词1", "关键词2", ...]`

**verifiable_claims 设计原则**：覆盖 F 的"谁 + 何时 + 何地 + 做了什么"，用可语义匹配的短语。

**required_for_ending 判定原则**：如果玩家不推出此 F 就无法达成 true ending → true；如果是补充细节/支线 → false。

**完整示例（F1）**——基于 axis_matrix.md 中 F1 的双证据：
```markdown
| **F1** | 江某于2017.08.11 23:40被赵某推入泳池，非意外落水 | 监控日志碎片 + 园丁证词 | inferability: medium | required_for_ending: true | verifiable_claims: ["赵某推江某", "23:40", "泳池", "非意外"] |
```

参考 `games/island-death/axis_matrix.md` §4 的三轴交叉表，每个 F 都列出了揭露文件和视角类型，据此设计 verifiable_claims。

- [ ] **步骤 3：验证解析器能正确解析**

运行：`node -e "import('./test/helpers/reasoning.js').then(m => { const fs = require('fs'); const c = fs.readFileSync('games/island-death/truth.md','utf-8'); const facts = m.parseFactsFromTruth(c); console.log(JSON.stringify(facts, null, 2)); })"`

预期：输出 15 个 F 的结构化对象，每个含 fId / inferability / requiredForEnding / verifiableClaims

- [ ] **步骤 4：Commit**

```bash
git add games/island-death/truth.md
git commit -m "feat(island-death): truth.md F 事实补推理标注（inferability/required_for_ending/verifiable_claims）"
```

---

## 任务 13：island-death file_index.md 标注回填

**文件：**
- 修改：`games/island-death/file_index.md`

- [ ] **步骤 1：读取 island-death/file_index.md 全文**

读取：`games/island-death/file_index.md`

- [ ] **步骤 2：为每个文件条目补充 exposes 字段**

对每个 `### <文件名>` 条目，在 `**tags**` 行后追加：
```markdown
- **exposes**: `F1, F2`   （如果该文件正文揭露了 F1 和 F2）
```

如果文件不揭露任何 F 事实：
```markdown
- **exposes**: ``
```

**标注规则**：
- 只标注"显式陈述"（C2 约束：证据以文件形式可读）
- 隐藏文件 / meta 文件也标注
- 参考 truth.md §2 的 F 描述，判断文件正文是否揭露该 F

- [ ] **步骤 3：验证解析器能正确解析**

运行：`node -e "import('./test/helpers/reasoning.js').then(m => { const fs = require('fs'); const c = fs.readFileSync('games/island-death/file_index.md','utf-8'); const e = m.parseExposesFromIndex(c); console.log(Object.keys(e).length, 'files with exposes'); })"`

预期：输出有 exposes 标注的文件数量

- [ ] **步骤 4：重跑 L6a 构图脚本**

运行：`node scripts/build-reasoning-graph.js --game=island-death`
预期：产出的 static-reasoning.json 中 facts 数组有 15 个 F，每个 F 的 exposesIn 非空

- [ ] **步骤 5：Commit**

```bash
git add games/island-death/file_index.md test/reasoning/_reports/island-death.static-reasoning.json
git commit -m "feat(island-death): file_index.md 补 exposes 标注 + 重生成 static-reasoning.json"
```

---

## 任务 14：island-death test.config.js reasoning 配置

**文件：**
- 修改：`games/island-death/test.config.js`

- [ ] **步骤 1：添加 reasoning 配置**

在 `games/island-death/test.config.js` 中追加：
```javascript
reasoning: {
  enabled: true,
  maxSteps: 30,
  startPassage: '00-readme',
  endingPassages: [],  // 留空：island-death 的结局通过 $cache 阈值触发 final-note，无独立结局 passage
},
```

**说明**：island-death 采用 C9 约束（唯一结局 = 阈值 + final-note），结局通过 `$cache_max` 达阈值触发，没有独立的"结局 passage"。因此 `endingPassages` 留空，死胡同检测会把 final-note 类文件算作死胡同（这是合理的警告，Director 审查时排除）。

- [ ] **步骤 2：运行 L6b 测试验证**

运行：`npx vitest run test/reasoning/static-reasoning.test.js`
预期：如果标注回填完成且无不可达 F / 不可达文件 → PASS；否则暴露具体问题

- [ ] **步骤 3：Commit**

```bash
git add games/island-death/test.config.js
git commit -m "feat(island-death): test.config.js 添加 reasoning 配置"
```

---

## 任务 15：Simulator Agent 提示词

**文件：**
- 创建：`.trae/specs/typehelp-novel-design/prompts/inference-simulator.md`

- [ ] **步骤 1：编写 Simulator 提示词**

```markdown
# Inference Simulator Agent 提示词

> 你是第 9 个 Agent。你的职责是**黑盒模拟玩家推理**。

## 角色定位

你是**对该剧本一无所知的玩家**。你不读 truth.md / file_index.md / axis_matrix.md / tag_graph.md / verification_report.md / playtest_log.md。你**只能**：
- 打开游戏 HTML 文件（通过 Playwright 或人工操作）
- 像真人一样输入命令（list / find / 文件名等）
- 维护"已知信息摘要"（你的记忆）
- 每条推理必须引用**具体文件名 + 文件内原文片段**

## 输入

- `games/<key>/agent_profile.md` 的 §0-§2, §4（Simulator 可见部分）
- `games/<key>/<key>.html`（游戏本身）

**禁止注入**：truth.md / file_index.md / axis_matrix.md / tag_graph.md / verification_report.md / playtest_log.md / inference_report.md（历史版本）

## 试玩流程

1. 启动游戏（打开 HTML 或通过 Playwright）
2. 读取初始 passage 内容
3. 在"已知信息摘要"中记录关键信息
4. 决定下一步命令（基于已有信息推理"还需要知道什么"）
5. 输入命令 → 读取响应 → 更新已知信息
6. 重复 4-5 直到终止条件

## 证据锚定约束

**每条推理必须引用具体文件名 + 文件内原文片段**。格式：
```json
{ "file": "11-11-MV-1", "quote": "23:40泳池", "claim": "江某死于23:40泳池" }
```

**未引用证据的推理不计分**（Grader 判定时忽略）。这迫使你基于证据而非类型套话推理。

## 终止条件

- 达成结局（你自报"我认为真相是..."）
- 卡死（连续 3 步无新信息 / 步数 > 30 / 自报"放弃"）
- 超时（单次试玩 5 分钟）

## 输出格式

产出 `inference_trace.json`（**过程，不含分数**）：
```json
{
  "gameKey": "<game>",
  "trialId": 1,
  "steps": [
    {
      "step": 1,
      "command": "00-readme",
      "response_summary": "响应内容的简短摘要",
      "reasoning": "为什么输入这个命令",
      "evidence_collected": [
        { "file": "00-readme", "quote": "原文片段", "claim": "你的理解" }
      ]
    }
  ],
  "finalInference": "你认为的完整真相推理",
  "outcome": "true_ending | false_ending | stuck | timeout"
}
```

## 类型套话对照组（baseline 模式）

如果 agent_profile.md 指定跑 baseline：
- **不打开 HTML 文件**，不输入任何命令
- 只给 §0 题材与基调 + §1 玩家角色
- 直接要求你凭题材类型推理"你认为真相是什么"
- 产出格式同上，但 steps 为空数组，finalInference 是你的纯推理
```

- [ ] **步骤 2：Commit**

```bash
git add .trae/specs/typehelp-novel-design/prompts/inference-simulator.md
git commit -m "feat(prompts): Inference Simulator Agent 提示词"
```

---

## 任务 16：Grader Agent 提示词

**文件：**
- 创建：`.trae/specs/typehelp-novel-design/prompts/inference-grader.md`

- [ ] **步骤 1：编写 Grader 提示词**

```markdown
# Inference Grader Agent 提示词

> 你是第 10 个 Agent。你的职责是**白盒判定 F 命中 + 产出 recall / 失败归因**。

## 角色定位

你是**阅卷者**。你持有 truth.md（白盒权限），接收 Simulator 的 inference_trace.json，判定 F 命中并产出 recall / 失败归因。

## 输入

- `truth.md`（含 verifiable_claims / required_for_ending 标注）
- `inference_trace.json`（Simulator 产出）
- `static-reasoning.json`（L6 静态分析产出，用于交叉校验）

## F 命中判定

对每个 F：
1. 从 truth.md 提取 verifiable_claims
2. 扫描 Simulator 的 evidence_collected 中的 claim 字段
3. 逐条判定每个 verifiable_claim 是否被 Simulator 的任一 claim **语义覆盖**（同义、近义、不同语序表达均算覆盖）
4. 语义覆盖的 verifiable_claims 比例 ≥ 60% → 判定 F 命中
5. 记录命中的 claim 列表 + 对应文件

**关键**：你是 LLM Agent，用语义匹配判定 F 命中（非纯子串匹配）。verifiable_claims 是判定的锚点，不是做子串匹配——你必须对每个 claim 逐一判定"Simulator 的推理是否覆盖了这个 claim"。

## recall 计算

```
required_recall = 命中的 required_for_ending=true 的 F 数 / required_for_ending=true 的 F 总数
optional_recall = 命中的 required_for_ending=false 的 F 数 / required_for_ending=false 的 F 总数
```

**通过标准**：
- required_recall = 1.0
- optional_recall ≥ 0.5
- 9 类失败归因全为 0

## 9 类失败归因

对每个**未命中**的 F，结合 inference_trace.json + static-reasoning.json 归因到 9 类之一：

| 类型 | 判定规则 | 派单 Agent |
|---|---|---|
| 信息不足 | exposes_in[F] 文件数 < 2 或静态不可达 | File Designer |
| 歧义 | Simulator 推理出"另一套解释"且文件支持 | File Designer |
| 推理谬误 | Simulator 自报推理与证据矛盾 | Meta & Tutorial Designer |
| 死胡同 | Simulator 连续 3 步无新文件，且排除其他类型 | Tag Graph Designer |
| meta 触发失败 | F 的揭露文件是隐藏文件且无解锁路径 | Meta & Tutorial Designer |
| 命名不可推断 | Simulator 尝试输入文件名但格式错误 | File Designer |
| 教程解锁错位 | Simulator 需要某命令但该命令未解锁 | Meta & Tutorial Designer |
| 时空错位 | Simulator 推理中时间/地点混乱 | Inference Architect |
| 无明示需有暗示 | 文件中存在该信息但既不明示也无暗示 | File Designer |

**判定规则细节**：
- 文件内容中存在该信息但未明示 → "无明示需有暗示"
- 文件中完全无该信息 → "信息不足"
- Simulator 自己说"我觉得 X 但其实是 Y" → "推理谬误"
- Simulator 输入文件名但格式不对 → "命名不可推断"

## 类型套话基线判定

如果提供了 baseline 的 inference_trace.json：
- 计算 baseline recall（直接对 finalInference 做语义匹配，不要求证据锚定）
- 真实 Simulator recall - baseline recall ≥ 0.2 → valid: true
- 否则 → valid: false（Simulator 未基于证据推理）

## 输出格式

产出 `inference_grades.json`：
```json
{
  "gameKey": "<game>",
  "trialId": 1,
  "requiredRecall": 0.8,
  "optionalRecall": 0.4,
  "factsHit": ["F1", "F2"],
  "factsMissed": ["F3"],
  "failureCategorization": [
    { "fId": "F3", "type": "信息不足", "detail": "具体描述", "fixTarget": "File Designer" }
  ],
  "typeBaseline": {
    "baselineRecall": 0.2,
    "simulatorRecall": 0.53,
    "valid": true
  }
}
```

同时产出 `inference_report.md`（人类可读报告）：汇总多次试玩结果 + 9 类失败归因统计 + 改进建议。
```

- [ ] **步骤 2：Commit**

```bash
git add .trae/specs/typehelp-novel-design/prompts/inference-grader.md
git commit -m "feat(prompts): Inference Grader Agent 提示词"
```

---

## 任务 17：launcher 脚本 — reasoning-simulator-launcher.js

**文件：**
- 创建：`scripts/reasoning-simulator-launcher.js`
- 修改：`package.json`

- [ ] **步骤 1：实现 launcher 脚本**

```javascript
// scripts/reasoning-simulator-launcher.js
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// 解析 CLI 参数
const gameArg = process.argv.find(a => a.startsWith('--game='));
const gameKey = gameArg ? gameArg.split('=')[1] : null;
if (!gameKey) {
  console.error('用法: node scripts/reasoning-simulator-launcher.js --game=<key>');
  process.exit(1);
}

const gameDir = join(projectRoot, 'games', gameKey);
const profilePath = join(gameDir, 'agent_profile.md');

let profileContent;
try {
  profileContent = readFileSync(profilePath, 'utf-8');
} catch {
  console.error(`错误: ${profilePath} 不存在。请先产出 agent_profile.md`);
  process.exit(1);
}

// 剥离 §3（禁止透露项）和 §5（通过标准）—— 仅操作者可见
function stripOperatorOnlySections(content) {
  const sections = content.split(/^(?=## )/m);
  const visible = sections.filter(section => {
    const headerMatch = section.match(/^##\s+(\d+)/);
    if (!headerMatch) return true;
    const num = parseInt(headerMatch[1]);
    return num !== 3 && num !== 5; // 剥离 §3 和 §5
  });
  return visible.join('');
}

const simulatorVisibleProfile = stripOperatorOnlySections(profileContent);

// 读取提示词模板
const simulatorPrompt = readFileSync(
  join(projectRoot, '.trae', 'specs', 'typehelp-novel-design', 'prompts', 'inference-simulator.md'),
  'utf-8'
);
const graderPrompt = readFileSync(
  join(projectRoot, '.trae', 'specs', 'typehelp-novel-design', 'prompts', 'inference-grader.md'),
  'utf-8'
);

// 组装并输出
console.log('========================================');
console.log('Inference Simulator 提示词');
console.log('========================================');
console.log();
console.log(simulatorPrompt);
console.log();
console.log('--- agent_profile.md（Simulator 可见部分）---');
console.log(simulatorVisibleProfile);
console.log();
console.log('--- 游戏文件 ---');
console.log(`路径: games/${gameKey}/${gameKey}.html`);
console.log();
console.log('========================================');
console.log('Inference Grader 提示词');
console.log('========================================');
console.log();
console.log(graderPrompt);
console.log();
console.log('--- truth.md 路径 ---');
console.log(`路径: games/${gameKey}/truth.md`);
console.log();
console.log('--- inference_trace.json 路径（Simulator 产出）---');
console.log(`路径: games/${gameKey}/inference_trace.json`);
console.log();
console.log('--- static-reasoning.json 路径（L6a 产出）---');
console.log(`路径: test/reasoning/_reports/${gameKey}.static-reasoning.json`);
```

- [ ] **步骤 2：在 package.json 添加 script**

```json
"reasoning:simulate": "node scripts/reasoning-simulator-launcher.js",
```

- [ ] **步骤 3：Commit**

```bash
git add scripts/reasoning-simulator-launcher.js package.json
git commit -m "feat(reasoning): launcher 脚本（组装 Simulator + Grader 提示词）"
```

---

## 任务 18：island-death agent_profile.md

**文件：**
- 创建：`games/island-death/agent_profile.md`

- [ ] **步骤 1：编写 agent_profile.md**

```markdown
# Inference Simulator 引导文件 · island-death

> 本文件给"模拟玩家"使用，不含任何剧情真相。
> 经 Formal Verifier 脱敏审查冻结。
> §3 为操作者注释，launcher 脚本会剥离，不注入 Simulator prompt。

## 0. 题材与基调（Simulator 可见）
- 题材：南海私人岛屿 / 社会派推理 / 暴风雪山庄变体
- 基调：meta 心理恐怖 + 合谋叙事
- 时代：2017-2024 现代
- 地点：南海珊瑚湾私人岛屿

## 1. 玩家角色（Simulator 可见）
- 玩家身份：第 4 任管家（meta 元素）

## 2. 玩法预期（Simulator 可见）
- 命令格式：单文本框命令（list / find / 文件名 / help / save / back / name / note / title / act / hangman）
- 证据形式：所有证据以可读文件形式存在（无 inventory / 无点击物体）
- 进度：进度 = 已收集文件数（达到阈值触发结局）
- 文件命名：SS-AA-X-Y 格式（SS=幕号, AA=时间码, X=地点/人物缩写, Y=序号）

## 3. 禁止透露项（仅操作者可见，launcher 剥离，不注入 Simulator）
> 本节是给操作者 / Verifier 的检查清单，确保 Simulator prompt 不含以下信息。
- F 事实列表（F1-F15）：[绝不告诉 Agent]
- 文件清单 / tag 图 / 真相时间线
- 双证据链 / 唯一性反例
- 任何"作者已设计但游戏未呈现"的信息
- 投毒 / 伪造自杀 / 合谋的具体细节

## 4. 试玩基线（Simulator 可见）
- 步数上限：30
- 卡死判定：连续 3 步无新信息
- 多解容忍度：1
- trials: 1

## 5. 通过标准（仅操作者可见，launcher 剥离，不注入 Simulator）
- required_recall: 1.0
- optional_recall: 0.5
- 失败归因上限: 0
```

- [ ] **步骤 2：Commit**

```bash
git add games/island-death/agent_profile.md
git commit -m "feat(island-death): agent_profile.md Simulator 引导文件"
```

---

## 任务 19：SKILL.md / AGENTS.md / README.md 文档更新

**文件：**
- 修改：`AGENTS.md`
- 修改：`.trae/skills/typehelp-novel-design/SKILL.md`
- 修改：`README.md`

- [ ] **步骤 1：AGENTS.md §3 表 1 追加 C10**

在 AGENTS.md 的 §3 表 1（方法论 9 项硬约束）后追加：
```markdown
| C10 | 推理充分性可验证 | 每个剧本必须通过 Inference Simulator + Grader 黑盒验证（required_recall = 1.0，9 类失败归因全为 0），且 L6 静态分析无不可达 F / 无不可达文件 |
```

- [ ] **步骤 2：AGENTS.md §3 表 2 追加 L6 层**

在 §3 表 2（5 层测试金字塔）的 L5 行后追加：
```markdown
| L6 推理 | Vitest + Agent 提示词 | `test/reasoning/*.test.js` + `npm run reasoning:simulate` | F 可达性 / 死胡同 / 双证据 / 黑盒推理 recall |
```

- [ ] **步骤 3：SKILL.md 更新**

在 `.trae/skills/typehelp-novel-design/SKILL.md` 中：

**§3.2 硬约束表追加 C10 行**：
```markdown
| C10 | 推理充分性可验证 | 每个剧本必须通过 Inference Simulator + Grader 黑盒验证（required_recall = 1.0，9 类失败归因全为 0），且 L6 静态分析无不可达 F / 无不可达文件 |
```

**§4 Agent 表追加两行**：
```markdown
| 9 | Inference Simulator | 黑盒模拟玩家推理，产出 inference_trace.json（过程） |
| 10 | Inference Grader | 白盒判定 F 命中 + recall + 9 类失败归因，产出 inference_grades.json（分数） |
```

**§6 工作流追加**：
```markdown
- Step 19: Inference Simulator（手动触发，需人在环）— 产出 inference_trace.json
- Step 20: Inference Grader（手动触发，消费 trace + truth.md）— 产出 inference_grades.json + inference_report.md
```

**§3.1 测试金字塔表追加 L6 行**（与 AGENTS.md 一致）。

**注意**：§4.3 axis_matrix.md 的 `evidence_gap` 列扩展延后到 PoC 验证后——L6 静态分析当前只消费 file_index.md exposes + HTML tags，不依赖 axis_matrix.md。

- [ ] **步骤 4：README.md 更新**

在 README.md 的设计方法论部分：9 项硬约束 → 10 项

- [ ] **步骤 5：Commit**

```bash
git add AGENTS.md .trae/skills/typehelp-novel-design/SKILL.md README.md
git commit -m "docs: 更新 SKILL.md / AGENTS.md / README.md 追加 C10 + L6 + Agent 9/10"
```

---

## 任务 20：全量验证 — npm test

**文件：** 无（验证任务）

- [ ] **步骤 1：运行全量测试**

运行：`npm test`
预期：所有测试通过（含新增 L6 测试）。island-death 的 static-reasoning.json 可能仍有警告（长路径 / 死胡同），但不应有 FAIL（unreachableFacts / unreachableFiles 为空）。

- [ ] **步骤 2：如有 FAIL，分析并修复**

根据 FAIL 输出，回溯到对应任务修复。常见问题：
- truth.md F 解析失败 → 检查表格格式
- file_index.md exposes 解析失败 → 检查格式
- 不可达 F → 检查 file_index exposes 标注是否遗漏
- 不可达文件 → 检查 HTML tags 是否正确

- [ ] **步骤 3：Commit 最终状态**

```bash
git add -A
git commit -m "test(reasoning): 全量验证通过 — L6 推理充分性测试框架集成完毕"
```
