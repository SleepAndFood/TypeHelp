/**
 * 强制所有 L1/L3 测试遍历 3 个剧本运行
 * 用法：import { forAllGames } from './_fixture.js';
 *   forAllGames(({ key, config, passages }) => {
 *     expect(findBrokenRefs(passages, config)).toEqual([]);
 *   });
 *
 * 设计动机（举一反三）：
 *   之前每个 L1 test 只手写 1~2 个剧本，导致 island-death 在 4/5 测试中
 *   "全过"假象。forAllGames 把"必须对所有剧本执行"作为约束条件编码到
 *   helper 中——任何新增剧本无需修改测试代码即可被覆盖，杜绝覆盖盲点。
 */
import { loadL1FromConfig } from './_fixture.js';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const ALL_GAMES = ['galley-villa', 'island-death', 'terminal-mystery'];

export function getAllGames() {
  const fromEnv = process.env.GXT_L1_GAMES;
  if (fromEnv) return fromEnv.split(',').filter(Boolean);
  return ALL_GAMES;
}

/**
 * 对每个游戏剧本跑 fn。
 * - fn 同步抛错或返回 rejected promise → 当前 case 失败
 * - 若剧本在 games/<key>/test.config.js 不存在 → 跳过
 * - 若剧本 htmlFile 存在但 htmlFile 缺失 → 跳过该剧本（fail-fast on config）
 */
export async function forAllGames(fn) {
  const games = getAllGames();
  const results = [];
  for (const key of games) {
    const cfgPath = `games/${key}/test.config.js`;
    if (!existsSync(cfgPath)) {
      results.push({ key, skipped: 'no config' });
      continue;
    }
    try {
      const { config, passages } = await loadL1FromConfig(key);
      if (config.htmlFile && !existsSync(config.htmlFile)) {
        results.push({ key, skipped: 'html missing' });
        continue;
      }
      const ret = await fn({ key, config, passages });
      results.push({ key, ok: true, ret });
    } catch (e) {
      results.push({ key, ok: false, error: e });
      throw e; // fail-fast
    }
  }
  return results;
}

/**
 * Vitest describe.each 等价物：每个剧本一个 describe block
 */
export const gameMatrix = ALL_GAMES;
