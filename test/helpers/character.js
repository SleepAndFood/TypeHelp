/**
 * 人物属性一致性（粗略）
 * 仅检查在 char 视角的 passage 中是否出现 forbiddenPatterns
 * 视角判断：passage 名 split('-') 中包含 char.id
 */
export function findPronounIssues(passages, config) {
  const constraints = config.characterConstraints || [];
  const out = [];
  for (const c of constraints) {
    const charPassages = passages.filter((p) => {
      const parts = p.name.split('-');
      return parts.slice(2).includes(c.id);
    });
    for (const p of charPassages) {
      for (const forbidden of c.forbiddenPatterns || []) {
        // 形态：`[N]` 后紧跟 forbidden
        const re = new RegExp(`\\[${c.id}\\][^\\n]{0,40}${forbidden}`);
        if (re.test(p.text)) {
          out.push({ char: c.id, passage: p.name, forbidden });
        }
      }
    }
  }
  return out;
}
