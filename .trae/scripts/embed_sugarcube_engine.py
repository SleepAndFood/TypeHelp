#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
embed_sugarcube_engine.py

把 SugarCube 引擎从参考 HTML 抽出来，注入目标 HTML，生成可双击运行的自包含 Twine 游戏。

解决的问题：
  worked example 生成的 TypeHelp_NewGame.html 是 44KB 的 placeholder，
  <script id="script-sugarcube"> 块只有 console.log。用户在浏览器打开时
  看到的是原始 HTML（ui-bar、tw-storydata 全暴露），无法运行游戏。
  本脚本把原 TypeHelp.html（902KB）的 engine + styles 注入到新 HTML，
  让"生成 = 可运行"成为一步到位的操作。

用法：
  python embed_sugarcube_engine.py \
      --reference <TypeHelp.html path> \
      --target <目标 HTML path> \
      [--out <输出 HTML path>]

参数：
  --reference   必填。完整可运行的 TypeHelp/SugarCube 参考 HTML（提供引擎源）
  --target      必填。只含 <tw-storydata> 但没有引擎的目标 HTML
  --out         可选。默认覆盖 --target；指定则写到新文件

退出码：
  0 = 成功嵌入
  1 = 错误（参考/目标文件问题、引擎块未找到等）
  2 = 参数错误

被抽出的块（按需）：
  - <script id="script-libraries">      SugarCube 第三方库
  - <script id="script-sugarcube">       SugarCube 引擎主体
  - <style id="style-normalize">         normalize.css
  - <style id="style-init-screen">       加载动画
  - <style id="style-font">              字体
  - <style id="style-core">              核心样式
  - <style id="style-core-display">      显示层
  - <style id="style-core-passage">      passage 容器
  - <style id="style-core-macro">        宏样式
  - <style id="style-ui-dialog">         对话框
  - <style id="style-ui">                UI bar
  - <style id="style-ui-debug">          调试栏
  - <style id="style-aria-outlines">     可访问性
  - <style id="style-story">             用户故事自定义样式

抽出策略：
  - 若目标 HTML 中存在某个 id 的占位块（含 id 标记但内容为 placeholder），
    用参考的完整块替换之
  - 若目标 HTML 中没有任何引擎块（直接是 <tw-storydata>...），
    在 <head> 内插入全部参考的引擎块
  - 参考文件中所有匹配的 id 必须全部抽取，否则报错
"""

import argparse
import re
import sys
from pathlib import Path

# SugarCube 引擎需要注入的块（id -> 块类型）
ENGINE_BLOCKS = {
    'script-libraries': 'script',
    'script-sugarcube': 'script',
    'style-normalize': 'style',
    'style-init-screen': 'style',
    'style-font': 'style',
    'style-core': 'style',
    'style-core-display': 'style',
    'style-core-passage': 'style',
    'style-core-macro': 'style',
    'style-ui-dialog': 'style',
    'style-ui': 'style',
    'style-ui-debug': 'style',
    'style-aria-outlines': 'style',
    'style-story': 'style',
}

# 目标文件中 placeholder 块的特征：script 块只有 1-3 行注释
PLACEHOLDER_HEURISTIC = re.compile(
    r'<(script|style)\s+id="(?P<id>[^"]+)"[^>]*>'
    r'(?P<body>.*?)'
    r'</\1>',
    re.DOTALL,
)


def extract_block(content: str, block_id: str, tag: str) -> str:
    """从 content 中抽取 <tag id="block_id" ...>...</tag> 完整字符串。"""
    pattern = re.compile(
        r'<' + tag + r'\s+id="' + re.escape(block_id) + r'"[^>]*>.*?</' + tag + r'>',
        re.DOTALL,
    )
    m = pattern.search(content)
    if not m:
        raise ValueError(
            f'Reference HTML missing <{tag} id="{block_id}"> block. '
            f'引擎参考文件可能不是完整 TypeHelp/SugarCube 格式。'
        )
    return m.group(0)


def is_placeholder(block: str) -> bool:
    """判断一个块是否为 placeholder（agent 生成的占位注释）。"""
    # 抽取 body
    m = re.match(r'<(?:script|style)\s+id="[^"]+"[^>]*>(.*?)</(?:script|style)>',
                 block, re.DOTALL)
    if not m:
        return False
    body = m.group(1).strip()
    if not body:
        return True
    # 全部内容都是注释 → placeholder
    non_comment = re.sub(r'/\*.*?\*/|//[^\n]*', '', body, flags=re.DOTALL).strip()
    if not non_comment:
        return True
    # 含有 placeholder 关键字
    keywords = ('placeholder', 'Inline Engine Reference',
                'engine code would be embedded')
    if any(k in body for k in keywords):
        return True
    return False


def replace_or_insert_block(target: str, block_id: str, tag: str,
                            new_block: str) -> str:
    """如果 target 中有该 id 的块（含 placeholder），替换；否则插入到 <head>。"""
    pattern = re.compile(
        r'<' + tag + r'\s+id="' + re.escape(block_id) + r'"[^>]*>.*?</' + tag + r'>',
        re.DOTALL,
    )
    if pattern.search(target):
        # 用 lambda 避免 backreference 解析（新块里可能含 \s 等）
        return pattern.sub(lambda _m: new_block, target, count=1)
    # 插入到 <head> 的末尾
    head_end = re.search(r'</head>', target, re.IGNORECASE)
    if not head_end:
        raise ValueError('Target HTML has no </head> tag.')
    return target[:head_end.start()] + new_block + '\n' + target[head_end.start():]


def main():
    parser = argparse.ArgumentParser(
        description='把 SugarCube 引擎从参考 HTML 注入目标 HTML，生成自包含可运行游戏')
    parser.add_argument('--reference', required=True,
                        help='完整可运行的 TypeHelp/SugarCube 参考 HTML 路径')
    parser.add_argument('--target', required=True,
                        help='只含 <tw-storydata> 但没引擎的目标 HTML 路径')
    parser.add_argument('--out', help='输出 HTML 路径（默认覆盖 --target）')
    parser.add_argument('--json', action='store_true', help='输出 JSON 报告')
    args = parser.parse_args()

    ref_path = Path(args.reference)
    tgt_path = Path(args.target)
    out_path = Path(args.out) if args.out else tgt_path

    if not ref_path.exists():
        print(f'Reference file not found: {ref_path}', file=sys.stderr)
        return 2
    if not tgt_path.exists():
        print(f'Target file not found: {tgt_path}', file=sys.stderr)
        return 2

    ref_content = ref_path.read_text(encoding='utf-8')
    tgt_content = tgt_path.read_text(encoding='utf-8')

    # 1. 抽取参考文件中的所有引擎块
    extracted = {}
    for block_id, tag in ENGINE_BLOCKS.items():
        try:
            extracted[block_id] = extract_block(ref_content, block_id, tag)
        except ValueError as e:
            print(f'ERROR: {e}', file=sys.stderr)
            return 1

    # 2. 替换 / 注入到目标文件
    result = tgt_content
    replaced = 0
    inserted = 0
    skipped = 0
    log = []
    for block_id, new_block in extracted.items():
        # 检查目标文件是否已有此 id 的块
        tag = ENGINE_BLOCKS[block_id]
        pattern = re.compile(
            r'<' + tag + r'\s+id="' + re.escape(block_id) + r'"[^>]*>.*?</' + tag + r'>',
            re.DOTALL,
        )
        m = pattern.search(result)
        if m:
            old_block = m.group(0)
            if is_placeholder(old_block):
                # 用 lambda 避免 backreference 解析
                result = pattern.sub(lambda _m: new_block, result, count=1)
                replaced += 1
                log.append(f'  REPLACE placeholder {tag}#{block_id} '
                           f'({len(old_block)} -> {len(new_block)} chars)')
            else:
                # 已有真实块（之前已嵌入过），跳过避免覆盖用户修改
                skipped += 1
                log.append(f'  SKIP existing {tag}#{block_id} '
                           f'({len(old_block)} chars) - already embedded')
        else:
            # 插入到 <head> 末尾
            result = replace_or_insert_block(result, block_id, tag, new_block)
            inserted += 1
            log.append(f'  INSERT {tag}#{block_id} ({len(new_block)} chars)')

    # 3. 写入输出
    out_path.write_text(result, encoding='utf-8')

    # 4. 报告
    if args.json:
        import json
        print(json.dumps({
            'reference': str(ref_path.resolve()),
            'target': str(tgt_path.resolve()),
            'out': str(out_path.resolve()),
            'replaced': replaced,
            'inserted': inserted,
            'skipped': skipped,
            'total_blocks': len(extracted),
            'output_size': len(result),
            'log': log,
        }, ensure_ascii=False, indent=2))
    else:
        print('=== embed-sugarcube-engine ===')
        print(f'Reference: {ref_path}')
        print(f'Target:    {tgt_path}')
        print(f'Output:    {out_path}')
        print()
        print(f'Replaced placeholders: {replaced}')
        print(f'Inserted new blocks:   {inserted}')
        print(f'Skipped (already real): {skipped}')
        print(f'Total engine blocks:   {len(extracted)}')
        print(f'Output size:           {len(result)} bytes')
        print()
        for line in log:
            print(line)

    return 0


if __name__ == '__main__':
    sys.exit(main())
