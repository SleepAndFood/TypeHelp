#!/usr/bin/env node
/**
 * TxtGame 全量测试入口（含 AGENTS.md 表 3 强制门禁）
 * 顺序：A → B → C → L1 → L2 → L3 → L4 → L5
 *
 * 用法：
 *   node scripts/run-all.js                       # 默认 galley-villa
 *   node scripts/run-all.js --game=island-death
 *   node scripts/run-all.js --gates=warn          # 门禁失败只 warn 不 fail
 *   node scripts/run-all.js --skip-l5             # 跳过 Playwright
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const gameKey =
  process.env.GXT_GAME ||
  args.find((a) => a.startsWith('--game='))?.slice(7) ||
  'galley-villa';
const gatesMode = args.find((a) => a.startsWith('--gates='))?.slice(8) || 'strict'; // strict | warn
const skipL5 = args.includes('--skip-l5') || !!process.env.GXT_SKIP_L5;

const ROOT = process.cwd();
const cfgPath = `games/${gameKey}/test.config.js`;
if (!existsSync(cfgPath)) {
  console.error(`未找到 ${cfgPath}，可选剧本：galley-villa / island-death / terminal-mystery`);
  process.exit(1);
}

const GAMES_DIR = path.join(ROOT, 'games');

const cfgMod = await import(pathToFileURL(path.resolve(ROOT, cfgPath)).href);
const cfg = cfgMod.default;
const hasHtml = !!cfg.htmlFile && existsSync(cfg.htmlFile);

// AGENTS.md §6 / 表 3：3 个 python 门禁（无 HTML 剧本跳过）
const PY_SCRIPTS = [
  { name: 'A: check_twine_escape',  script: '.trae/scripts/check_twine_escape.py' },
  { name: 'B: verify_embed',        script: '.trae/scripts/verify_embed.py' },
  { name: 'C: check_twine_macro_stack', script: '.trae/scripts/check_twine_macro_stack.py' },
];

const NPM_CMD = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(label, cmd, cmdArgs, opts = {}) {
  const t = Date.now();
  console.log(`\n=== ${label} (${gameKey}) ===`);
  const r = spawnSync(cmd, cmdArgs, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, GXT_GAME: gameKey, ...(opts.env || {}) },
  });
  const ms = Date.now() - t;
  return { r, ms };
}

const t0 = Date.now();
let failed = 0;
let warned = 0;
const summary = [];

// ===== L0 阶段：首页数据准备（确保 games.json / index.html inline 与各剧本 README 同步） =====
// 修复前：package.json 的 pretest 钩子会"每次 npm test 都静默改源"——违反 AGENTS.md 心法"全部 CI 化"
//        + 由于 generatedAt 是时间戳，每次 build 都会产生无意义 git diff
// 修复后：把 build:games / build:index:check 显式提到 run-all.js 入口（在门禁 A/B/C 之前），
//        与"显式门禁链"风格一致。
// 注：单跑 L1/L2/L3/L4/L5（npm run test:xxx）时不再隐式触发 build —— 因为 L1-L5 单层不依赖 games.json
if (existsSync(path.join(ROOT, 'index.html')) && existsSync(GAMES_DIR)) {
  const l0Steps = [
    { name: 'L0 build:games',         args: ['run', 'build:games'] },
    { name: 'L0 build:index:check',   args: ['run', 'build:index:check'] },
  ];
  for (const step of l0Steps) {
    const { r: buildR, ms: buildMs } = run(step.name, NPM_CMD, step.args);
    if (buildR.status === 0) {
      summary.push({ name: step.name, status: 'OK', ms: buildMs });
    } else if (gatesMode === 'warn') {
      console.error(`[WARN] ${step.name} (${buildMs}ms) - 非零退出但 --gates=warn 继续`);
      summary.push({ name: step.name, status: 'WARN', ms: buildMs });
      warned++;
    } else {
      console.error(`[FAIL] ${step.name} (${buildMs}ms) - 立即终止（games.json / index.html inline 缺失或损坏）`);
      summary.push({ name: step.name, status: 'FAIL', ms: buildMs });
      failed++;
      // build:games 失败会连带 build:index:check 没意义（games.json 缺失）
      break;
    }
  }
}

// ===== 强制门禁 A/B/C =====
if (hasHtml && failed === 0) {
  for (const gate of PY_SCRIPTS) {
    if (!existsSync(gate.script)) {
      console.log(`[skip] ${gate.name}: 脚本不存在 ${gate.script}`);
      continue;
    }
    const { r, ms } = run(gate.name, 'python', [gate.script, cfg.htmlFile]);
    if (r.status === 0) {
      summary.push({ name: gate.name, status: 'OK', ms });
    } else if (gatesMode === 'warn') {
      console.error(`[WARN] ${gate.name} (${ms}ms) - 非零退出但 --gates=warn 继续`);
      summary.push({ name: gate.name, status: 'WARN', ms });
      warned++;
    } else {
      console.error(`[FAIL] ${gate.name} (${ms}ms) - 立即终止（按 AGENTS.md §6 门禁链）`);
      summary.push({ name: gate.name, status: 'FAIL', ms });
      failed++;
      break; // 任一失败立即中止
    }
  }
} else {
  console.log(`[skip] ${gameKey} 无 HTML → 门禁 A/B/C 跳过`);
}

// ===== 6 层金字塔 =====
if (failed === 0) {
  const layers = [
    { name: 'L1 静态分析',  args: ['run', 'test:static'] },
    { name: 'L2 单元',     args: ['run', 'test:unit'] },
    { name: 'L3 叙事',     args: ['run', 'test:narrative'] },
  ];
  if (hasHtml) layers.push({ name: 'L4 渲染', args: ['run', 'test:render'] });
  // L6 推理（CI 静态部分）：不依赖浏览器，先于 L5 E2E 跑（快速失败原则）
  // L6b 测试内部用 forAllGames 自动跳过未启用 reasoning 的剧本，与 gameKey 无关
  layers.push({ name: 'L6 推理', args: ['run', 'test:reasoning'] });
  if (hasHtml && !skipL5) layers.push({ name: 'L5 E2E', args: ['run', 'test:e2e'] });

  for (const layer of layers) {
    const { r, ms } = run(layer.name, NPM_CMD, layer.args);
    if (r.status === 0) {
      summary.push({ name: layer.name, status: 'OK', ms });
    } else {
      console.error(`[FAIL] ${layer.name} (${ms}ms)`);
      summary.push({ name: layer.name, status: 'FAIL', ms });
      failed++;
    }
  }
}

const total = Date.now() - t0;
console.log(`\n========== Summary (${gameKey}) ${total}ms ==========`);
for (const s of summary) {
  console.log(`  ${s.status.padEnd(4)}  ${s.name.padEnd(30)}  ${s.ms}ms`);
}
console.log(`总计: ${summary.length} 步 / 失败 ${failed} 步 / 警告 ${warned} 步`);
process.exit(failed ? 1 : 0);
