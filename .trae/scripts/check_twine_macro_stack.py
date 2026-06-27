#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check_twine_macro_stack.py

栈式扫描 Twine HTML 的 <tw-passagedata> body，定位 "<<elseif>> / <<else>> 在
<<if>> / <<switch>> 外" 的位置。这是 SugarCube 抛 "child tag <<elseif>> was
found outside of …" 报错的最常见根因——现有 check_twine_escape.py 只查
配对数（必要不充分），无法发现嵌套错位。

匹配 SugarCube v2 body-tag 宏白名单：
  if / elseif / else / for / capture / nobr / timed / replace / switch /
  silent / type / case / default

检查规则：
  - 遇到 <<name>>（开）→ push 当前宏
  - 遇到 <</name>> / <<endname>>（关）→ pop
  - 遇到 <<elseif>> / <<else>> → 栈顶必须为 'if' / 'switch' / 'case'
  - <<case>> 必须在 'switch' 内
  - 任何 <<elseif>> 出现在非 if 上下文 → 报告错误
"""
import argparse
import json
import re
import sys
from pathlib import Path

# SugarCube v2 body-tag 宏（含 elseif/else/case/default）
# 关键：<<link>> 和 <<script>> 是合法的单行+close 形式 body-tag 宏
# (例: <<link "text">>code<</link>>, <<script>>code<</script>>)
# 不在白名单会误报 "<</link>> 关闭无对应"
BODY_TAG_OPEN = ('if', 'for', 'capture', 'nobr', 'timed', 'replace',
                 'switch', 'silent', 'type', 'widget', 'link', 'script')
# <<done>> 是 <<for>> <<capture>> <<silent>> <<timed>> <<widget>> 的关闭符
# (SugarCube v2 文档化的 close 形式)
# 注意: <<nobr>> 和 <<replace>> 不用 <<done>> 关闭, 各自有 <</nobr>> / <</replace>>
# 之前的版本把 nobr/replace 误列进 DONE_ALIASES, 导致"<<done>> 错误关闭最外层 nobr",
# 进而触发连锁误报 "<</nobr>> close-without-open" (galley-villa Box:601, list:754 等)
DONE_ALIASES = ('for', 'capture', 'silent', 'timed', 'widget')
BODY_TAG_CLOSE = ('if', 'for', 'capture', 'nobr', 'timed', 'replace',
                  'switch', 'silent', 'type', 'widget', 'link', 'script', 'done')
# elseif/else/case/default 是子标签，无 close
SUB_TAGS = ('elseif', 'else', 'case', 'default')

# Twine 2 转义后的宏形式
LT_ESC = '&lt;'
GT_ESC = '&gt;'
MACRO_PATTERN = re.compile(
    LT_ESC + LT_ESC + r'/?(?:end)?([a-zA-Z][a-zA-Z0-9_-]*)\b.*?'
    + GT_ESC + GT_ESC
)

ERRORS = []


def add_error(passage, pid, line, kind, desc, ctx=''):
    ERRORS.append({
        'passage': passage, 'pid': pid, 'line': line,
        'kind': kind, 'desc': desc, 'context': ctx,
    })


def line_num_in(haystack, idx):
    return haystack.count('\n', 0, idx) + 1


def get_context(body, idx, width=80):
    s = max(0, idx - 30)
    return body[s:s + width].replace('\n', '\\n')


def _find_js_comments(body):
    """找出 body 中所有 JS 块注释 /* ... */ 的字符范围 (start, end)。
    这些范围内的宏是注释里的伪代码，不应被当作真实宏解析。
    关键场景: PassageFooter 用 /*<<run ...>>*/ 包裹宏调用做"看似注释"的运行代码。
    """
    ranges = []
    pos = 0
    while pos < len(body):
        start = body.find('/*', pos)
        if start < 0:
            break
        end = body.find('*/', start + 2)
        if end < 0:
            # 未闭合的注释：保守地取到 body 结尾
            end = len(body)
        else:
            end += 2  # 包含 */
        ranges.append((start, end))
        pos = end
    return ranges


def split_passages(content):
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
        name = (re.search(r'name="([^"]+)"', tag_str) or [None, '?'])[1] if re.search(r'name="([^"]+)"', tag_str) else '?'
        pid = (re.search(r'pid="(\d+)"', tag_str) or [None, '?'])[1] if re.search(r'pid="(\d+)"', tag_str) else '?'
        name = re.search(r'name="([^"]+)"', tag_str).group(1) if re.search(r'name="([^"]+)"', tag_str) else '?'
        pid = re.search(r'pid="(\d+)"', tag_str).group(1) if re.search(r'pid="(\d+)"', tag_str) else '?'

        body = content[open_end + 1:close_idx]
        line_num = content[:open_end + 1].count('\n') + 1
        passages.append({
            'name': name, 'pid': pid, 'body': body, 'line': line_num,
        })
        pos = close_idx + len('</tw-passagedata>')
    return passages


def check_passage(passage):
    body = passage['body']
    name = passage['name']
    base_line = passage['line']

    # 预处理: 找出所有 JS 块注释 /* ... */ 的范围
    # 这些注释里的 <<script>><</script>> 不是真宏,不能误判为嵌套错位
    # 关键: PassageFooter 中经常用 /*<<run ...>>*/ 包裹宏调用
    js_comment_ranges = _find_js_comments(body)

    def in_js_comment(idx):
        for s, e in js_comment_ranges:
            if s <= idx < e:
                return True
        return False

    stack = []  # list of dicts: {tag, open_idx, open_line}

    # <<nobr>> <<silent>> <<capture>> <<timed>> <<replace>> <<type>> <<widget>> <<for>>
    # 都不是"严格闭包"——它们内部可以嵌套任何宏,没有强制 close
    # 只有 <<if>> <<switch>> 才是真正的"分支闭包"——要求 else/elseif 配对
    STRICT_CLOSERS = ('if', 'switch')

    def find_enclosing(tag):
        """从栈顶往下找最近的指定 tag 父级。"""
        for i in range(len(stack) - 1, -1, -1):
            if stack[i]['tag'] == tag:
                return stack[i]
        return None

    # <<done>> 关闭策略:
    #   1. 优先找栈中名为 'done' 的 frame
    #   2. 否则从栈顶往下找最近的 DONE_ALIASES 帧
    #      (允许跳过中间的 <<if>> 等"非严格闭包"——这正是 galley-villa Box:523 的场景)
    def find_done_target():
        for i in range(len(stack) - 1, -1, -1):
            if stack[i]['tag'] == 'done':
                return i
            if stack[i]['tag'] in DONE_ALIASES:
                return i
        return None

    # DEBUG: 跟踪 done 关闭行为
    DEBUG_DONE = False  # set True to trace
    if DEBUG_DONE:
        def _dbg(msg):
            if 'done' in msg.lower() or 520 <= line <= 545:
                print(f"  DBG L{line} {msg}  stack={[s['tag'] for s in stack]}")

    for m in MACRO_PATTERN.finditer(body):
        # 跳过 JS 注释内的伪宏
        if in_js_comment(m.start()):
            continue
        token = m.group(1)
        raw = m.group(0)
        is_close_form = raw.startswith(LT_ESC + LT_ESC + '/') or \
                        raw.startswith(LT_ESC + LT_ESC + 'end')

        line = base_line + line_num_in(body, m.start()) - 1
        ctx = get_context(body, m.start())

        if is_close_form:
            # <</name>> / <<endname>>: pop 最近的同名 frame
            # <<done>> 是 <<for>>/<<capture>>/<<silent>>/<<timed>>/<<widget>> 的 close 形式
            # (SugarCube v2 文档化)
            if not stack:
                # <<done>> 在没有打开的块时 SugarCube 视为 no-op (TypeHelp 引擎用法:
                # <<if>> 内放 <<done>><<replace>>...<</replace>><</done>> 是合法风格)
                # 仅对其他 close 形式报错
                if token != 'done':
                    add_error(name, passage['pid'], line, 'close-without-open',
                              f'<</{token}>> 出现但无对应 <<{token}>> 打开', ctx)
                continue
            # 找最近的同名 frame (可能中间有非严格闭包的 frame)
            idx = None
            for i in range(len(stack) - 1, -1, -1):
                if stack[i]['tag'] == token:
                    idx = i
                    break
                # <<done>> 也匹配所有 DONE_ALIASES
                if token == 'done':
                    idx = find_done_target()
                    if idx is not None:
                        break
            if idx is None:
                # <<done>> 找不到对应 frame 时 silent 忽略 (SugarCube no-op)
                if token != 'done':
                    add_error(name, passage['pid'], line, 'close-without-open',
                              f'<</{token}>> 出现但无对应 <<{token}>> 打开', ctx)
                continue
            if idx < len(stack) - 1:
                # 关闭了嵌套的外层 frame —— 报告非严格嵌套关闭
                # 例外: <<done>> 是 SugarCube 合法行为，可以跨 <<if>> 关闭外层
                # <<for>> / <<capture>> / <<silent>> / <<timed>> / <<widget>> 等
                if token != 'done':
                    add_error(name, passage['pid'], line, 'nested-close',
                              f'<</{token}>> 关闭了嵌套在 '
                              f'<<{stack[-1]["tag"]}>> 内的 <<{token}>> '
                              f'(<<{stack[-1]["tag"]}>> 在 {stack[-1]["open_line"]} 行打开)',
                              ctx)
            # 弹掉该 frame
            # 关键: <<done>> 关闭外层 for/capture 后, 中间的 <<if>> 等严格闭包
            # frame 必须保留 (否则后续 <</if>> 找不到配对)
            if token == 'done':
                del stack[idx]
            else:
                del stack[idx:]
        elif token in SUB_TAGS:
            if token in ('elseif', 'else'):
                # 必须是最近的 <<if>> / <<switch>> / <<case>> 的子分支
                # 注意：<<case>> 在 switch 内允许 <<else>> (SugarCube v2 行为)
                if not stack:
                    add_error(name, passage['pid'], line, 'orphan-elseif',
                              f'<<{token}>> 出现但无任何打开的 <<if>> / <<switch>>',
                              ctx)
                else:
                    # 找最近的 STRICT_CLOSER 或 case
                    found = None
                    for i in range(len(stack) - 1, -1, -1):
                        if stack[i]['tag'] in STRICT_CLOSERS or stack[i]['tag'] == 'case':
                            found = stack[i]
                            break
                    if not found:
                        add_error(name, passage['pid'], line, 'orphan-elseif',
                                  f'<<{token}>> 出现但最近的父级是 <<{stack[-1]["tag"]}>>，'
                                  f'不是 <<if>> / <<switch>> / <<case>>',
                                  ctx)
                    else:
                        found['branch'] = token
            elif token == 'case':
                top = stack[-1] if stack else None
                if not top or top['tag'] != 'switch':
                    add_error(name, passage['pid'], line, 'orphan-case',
                              f'<<case>> 出现在 <<{top["tag"] if top else "(none)"}>> 内，'
                              f'<<case>> 必须在 <<switch>> 块内',
                              ctx)
            elif token == 'default':
                top = stack[-1] if stack else None
                if not top or top['tag'] != 'switch':
                    add_error(name, passage['pid'], line, 'orphan-default',
                              f'<<default>> 出现在 <<{top["tag"] if top else "(none)"}>> 内，'
                              f'<<default>> 必须在 <<switch>> 块内',
                              ctx)
        elif token in BODY_TAG_OPEN:
            stack.append({
                'tag': token, 'open_idx': m.start(), 'open_line': line,
            })

    # 结束时检查未关闭的标签
    for s in stack:
        add_error(name, passage['pid'], s['open_line'], 'unclosed-tag',
                  f'<<{s["tag"]}>> 在 passage 结束时未关闭（缺少 <</{s["tag"]}>>）',
                  '')


def main():
    p = argparse.ArgumentParser(description='栈式扫描 Twine passage 的 body-tag 嵌套')
    p.add_argument('path', help='Twine HTML 路径')
    p.add_argument('--json', action='store_true', help='输出 JSON')
    args = p.parse_args()

    path = Path(args.path)
    if not path.exists():
        print(f'File not found: {path}', file=sys.stderr)
        return 2

    content = path.read_text(encoding='utf-8', errors='replace')
    passages = split_passages(content)
    for ps in passages:
        check_passage(ps)

    if args.json:
        print(json.dumps({
            'path': str(path.resolve()),
            'passage_count': len(passages),
            'error_count': len(ERRORS),
            'errors': ERRORS,
        }, ensure_ascii=False, indent=2))
    else:
        print('=== check-twine-macro-stack ===')
        print(f'File: {path}')
        print(f'Passages scanned: {len(passages)}')
        print(f'Errors: {len(ERRORS)}')
        print()
        for e in ERRORS:
            print(f"  [{e['passage']}:{e['line']}] {e['kind']} - {e['desc']}")
            if e['context']:
                print(f"    ctx: {e['context']}")
            print()
        if not ERRORS:
            print('OK: 0 stack errors')

    return 1 if ERRORS else 0


if __name__ == '__main__':
    sys.exit(main())
