#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check_twine_escape.py

检查 Twine HTML 文件中 <tw-passagedata> 体内的 HTML 实体完整性。

背景：Twine 2.x 在保存 passage body 时会把 << / >> 转义成 &lt;&lt; / &gt;&gt;。
如果文件被 AI 生成器、人工编辑或文本工具污染，会出现：
  1. & 丢失：&lt;&lt; 变成 lt;&lt;
  2. 裸宏符：body 内出现未转义的 << / >>
  3. 编码污染：中文字符被替换为 ?
  4. 配对数：body-tag 宏 (if/for/capture/nobr/timed/replace/switch/silent/type)
     在单个 passage 体内 <<name>> 与 <</name>>/<<endname>> 数量不一致
  5. 截断实体：&lt; 后跟不合法字符（如 ""&gt; / 数字 / 空格）—— 表明
     AI 写 passage 时把字符串提前闭合，&lt;/tag&gt; 变成 &lt;tag""&gt;
     例：&lt;/nowrap&gt; → &lt;now""&gt;（被双引号截断 + 提前闭合）
     后果：SugarCube wikifier 把 &lt;/now&gt; 误识别为伪宏关闭，导致
     "child tag <<elseif>> was found outside of <<if>>" 错位报错

这些问题都会让 SugarCube 引擎的 Wikifier.Parser.parseBody 抛出
"cannot find a closing tag for macro <<X>>" 报错，且报错可能出现在
与实际损坏宏不同名的宏上（parser 在嵌套 wikify 上下文中错位消费）。

用法：
  python check_twine_escape.py <Twine HTML 文件路径> [--json]

退出码：
  0 = 0 error（PASS）
  1 = 至少 1 个 error（FAIL）
  2 = 文件未找到或参数错误
"""

import argparse
import json
import re
import sys
from pathlib import Path

# SugarCube v2 已知 body-tag 宏白名单（与 macro.tags !== undefined 对齐）
BODY_TAG_MACROS = ('if', 'for', 'capture', 'nobr', 'timed',
                   'replace', 'switch', 'silent', 'type')

# HTML 实体片段
AMP = '&'
LT = '<'
GT = '>'
LT_ESC = '&lt;'
GT_ESC = '&gt;'

# 输出收集
ERRORS = []
WARNINGS = []


def add_error(passage, pid, line, kind, desc, context=''):
    ERRORS.append({
        'passage': passage,
        'pid': pid,
        'line': line,
        'kind': kind,
        'desc': desc,
        'context': context,
    })


def add_warning(passage, pid, line, kind, desc, context=''):
    WARNINGS.append({
        'passage': passage,
        'pid': pid,
        'line': line,
        'kind': kind,
        'desc': desc,
        'context': context,
    })


def line_num_in(haystack, idx):
    """Return 1-based line number for char idx in haystack."""
    return haystack.count('\n', 0, idx) + 1


def get_context(haystack, idx, width=60):
    start = max(0, idx - 20)
    length = min(width, len(haystack) - start)
    return haystack[start:start + length].replace('\n', '\\n').replace('\r', '')


def split_passages(content):
    """按 <tw-passagedata ...>...</tw-passagedata> 拆分 passage。"""
    passages = []
    pos = 0
    while pos < len(content):
        open_idx = content.find('<tw-passagedata', pos)
        if open_idx < 0:
            break
        open_end = content.find('>', open_idx)
        if open_end < 0:
            break
        close_idx = content.find('</tw-passagedata>', open_end)
        if close_idx < 0:
            break

        tag_str = content[open_idx:open_end + 1]
        name_match = re.search(r'name="([^"]+)"', tag_str)
        pid_match = re.search(r'pid="(\d+)"', tag_str)
        name = name_match.group(1) if name_match else '?'
        pid = pid_match.group(1) if pid_match else '?'

        body = content[open_end + 1:close_idx]
        line_num = content[:open_end + 1].count('\n') + 1

        passages.append({
            'name': name,
            'pid': pid,
            'body': body,
            'line': line_num,
        })

        pos = close_idx + len('</tw-passagedata>')

    return passages


def check_passage(passage):
    """对单个 passage 体做全部检查。"""
    body = passage['body']
    name = passage['name']
    line = passage['line']

    # 检查 1: & 丢失类
    # 任何 `lt;` 或 `gt;` 不是某个 `&lt;` / `&gt;` 实体的结尾，都是损坏。
    # 即：寻找 NOT preceded by `&` 的 `lt;` 或 `gt;`。
    for m in re.finditer(r'(?<!' + re.escape(AMP) + r')lt;', body):
        # 排除：纯文本里出现 "lt;" 是英文中的 "less than" 缩写
        # 但在 Twine passage body 中，这种用法极罕见
        ctx = body[max(0, m.start() - 5):m.end() + 15]
        # 进一步过滤：如果前面是中文字符或英文词的一部分，视为正常
        prev_char = body[m.start() - 1] if m.start() > 0 else ''
        if prev_char and (prev_char.isalnum() or
                          (0x4E00 <= ord(prev_char) <= 0x9FFF)):
            continue
        add_error(name, passage['pid'],
                  line + line_num_in(body, m.start()) - 1,
                  'amp-missing-lt',
                  f'&lt; 丢失（standalone lt;），上下文={ctx!r}',
                  get_context(body, m.start()))

    for m in re.finditer(r'(?<!' + re.escape(AMP) + r')gt;', body):
        prev_char = body[m.start() - 1] if m.start() > 0 else ''
        if prev_char and (prev_char.isalnum() or
                          (0x4E00 <= ord(prev_char) <= 0x9FFF)):
            continue
        add_error(name, passage['pid'],
                  line + line_num_in(body, m.start()) - 1,
                  'amp-missing-gt',
                  f'&gt; 丢失（standalone gt;）',
                  get_context(body, m.start()))

    # 检查 2: 裸宏符（body 内出现未转义的 <<）
    idx = 0
    while True:
        idx = body.find('<<', idx)
        if idx < 0:
            break
        prev = body[max(0, idx - 2):idx]
        if prev != 'lt;':
            desc = f'body 内出现未转义的 <<，前 2 字符={prev!r}'
            add_error(name, passage['pid'],
                      line + line_num_in(body, idx) - 1,
                      'bare-macro-open', desc, get_context(body, idx))
        idx += 1

    # 检查 3: 工具链污染 - 中文字符旁的孤立 ?
    idx = 0
    while True:
        idx = body.find('?', idx)
        if idx < 0:
            break
        before = body[idx - 1] if idx > 0 else ''
        after = body[idx + 1] if idx < len(body) - 1 else ''
        is_before_cjk = (len(before) > 0
                         and 0x4E00 <= ord(before[0]) <= 0x9FFF)
        is_after_cjk = (len(after) > 0
                        and 0x4E00 <= ord(after[0]) <= 0x9FFF)
        if is_before_cjk or is_after_cjk:
            desc = '中文字符旁出现 ?（可能是被工具链替换的中文标点，如 ：→?）'
            add_warning(name, passage['pid'],
                        line + line_num_in(body, idx) - 1,
                        'cjk-questionable-question', desc,
                        get_context(body, idx))
        idx += 1

    # 检查 4: body-tag 宏配对数
    for macro in BODY_TAG_MACROS:
        # 打开: &lt;&lt;name 后跟非字母（用 \b 单词边界）
        open_pattern = re.compile(re.escape(LT_ESC) + re.escape(LT_ESC)
                                  + macro + r'\b')
        # 关闭: &lt;&lt;/name&gt;&gt; 或 &lt;&lt;endname&gt;&gt;
        close_pattern = re.compile(
            re.escape(LT_ESC) + re.escape(LT_ESC) + '/' + macro
            + re.escape(GT_ESC) + re.escape(GT_ESC) + '|'
            + re.escape(LT_ESC) + re.escape(LT_ESC) + 'end' + macro
            + re.escape(GT_ESC) + re.escape(GT_ESC)
        )
        open_count = len(open_pattern.findall(body))
        close_count = len(close_pattern.findall(body))
        if open_count != close_count:
            diff = open_count - close_count
            desc = f'<<{macro}>> open={open_count} close={close_count} (diff {diff})'
            add_error(name, passage['pid'], line,
                      'macro-pair-mismatch', desc, '')

    # 检查 5: 截断的 HTML 实体 / 不完整的 &lt; 转义
    # 关键问题：宏体内部字符串可以含 &lt; 是合法的（如 "&gt;blank&lt;"）
    # 因此**只**检测"短模式"截断——
    # 模式 A：&lt; + 1-8 个字母 + 双引号/数字 + &gt;（如 &lt;now""&gt; / &lt;a 5&gt;）
    # 模式 B：&lt; + 双引号 + &gt; 本身（&lt;"&gt;）—— 允许（合法字符串字面 "&lt;"）
    # 这种"字母+截断字符"短实体不可能是合法的 HTML 实体
    for m in re.finditer(r'&lt;[a-zA-Z]{1,8}["\d]["\d]*&gt;', body):
        add_error(name, passage['pid'],
                  line + line_num_in(body, m.start()) - 1,
                  'truncated-entity',
                  f'{m.group(0)!r} 是截断的不合法 HTML 实体'
                  f'（&lt; 后跟字母+双引号/数字+&gt; —— 不是完整标签名）',
                  get_context(body, m.start()))


def main():
    parser = argparse.ArgumentParser(
        description='检查 Twine HTML 文件中 <tw-passagedata> 体的 HTML 实体完整性')
    parser.add_argument('path', help='Twine HTML 文件路径')
    parser.add_argument('--json', action='store_true', help='输出 JSON 格式')
    args = parser.parse_args()

    path = Path(args.path)
    if not path.exists():
        print(f'File not found: {path}', file=sys.stderr)
        return 2

    # 强制 UTF-8 读取（避免 GBK 截断）
    try:
        content = path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        # 退路：用 utf-8 替换错误字符
        content = path.read_text(encoding='utf-8', errors='replace')

    passages = split_passages(content)
    if not passages:
        print(f'No <tw-passagedata> elements found in {path}', file=sys.stderr)
        return 1

    for p in passages:
        check_passage(p)

    if args.json:
        result = {
            'path': str(path.resolve()),
            'passage_count': len(passages),
            'errors': ERRORS,
            'warnings': WARNINGS,
            'error_count': len(ERRORS),
            'warning_count': len(WARNINGS),
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print('=== check-twine-escape ===')
        print(f'File: {path}')
        print(f'Passages scanned: {len(passages)}')
        print()

        if ERRORS:
            print(f'ERRORS ({len(ERRORS)}):')
            for e in ERRORS:
                print(f"  [{e['passage']}:{e['line']}] {e['kind']} - {e['desc']}")
                if e['context']:
                    print(f"    ctx: {e['context']}")
            print()

        if WARNINGS:
            print(f'WARNINGS ({len(WARNINGS)}):')
            for w in WARNINGS:
                print(f"  [{w['passage']}:{w['line']}] {w['kind']} - {w['desc']}")
                if w['context']:
                    print(f"    ctx: {w['context']}")
            print()

        if not ERRORS and not WARNINGS:
            print('OK: 0 errors, 0 warnings')
        elif not ERRORS:
            print(f'PASS: 0 errors, {len(WARNINGS)} warnings')
        else:
            print(f'FAIL: {len(ERRORS)} errors, {len(WARNINGS)} warnings')

    return 1 if ERRORS else 0


if __name__ == '__main__':
    sys.exit(main())
