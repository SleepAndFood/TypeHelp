#!/usr/bin/env node
/**
 * 全量跑 5 层测试（按剧本）
 * 用法：
 *   node scripts/run-all.js            # 使用 GXT_GAME（默认 galley-villa）
 *   GXT_GAME=island-death node scripts/run-all.js
 *   node scripts/run-all.js --game=terminal-mystery
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const gameKey =
  process.env.GXT_GAME ||
  (process.argv.find((a) => a.startsWith('--game=')) || '').slice(7) ||
  'galley-villa';

const cfgPath = `games/${gameKey}/test.config.js`;
if (!existsSync(cfgPath)) {
  console.error(`未找到 ${cfgPath}，可选剧本：galley-villa / island-death / terminal-mystery`);
  process.exit(1);
}

// 动态读取 config 判断是否支持 L4/L5
const cfgMod = await import(pathToFileURL(path.resolve(cfgPath)).href);
const cfg = cfgMod.default;
const hasHtml = !!cfg.htmlFile && existsSync(cfg.htmlFile);

const NPM_CMD = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const layers = [
  { name: 'L1 静态分析', cmd: NPM_CMD, args: ['run', 'test:static'] },
  { name: 'L2 单元', cmd: NPM_CMD, args: ['run', 'test:unit'] },
  { name: 'L3 叙事', cmd: NPM_CMD, args: ['run', 'test:narrative'] },
];
if (hasHtml) {
  layers.push({ name: 'L4 渲染', cmd: NPM_CMD, args: ['run', 'test:render'] });
  layers.push({ name: 'L5 E2E', cmd: NPM_CMD, args: ['run', 'test:e2e'] });
} else {
  console.log(`[skip] ${gameKey} 无 HTML → L4/L5 跳过`);
}

const t0 = Date.now();
let failed = 0;
for (const layer of layers) {
  const t = Date.now();
  console.log(`\n=== ${layer.name} (${gameKey}) ===`);
  const r = spawnSync(layer.cmd, layer.args, { stdio: 'inherit', shell: true, env: { ...process.env, GXT_GAME: gameKey } });
  const ms = Date.now() - t;
  if (r.status !== 0) {
    console.error(`[FAIL] ${layer.name} (${ms}ms)`);
    failed++;
  } else {
    console.log(`[OK] ${layer.name} (${ms}ms)`);
  }
}
const total = Date.now() - t0;
console.log(`\n=== 总计 (${gameKey}) ${total}ms${failed ? `，失败 ${failed} 层` : '，全过'} ===`);
process.exit(failed ? 1 : 0);
