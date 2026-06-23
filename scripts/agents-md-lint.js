#!/usr/bin/env node
/**
 * AGENTS.md 漂移 linter
 * 用法：node scripts/agents-md-lint.js
 *
 * 校验仓根 AGENTS.md 是否包含 5 个规范锚点（对应 checklist.md B.2 / H.3）。
 * 任何锚点缺失 → 退出码 1 + 报告缺失项；全通过 → 退出码 0。
 *
 * 5 个锚点：
 *   1) C1–C9：方法论 9 项硬约束表
 *   2) L1 静态 / L2 单元 / L3 叙事 / L4 渲染 / L5 E2E：5 层测试金字塔表
 *   3) check_twine_escape / verify_embed / check_twine_macro_stack：4 步门禁脚本名
 *   4) "UI bar" 或 "UIBar" / "L10n" 或 "l10n" / 反馈风格：多剧本共享基线
 *   5) 禁止：禁止行为清单标题词
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const AGENTS_MD = path.join(process.cwd(), 'AGENTS.md');

// 5 个锚点定义（任意一条缺失即视为该锚点缺失）
// 形式：{ id, name, patterns: [string, ...] } —— patterns 中每个串都需在 AGENTS.md 中存在
const ANCHORS = [
  {
    id: 'A1',
    name: 'C1–C9 方法论硬约束表',
    patterns: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9'],
  },
  {
    id: 'A2',
    name: '5 层测试金字塔表',
    patterns: ['L1 静态', 'L2 单元', 'L3 叙事', 'L4 渲染', 'L5 E2E'],
  },
  {
    id: 'A3',
    name: '4 步强制门禁脚本名',
    patterns: ['check_twine_escape', 'verify_embed', 'check_twine_macro_stack'],
  },
  {
    id: 'A4',
    name: '多剧本共享基线（UI bar / L10n / 反馈风格）',
    // 任一 OR 组中存在一个即可；这里分两阶段判断，先平铺全部子串
    patterns: ['UI bar', 'UIBar', 'L10n', 'l10n', '反馈风格'],
    // orGroups：每个子数组内部是"或"关系（任一命中即算锚点通过）
    orGroups: [
      ['UI bar', 'UIBar'],
      ['L10n', 'l10n'],
      ['反馈风格'],
    ],
  },
  {
    id: 'A5',
    name: '禁止行为清单',
    patterns: ['禁止'],
  },
];

function evaluateAnchor(anchor, body) {
  const missing = [];
  if (anchor.orGroups) {
    for (const group of anchor.orGroups) {
      const hit = group.some((p) => body.includes(p));
      if (!hit) missing.push(`(${group.join(' OR ')})`);
    }
  } else {
    for (const p of anchor.patterns) {
      if (!body.includes(p)) missing.push(p);
    }
  }
  return missing;
}

async function main() {
  if (!existsSync(AGENTS_MD)) {
    process.stderr.write(`AGENTS.md 不存在：${AGENTS_MD}\n`);
    process.exit(1);
  }

  const body = await readFile(AGENTS_MD, 'utf-8');

  const failed = [];
  for (const anchor of ANCHORS) {
    const missing = evaluateAnchor(anchor, body);
    if (missing.length) {
      failed.push({ id: anchor.id, name: anchor.name, missing });
    }
  }

  if (failed.length === 0) {
    process.stdout.write('AGENTS.md 通过所有规范锚点校验\n');
    process.exit(0);
  }

  const report = {
    file: 'AGENTS.md',
    totalAnchors: ANCHORS.length,
    passed: ANCHORS.length - failed.length,
    failed,
  };
  process.stderr.write(JSON.stringify(report, null, 2) + '\n');
  process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`AGENTS.md 校验异常：${err.stack || err.message}\n`);
  process.exit(1);
});
