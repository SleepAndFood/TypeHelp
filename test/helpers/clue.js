export function findUncoveredClues(passages, config) {
  const clues = config.criticalClues || [];
  const out = [];
  for (const clue of clues) {
    const kw = clue.keyword.toLowerCase();
    const count = passages.filter((p) => (p.text || '').toLowerCase().includes(kw)).length;
    if (count < clue.minAppearances) {
      out.push({ keyword: clue.keyword, minAppearances: clue.minAppearances, actualCount: count, description: clue.description });
    }
  }
  return out;
}
