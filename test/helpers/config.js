/**
 * Game config loader.
 * 优先级：CLI 参数指定剧本 > GXT_GAME 环境变量 > game.config.js 默认
 *
 * 用法（test 代码中）：
 *   import { loadConfig } from '../helpers/config.js';
 *   const cfg = loadConfig();
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

const ROOT = path.resolve(process.cwd());

function tryLoad(p) {
  if (!p) return null;
  const abs = path.isAbsolute(p) ? p : path.resolve(ROOT, p);
  if (!existsSync(abs)) return null;
  return import(pathToFileURL(abs).href).then((m) => m.default);
}

export async function loadConfig() {
  // 1) 根默认
  const defaults = (await tryLoad('game.config.js')) || {};

  // 2) 选定剧本（CLI > env > 默认 galley-villa）
  const gameKey =
    process.env.GXT_GAME ||
    (process.argv.find((a) => a.startsWith('--game=')) || '').slice(7) ||
    'galley-villa';

  const gameConfigPath = `games/${gameKey}/test.config.js`;
  const game = (await tryLoad(gameConfigPath)) || {};

  return deepMerge(defaults, game);
}

function deepMerge(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return b;
  if (a && typeof a === 'object' && b && typeof b === 'object') {
    const out = { ...a };
    for (const k of Object.keys(b)) out[k] = deepMerge(a?.[k], b[k]);
    return out;
  }
  return b === undefined ? a : b;
}

/** 同步版本：仅用于 test 中作为顶层 await 之外的工具 */
export function resolveGameKey() {
  return (
    process.env.GXT_GAME ||
    (process.argv.find((a) => a.startsWith('--game=')) || '').slice(7) ||
    'galley-villa'
  );
}
