// src/index-page.js
//
// index.html 首页的纯渲染 + 清洗逻辑（被首页 <script type="module"> 引入）。
//
// 设计目标：
//   1. **XSS 防御**：所有从外部源（games.json / README 抽取）拼到 HTML 字符串的字段
//      都必须经 escapeHtml 转换；URL 必须经 sanitizeHtmlFile 校验白名单。
//   2. **零依赖**：不引入 DOMPurify 之类运行时库；用最小白名单手写。
//   3. **可测试**：所有逻辑都是纯函数（输入 → 字符串/对象），无 DOM 依赖，
//      可在 jsdom / Node 环境下直接 import 断言。
//
// 公开 API：
//   - escapeHtml(s)
//   - sanitizeHtmlFile(href)
//   - sanitizeGamesPayload(data)
//   - renderCardHtml(game)
//   - renderStats(games)

/**
 * HTML 文本节点 / 属性值转义，防止 XSS 注入。
 * 规则：处理 & < > " ' 五字符；& 必须最先替换，避免双重转义。
 *
 * @param {unknown} s
 * @returns {string}
 */
export function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 校验并清洗 htmlFile 字段。
 *
 * 规则（按"白名单"思路设计，多重防御）：
 *   1. 仅允许以 "games/" 开头（锁定到仓内 games 目录 + 强制同源）
 *   2. 必须以 ".html" 结尾（不暴露非 HTML 资源）
 *   3. 中间部分仅允许 [A-Za-z0-9._/-]（拒绝 :, ?, #, %, \\, 空格、控制字符等）
 *   4. 拒绝空段、拒绝以 "/" 开头的"games//"前缀
 *   5. 拒绝 ".."（防目录遍历）
 *   6. 拒绝 "games" 根（必须有文件名）
 *
 * 不通过返回 null。调用方按"不可启动"路径处理（指向 README.md）。
 *
 * @param {unknown} href
 * @returns {string|null}
 */
export function sanitizeHtmlFile(href) {
  if (href == null) return null;
  if (typeof href !== 'string') return null;
  const trimmed = href.trim();
  if (!trimmed) return null;
  // 整体形态：games/<segment>/<...>/<file>.html
  if (!/^games\/[A-Za-z0-9._/-]+\.html$/.test(trimmed)) return null;
  // 拒绝 "games//xxx"（双斜杠）和 "games/."（当前目录）
  if (trimmed.includes('//') || trimmed.includes('/.')) return null;
  // 拒绝目录遍历
  if (trimmed.includes('..')) return null;
  // 必须有目录 + 文件名（至少 games/x/y.html）
  const segments = trimmed.split('/');
  if (segments.length < 3) return null;
  return trimmed;
}

/**
 * 校验 games.json 整体结构 + 逐项清洗。
 * 任何异常结构 → 抛 Error（由调用方 catch 后走 fallback 列表）。
 *
 * @param {unknown} data
 * @returns {{ generatedAt: string, games: Array<{codename:string,title:string,subtitle:string,genre:string,status:string,description:string,htmlFile:(string|null)}> }}
 */
export function sanitizeGamesPayload(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('games.json 根必须是对象');
  }
  if (!Array.isArray(data.games)) {
    throw new Error('games.json 缺少 games 数组');
  }
  return {
    generatedAt: typeof data.generatedAt === 'string' ? data.generatedAt : '',
    games: data.games.map((g, i) => sanitizeGameEntry(g, i)),
  };
}

function sanitizeGameEntry(g, i) {
  if (!g || typeof g !== 'object') {
    throw new Error(`games[${i}] 不是对象`);
  }
  if (typeof g.codename !== 'string' || !/^[a-z0-9-]+$/.test(g.codename)) {
    throw new Error(`games[${i}].codename 缺失或非法`);
  }
  return {
    codename: g.codename,
    title: typeof g.title === 'string' ? g.title : '',
    subtitle: typeof g.subtitle === 'string' ? g.subtitle : '',
    genre: typeof g.genre === 'string' ? g.genre : '',
    status: typeof g.status === 'string' ? g.status : '',
    description: typeof g.description === 'string' ? g.description : '',
    htmlFile: sanitizeHtmlFile(g.htmlFile),
  };
}

/**
 * 渲染单张剧本卡片为 HTML 字符串。
 * 所有动态字段都经 escapeHtml；URL 经 sanitizeHtmlFile。
 * 不可启动剧本（htmlFile 为 null）→ 链接指向 games/<codename>/README.md，class 包含 disabled。
 *
 * @param {{codename:string,title:string,subtitle:string,genre:string,status:string,description:string,htmlFile:(string|null)}} game
 * @returns {string}
 */
export function renderCardHtml(game) {
  const codename = escapeHtml(game.codename || '');
  const title = escapeHtml(game.title || game.codename || '未命名剧本');
  const subtitle = escapeHtml(game.subtitle);
  const genre = escapeHtml(game.genre);
  const desc = escapeHtml(game.description);
  const status = escapeHtml(game.status);
  // 双重防御：即便调用方忘了 sanitizeGamesPayload，这里也兜底清洗一次
  const safeFile = sanitizeHtmlFile(game.htmlFile);
  const playable = !!safeFile;
  const href = playable
    ? escapeHtml(safeFile)
    : `games/${codename}/README.md`;
  const label = playable ? '[ 开始游戏 ]' : '[ 查看说明 ]';
  const cls = playable ? 'card' : 'card disabled';
  return `
    <article class="${cls}" data-codename="${codename}">
      <h2>${title}</h2>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
      <div class="genre">${genre}</div>
      <div class="desc">${desc}</div>
      <div class="status">状态：${status}</div>
      <a class="launch" href="${href}">${label}</a>
    </article>
  `.trim();
}

/**
 * 渲染顶部 stats 文字。
 *
 * @param {Array<{htmlFile:(string|null)}>} games
 * @returns {string}
 */
export function renderStats(games) {
  const total = games.length;
  const playable = games.filter(g => g.htmlFile).length;
  return `当前收录 ${total} 个剧本 · ${playable} 个可玩`;
}
