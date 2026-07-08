// test/unit/generate-games-json.test.js
//
// 单元测试：scripts/generate-games-json.js 的纯函数
//
// 关键原则：
//   1. 必须 import 实际函数（不能内联复制实现 —— 任务 1 的 code review 已经识别该反模式）
//   2. 使用 os.tmpdir() + fs.mkdtempSync 构造临时 fixture，afterEach 清理
//      避免污染真实 games/ 目录
//   3. 模块顶层有 isMain 守卫，import 时 main() 不会执行

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  readReadme,
  extractTitle,
  extractGenre,
  extractStatus,
  extractDescription,
  extractPlayableFile,
  discoverGame,
} from '../../scripts/generate-games-json.js';

let tmpDir;
let warnSpy;

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(tmpdir(), 'txtgame-games-json-'));
  // 静默被测代码的 console.warn（回退路径会触发），避免污染测试输出
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  if (tmpDir && existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('readReadme', () => {
  it('返回 null 当目录中不存在 README.md', () => {
    expect(readReadme(tmpDir)).toBeNull();
  });

  it('返回文件原始内容（utf-8）当 README.md 存在', () => {
    const p = path.join(tmpDir, 'README.md');
    writeFileSync(p, '# 标题\n正文', 'utf-8');
    expect(readReadme(tmpDir)).toBe('# 标题\n正文');
  });
});

describe('extractTitle', () => {
  it('解析带括号的中英双语标题', () => {
    expect(extractTitle('# 嘉利别墅 (Galley Villa)\n')).toEqual({
      title: '嘉利别墅',
      subtitle: 'Galley Villa',
    });
  });

  it('解析无副标题的纯中文标题，subtitle 为空字符串', () => {
    expect(extractTitle('# 嘉利别墅\n')).toEqual({
      title: '嘉利别墅',
      subtitle: '',
    });
  });

  it('trim 标题与副标题的多余空白', () => {
    expect(extractTitle('#   嘉利别墅   (  Galley Villa  )   \n')).toEqual({
      title: '嘉利别墅',
      subtitle: 'Galley Villa',
    });
  });

  it('只取第一个 H1（多 H1 场景下忽略后续）', () => {
    const content = '# 第一个 (First)\n\n## 简介\n\n# 第二个 (Second)\n';
    expect(extractTitle(content)).toEqual({
      title: '第一个',
      subtitle: 'First',
    });
  });

  it('返回 null 当内容中无 H1', () => {
    expect(extractTitle('## 简介\n无 H1\n')).toBeNull();
  });

  it('返回 null 对空字符串输入', () => {
    expect(extractTitle('')).toBeNull();
  });

  it('返回 null 对 null 输入', () => {
    expect(extractTitle(null)).toBeNull();
  });
});

describe('extractGenre', () => {
  it('提取首行 blockquote 作为题材', () => {
    const content = '# T\n\n> 1936 年英国古堡暴风雪山庄 + meta 心理恐怖\n> **状态**：可玩\n';
    expect(extractGenre(content)).toBe('1936 年英国古堡暴风雪山庄 + meta 心理恐怖');
  });

  it('返回空字符串当无 blockquote', () => {
    expect(extractGenre('# 标题\n\n正文\n')).toBe('');
  });

  it('返回空字符串对空输入', () => {
    expect(extractGenre('')).toBe('');
  });

  it('返回空字符串对 null 输入', () => {
    expect(extractGenre(null)).toBe('');
  });
});

describe('extractStatus', () => {
  it('提取状态文字（中文冒号）', () => {
    expect(extractStatus('# T\n\n> **状态**：完整可玩\n')).toBe('完整可玩');
  });

  it('提取状态文字（中文标签 + 英文冒号）', () => {
    // 实际仓库中所有剧本都使用中文 "状态" 标签；这里用英文冒号验证 [:：] 双字符类
    expect(extractStatus('# T\n\n> **状态**: playable\n')).toBe('playable');
  });

  it('剥离状态文字中残留的 markdown 加粗标记', () => {
    // 注意：这里的状态行**自身**的 **状态** 加粗是固定的；我们要测的是状态值中嵌入的加粗
    // 实际场景：'> **状态**：**可玩**，**完成**'
    expect(extractStatus('# T\n\n> **状态**：**可玩**，**完成**\n')).toBe('可玩，完成');
  });

  it('回退为 "未知" 当状态行缺失', () => {
    expect(extractStatus('# T\n\n> 题材 / 随便写写\n')).toBe('未知');
  });

  it('返回 "未知" 对 null 输入', () => {
    expect(extractStatus(null)).toBe('未知');
  });

  it('返回 "未知" 对空字符串输入', () => {
    expect(extractStatus('')).toBe('未知');
  });
});

describe('extractDescription', () => {
  it('提取 ## 简介 章节正文（单行）', () => {
    const content = '# T\n\n## 简介\n\n这是简介正文。\n\n## 故事结构\n';
    expect(extractDescription(content)).toBe('这是简介正文。');
  });

  it('清理 markdown 噪声：加粗、水平分隔符、列表项', () => {
    const content = [
      '# T',
      '',
      '## 简介',
      '',
      '---',
      '',
      '这是 **重要** 内容。',
      '- 列表项 A',
      '- 列表项 B',
      '',
      '## 下一节',
      '',
    ].join('\n');
    // 中文合并规则会处理所有"中文 + 空白 + 中文"：
    //   "这是" + 空格 + "重要" → 合并
    //   "重要" + 空格 + "内容" → 合并
    //   "内容。" + 空格 + "列表" → 合并（"。" 在 \u3000-\u303F 范围）
    expect(extractDescription(content)).toBe('这是重要内容。列表项 A 列表项 B');
  });

  it('清理 blockquote 前缀（> 引用 A \\n > 引用 B）', () => {
    const content = '# T\n\n## 简介\n\n> 引用内容 A\n> 引用内容 B\n\n## 下一节\n';
    expect(extractDescription(content)).toBe('引用内容 A 引用内容 B');
  });

  it('简介超长（>280 code point）按 code point 截断并追加省略号', () => {
    const long = '字'.repeat(500);
    const content = `## 简介\n\n${long}\n\n## 其他\n`;
    const result = extractDescription(content);
    expect(result.endsWith('…')).toBe(true);
    // 280 个汉字 + 1 个 "…" = 281 code point
    expect([...result].length).toBe(281);
  });

  it('简介不超长时不追加省略号', () => {
    const content = '# T\n\n## 简介\n\n短简介。\n\n## 其他\n';
    expect(extractDescription(content)).toBe('短简介。');
  });

  it('返回空字符串当 ## 简介 章节缺失', () => {
    expect(extractDescription('# T\n\n## 故事结构\n\n其他\n')).toBe('');
  });

  it('返回空字符串对 null 输入', () => {
    expect(extractDescription(null)).toBe('');
  });
});

describe('extractPlayableFile', () => {
  it('回退路径 1：README 显式声明且文件存在 → 返回声明的文件名', () => {
    const f = 'custom-name.html';
    writeFileSync(path.join(tmpDir, f), '<html></html>', 'utf-8');
    const content = `# T\n\n> **可玩文件**：[\`${f}\`](${f})\n`;
    expect(extractPlayableFile(content, tmpDir, 'foo')).toBe(f);
  });

  it('回退路径 1 → 2：README 声明的文件不存在 → 回退到唯一 HTML', () => {
    writeFileSync(path.join(tmpDir, 'actual.html'), '<html></html>', 'utf-8');
    const content = '# T\n\n> **可玩文件**：[missing.html](missing.html)\n';
    expect(extractPlayableFile(content, tmpDir, 'foo')).toBe('actual.html');
  });

  it('回退路径 3：README 未声明 + 多个 HTML + 有 codename.html → 返回 codename.html', () => {
    writeFileSync(path.join(tmpDir, 'extra.html'), '<html></html>', 'utf-8');
    writeFileSync(path.join(tmpDir, 'foo.html'), '<html></html>', 'utf-8');
    expect(extractPlayableFile('# T\n', tmpDir, 'foo')).toBe('foo.html');
  });

  it('README 未声明 + 多个 HTML + 无 codename.html → 返回 null', () => {
    writeFileSync(path.join(tmpDir, 'a.html'), '<html></html>', 'utf-8');
    writeFileSync(path.join(tmpDir, 'b.html'), '<html></html>', 'utf-8');
    expect(extractPlayableFile('# T\n', tmpDir, 'foo')).toBeNull();
  });

  it('README 未声明 + 无 HTML → 返回 null', () => {
    expect(extractPlayableFile('# T\n', tmpDir, 'foo')).toBeNull();
  });

  it('忽略 _embedded 中间产物（不视为唯一 HTML）', () => {
    writeFileSync(path.join(tmpDir, 'foo_embedded.html'), '<html></html>', 'utf-8');
    // 过滤后剩下 []，且没有 codename.html → null
    expect(extractPlayableFile('# T\n', tmpDir, 'foo')).toBeNull();
  });

  it('返回 null 对 null content', () => {
    expect(extractPlayableFile(null, tmpDir, 'foo')).toBeNull();
  });

  it('返回 null 对 null dir', () => {
    expect(extractPlayableFile('# T\n', null, 'foo')).toBeNull();
  });
});

describe('discoverGame', () => {
  it('返回 null 当 README.md 不存在', () => {
    // 没有创建任何子目录 → discoverGame('missing-codename', tmpDir) 找不到
    // tmpDir/missing-codename/README.md
    expect(discoverGame('missing-codename', tmpDir)).toBeNull();
  });

  it('返回 null 当 README 缺少 H1', () => {
    const dir = path.join(tmpDir, 'no-h1');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'README.md'), '## 简介\n无 H1\n', 'utf-8');
    expect(discoverGame('no-h1', tmpDir)).toBeNull();
  });

  it('合法剧本目录 → 返回完整 game 对象', () => {
    const dir = path.join(tmpDir, 'galley-villa');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      path.join(dir, 'README.md'),
      [
        '# 嘉利别墅 (Galley Villa)',
        '',
        '> 1936 年古堡暴风雪山庄',
        '> **状态**：完整可玩',
        '> **可玩文件**：[`galley-villa.html`](galley-villa.html)',
        '',
        '## 简介',
        '',
        '你是一名调查员。',
        '',
        '## 如何运行',
        '',
      ].join('\n'),
      'utf-8',
    );
    writeFileSync(path.join(dir, 'galley-villa.html'), '<html></html>', 'utf-8');

    const game = discoverGame('galley-villa', tmpDir);
    expect(game).toEqual({
      codename: 'galley-villa',
      title: '嘉利别墅',
      subtitle: 'Galley Villa',
      genre: '1936 年古堡暴风雪山庄',
      status: '完整可玩',
      description: '你是一名调查员。',
      htmlFile: 'games/galley-villa/galley-villa.html',
    });
  });

  it('htmlFile 缺失时，状态中 "不完整" 替换为 "早期探索 / 不可启动"', () => {
    const dir = path.join(tmpDir, 'terminal-mystery');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      path.join(dir, 'README.md'),
      [
        '# 沈家山庄事件 (Case Recovery)',
        '',
        '> 暴风雪山庄 / 早期探索',
        '> **状态**：⚠️ **不完整**，仅 00-04 段文件',
        '',
        '## 简介',
        '',
        'Solo Agent 早期探索项目。',
        '',
      ].join('\n'),
      'utf-8',
    );

    const game = discoverGame('terminal-mystery', tmpDir);
    expect(game).not.toBeNull();
    expect(game.htmlFile).toBeNull();
    expect(game.status).not.toContain('不完整');
    expect(game.status).toContain('早期探索 / 不可启动');
  });

  it('htmlFile 缺失但状态文本不含 "不完整" 时保持原文', () => {
    const dir = path.join(tmpDir, 'test-game');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      path.join(dir, 'README.md'),
      [
        '# Test',
        '',
        '> 题材',
        '> **状态**：设计阶段',
        '',
        '## 简介',
        '',
        '占位',
        '',
      ].join('\n'),
      'utf-8',
    );

    const game = discoverGame('test-game', tmpDir);
    expect(game).not.toBeNull();
    expect(game.htmlFile).toBeNull();
    expect(game.status).toBe('设计阶段');
  });
});
