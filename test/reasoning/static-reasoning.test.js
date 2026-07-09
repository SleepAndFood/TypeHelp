// test/reasoning/static-reasoning.test.js
// L6b CI 静态推理分析：消费入仓的 static-reasoning.json，校验无不可达 F / 无不可达文件
import { describe, test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { forAllGames } from '../static/_matrix.js';

describe('L6b 静态推理分析 (C10)', () => {
  test('所有剧本：static-reasoning.json 存在且无不可达 F / 无不可达文件', async () => {
    await forAllGames(async ({ key, config }) => {
      if (!config.htmlFile) return; // 跳过无 HTML 的剧本
      if (!config.reasoning?.enabled) return;
      if (config.reasoning?.gracePeriod) return; // 豁免期内跳过

      const reportPath = join(process.cwd(), 'test', 'reasoning', '_reports', `${key}.static-reasoning.json`);
      expect(existsSync(reportPath), `[${key}] 缺少 static-reasoning.json，请运行 npm run reasoning:build-graph -- --game=${key}`).toBe(true);

      const report = JSON.parse(readFileSync(reportPath, 'utf-8'));

      expect(report.unreachableFacts, `[${key}] 存在不可达 F 事实: ${report.unreachableFacts.join(', ')}`)
        .toEqual([]);
      expect(report.unreachableFiles, `[${key}] 存在不可达文件: ${report.unreachableFiles.join(', ')}`)
        .toEqual([]);
    });
  });
});
