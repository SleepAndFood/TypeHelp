"""
scripts/verify-index.py

端到端验证 index.html：
  1. 正常加载 → 3 个剧本卡片，2 可玩，1 disabled
  2. XSS fixture（注入 games.json 含 <script>）→ 不触发弹窗 / onerror
  3. fetch 失败（删除 games.json）→ FALLBACK_GAMES 渲染成功
  4. console.error / pageerror 监听全程干净

通过 with_server.py 启动 npx serve，with_server 负责服务生命周期管理。
本脚本只负责：构造 fixture + Playwright 断言。
"""

import json
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 4321
URL = f"http://localhost:{PORT}/index.html"
GAMES_JSON = ROOT / "games.json"
GAMES_JSON_BAK = ROOT / "games.json.bak"
ARTIFACTS = ROOT / "test-results" / "verify-index"
ARTIFACTS.mkdir(parents=True, exist_ok=True)

# 恶意 fixture：title 含 <script>，description 含 onerror，htmlFile 含 javascript: 和 ../
XSS_PAYLOAD = {
    "generatedAt": "2026-07-05T00:00:00.000Z",
    "games": [
        {
            "codename": "xss-game",
            "title": "<script>window.__xssTitle=true;alert(1)</script>",
            "subtitle": "<img src=x onerror=window.__xssSubtitle=true>",
            "genre": "<b>genre</b>",
            "status": "状态<b>XSS</b>",
            "description": "\"><img src=x onerror=window.__xssDesc=true>",
            "htmlFile": "javascript:window.__xssHref=true",
        },
        {
            "codename": "traversal",
            "title": "目录遍历",
            "subtitle": "test",
            "genre": "x",
            "status": "x",
            "description": "x",
            "htmlFile": "../../../etc/passwd.html",
        },
    ],
}


def collect_logs(page):
    page._page_errors = []
    page._console_errors = []

    def on_pageerror(err):
        page._page_errors.append(str(err))

    def on_console(msg):
        if msg.type == "error":
            page._console_errors.append(msg.text)

    page.on("pageerror", on_pageerror)
    page.on("console", on_console)


def assert_no_pageerrors(page, label):
    if page._page_errors:
        print(f"  [FAIL] {label}：检测到未捕获 JS 异常 {len(page._page_errors)} 条：")
        for msg in page._page_errors:
            print(f"    - {msg}")
        sys.exit(1)
    print(f"  [OK] {label}：未触发未捕获异常")


def filter_expected_console_errors(errors, expected_substrings):
    """过滤掉预期内会出现的 console.error（例如 fetch 失败时浏览器自动记录 + 我们主动 console.error）。"""
    return [
        e for e in errors
        if not any(sub in e for sub in expected_substrings)
    ]


def assert_only_expected_console_errors(page, label, expected_substrings):
    unexpected = filter_expected_console_errors(page._console_errors, expected_substrings)
    if unexpected:
        print(f"  [FAIL] {label}：意外 console.error {len(unexpected)} 条：")
        for msg in unexpected:
            print(f"    - {msg}")
        sys.exit(1)
    print(f"  [OK] {label}：console.error 仅含预期项（{len(page._console_errors) - len(unexpected)} 条被忽略）")


def assert_no_xss_flags(page, label):
    for flag in ("__xssTitle", "__xssSubtitle", "__xssDesc", "__xssHref"):
        v = page.evaluate(f"() => window.{flag} === true")
        if v:
            print(f"  [FAIL] {label}：XSS 标志 window.{flag} 被触发！")
            sys.exit(1)
    print(f"  [OK] {label}：未触发 XSS")


def scenario_normal_load(browser):
    print("\n[场景 1] 正常加载真实 games.json")
    page = browser.new_page()
    collect_logs(page)
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    page.wait_for_function(
        "() => document.getElementById('stats') && /\\d+ 个剧本/.test(document.getElementById('stats').textContent)",
        timeout=5000,
    )

    cards = page.locator("article.card").all()
    assert len(cards) == 3, f"期望 3 张卡片，实际 {len(cards)}"
    print(f"  [OK] 渲染 {len(cards)} 张卡片")

    disabled = page.locator("article.card.disabled").all()
    assert len(disabled) == 1, f"期望 1 张 disabled，实际 {len(disabled)}"
    print(f"  [OK] {len(disabled)} 张 disabled 卡片")

    title_texts = [c.locator("h2").inner_text() for c in cards]
    assert "嘉利别墅" in title_texts
    assert "岛主之死" in title_texts
    assert "沈家山庄事件" in title_texts
    print(f"  [OK] 标题含全部 3 个剧本")

    stats = page.locator("#stats").inner_text()
    assert "3 个剧本" in stats, f"stats 文字异常：{stats}"
    assert "2 个可玩" in stats, f"stats 文字异常：{stats}"
    print(f"  [OK] stats: {stats}")

    galley = page.locator('article.card[data-codename="galley-villa"] a.launch')
    href = galley.get_attribute("href")
    assert href == "games/galley-villa/TypeHelp.html", f"嘉利别墅链接错：{href}"
    print(f"  [OK] 嘉利别墅 → {href}")

    terminal = page.locator('article.card[data-codename="terminal-mystery"] a.launch')
    href_t = terminal.get_attribute("href")
    assert href_t == "games/terminal-mystery/README.md", f"沈家山庄链接错：{href_t}"
    print(f"  [OK] 沈家山庄 → {href_t}")

    page.screenshot(path=str(ARTIFACTS / "01-normal.png"), full_page=True)
    print(f"  [OK] 截图 → 01-normal.png")

    assert_no_pageerrors(page, "场景 1")
    if page._console_errors:
        print(f"  [FAIL] 场景 1：预期外 console.error {len(page._console_errors)} 条：")
        for msg in page._console_errors:
            print(f"    - {msg}")
        sys.exit(1)
    print(f"  [OK] 场景 1：console.error 0 条")
    page.close()


def scenario_xss_fixture(browser):
    print("\n[场景 2] XSS 注入 fixture")
    if GAMES_JSON_BAK.exists():
        print("  [SKIP] 备份文件已存在（上一轮没还原），手动删除 games.json.bak 后重跑")
        sys.exit(1)

    shutil.copy2(GAMES_JSON, GAMES_JSON_BAK)
    try:
        GAMES_JSON.write_text(json.dumps(XSS_PAYLOAD, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  [OK] 已写入恶意 games.json")

        page = browser.new_page()
        collect_logs(page)
        page.goto(URL)
        page.wait_for_load_state("networkidle")
        page.wait_for_function(
            "() => document.getElementById('stats') && /\\d+ 个剧本/.test(document.getElementById('stats').textContent)",
            timeout=5000,
        )

        assert_no_xss_flags(page, "场景 2")

        grid_html = page.locator("#games-grid").inner_html()
        assert "<script>window.__xssTitle" not in grid_html, "<script> 标签未转义！"
        assert "&lt;script&gt;window.__xssTitle" in grid_html, "<script> 标签未按预期转义"
        print("  [OK] <script> 已被转义为 &lt;script&gt;")

        # onerror 字符串可以出现（无害），但不能成为 HTML 属性
        onerror_attrs = re.findall(r'<[^>]*\sonerror=', grid_html)
        assert not onerror_attrs, f"onerror 成为 HTML 属性！{onerror_attrs}"
        print("  [OK] onerror 字符串未成为 HTML 属性")

        # xss-game 的 javascript: URL 应被清洗 → 走 README + disabled
        xss_card = page.locator('article.card[data-codename="xss-game"]')
        assert xss_card.count() == 1, "xss-game 卡片未渲染"
        cls = xss_card.get_attribute("class")
        assert "disabled" in cls, f"xss-game（javascript: URL）应被识别为 disabled，实际 class={cls}"
        link = xss_card.locator("a.launch")
        href = link.get_attribute("href")
        assert "javascript" not in href.lower(), f"href 含 javascript！{href}"
        assert href == "games/xss-game/README.md", f"xss-game 应走 README，实际 {href}"
        print(f"  [OK] xss-game 链接已清洗为 {href}（class 含 disabled）")

        # ../ 也应被清洗
        trav = page.locator('article.card[data-codename="traversal"]')
        assert trav.count() == 1
        trav_cls = trav.get_attribute("class")
        assert "disabled" in trav_cls, "traversal 未被识别为 disabled"
        trav_href = trav.locator("a.launch").get_attribute("href")
        assert "../" not in trav_href, f"traversal href 含 ../! {trav_href}"
        print(f"  [OK] traversal 链接已清洗为 {trav_href}")

        stats = page.locator("#stats").inner_text()
        assert "0 个可玩" in stats, f"全部被清洗后应 0 个可玩，stats={stats}"
        print(f"  [OK] stats: {stats}")

        page.screenshot(path=str(ARTIFACTS / "02-xss.png"), full_page=True)
        assert_no_pageerrors(page, "场景 2")
        if page._console_errors:
            print(f"  [FAIL] 场景 2：预期外 console.error {len(page._console_errors)} 条：")
            for msg in page._console_errors:
                print(f"    - {msg}")
            sys.exit(1)
        print(f"  [OK] 场景 2：console.error 0 条")
        page.close()
    finally:
        if GAMES_JSON_BAK.exists():
            shutil.move(str(GAMES_JSON_BAK), str(GAMES_JSON))
            print(f"  [OK] 已还原 games.json")


def scenario_fetch_failure(browser):
    print("\n[场景 3] fetch 失败 → FALLBACK_GAMES")
    if GAMES_JSON_BAK.exists():
        print("  [SKIP] 备份文件已存在")
        sys.exit(1)

    GAMES_JSON.rename(GAMES_JSON_BAK)
    try:
        page = browser.new_page()
        collect_logs(page)
        page.goto(URL)
        page.wait_for_load_state("networkidle")
        # 等待 fallback 渲染：error 警告条出现
        page.wait_for_function(
            "() => document.querySelector('.error') !== null",
            timeout=5000,
        )

        err = page.locator(".error").inner_text()
        assert "[WARN]" in err, f"error 文字异常：{err}"
        assert "无法加载 games.json" in err
        print(f"  [OK] 警告条：{err.split(chr(10))[0]}")

        cards = page.locator("article.card").all()
        assert len(cards) == 3, f"期望 3 张 fallback，实际 {len(cards)}"
        print(f"  [OK] fallback 渲染 {len(cards)} 张卡片")

        title_texts = [c.locator("h2").inner_text() for c in cards]
        assert "嘉利别墅" in title_texts
        assert "岛主之死" in title_texts
        assert "沈家山庄事件" in title_texts

        stats = page.locator("#stats").inner_text()
        assert "备用" in stats, f"stats 文字异常：{stats}"
        print(f"  [OK] stats: {stats}")

        page.screenshot(path=str(ARTIFACTS / "03-fallback.png"), full_page=True)
        assert_no_pageerrors(page, "场景 3")
        # 场景 3 预期会出现 2 条 console.error：
        #   1) 浏览器自动记录 "Failed to load resource: ... 404"
        #   2) 我们主动 console.error("加载 games.json 失败：...", err)
        # 这两条都是"预期内的失败信号"，不视为 bug。
        assert_only_expected_console_errors(
            page, "场景 3",
            expected_substrings=["Failed to load resource", "加载 games.json 失败"],
        )
        page.close()
    finally:
        if not GAMES_JSON.exists() and GAMES_JSON_BAK.exists():
            GAMES_JSON_BAK.rename(GAMES_JSON)
            print(f"  [OK] 已还原 games.json")


def wait_for_server(url, timeout=20):
    import urllib.request
    import urllib.error
    start = time.time()
    while time.time() - start < timeout:
        try:
            urllib.request.urlopen(url, timeout=2)
            return True
        except urllib.error.URLError:
            time.sleep(0.3)
    return False


def main():
    # 内嵌启动 python -m http.server（轻量、跨平台、不需要 npm install）
    print(f"[setup] 启动 python -m http.server on :{PORT}")
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )
    try:
        if not wait_for_server(f"http://127.0.0.1:{PORT}/", timeout=20):
            print("[FAIL] 静态服务启动超时")
            sys.exit(1)
        print(f"[setup] 服务就绪: {URL}")

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                scenario_normal_load(browser)
                scenario_xss_fixture(browser)
                scenario_fetch_failure(browser)
            finally:
                browser.close()
        print("\n[DONE] 全部场景通过")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    main()
