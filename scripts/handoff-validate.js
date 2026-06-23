#!/usr/bin/env node
/**
 * handoff 协议校验器
 * 用法：node scripts/handoff-validate.js <game-name>
 *
 * 校验 games/<game-name>/handoffs/*.json 是否符合 SKILL.md §4.2 + handoff-protocol.md
 * - 必填字段：from / to / next_step（字符串）、deliverables / assumptions / open_questions / blockers（数组）
 * - Agent 名称白名单（from / to 必须是白名单中的 9 个角色之一）
 * - deliverables 路径必须存在（相对仓根）
 * - 空目录：退出码 0 + 友好提示
 * - 有错：退出码 1 + JSON 报告写到 stderr
 */
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

// 9 个 Agent 名称白名单（与 .trae/specs/typehelp-novel-design/prompts/README.md §1 一致）
const AGENT_WHITELIST = new Set([
  'director',
  'truth-designer',
  'inference-architect',
  'file-designer',
  'tag-graph-designer',
  'meta-tutorial-designer',
  'formal-verifier',
  'twine-implementer',
  'playtester',
]);

// 必填字符串字段
const STRING_FIELDS = ['from', 'to', 'next_step'];

// 必填数组字段
const ARRAY_FIELDS = ['deliverables', 'assumptions', 'open_questions', 'blockers'];

/**
 * 从 from / to 字符串中提取 Agent 短名
 * 形如 "00-Director" / "01-Truth Designer" / "05-Meta & Tutorial Designer" 都接受
 * 规则：去掉 "00-" 编号前缀 → "&" 当空格切 → 空格切分 → 用 "-" 拼接 → 小写
 * 例： "01-Truth Designer" → "truth-designer"
 *      "05-Meta & Tutorial Designer" → "meta-tutorial-designer"
 *      "08-Playtester" → "playtester"
 */
function extractAgentKey(label) {
  if (typeof label !== 'string') return null;
  // 去掉 "00-" "01-" 之类的前缀编号
  const tail = label.replace(/^\d+-/, '');
  // "&" 视作分隔符（"Meta & Tutorial Designer" -> ["Meta","Tutorial","Designer"]）
  const tokens = tail.split(/[\s&]+/).filter(Boolean);
  return tokens.length ? tokens.join('-').toLowerCase() : null;
}

function main() {
  const gameName = process.argv[2];
  if (!gameName) {
    process.stderr.write('用法：node scripts/handoff-validate.js <game-name>\n');
    process.exit(2);
  }

  const handoffDir = path.join('games', gameName, 'handoffs');
  if (!existsSync(handoffDir)) {
    // 空目录场景：友好提示 + 退出 0
    process.stdout.write(`未发现 handoff 文件，跳过校验（目录不存在：${handoffDir}）\n`);
    process.exit(0);
  }

  (async () => {
    let files;
    try {
      files = (await readdir(handoffDir))
        .filter((f) => f.endsWith('.json'))
        .sort();
    } catch (err) {
      process.stderr.write(`无法读取目录 ${handoffDir}: ${err.message}\n`);
      process.exit(1);
    }

    if (files.length === 0) {
      process.stdout.write(`未发现 handoff 文件，跳过校验（${handoffDir} 为空）\n`);
      process.exit(0);
    }

    const report = {
      game: gameName,
      handoffDir,
      total: files.length,
      failed: 0,
      files: [],
    };

    for (const file of files) {
      const absPath = path.join(handoffDir, file);
      const fileReport = { file, errors: [] };

      let payload;
      try {
        const raw = await readFile(absPath, 'utf-8');
        payload = JSON.parse(raw);
      } catch (err) {
        fileReport.errors.push(`JSON 解析失败：${err.message}`);
        report.files.push(fileReport);
        report.failed += 1;
        continue;
      }

      // 必填字符串字段
      for (const f of STRING_FIELDS) {
        if (typeof payload[f] !== 'string' || payload[f].trim() === '') {
          fileReport.errors.push(`必填字符串字段缺失或为空：${f}`);
        }
      }

      // 必填数组字段
      for (const f of ARRAY_FIELDS) {
        if (!Array.isArray(payload[f])) {
          fileReport.errors.push(`必填数组字段缺失或类型错误：${f}`);
        }
      }

      // Agent 白名单
      if (typeof payload.from === 'string') {
        const fromKey = extractAgentKey(payload.from);
        if (!fromKey || !AGENT_WHITELIST.has(fromKey)) {
          fileReport.errors.push(
            `from "${payload.from}" 不在 Agent 白名单（需为：${[...AGENT_WHITELIST].join(' / ')}）`,
          );
        }
      }
      if (typeof payload.to === 'string') {
        const toKey = extractAgentKey(payload.to);
        if (!toKey || !AGENT_WHITELIST.has(toKey)) {
          fileReport.errors.push(
            `to "${payload.to}" 不在 Agent 白名单（需为：${[...AGENT_WHITELIST].join(' / ')}）`,
          );
        }
      }

      // deliverables 路径存在性
      if (Array.isArray(payload.deliverables)) {
        payload.deliverables.forEach((rel, idx) => {
          if (typeof rel !== 'string' || rel.trim() === '') {
            fileReport.errors.push(`deliverables[${idx}] 不是非空字符串`);
            return;
          }
          const abs = path.resolve(ROOT, rel);
          if (!existsSync(abs)) {
            fileReport.errors.push(`deliverables[${idx}] 路径不存在：${rel}`);
          }
        });
      }

      if (fileReport.errors.length) report.failed += 1;
      report.files.push(fileReport);
    }

    if (report.failed === 0) {
      process.stdout.write(
        `handoff 校验通过：${gameName} 共 ${report.total} 个 handoff 文件，全部符合协议\n`,
      );
      process.exit(0);
    }

    process.stderr.write(JSON.stringify(report, null, 2) + '\n');
    process.exit(1);
  })().catch((err) => {
    process.stderr.write(`handoff 校验异常：${err.stack || err.message}\n`);
    process.exit(1);
  });
}

main();
