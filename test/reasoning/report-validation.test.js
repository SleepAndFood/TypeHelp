// test/reasoning/report-validation.test.js
// L6c 推理报告格式校验：inference_trace.json + inference_grades.json + inference_report.md
// 注意：L6c 是人在环产出（操作者手动跑 npm run reasoning:simulate + Grader），
// CI 不强制要求文件存在；仅校验"如果存在则格式合规"。
// 与 L6b（static-reasoning.json）不同——L6b 是 CI 自动产出的，必须存在。
import { describe, test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { forAllGames } from '../static/_matrix.js';

describe('L6c 推理报告格式校验（人在环产出，存在则校验）', () => {
  test('inference_trace.json 若存在则结构合规', async () => {
    await forAllGames(async ({ key, config }) => {
      if (!config.htmlFile) return;
      if (!config.reasoning?.enabled) return;
      if (config.reasoning?.gracePeriod) return;

      const tracePath = join(process.cwd(), 'games', key, 'inference_trace.json');
      if (!existsSync(tracePath)) return; // L6c 未跑过则跳过

      const trace = JSON.parse(readFileSync(tracePath, 'utf-8'));
      expect(trace.gameKey).toBe(key);
      expect(Array.isArray(trace.steps)).toBe(true);
      expect(trace.finalInference).toBeTypeOf('string');
      expect(trace.outcome).toBeTypeOf('string');
    });
  });

  test('inference_grades.json 若存在则结构合规', async () => {
    await forAllGames(async ({ key, config }) => {
      if (!config.htmlFile) return;
      if (!config.reasoning?.enabled) return;
      if (config.reasoning?.gracePeriod) return;

      const gradesPath = join(process.cwd(), 'games', key, 'inference_grades.json');
      if (!existsSync(gradesPath)) return; // L6c 未跑过则跳过

      const grades = JSON.parse(readFileSync(gradesPath, 'utf-8'));
      expect(grades.requiredRecall).toBeTypeOf('number');
      expect(grades.optionalRecall).toBeTypeOf('number');
      expect(Array.isArray(grades.factsHit)).toBe(true);
      expect(Array.isArray(grades.factsMissed)).toBe(true);
      expect(Array.isArray(grades.failureCategorization)).toBe(true);
    });
  });

  test('inference_report.md 若存在则为非空 markdown', async () => {
    await forAllGames(async ({ key, config }) => {
      if (!config.htmlFile) return;
      if (!config.reasoning?.enabled) return;
      if (config.reasoning?.gracePeriod) return;

      const reportPath = join(process.cwd(), 'games', key, 'inference_report.md');
      if (!existsSync(reportPath)) return; // L6c 未跑过则跳过

      const content = readFileSync(reportPath, 'utf-8');
      expect(content.length, `[${key}] inference_report.md 不应为空`).toBeGreaterThan(0);
      expect(content, `[${key}] inference_report.md 应为 markdown 格式`).toMatch(/^[#>\-\s]/);
    });
  });
});
