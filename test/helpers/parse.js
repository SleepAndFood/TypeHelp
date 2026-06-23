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
 * 从分片文件构造 passages（无 HTML 编译产物的剧本）
 * @param {Array<{name:string,content:string}>} files
 */
export async function parsePassagesFromFiles(files) {
  const out = [];
  for (const f of files) {
    const ps = extractFromHtml(f.content);
    for (const p of ps) {
      // 分片文件没有 HTML 包裹，让 name 来自内容但保留文件名作为备注
      out.push({ ...p, sourceFile: f.name });
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
