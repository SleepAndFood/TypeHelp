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
BODY_TAG_OPEN = ('if', 'for', 'capture', 'nobr', 'timed', 'replace',
                 'switch', 'silent', 'type', 'widget')
# <<done>> 是 <<for>> <<capture>> <<nobr>> <<silent>> <<timed>> <<widget>> 的
# 关闭符（SugarCube 文档化的 close 形式）
DONE_ALIASES = ('for', 'capture', 'nobr', 'silent', 'timed', 'widget', 'replace')
BODY_TAG_CLOSE = ('if', 'for', 'capture', 'nobr', 'timed', 'replace',
                  'switch', 'silent', 'type', 'widget')
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

    stack = []  # list of dicts: {tag, open_idx, open_line}

    # <<nobr>> <<silent>> <<capture>> <<timed>> <<replace>> <<type>> <<widget>> <<for>>
    # 都不是"严格闭包"——它们内部可以嵌套任何宏，没有强制 close
    # 只有 <<if>> <<switch>> 才是真正的"分支闭包"——要求 else/elseif 配对
    STRICT_CLOSERS = ('if', 'switch')

    def find_enclosing(tag):
        """从栈顶往下找最近的指定 tag 父级。"""
        for i in range(len(stack) - 1, -1, -1):
            if stack[i]['tag'] == tag:
                return stack[i]
        return None

    for m in MACRO_PATTERN.finditer(body):
        token = m.group(1)
        raw = m.group(0)
        is_close_form = raw.startswith(LT_ESC + LT_ESC + '/') or \
                        raw.startswith(LT_ESC + LT_ESC + 'end')

        line = base_line + line_num_in(body, m.start()) - 1
        ctx = get_context(body, m.start())

        if is_close_form:
            # <</name>> / <<endname>> / <<done>>：pop 最近的同名 frame
            # <<done>> 是 <<for>> <<capture>> <<nobr>> <<silent>> <<timed>>
            #  <<widget>> <<replace>> 的 close 形式
            if not stack:
                add_error(name, passage['pid'], line, 'close-without-open',
                          f'<</{token}>> 出现但无对应 <<{token}>> 打开', ctx)
                continue
            # 找最近的同名 frame（可能中间有非严格闭包的 frame）
            idx = None
            for i in range(len(stack) - 1, -1, -1):
                if stack[i]['tag'] == token:
                    idx = i
                    break
                # <<done>> 也匹配所有 DONE_ALIASES
                if token == 'done' and stack[i]['tag'] in DONE_ALIASES:
                    idx = i
                    break
            if idx is None:
                add_error(name, passage['pid'], line, 'close-without-open',
                          f'<</{token}>> 出现但无对应 <<{token}>> 打开', ctx)
                continue
            if idx < len(stack) - 1:
                # 关闭了嵌套的外层 frame —— 报告非严格嵌套关闭
                add_error(name, passage['pid'], line, 'nested-close',
                          f'<</{token}>> 关闭了嵌套在 '
                          f'<<{stack[-1]["tag"]}>> 内的 <<{token}>> '
                          f'(<<{stack[-1]["tag"]}>> 在 {stack[-1]["open_line"]} 行打开)',
                          ctx)
            # 弹到该层（包含）
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
