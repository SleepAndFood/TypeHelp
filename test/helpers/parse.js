/**
 * HTML 解析助手（cheerio）
 * 适配 SugarCube / Harlowe / 通用 Twine 格式
 */
import * as cheerio from 'cheerio';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * 解析一个 SugarCube/Twine HTML 文件，提取所有 passage 数据
 * @param {string} htmlPath - 相对 / 绝对路径
 * @returns {Promise<Array<{pid:string,name:string,tags:string[],text:string}>>}
 */
export async function parsePassages(htmlPath) {
  const abs = path.resolve(process.cwd(), htmlPath);
  const html = await readFile(abs, 'utf-8');
  return extractFromHtml(html);
}

/**
 * 从分片文件构造 passages
 *
 * 支持两种格式（按文件内容自动识别）：
 * 1) SugarCube 分片：内容含 <tw-passagedata name="..."> 包装 → 用 cheerio 提取
 * 2) 纯文本分片：文件名 → passage.name，文件内容 → passage.text（用于早期无 HTML 的剧本）
 */
export async function parsePassagesFromFiles(files) {
  const out = [];
  for (const f of files) {
    if (/<tw-passagedata\b/i.test(f.content)) {
      // SugarCube 分片
      const ps = extractFromHtml(f.content);
      for (const p of ps) out.push({ ...p, sourceFile: f.name });
    } else {
      // 纯文本分片：文件名作为 passage 名，去掉后缀与路径
      const name = f.name
        .replace(/\\/g, '/')
        .split('/')
        .pop()
        .replace(/\.[^.]+$/, '');
      out.push({
        pid: String(out.length),
        name,
        tags: [],
        text: f.content,
        sourceFile: f.name,
      });
    }
  }
  return out;
}

function extractFromHtml(html) {
  const $ = cheerio.load(html, { xmlMode: false });
  const storydata = $('tw-storydata').first();
  const format = (storydata.attr('format') || 'SugarCube').toLowerCase();
  const passages = [];

  // 选择器：SugarCube / Harlowe 都用 tw-passagedata
  const selector = format === 'snowman'
    ? '[data-passage]'
    : 'tw-passagedata';

  $(selector).each((_, el) => {
    const $el = $(el);
    const name = $el.attr('name') || $el.attr('data-name') || `passage-${passages.length}`;
    const tags = ($el.attr('tags') || $el.attr('data-tags') || '')
      .split(/\s+/)
      .filter(Boolean);
    passages.push({
      pid: $el.attr('pid') || $el.attr('data-pid') || String(passages.length),
      name,
      tags,
      text: $el.html() || '',
    });
  });

  // fallback：如果仍无 passages，尝试任意标签
  if (passages.length === 0) {
    $('[data-passage], passage').each((_, el) => {
      const $el = $(el);
      passages.push({
        pid: $el.attr('data-pid') || String(passages.length),
        name: $el.attr('data-name') || `passage-${passages.length}`,
        tags: ($el.attr('data-tags') || '').split(/\s+/).filter(Boolean),
        text: $el.html() || '',
      });
    });
  }

  return passages;
}
