/**
 * L3 叙事一致性 helper（配置驱动）
 */
export function extractTimeCode(passageName, config = {}) {
  const position = config.timeCodePosition ?? 0;
  const length = config.timeCodeLength ?? 2;
  const re = new RegExp(`^(\\d{${length}})`);
  const m = passageName.match(re);
  if (!m) return null;
  return parseInt(m[1].slice(position, position + length), 10);
}

export function extractLocations(text, config = {}) {
  const pattern = new RegExp(config.locationPattern || "''([^']+)''", 'g');
  const out = [];
  let m;
  while ((m = pattern.exec(text)) !== null) out.push(m[1]);
  return out;
}

/**
 * 报告：同一时间码下，同一人物出现在多个不同地点
 * 返回 [{ time, person, locations: string[] }]
 */
export function findTimelineContradictions(passages, config) {
  const slots = {};
  for (const p of passages) {
    const t = extractTimeCode(p.name, config.timeline);
    if (t === null) continue;
    if (!slots[t]) slots[t] = [];
    const parts = p.name.split('-');
    // 简单推断人物 token：1-2 位数字 / 单大写字母
    const personTokens = parts.filter((x) => /^[0-9]{1,2}$|^[A-Z@]$/.test(x));
    slots[t].push({ name: p.name, locations: extractLocations(p.text, config.timeline), persons: personTokens });
  }

  const out = [];
  for (const [time, arr] of Object.entries(slots)) {
    const personLocs = {};
    for (const slot of arr) {
      for (const person of slot.persons) {
        if (!personLocs[person]) personLocs[person] = new Set();
        for (const loc of slot.locations) personLocs[person].add(loc);
      }
    }
    for (const [person, locs] of Object.entries(personLocs)) {
      if (locs.size > 1) {
        out.push({ time: Number(time), person, locations: [...locs] });
      }
    }
  }
  return out;
}
