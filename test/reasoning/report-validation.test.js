// test/reasoning/report-validation.test.js
// L6 推理报告格式校验：inference_trace.json + inference_grades.json + inference_report.md
import { describe, test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { forAllGames } from '../static/_matrix.js';

describe('L6 推理报告格式校验', () => {
  test('有 HTML 的剧本必须有 inference_trace.json + inference_grades.json + inference_report.md', async () => {
    await forAllGames(async ({ key, config }) => {
      if (!config.htmlFile) return;
      if (!config.reasoning?.enabled) return;
      if (config.reasoning?.gracePeriod) return;

      const gameDir = join(process.cwd(), 'games', key);
      const tracePath = join(gameDir, 'inference_trace.json');
      const gradesPath = join(gameDir, 'inference_grades.json');
      const reportPath = join(gameDir, 'inference_report.md');

      expect(existsSync(tracePath), `[${key}] 缺少 inference_trace.json`).toBe(true);
      expect(existsSync(gradesPath), `[${key}] 缺少 inference_grades.json`).toBe(true);
      expect(existsSync(reportPath), `[${key}] 缺少 inference_report.md`).toBe(true);
    });
  });

  test('inference_trace.json 结构合规', async () => {
    await forAllGames(async ({ key, config }) => {
      if (!config.htmlFile) return;
      if (!config.reasoning?.enabled) return;
      if (config.reasoning?.gracePeriod) return;

      const tracePath = join(process.cwd(), 'games', key, 'inference_trace.json');
      if (!existsSync(tracePath)) return;

      const trace = JSON.parse(readFileSync(tracePath, 'utf-8'));
      expect(trace.gameKey).toBe(key);
      expect(Array.isArray(trace.steps)).toBe(true);
      expect(trace.finalInference).toBeTypeOf('string');
      expect(trace.outcome).toBeTypeOf('string');
    });
  });

  test('inference_grades.json 结构合规', async () => {
    await forAllGames(async ({ key, config }) => {
      if (!config.htmlFile) return;
      if (!config.reasoning?.enabled) return;
      if (config.reasoning?.gracePeriod) return;

      const gradesPath = join(process.cwd(), 'games', key, 'inference_grades.json');
      if (!existsSync(gradesPath)) return;

      const grades = JSON.parse(readFileSync(gradesPath, 'utf-8'));
      expect(grades.requiredRecall).toBeTypeOf('number');
      expect(grades.optionalRecall).toBeTypeOf('number');
      expect(Array.isArray(grades.factsHit)).toBe(true);
      expect(Array.isArray(grades.factsMissed)).toBe(true);
      expect(Array.isArray(grades.failureCategorization)).toBe(true);
    });
  });
});
