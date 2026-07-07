// scripts/generate-games-json.js
//
// 扫描 games/ 下所有剧本目录，从各 README.md 抽取元数据，生成 games.json
// 供 index.html 首页使用。
//
// HTML 文件名解析三级回退（针对单剧本目录）：
//   1) README 中 **可玩文件** 显式声明（需校验文件存在）
//   2) 目录中唯一 .html 文件（过滤 _embedded 中间产物）
//   3) 与目录同名的 <codename>.html
// 若仍未命中，htmlFile = null，状态"不完整"被替换为"早期探索 / 不可启动"。
//
// 输出格式：
//   { generatedAt: ISO 时间戳, games: [...] }

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GAMES_DIR = path.join(ROOT, 'games');
const OUT_FILE = path.join(ROOT, 'games.json');

/**
 * 计算稳定 build marker：基于各剧本 README.md + 本脚本自身内容的 SHA256 头 8 位。
 *
 * 设计动机（修复 AGENTS.md 心法"全部 CI 化"中"games.json 每次 build 都产生无意义时间戳 diff"问题）：
 *   - 原实现用 `new Date().toISOString()` —— 每次 build 都变，git diff 充斥时间戳。
 *   - 改用 README + 脚本自身内容 hash —— 源数据未变 → hash 不变 → diff 干净；
 *     源数据变化 → hash 变化 → diff 体现真实变化。
 *   - **Windows CRLF 防御**：所有被 hash 的内容先归一为 LF。git 在 Windows 上
 *     checkout 时可能把 LF 转 CRLF，导致同一份 README 在 commit 时刻与 build 时刻
 *     字节不同，hash 漂移。归一化后两端一致。
 *   - 8 位 hex = 32 bit 碰撞空间，对 10 个以内剧本的仓级 metadata 足够。
 *
 * @param {string[]} codenames 已发现的剧本 codename 列表
 * @returns {string} 形如 "build-<8hex>"
 */
function buildMarker(codenames) {
  const hash = createHash('sha256');
  // 1) 把本脚本自身纳入 hash —— 脚本逻辑改了 hash 也变
  //    CRLF → LF 归一，规避 Windows checkout 引入的字节差异
  hash.update(readFileSync(fileURLToPath(import.meta.url), 'utf-8').replace(/\r\n/g, '\n'));
  // 2) 按 codename 排序后逐个读 README 加入 hash
  //    排序保证遍历顺序无关（readdirSync 在 Windows / Linux 可能不同）
  for (const codename of [...codenames].sort()) {
    const readmePath = path.join(GAMES_DIR, codename, 'README.md');
    hash.update(`\n=== ${codename} ===\n`);
    if (existsSync(readmePath)) {
      hash.update(readFileSync(readmePath, 'utf-8').replace(/\r\n/g, '\n'));
    }
  }
  return `build-${hash.digest('hex').slice(0, 8)}`;
}

export function readReadme(dir) {
  const p = path.join(dir, 'README.md');
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf-8');
}

export function extractTitle(content) {
  if (!content) return null;
  const m = content.match(/^#\s+(.+)$/m);
  if (!m) return null;
  const raw = m[1].trim();
  // 分离中文名和英文名，如 "嘉利别墅 (Galley Villa)"
  const bracket = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (bracket) {
    return { title: bracket[1].trim(), subtitle: bracket[2].trim() };
  }
  return { title: raw, subtitle: '' };
}

export function extractGenre(content) {
  if (!content) return '';
  // 首段 blockquote 中第一行作为题材/基调
  const m = content.match(/^>\s*(.+)$/m);
  return m ? m[1].trim() : '';
}

export function extractStatus(content) {
  if (!content) return '未知';
  const m = content.match(/\*\*状态\*\*[:：]\s*(.+)/i);
  const raw = m ? m[1].trim() : '未知';
  // 剥离 markdown 加粗/斜体标记，首页为纯文本渲染
  return raw.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1').trim() || '未知';
}

// 清理 markdown 噪声：blockquote、加粗、分隔符、列表项、合并空白
// 同时按 code point 截断以避免 emoji 被切坏
function cleanText(text) {
  return text
    .replace(/^>\s*/gm, '')                                   // 剥离 blockquote
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')                   // 剥离加粗/斜体
    .replace(/^---+\s*$/gm, '')                               // 剥离水平分隔符
    .replace(/^[\s]*[-*]\s+/gm, '')                           // 剥离列表项
    .replace(/\s+/g, ' ')                                     // 合并空白
    .replace(/([\u4E00-\u9FFF\u3000-\u303F])\s+([\u4E00-\u9FFF\u3000-\u303F])/g, '$1$2')  // 合并被切碎的中文/全角标点
    .trim();
}

function safeSlice(text, max) {
  // 按 code point 截断，避免 surrogate pair 切坏 emoji
  const chars = [...text];
  return chars.length > max ? chars.slice(0, max).join('') + '…' : text;
}

export function extractDescription(content) {
  if (!content) return '';
  const m = content.match(/^##\s+简介\s*\n+([\s\S]+?)(?=^##\s|\z)/m);
  if (!m) return '';
  return safeSlice(cleanText(m[1]), 280);
}

export function extractPlayableFile(content, dir, codename) {
  if (!content || !dir) return null;
  const m = content.match(/\*\*可玩文件\*\*[:：]?\s*\[`?([^\]`\n]+)`?\]\([^\)]*\)/i);
  if (m) {
    const f = m[1].trim();
    if (existsSync(path.join(dir, f))) return f;
    console.warn(`[warn] ${codename}: README 声明的 ${f} 不存在，回退到自动扫描`);
  }
  const htmlFiles = readdirSync(dir).filter(f => f.endsWith('.html') && !f.includes('_embedded'));
  if (htmlFiles.length === 1) return htmlFiles[0];
  const named = htmlFiles.find(f => f === `${codename}.html`);
  if (named) return named;
  return null;
}

export function discoverGame(codename, gamesDir = GAMES_DIR) {
  const dir = path.join(gamesDir, codename);
  const content = readReadme(dir);
  if (!content) {
    console.warn(`[warn] ${codename}: README.md 不存在`);
    return null;
  }
  const titleInfo = extractTitle(content);
  if (!titleInfo) {
    console.warn(`[warn] ${codename}: 标题解析失败（H1 缺失或格式异常）`);
    return null;
  }
  const htmlFile = extractPlayableFile(content, dir, codename);
  const baseStatus = extractStatus(content);
  const status = htmlFile ? baseStatus : baseStatus.replace('不完整', '早期探索 / 不可启动');
  return {
    codename,
    title: titleInfo.title,
    subtitle: titleInfo.subtitle,
    genre: extractGenre(content),
    status,
    description: extractDescription(content),
    htmlFile: htmlFile ? `games/${codename}/${htmlFile}` : null,
  };
}

function main() {
  try {
    if (!existsSync(GAMES_DIR)) {
      console.error(`[FAIL] games 目录不存在: ${GAMES_DIR}`);
      process.exitCode = 1;
      return;
    }

    const entries = readdirSync(GAMES_DIR)
      .map(name => {
        const full = path.join(GAMES_DIR, name);
        try {
          return statSync(full).isDirectory() ? name : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const games = [];
    const codenames = [];
    for (const codename of entries) {
      const game = discoverGame(codename);
      if (game) {
        games.push(game);
        codenames.push(codename);
      }
    }

    const payload = {
      // 修复前：generatedAt: new Date().toISOString() —— 每次 build 都变，git diff 污染
      // 修复后：基于 README + 脚本自身内容 SHA256 → 源数据未变时 build marker 稳定
      generatedAt: buildMarker(codenames),
      games,
    };

    writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
    const relOut = path.relative(process.cwd(), OUT_FILE);
    console.log(`[ok] 已生成 ${relOut}，共 ${games.length} 个剧本`);
  } catch (err) {
    console.error(`[FAIL] 生成 games.json 时发生未捕获错误: ${err.message}`);
    console.error(err.stack);
    process.exitCode = 1;
  }
}

// 仅在直接执行时运行 main；被 import 时不自动执行
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
