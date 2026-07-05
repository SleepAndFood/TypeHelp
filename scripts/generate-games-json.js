// scripts/generate-games-json.js
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GAMES_DIR = path.join(ROOT, 'games');
const OUT_FILE = path.join(ROOT, 'games.json');

function readReadme(dir) {
  const p = path.join(dir, 'README.md');
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf-8');
}

function extractTitle(content) {
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

function extractGenre(content) {
  // 首段 blockquote 中第一行作为题材/基调
  const m = content.match(/^>\s*(.+)$/m);
  return m ? m[1].trim() : '';
}

function extractStatus(content) {
  const m = content.match(/\*\*状态\*\*[:：]\s*(.+)/i);
  return m ? m[1].trim() : '未知';
}

function extractDescription(content) {
  const m = content.match(/^##\s+简介\s*\n+([\s\S]+?)(?=^##\s|\z)/m);
  if (!m) return '';
  return m[1]
    .replace(/^>\s*/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 280);
}

function extractPlayableFile(content, dir, codename) {
  const m = content.match(/\*\*可玩文件\*\*[:：]?\s*\[`?([^\]`\n]+)`?\]\([^\)]*\)/i);
  if (m) {
    const f = m[1].trim();
    if (existsSync(path.join(dir, f))) return f;
  }
  const htmlFiles = readdirSync(dir).filter(f => f.endsWith('.html') && !f.includes('_embedded'));
  if (htmlFiles.length === 1) return htmlFiles[0];
  const named = htmlFiles.find(f => f === `${codename}.html`);
  if (named) return named;
  return null;
}

function discoverGame(codename) {
  const dir = path.join(GAMES_DIR, codename);
  const content = readReadme(dir);
  if (!content) {
    console.warn(`[warn] ${codename}: README.md 不存在`);
    return null;
  }
  const titleInfo = extractTitle(content);
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
  for (const codename of entries) {
    const game = discoverGame(codename);
    if (game) games.push(game);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    games,
  };

  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  console.log(`[ok] 已生成 ${OUT_FILE}，共 ${games.length} 个剧本`);
}

main();
