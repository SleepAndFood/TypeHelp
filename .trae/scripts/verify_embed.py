#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
verify_embed.py

校验一个 Twine HTML 是否已成功装填 SugarCube 引擎。
对应该 5 条硬条件（全部为真才 PASS）：

  1. <script id="script-sugarcube"> 块体 > 100KB
  2. <script id="script-libraries"> 块体 > 100KB
  3. <style id="style-..."> 块至少 10 个
  4. 文件总大小 > 500KB
  5. check_twine_escape.py 报告 0 errors（可选 --skip-twine-check 跳过）

用法：
  python verify_embed.py <html_path> [--skip-twine-check] [--json]

退出码：
  0 = PASS
  1 = FAIL（任一条件不满足）
  2 = 参数错误
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHECK_TWINE = ROOT / 'scripts' / 'check_twine_escape.py'

SCRIPT_THRESHOLD = 100 * 1024   # 100KB
TOTAL_THRESHOLD = 500 * 1024    # 500KB
MIN_STYLE_BLOCKS = 10

BLOCK_RE = re.compile(
    r'<(script|style)\s+id="(?P<id>[^"]+)"[^>]*>(?P<body>.*?)</\1>',
    re.DOTALL,
)


def check(path: Path, skip_twine: bool) -> tuple[bool, list[dict]]:
    content = path.read_text(encoding='utf-8')
    size = path.stat().st_size
    blocks = {m.group('id'): (m.group(1), len(m.group('body')))
              for m in BLOCK_RE.finditer(content)}

    sugar_size = blocks.get('script-sugarcube', (None, 0))[1]
    libs_size = blocks.get('script-libraries', (None, 0))[1]
    style_blocks = sum(1 for k in blocks if k.startswith('style-'))

    results = [
        {
            'name': 'script-sugarcube > 100KB',
            'ok': sugar_size > SCRIPT_THRESHOLD,
            'detail': f'{sugar_size} bytes',
        },
        {
            'name': 'script-libraries > 100KB',
            'ok': libs_size > SCRIPT_THRESHOLD,
            'detail': f'{libs_size} bytes',
        },
        {
            'name': f'>= {MIN_STYLE_BLOCKS} style blocks',
            'ok': style_blocks >= MIN_STYLE_BLOCKS,
            'detail': f'{style_blocks} style blocks',
        },
        {
            'name': f'total size > {TOTAL_THRESHOLD // 1024}KB',
            'ok': size > TOTAL_THRESHOLD,
            'detail': f'{size} bytes',
        },
    ]

    if not skip_twine:
        if CHECK_TWINE.exists():
            cp = subprocess.run(
                [sys.executable, str(CHECK_TWINE), str(path)],
                capture_output=True, text=True, encoding='utf-8',
            )
            results.append({
                'name': 'check_twine_escape.py PASS',
                'ok': cp.returncode == 0,
                'detail': f'exit={cp.returncode}',
            })
        else:
            results.append({
                'name': 'check_twine_escape.py exists',
                'ok': False,
                'detail': f'missing: {CHECK_TWINE}',
            })

    overall = all(r['ok'] for r in results)
    return overall, results


def main():
    p = argparse.ArgumentParser(description='验证 Twine HTML 是否已装填 SugarCube 引擎')
    p.add_argument('html', help='待检查的 HTML 路径')
    p.add_argument('--skip-twine-check', action='store_true',
                   help='跳过 check_twine_escape.py 子进程调用')
    p.add_argument('--json', action='store_true', help='输出 JSON 报告')
    args = p.parse_args()

    path = Path(args.html)
    if not path.exists():
        print(f'File not found: {path}', file=sys.stderr)
        return 2

    overall, results = check(path, args.skip_twine_check)

    if args.json:
        import json
        print(json.dumps({
            'file': str(path.resolve()),
            'pass': overall,
            'checks': results,
        }, ensure_ascii=False, indent=2))
    else:
        print('=== verify-embed ===')
        print(f'File: {path}')
        print()
        for r in results:
            mark = 'PASS' if r['ok'] else 'FAIL'
            print(f'  [{mark}] {r["name"]}  ({r["detail"]})')
        print()
        print('OVERALL: ' + ('PASS' if overall else 'FAIL'))

    return 0 if overall else 1


if __name__ == '__main__':
    sys.exit(main())
