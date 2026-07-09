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
