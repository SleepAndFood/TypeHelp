// test/unit/index-page.test.js
//
// 单元测试：src/index-page.js 的纯函数（XSS 防御 + 卡片渲染）
//
// 关键原则：
//   1. 必须 import 实际函数（不能内联复制实现 —— 与 generate-games-json.test.js 一致）
//   2. 重点覆盖：XSS 注入（标题/描述/状态含 <script> 标签）、URL 白名单逃逸、
//      fetch 失败兜底（sanitizeGamesPayload 抛错也能被 catch）
//   3. 故意构造恶意 fixture 验证 escapeHtml/sanitizeHtmlFile 真的把危险字符吃掉了

import { describe, it, expect } from 'vitest';

import {
  escapeHtml,
  sanitizeHtmlFile,
  sanitizeGamesPayload,
  renderCardHtml,
  renderStats,
} from '../../src/index-page.js';

describe('escapeHtml', () => {
  it('转义 5 个核心元字符：& < > " \'', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('& 必须最先替换（避免双重转义）', () => {
    // 如果实现里 & 不是最先，则 "<" → "&lt;" 会再被转成 "&amp;lt;"，结果变长
    expect(escapeHtml('<a&b>')).toBe('&lt;a&amp;b&gt;');
  });

  it('null / undefined / 空字符串 → 空字符串', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml('')).toBe('');
  });

  it('数字 / 布尔 / 对象转字符串后再 escape', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(true)).toBe('true');
    expect(escapeHtml(false)).toBe('false');
  });

  it('XSS 注入：<script>alert(1)</script> 整体被转义', () => {
    const xss = '<script>alert(1)</script>';
    const escaped = escapeHtml(xss);
    expect(escaped).not.toContain('<script>');
    expect(escaped).not.toContain('</script>');
    expect(escaped).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('XSS 注入：含 "onerror" 属性 + 表达式（关键：HTML 标签被转义，不是检查 onerror 字符串）', () => {
    const xss = '"><img src=x onerror=alert(1)>';
    const escaped = escapeHtml(xss);
    // 关键断言：转义后 <img> 不再是 HTML 标签（< 被转成 &lt;），
    // 因此浏览器不会去解析里面的 onerror 属性。
    // 注意 onerror 字面字符串可以出现 — 只要它不在 HTML 标签内部就无害。
    expect(escaped).toContain('&lt;img');
    expect(escaped).toContain('&quot;');
    expect(escaped).toBe('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;');
  });

  it('中文字符不被破坏', () => {
    expect(escapeHtml('嘉利别墅 (Galley Villa)')).toBe('嘉利别墅 (Galley Villa)');
  });
});

describe('sanitizeHtmlFile', () => {
  it('合法 games/xxx/yyy.html 路径 → 原样返回', () => {
    expect(sanitizeHtmlFile('games/galley-villa/TypeHelp.html'))
      .toBe('games/galley-villa/TypeHelp.html');
    expect(sanitizeHtmlFile('games/island-death/island-death.html'))
      .toBe('games/island-death/island-death.html');
  });

  it('null / undefined / 空 / 非字符串 → null', () => {
    expect(sanitizeHtmlFile(null)).toBeNull();
    expect(sanitizeHtmlFile(undefined)).toBeNull();
    expect(sanitizeHtmlFile('')).toBeNull();
    expect(sanitizeHtmlFile('   ')).toBeNull();
    expect(sanitizeHtmlFile(42)).toBeNull();
    expect(sanitizeHtmlFile({})).toBeNull();
  });

  it('非 games/ 开头 → null', () => {
    expect(sanitizeHtmlFile('/games/foo.html')).toBeNull();
    expect(sanitizeHtmlFile('./games/foo.html')).toBeNull();
    expect(sanitizeHtmlFile('../games/foo.html')).toBeNull();
    expect(sanitizeHtmlFile('https://evil.com/games/foo.html')).toBeNull();
    expect(sanitizeHtmlFile('foo.html')).toBeNull();
  });

  it('javascript: / data: 协议注入 → null', () => {
    expect(sanitizeHtmlFile('javascript:alert(1)')).toBeNull();
    expect(sanitizeHtmlFile('games/../javascript:alert(1)')).toBeNull();
    expect(sanitizeHtmlFile('games/foo/../bar.html')).toBeNull(); // 包含 ..
  });

  it('目录遍历 .. → null', () => {
    expect(sanitizeHtmlFile('games/../../../etc/passwd.html')).toBeNull();
    expect(sanitizeHtmlFile('games/foo/..bar.html')).toBeNull(); // 含 ".."
  });

  it('非 .html 后缀 → null', () => {
    expect(sanitizeHtmlFile('games/foo/bar.txt')).toBeNull();
    expect(sanitizeHtmlFile('games/foo/bar')).toBeNull();
    expect(sanitizeHtmlFile('games/foo/bar.html.bak')).toBeNull();
  });

  it('双斜杠 / 点段 → null', () => {
    expect(sanitizeHtmlFile('games//foo.html')).toBeNull();
    expect(sanitizeHtmlFile('games/./foo.html')).toBeNull();
  });

  it('根级 "games" 或 "games/" → null（必须有文件名）', () => {
    expect(sanitizeHtmlFile('games')).toBeNull();
    expect(sanitizeHtmlFile('games/')).toBeNull();
  });

  it('含特殊字符（? # % 空格） → null', () => {
    expect(sanitizeHtmlFile('games/foo/bar.html?x=1')).toBeNull();
    expect(sanitizeHtmlFile('games/foo/bar.html#frag')).toBeNull();
    expect(sanitizeHtmlFile('games/foo bar.html')).toBeNull();
    expect(sanitizeHtmlFile('games/foo%20bar.html')).toBeNull();
    expect(sanitizeHtmlFile('games/foo\\bar.html')).toBeNull();
  });

  it('trim 前导 / 尾部空白', () => {
    expect(sanitizeHtmlFile('  games/foo/bar.html  ')).toBe('games/foo/bar.html');
  });
});

describe('sanitizeGamesPayload', () => {
  it('合法 payload → 透传字段', () => {
    const input = {
      generatedAt: '2026-07-05T00:00:00.000Z',
      games: [
        {
          codename: 'galley-villa',
          title: '嘉利别墅',
          subtitle: 'Galley Villa',
          genre: '1936',
          status: '可玩',
          description: 'desc',
          htmlFile: 'games/galley-villa/TypeHelp.html',
        },
      ],
    };
    expect(sanitizeGamesPayload(input)).toEqual(input);
  });

  it('缺 games 数组 → 抛错', () => {
    expect(() => sanitizeGamesPayload({ generatedAt: 'x' })).toThrow(/games/);
  });

  it('根不是对象 → 抛错', () => {
    expect(() => sanitizeGamesPayload(null)).toThrow();
    expect(() => sanitizeGamesPayload('x')).toThrow();
    expect(() => sanitizeGamesPayload([])).toThrow();
  });

  it('缺 codename 或 codename 非法 → 抛错', () => {
    expect(() => sanitizeGamesPayload({ games: [{ title: 'x' }] })).toThrow(/codename/);
    expect(() => sanitizeGamesPayload({ games: [{ codename: 'GALLEY' }] })).toThrow(/codename/);
    expect(() => sanitizeGamesPayload({ games: [{ codename: 'a b' }] })).toThrow(/codename/);
    expect(() => sanitizeGamesPayload({ games: [{ codename: '../etc' }] })).toThrow(/codename/);
  });

  it('codename 必须全小写 + 数字 + 横线', () => {
    const ok = { games: [{ codename: 'island-death-v2', title: 't' }] };
    expect(() => sanitizeGamesPayload(ok)).not.toThrow();
  });

  it('缺字段的 game → 字符串默认值（不抛）', () => {
    const input = { games: [{ codename: 'foo' }] };
    const out = sanitizeGamesPayload(input);
    expect(out.games[0].title).toBe('');
    expect(out.games[0].subtitle).toBe('');
    expect(out.games[0].htmlFile).toBeNull();
  });

  it('htmlFile 非法 → 该项 htmlFile 置 null（不抛）', () => {
    const input = {
      games: [{ codename: 'foo', htmlFile: 'javascript:alert(1)' }],
    };
    const out = sanitizeGamesPayload(input);
    expect(out.games[0].htmlFile).toBeNull();
  });

  it('game 项不是对象 → 抛错', () => {
    expect(() => sanitizeGamesPayload({ games: [null] })).toThrow();
    expect(() => sanitizeGamesPayload({ games: ['x'] })).toThrow();
  });
});

describe('renderCardHtml', () => {
  const baseGame = {
    codename: 'galley-villa',
    title: '嘉利别墅',
    subtitle: 'Galley Villa',
    genre: '1936 古堡',
    status: '可玩',
    description: '调查员',
    htmlFile: 'games/galley-villa/TypeHelp.html',
  };

  it('可玩剧本：class 包含 card 但不含 disabled，链接指向 htmlFile', () => {
    const html = renderCardHtml(baseGame);
    expect(html).toContain('class="card"');
    expect(html).not.toContain('disabled');
    expect(html).toContain('href="games/galley-villa/TypeHelp.html"');
    expect(html).toContain('[ 开始游戏 ]');
  });

  it('不可启动剧本：class 包含 disabled，链接指向 README', () => {
    const html = renderCardHtml({ ...baseGame, htmlFile: null });
    expect(html).toContain('class="card disabled"');
    expect(html).toContain('href="games/galley-villa/README.md"');
    expect(html).toContain('[ 查看说明 ]');
  });

  it('无 subtitle 字段时不渲染空 div', () => {
    const html = renderCardHtml({ ...baseGame, subtitle: '' });
    expect(html).not.toContain('class="subtitle"');
  });

  it('有 subtitle 时渲染', () => {
    const html = renderCardHtml({ ...baseGame, subtitle: 'Galley Villa' });
    expect(html).toContain('<div class="subtitle">Galley Villa</div>');
  });

  it('**XSS 防御**：标题含 <script> 不会被当作脚本执行', () => {
    const xssTitle = '<script>alert(1)</script>';
    const html = renderCardHtml({ ...baseGame, title: xssTitle });
    // 关键断言：转义后 <script> 标签不再作为 HTML 标签出现
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('**XSS 防御**：描述含 onerror / img 标签不会触发', () => {
    const xssDesc = '"><img src=x onerror=alert(1)>';
    const html = renderCardHtml({ ...baseGame, description: xssDesc });
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('**XSS 防御**：status 字段含 HTML 也被转义', () => {
    const xssStatus = '<b>重要</b>';
    const html = renderCardHtml({ ...baseGame, status: xssStatus });
    expect(html).toContain('&lt;b&gt;重要&lt;/b&gt;');
  });

  it('**URL 注入防御**：htmlFile 含 javascript: 被清洗为 null → 走 README 链接', () => {
    const html = renderCardHtml({ ...baseGame, htmlFile: 'javascript:alert(1)' });
    // sanitizeHtmlFile 返回 null → renderCardHtml 应回退到 README 链接
    expect(html).toContain('href="games/galley-villa/README.md"');
    expect(html).toContain('class="card disabled"');
    expect(html).not.toContain('javascript:');
  });

  it('**URL 注入防御**：htmlFile 含 ../ 走 README 链接', () => {
    const html = renderCardHtml({ ...baseGame, htmlFile: '../evil.html' });
    expect(html).toContain('href="games/galley-villa/README.md"');
  });

  it('**codename 注入防御**：codename 含 < > 不会破坏 attribute', () => {
    const html = renderCardHtml({ ...baseGame, codename: 'foo" onclick="alert(1)' });
    expect(html).toContain('data-codename="foo&quot; onclick=&quot;alert(1)"');
  });

  it('data-codename 始终存在', () => {
    const html = renderCardHtml(baseGame);
    expect(html).toContain('data-codename="galley-villa"');
  });
});

describe('renderStats', () => {
  it('空数组 → "0 个剧本 · 0 个可玩"', () => {
    expect(renderStats([])).toBe('当前收录 0 个剧本 · 0 个可玩');
  });

  it('全部可玩', () => {
    const games = [
      { htmlFile: 'games/a/a.html' },
      { htmlFile: 'games/b/b.html' },
    ];
    expect(renderStats(games)).toBe('当前收录 2 个剧本 · 2 个可玩');
  });

  it('部分可玩', () => {
    const games = [
      { htmlFile: 'games/a/a.html' },
      { htmlFile: null },
      { htmlFile: null },
    ];
    expect(renderStats(games)).toBe('当前收录 3 个剧本 · 1 个可玩');
  });

  it('全部不可玩', () => {
    const games = [{ htmlFile: null }, { htmlFile: null }];
    expect(renderStats(games)).toBe('当前收录 2 个剧本 · 0 个可玩');
  });
});
