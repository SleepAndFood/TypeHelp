// scripts/build-reasoning-graph.js
// L6a 构图脚本：解析 HTML tags + cache.push + file_index exposes → 产出 static-reasoning.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as cheerio from 'cheerio';
import { buildTagGraph, buildUnlockGraph, parseExposesFromIndex, parseFactsFromTruth, analyzeReasoning } from '../test/helpers/reasoning.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// 解析 CLI 参数
const gameArg = process.argv.find(a => a.startsWith('--game='));
const gameKey = gameArg ? gameArg.split('=')[1] : null;
if (!gameKey) {
  console.error('用法: node scripts/build-reasoning-graph.js --game=<key>');
  process.exit(1);
}

const gameDir = join(projectRoot, 'games', gameKey);

// 加载 test.config.js 获取 htmlFile 路径
const configModule = await import(pathToFileURL(join(gameDir, 'test.config.js')).href);
const config = configModule.default || configModule;
if (!config.htmlFile) {
  console.error(`剧本 ${gameKey} 无 htmlFile 配置，跳过`);
  process.exit(0);
}

// 1. 解析 HTML passages
const htmlPath = join(projectRoot, config.htmlFile);
const html = readFileSync(htmlPath, 'utf-8');
const $ = cheerio.load(html);
const passages = [];
$('tw-passagedata').each((_, el) => {
  const $el = $(el);
  passages.push({
    pid: $el.attr('pid'),
    name: $el.attr('name'),
    tags: ($el.attr('tags') || '').split(' ').filter(Boolean),
    text: $el.text(),
  });
});

// 2. 构建 tag 图 + 解锁图
const tagGraph = buildTagGraph(passages);
const unlockGraph = buildUnlockGraph(passages);

// 3. 解析 file_index.md 的 exposes 标注
const indexContent = readFileSync(join(gameDir, 'file_index.md'), 'utf-8');
const exposesMap = parseExposesFromIndex(indexContent);

// 4. 解析 truth.md 的 F 事实
const truthContent = readFileSync(join(gameDir, 'truth.md'), 'utf-8');
const facts = parseFactsFromTruth(truthContent);
// 给每个 F 补上 exposesIn（从 exposesMap 反查）
for (const fact of facts) {
  fact.exposesIn = Object.entries(exposesMap)
    .filter(([_, fIds]) => fIds.includes(fact.fId))
    .map(([fileName, _]) => fileName);
}

// 5. 汇总分析
const reasoningConfig = config.reasoning || { maxSteps: 30, startPassage: '00-readme', endingPassages: [] };
const analysis = analyzeReasoning(tagGraph, unlockGraph, facts, {
  startPassage: reasoningConfig.startPassage,
  endingPassages: reasoningConfig.endingPassages || [],
  maxSteps: reasoningConfig.maxSteps || 30,
});

// 6. 产出 static-reasoning.json
const report = {
  gameKey,
  generatedAt: new Date().toISOString(),
  tagGraph,
  unlockGraph,
  facts: analysis.facts,
  unreachableFacts: analysis.unreachableFacts,
  unreachableFiles: analysis.unreachableFiles,
  deadEndFiles: analysis.deadEndFiles,
  evidenceInsufficient: analysis.evidenceInsufficient,
  reachableNodes: analysis.reachableNodes,
};

const reportDir = join(projectRoot, 'test', 'reasoning', '_reports');
mkdirSync(reportDir, { recursive: true });
const reportPath = join(reportDir, `${gameKey}.static-reasoning.json`);
writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

console.log(`✓ ${gameKey} 推理图已生成: ${reportPath}`);
console.log(`  - 不可达 F: ${report.unreachableFacts.length}`);
console.log(`  - 不可达文件: ${report.unreachableFiles.length}`);
console.log(`  - 死胡同文件: ${report.deadEndFiles.length}`);
console.log(`  - 证据不足 F: ${report.evidenceInsufficient.length}`);
