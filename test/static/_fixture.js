/**
 * L1 静态分析统一 fixture
 * - loadL1: 用 minimal fixture 测 helper 本身
 * - loadL1FromConfig: 按 gameKey 加载指定剧本的 config + passages
 *   （含 terminal-mystery 的 passageFiles fallback）
 */
import { loadConfig } from '../helpers/config.js';
import { parsePassages, parsePassagesFromFiles } from '../helpers/parse.js';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

export async function loadL1(htmlPath = 'tests-fixtures/minimal.html') {
  const config = await loadConfig();
  const passages = await parsePassages(htmlPath);
  return { config, passages };
}

export async function loadL1FromConfig(gameKey) {
  const cfgPath = `games/${gameKey}/test.config.js`;
  if (!existsSync(cfgPath)) throw new Error(`Missing ${cfgPath}`);
  const mod = await import(pathToFileURL(path.resolve(cfgPath)).href);
  const config = mod.default;
  let passages;
  if (config.htmlFile) {
    if (!existsSync(config.htmlFile)) {
      // HTML 缺失但 config 存在：仍尝试解析（parsePassages 会抛），让上层 catch
      passages = await parsePassages(config.htmlFile);
    } else {
      passages = await parsePassages(config.htmlFile);
    }
  } else if (config.passageFiles?.length) {
    const files = await Promise.all(
      config.passageFiles.map(async (p) => ({
        name: p,
        content: await readFile(p, 'utf-8'),
      }))
    );
    passages = await parsePassagesFromFiles(files);
  } else {
    passages = [];
  }
  return { config, passages };
}
