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
