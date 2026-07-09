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

/**
 * 检测死胡同文件：可达但无出边，且非结局文件。
 * 死胡同文件 ≠ 不可达文件（前者可达但无处可去，后者根本到不了）。
 * @param {object} tagGraph
 * @param {object} unlockGraph
 * @param {{endingPassages: string[], startPassage?: string}} options
 * @returns {string[]} 死胡同文件名列表
 */
export function detectDeadEndFiles(tagGraph, unlockGraph, options) {
  const { endingPassages, startPassage } = options;
  const endingSet = new Set(endingPassages);
  // 收集所有有出边的文件
  const hasOutgoing = new Set();
  for (const e of tagGraph.edges) hasOutgoing.add(e.from);
  for (const e of unlockGraph.edges) hasOutgoing.add(e.from);
  // 收集所有有入边的文件（用于排除不可达文件）
  const hasIncoming = new Set();
  for (const e of tagGraph.edges) hasIncoming.add(e.to);
  for (const e of unlockGraph.edges) hasIncoming.add(e.to);
  // 所有节点
  const allNodes = new Set([...tagGraph.nodes, ...unlockGraph.nodes]);
  const deadEnds = [];
  for (const node of allNodes) {
    if (endingSet.has(node)) continue;
    if (node === startPassage) continue; // 起点不算死胡同
    // 排除不可达文件（无入边且非起点 = 不可达，不算死胡同）
    if (!hasIncoming.has(node)) continue;
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
    // shortestPath 占位：用 reachableExposes 数量粗略估算（PoC 阶段简化，后续可用 BFS 精确算）
    const shortestPath = reachable ? Math.min(maxSteps, reachableExposes.length + 2) : Infinity;
    return {
      fId: fact.fId,
      exposesIn: fact.exposesIn || [],
      requiredForEnding: fact.requiredForEnding,
      verifiableClaims: fact.verifiableClaims || [],
      reachable,
      shortestPath,
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
  const deadEndFiles = detectDeadEndFiles(tagGraph, unlockGraph, { startPassage, endingPassages });
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
    // 只提取 ASCII 字母数字+连字符作为文件名，去掉中文注释如"（隐藏文件）"
    const headerMatch = section.match(/^###\s+([A-Za-z0-9][A-Za-z0-9-]*)/);
    if (!headerMatch) continue;
    const fileName = headerMatch[1];
    const exposesMatch = section.match(EXPOSES_RE);
    if (exposesMatch) {
      result[fileName] = exposesMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return result;
}

/**
 * 从 truth.md §2 表格解析 F 事实列表。
 * 支持 §2 下多个子表（L1/L2/... 分块），每行可选标注：
 *   inferability / required_for_ending / verifiable_claims
 * @param {string} truthContent - truth.md 的完整文本
 * @returns {Array<{fId: string, description: string, evidence: string, inferability: string, requiredForEnding: boolean, verifiableClaims: string[]}>}
 */
export function parseFactsFromTruth(truthContent) {
  const result = [];
  const lines = truthContent.split('\n');
  let inFactSection = false;
  for (const line of lines) {
    if (line.startsWith('## 2.')) { inFactSection = true; continue; }
    if (inFactSection && /^##\s/.test(line)) { inFactSection = false; continue; }
    if (!inFactSection) continue;
    if (line.startsWith('|---') || /^\|\s*编号/.test(line)) continue;
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
