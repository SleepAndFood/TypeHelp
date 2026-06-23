/**
 * L3 叙事一致性 helper（配置驱动）
 *
 * timeline 检查需要在 config.timeline.enabled = true 时才生效；
 * 因为不同剧本的"段号/幕号/人物 ID"位置不同（galley-villa: 末 1-2 段是人物 ID；
 * island-death: 末 1 段是"在场人数"且人物是字母缩写），不做配置时默认保守跳过。
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
 *
 * 仅当 config.timeline.enabled === true 才检查；否则返回空数组
 */
export function findTimelineContradictions(passages, config) {
  if (!config.timeline?.enabled) return [];

  const slots = {};
  // person 段位置（从后数）：如 [1, 2] 表示倒数第 1、2 段都是人物 ID
  const personFromTail = config.timeline.personFromTail || [1];

  for (const p of passages) {
    const t = extractTimeCode(p.name, config.timeline);
    if (t === null) continue;
    if (!slots[t]) slots[t] = [];
    const parts = p.name.split('-');
    const persons = new Set();
    for (const offset of personFromTail) {
      const idx = parts.length - offset;
      if (idx < 0) continue;
      const tok = parts[idx];
      // 人物 ID 形态：1-2 位数字（11/12/15 等）或单字母（K / @ / 单大写）
      if (/^[0-9]{1,2}$/.test(tok) || /^[A-Z@]$/.test(tok)) {
        persons.add(tok);
      }
    }
    slots[t].push({ name: p.name, locations: extractLocations(p.text, config.timeline), persons: [...persons] });
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
