#!/usr/bin/env node
/**
 * 跨剧本诊断报告
 * 用法：node scripts/diagnose.js [gameKey]
 *   无参：跑全部 3 剧本
 *   带参：只跑指定剧本
 *
 * 输出：每个剧本的
 *   - passage 数量
 *   - L1 静态违规数（引用 / 命名 / 人物ID / 死链 / 隐藏）
 *   - L3 叙事数据完整性（地点标记数 / 时间码种数）
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import {
  findBrokenRefs, findNamingViolations, findInvalidPeopleIds, findDeadLinks, findHiddenFileIssues,
} from '../src/static/l1-helpers.js';
import { extractLocations, extractTimeCode } from '../test/helpers/timeline.js';
import { parsePassages, parsePassagesFromFiles } from '../test/helpers/parse.js';

const ROOT = process.cwd();
const only = process.argv[2] || null;

const games = [
  { key: 'galley-villa', label: 'Galley Villa' },
  { key: 'island-death', label: 'Coral Bay' },
  { key: 'terminal-mystery', label: 'Terminal Mystery' },
].filter((g) => !only || g.key === only);

for (const g of games) {
  const cfgPath = `games/${g.key}/test.config.js`;
  if (!existsSync(cfgPath)) {
    console.log(`!! 跳过 ${g.key}：未找到 ${cfgPath}`);
    continue;
  }
  const mod = await import(pathToFileURL(path.resolve(ROOT, cfgPath)).href);
  const cfg = mod.default;

  let passages;
  if (cfg.htmlFile) {
    if (!existsSync(cfg.htmlFile)) { console.log(`!! 跳过 ${g.key}：HTML 缺失`); continue; }
    passages = await parsePassages(cfg.htmlFile);
  } else if (cfg.passageFiles?.length) {
    const files = await Promise.all(
      cfg.passageFiles.map(async (p) => ({ name: p, content: await readFile(p, 'utf-8') }))
    );
    passages = await parsePassagesFromFiles(files);
  } else {
    passages = [];
  }

  console.log(`\n================ ${g.key} ================`);
  console.log(`游戏名:       ${cfg.gameName}`);
  console.log(`passage 总数: ${passages.length}`);
  console.log(`meta 文件:    ${passages.filter((p) => p.name.startsWith(cfg.metaPrefix)).length}`);
  console.log(`场景数:       ${passages.filter((p) => /^\d{2}-/.test(p.name)).length}`);

  // L1
  const refs = findBrokenRefs(passages, cfg);
  const naming = findNamingViolations(passages, cfg);
  const pids = findInvalidPeopleIds(passages, cfg);
  const dead = findDeadLinks(passages, cfg);
  const hidden = findHiddenFileIssues(passages, cfg);
  console.log(`L1: 引用=${refs.length}  命名违规=${naming.length}  人物ID违规=${pids.length}  死链=${dead.length}  隐藏问题=${hidden.length}`);
  if (naming.length) console.log(`  命名样本: ${naming.slice(0, 5).join(', ')}`);
  if (refs.length) console.log(`  引用样本: ${JSON.stringify(refs.slice(0, 3))}`);
  if (dead.length) console.log(`  死链样本: ${JSON.stringify(dead.slice(0, 3))}`);

  // L3 数据完整性
  const lp = cfg.timeline?.locationPattern || "''([^']+)''";
  const locTotal = passages.reduce(
    (s, p) => s + extractLocations(p.text, { locationPattern: lp }).length, 0
  );
  const tCodes = new Set();
  for (const p of passages) {
    const t = extractTimeCode(p.name, cfg.timeline || {});
    if (t !== null) tCodes.add(t);
  }
  console.log(`L3: 地点标记数=${locTotal}  时间码种数=${tCodes.size}`);

  // 警告：地点标记为 0 时提示
  if (locTotal === 0 && tCodes.size > 0) {
    console.log(`  ⚠️ 时间码齐全但地点标记为 0 → L3 timeline 是"假阴性"（无数据可查非无矛盾）`);
  }
  if (naming.length === 0 && refs.length === 0 && dead.length === 0 && locTotal === 0) {
    console.log(`  ℹ️ 剧本"形式合规"但内容数据未填入，可能仍在早期阶段`);
  }
}
