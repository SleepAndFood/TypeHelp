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

// SugarCube 引擎内置系统 passage（不参与推理图分析）
// 这些是命令路由/UI/引擎功能 passage，非游戏内容文件
const SUGARCUBE_SYSTEM_PASSAGES = [
  'StoryCaption', 'PassageHeader', 'PassageFooter', 'StoryInit', 'Start',
  'Background', 'Intro', 'Box', 'End',
  'help', 'list', 'name', 'name_detail', 'find_results', 'note_list',
  'inbox', 'hangman', 'title', 'act', 'find', 'note', 'save', 'back',
];

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

// 过滤系统 passage：排除引擎功能 passage，只保留游戏内容文件
const reasoningConfig = config.reasoning || { maxSteps: 30, startPassage: '00-readme', endingPassages: [] };
const systemNames = new Set([
  ...SUGARCUBE_SYSTEM_PASSAGES,
  ...(config.systemPassages || []),
  ...(reasoningConfig.systemPassageNames || []),
]);
const systemPrefixes = [
  ...(config.systemPassagePrefixes || []),
  ...(reasoningConfig.systemPassagePrefixes || []),
];
const gamePassages = passages.filter(p => {
  if (systemNames.has(p.name)) return false;
  for (const prefix of systemPrefixes) {
    if (p.name.startsWith(prefix)) return false;
  }
  return true;
});

// 2. 构建 tag 图 + 解锁图（仅用游戏内容 passage）
const tagGraph = buildTagGraph(gamePassages);
const unlockGraph = buildUnlockGraph(gamePassages);

// 2a. 注入隐藏文件虚拟入边：隐藏文件通过命令触发（find/输入文件名），
// tag 图和 cache.push 无法捕捉，需通过配置显式声明
if (reasoningConfig.hiddenFileEdges) {
  for (const edge of reasoningConfig.hiddenFileEdges) {
    unlockGraph.edges.push(edge);
    if (!unlockGraph.nodes.includes(edge.to)) unlockGraph.nodes.push(edge.to);
    if (!unlockGraph.nodes.includes(edge.from)) unlockGraph.nodes.push(edge.from);
  }
}

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

// 5. 汇总分析（reasoningConfig 已在上方声明）
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
