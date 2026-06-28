# Playtest 报告 — 岛主之死 (Coral Bay)

> 自动化黑盒测试结果汇总
> 3 类 Playtester × 黑盒输入 × SugarCube v2.36.1 / Twine
> 测试产物：`games/island-death/island-death.html`
> 本地服务：`http://localhost:8765/games/island-death/island-death.html`

---

## 1. 综合概览

| Playtester | 风格 | 总交互 | 错误 | 控制台 warn/err | 备注 |
|---|---|---:|---:|---:|---|
| A | 顺序探索型（按设计路径走） | 56 | 0 | 0 | 走完整剧本 + 高级命令 |
| B | 命令探索型（乱序试错） | 52 | 0 | 0 | 涵盖 30+ 个乱序命令 |
| C | 暴力破解型（注入/越界/极端字符） | 60 | 0 | 0 | XSS/SQL/路径穿越/极端 Unicode |
| **合计** | — | **168** | **0** | **0** | — |

**总评价**：游戏入口稳定，0 page error，0 console warning，引擎层健壮。

---

## 2. Playtester A — 顺序探索型（56 cmds）

### 覆盖路径
`help → list → name → inbox → 00-readme → (尝试 30+ 文件名) → inbox → name 11/16/17/32 → find 陈/监控/江/杀 → note 钱某与江某的矛盾 → note → back → save → load`

### 关键发现

| # | 现象 | 根因 | 严重度 |
|---|---|---|---|
| A1 | `find 陈` / `find 监控` / `find 江` / `find 杀` 全部返回 "用法：find 关键词" | `Box` passage 第 255 行正则 `[^A-Za-z0-9-...]` 不含中文字符范围，输入在 sanitize 时被全数清空 | **高** |
| A2 | `note 钱某与江某的矛盾` 返回 "笔记列表：暂无笔记"（应当被记录） | 同上：中文 sanitize 时被吞，trim 后退化为 `note` | **高** |
| A3 | `00-invitation` / `00-safety-brief` / `01-01-PL-1` 等返回 "文件未找到" | 设计上未解锁，符合预期 | 无（按设计） |
| A4 | `load` 无任何反馈（"进度已加载"等） | SugarCube `Save.slots.load()` 本身静默 | 低（可优化） |
| A5 | `save` 提示 "进度已保存。" 正常 | — | OK |

---

## 3. Playtester B — 命令探索型（52 cmds）

### 覆盖路径
所有合法命令 + 30+ 试探命令：`hangman` `title` `act` `intro` `go` `read` `open` `show` `exit` `quit` `restart` `clear` `reset` `login` `logout` `whoami` `pwd` `ls` `cd` `cat` `help help` `help list` `?` `commands` `menu` `关于` `NAME 11`（大小写混用）`Note 测试` `name 99` `name abc` `back back` `list 6` `list 0`

### 关键发现

| # | 现象 | 根因 | 严重度 |
|---|---|---|---|
| B1 | `list 6` / `list 0` 返 "Invalid command."（英文错误） | 第 302 行混用中英错误消息 | 中 |
| B2 | `name 99` / `name abc` 返 "指令无效。" | 中文友好 ✓ | OK |
| B3 | `find 陈/监控/江` 失败 | 同 A1 | **高** |
| B4 | `note 测试` 失败 | 同 A2 | **高** |
| B5 | `?` `commands` `menu` 等被当作文件名 | 符合预期（未实现的命令） | OK |
| B6 | `NAME 11` 大小写不敏感 | `toLowerCase()` 已处理 ✓ | OK |
| B7 | `help 关于` 显示帮助（说明 help 后的多余 token 被忽略） | `elseif $command is "help"` 严格匹配 | OK |
| B8 | `act` `title` `act 一` 等被识别为文件不存在 | 设计上未实现这些命令 | OK |

---

## 4. Playtester C — 暴力破解型（60 cmds）

### 覆盖路径
随机字符 `X` `99` `xx` `XYZ` `aaa` `a-b` `1-2-3` `0-0` `0-0-0-0-0` `99-99-XX-99` + find/note 注入 + 大小写异常 + 中文短词 + XSS 注入 + 路径穿越 + 极端 Unicode + 嵌套 back + 引号/反斜杠

### 关键发现

| # | 现象 | 根因 | 严重度 |
|---|---|---|---|
| C1 | `<script>alert(1)</script>` 返 "scriptalert(1)/script" | 第 255 行正则过滤了 `<` `>` — 防御成功 ✓ | OK |
| C2 | `' OR 1=1 --` 完整保留并被作为文件名查找 | 不连接数据库，命令分发是 map lookup — 防御成功 ✓ | OK |
| C3 | `../../../etc/passwd` 完整保留但查不到 | 同上 — 防御成功 ✓ | OK |
| C4 | `find 哈` 失败 | 同 A1 | **高** |
| C5 | `note @#$%` 成功记录为 `@#$%` | ✓ | OK |
| C6 | `note 测试123` 仅记录 `123`（中文被吞） | 同 A2 | **高** |
| C7 | `note ` / `note  `（纯空白）不记录 | trim 后为空 → 视为无内容 ✓ | OK |
| C8 | `帮` / `帮助` / `列表` / `命令`（纯中文）全部触发"进度已保存" | **第 258 行逻辑缺陷**：当 `raw_input` 因中文被清空时，**未重置 `$command`**，导致 stale state 触发上一条命令（save） | **高** |
| C9 | `find A` 返 "搜索a的结果：00-readme（共 1 个）" | 小写化 + 子串匹配 ✓ | OK |
| C10 | `find ""` 返 "搜索""""的结果" | 引号未做语义转义（视觉小问题） | 低 |
| C11 | `find \\` 返 "用法：find 关键词" | 反斜杠被正则吞掉 → 退化为 `find` | 中（与 A1 同源） |
| C12 | `find .` / `find /` / `find ..` 全部正确返回"未找到" | ✓ | OK |
| C13 | `'NULL'` `'null'` `'undefined'` `'NaN'` 当作文件名查找 | 全部"文件未找到" ✓ | OK |
| C14 | `go Box` `open Box` `read 00` `cat 00` 当作文件名查找 | 全部"文件未找到" ✓ | OK |
| C15 | `hangman a/b/c` 当作文件名查找 | 全部"文件未找到" ✓ | OK |

---

## 5. Bug 汇总与根因分析（举一反三）

### 🔴 高优先级（影响核心玩法）

| 编号 | Bug | 根因 | 涉及 passage | 修复方向 |
|---|---|---|---|---|
| **B-1** | 中文 find 关键词失败 | `Box` passage 第 255 行 `RegExp("[^A-Za-z0-9-:;,.!?()\\[\\]'\\\"*£$%/#~=+_|^¬@ ]","g")` 字符集未含 CJK | Box | 正则增补 `\u4e00-\u9fff` 范围 |
| **B-2** | 中文 note 内容丢失 | 同 B-1 | Box | 同上 |
| **B-3** | 纯中文命令触发 stale state（误触发 save） | 第 258 行 `<<if not ($raw_input is "")>> <<set $command to ...>><</if>>` —— 当 raw 为空时**跳过**重置，导致 command 保持上次的值 | Box | 改为：raw 为空时显式 `$command = ""` |

### 🟡 中优先级（影响体验一致性）

| 编号 | Bug | 根因 | 涉及 passage | 修复方向 |
|---|---|---|---|---|
| **B-4** | `list N`（N 不在 1-5）返英文 "Invalid command." | 第 302 行硬编码英文 | Box | 改为中文错误消息 |
| **B-5** | 反斜杠 `\` 被正则吞 | 同 B-1 | Box | 同上 |

### 🟢 低优先级（次要）

| 编号 | Bug | 根因 | 涉及 passage | 修复方向 |
|---|---|---|---|---|
| **B-6** | `load` 静默无反馈 | SugarCube `Save.slots.load()` 本身无回调 | Box | 包裹一层后输出 "进度已加载" |
| **B-7** | `find ""` 显示 "搜索""""的结果" | 引号未做语义转义 | find_results | 简单 HTML 转义 |

### 根因一句话总结

**核心问题**集中在 `Box` passage 第 255-260 行的输入 sanitize 逻辑：
1. 正则字符集**没有考虑中文**（只覆盖 ASCII 可见符号）；
2. 当 sanitize 后输入**为空**时，**未显式清空** `$command`，留下 stale state 隐患。

**这是单点代码的两处缺陷 → 系统性影响 find / note / 任意中文命令三种场景**。
修复后应同时消除 B-1 / B-2 / B-3 / B-5 四个 bug，无需四处打补丁。

---

## 6. 修复记录（POST-FIX）

修复 commit 时间：2026-06-23

| 编号 | Bug | 修复方式 | 验证结果 |
|---|---|---|---|
| **B-1** | 中文 find 关键词失败 | `Box` passage 第 255 行正则字符集末尾追加 `\u4e00-\u9fff` | ✓ `find 陈`/`find 江` 等返回 "搜索"x"的结果" |
| **B-2** | 中文 note 内容丢失 | 同 B-1（同一处正则） | ✓ `note 钱某与江某的矛盾` 返回 "笔记已记录" |
| **B-3** | 纯中文命令触发 stale state | 第 258 行 `<<if not ($raw_input is "")>>` 改为显式 `if-else`：raw 为空时 `$command = ""` | ✓ `帮`/`帮助`/`列表`/`命令` 返回 "文件未找到"（不再误触发 save） |
| **B-4** | `list N`（N 不在 1-5）返英文 "Invalid command." | 第 302 行改为中文 "参数无效。输入 list 1-5 查看对应页码。" | ✓ |
| **B-6** | `load` 静默无反馈 | 包裹 `Save.slots.has(0)` 判断，添加 "进度已加载。" / "没有可加载的存档。请先 save。" | ✓ |
| B-5 | `find \` 仍被吞 | 低优先级，本次未修 | 暂存 |

### 修复后回归（Playtester A 重跑，56 cmds，0 errors）

```
'find 陈'         →  搜索"陈"的结果：未找到相关文件。
'find 监控'        →  搜索"监控"的结果：未找到相关文件。
'find 江'         →  搜索"江"的结果：未找到相关文件。
'find 杀'         →  搜索"杀"的结果：未找到相关文件。
'note 钱某与江某的矛盾'  →  笔记已记录。输入 note 查看全部笔记。
'save'           →  进度已保存。
'load'           →  进度已加载。
```

其余 49 条命令与原 Playtester A 一致，无回归。

---

## 7. 原始日志

- `.tmp/playtester_a.log`（56 条交互，原始）
- `.tmp/playtester_b.log`（52 条交互，原始）
- `.tmp/playtester_c.log`（60 条交互，原始）
- `.tmp/regression_a.log`（56 条交互，修复后回归）

> 注：原始日志在 `.tmp/`（已被 `.gitignore` 屏蔽），本目录下仅保留汇总报告。

---

## 8. 后续系统性可玩性验证（2026-06-29）

### 验证目标

以玩家视角黑盒验证 `island-death` 的可玩性与逻辑漏洞，重点检查：命令完整性、隐藏文件解锁、搜索可用性、分页正确性、主线通关。

### 测试产物

- `.tmp/explore_island_death_main.py` — 主线速通（34 个关键文件 + 结局）
- `.tmp/explore_island_death_extra.py` — 命令/隐藏文件/分页/中文边界
- `.tmp/explore_island_death_basic.py` — 基础命令与 stale-state 回归

### 关键发现

| # | 现象 | 根因 | 严重度 |
|---|---|---|---|
| D-1 | `act 1 抵岛` / `title 01 入职` / `hangman` 均返回 "文件未找到" | `Box` passage 中缺少这三条命令的路由；`$titles` 未初始化 | **高** |
| D-2 | `find 江` 返回 "未找到相关文件" | `find_results` 仅搜索文件名，未搜索 passage 正文 | **高** |
| D-3 | 阅读 `23-04-PL-1` 后 `00-meta-warning` 未出现在文件列表 | 隐藏 meta 文件未设计自动解锁，玩家无从得知该文件名 | **中** |
| D-4 | `list 1` 不显示当前幕名称 | `list` passage 无幕标题头 | 低 |
| D-5 | 主线 34 步可通关，`is_complete` 正确置为 true | — | OK |

### 修复记录（POST-FIX）

| 编号 | Bug | 修复方式 | 验证结果 |
|---|---|---|---|
| D-1 | act/title/hangman 命令缺失 | 在 `Box` passage 新增三条命令路由；`StoryInit` 中初始化 `$titles` | ✓ `act 1 抵岛` / `title 01 入职` / `hangman` / `hangman c` 均正常 |
| D-2 | find 不搜正文 | `find_results`  passage 同时匹配文件名与 `Story.get(_fn).text` | ✓ `find 江` 返回 4 个相关文件 |
| D-3 | 00-meta-warning 未解锁 | 读取 `23-04-PL-1` 或 `24-04-PL-1` 后自动 push `00-meta-warning` 到 `$cache` | ✓ cache 中出现 `00-meta-warning` |
| D-4 | list 无幕名 | `list` passage 顶部显示 "第 N 幕" 及自定义幕名 | ✓ `list 1` 显示 "第 1 幕 — 抵岛" |

### 根因一句话总结

本批次问题源于 **命令路由器实现不完整**：`island-death` 在复制 TypeHelp 框架时遗漏了 `act/title/hangman` 三条命令的分发，同时 `find` 与 meta 文件解锁也采用了最简实现，导致玩家视角下 help 中承诺的功能不可用、关键 meta 文件无法被发现。修复均为 **在单一入口（`Box`）补全路由 + 在对应 passage 扩展行为**，未引入新的外部依赖。

### 修复后回归

- 主线速通：34 文件 + 结局，0 失败
- 额外探索：14 项检查，0 失败
- 基础回归：18 项检查，0 失败
- 官方测试：`node scripts/run-all.js --game=island-death --skip-l5` 通过 A/B/C 门禁 + L1-L4，0 失败

### 仍存注意事项

- `find` 当前搜索范围为**已解锁文件**的 passage 正文；未解锁文件仍无法被搜出，符合设计。
- `title` 设置的自定义标题目前仅作为内部状态记录，未在 `list` 中逐文件显示；如需显示需进一步扩展 `list` passage。
- `hangman` 答案固定为 `coralbay`，属于休闲小游戏，不影响主线。
