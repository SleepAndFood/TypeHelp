#!/usr/bin/env node
/**
 * 从 SugarCube HTML 中自动提取配置模板
 * 用法：node scripts/generate-config.js <game.html> [outPath]
 */
import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
const out = process.argv[3] || null;
if (!file) {
  console.error('用法: node scripts/generate-config.js <game.html> [outPath]');
  process.exit(1);
}

const html = readFileSync(file, 'utf-8');
const $ = cheerio.load(html);

const gameName = $('tw-storydata').attr('name') || 'Unknown';
const allNames = [];
$('tw-passagedata').each((_, el) => allNames.push($(el).attr('name')));

const storyInit = $('tw-passagedata[name="StoryInit"]').html() || '';
const peopleMatch = storyInit.match(/\$people\s+to\s+\[([^\]]+)\]/);
const peopleIds = peopleMatch
  ? peopleMatch[1].replace(/["']/g, '').split(',').map((s) => s.trim()).filter(Boolean)
  : [];

const box = $('tw-passagedata[name="Box"]').html() || '';
const cmdSet = new Set();
let m;
const cmdRe = /\$command\.split\(["']\s*["']\)\[0\]\s+is\s+["']([^"']+)["']/g;
while ((m = cmdRe.exec(box)) !== null) cmdSet.add(m[1]);

const scenePassages = allNames.filter((n) => /^\d{2}/.test(n));
const patternSamples = [...new Set(scenePassages.slice(0, 5))];

const tpl = `/**
 * ${gameName} 测试配置（由 scripts/generate-config.js 生成，请人工校对）
 */
export default {
  gameName: '${gameName}',
  htmlFile: '${file.replace(/\\\\/g, '/')}',
  engine: 'SugarCube',
  namingPattern: '<FILL_ME>',
  metaPrefix: '00-',
  metaFiles: [<FILL_ME>],
  peopleIds: ${JSON.stringify(peopleIds)},
  hiddenFiles: [],
  commands: {
    alwaysAvailable: ['help','list','save','back'],
    unlockable: ${JSON.stringify([...cmdSet])},
  },
  commandRouterPassage: 'Box',
  timeline: { extractFrom: 'passageName', timeCodePosition: 0, timeCodeLength: 2, locationPattern: "''([^']+)''" },
  criticalClues: [],
  characterConstraints: [],
};
`;

if (out) {
  writeFileSync(out, tpl, 'utf-8');
  console.log('已写入：', out);
} else {
  console.log(tpl);
}
console.error('--- 元数据 ---');
console.error('游戏名：', gameName);
console.error('Passage 总数：', allNames.length);
console.error('场景数：', scenePassages.length);
console.error('人物 ID 样本：', peopleIds.slice(0, 5));
console.error('命令列表：', [...cmdSet]);
console.error('场景名样本：', patternSamples);
