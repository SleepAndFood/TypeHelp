/**
 * 加载 L1 静态分析测试 fixture + 配置
 * 用法：import { loadL1 } from './_fixture.js';
 *  - loadL1() 默认使用 tests-fixtures/minimal.html
 *  - loadL1('tests-fixtures/xx.html') 指定文件
 */
import { loadConfig } from '../helpers/config.js';
import { parsePassages, parsePassagesFromFiles } from '../helpers/parse.js';
import { readFile } from 'node:fs/promises';

export async function loadL1(htmlPath = 'tests-fixtures/minimal.html') {
  const config = await loadConfig();
  const passages = await parsePassages(htmlPath);
  return { config, passages };
}

export async function loadL1FromConfig(gameKey) {
  // 通过覆盖 env 让 loadConfig 选指定剧本
  const prev = process.env.GXT_GAME;
  process.env.GXT_GAME = gameKey;
  try {
    const config = await loadConfig();
    let passages;
    if (config.htmlFile) {
      passages = await parsePassages(config.htmlFile);
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
  } finally {
    if (prev === undefined) delete process.env.GXT_GAME;
    else process.env.GXT_GAME = prev;
  }
}
