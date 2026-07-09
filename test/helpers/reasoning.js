/**
 * 推理充分性测试框架 — 纯函数集合
 *
 * 提供图构建 + BFS 可达性 + 不可达文件检测 + 死胡同检测 + 双证据检查 + 解析器。
 * 所有函数都是纯函数，无副作用，可独立测试。
 */

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
