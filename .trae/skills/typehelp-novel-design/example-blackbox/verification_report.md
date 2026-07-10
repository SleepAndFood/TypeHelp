# verification_report：三性验证报告

> Formal Verifier Agent 产出

---

## 1. 唯一性验证（Uniqueness）

### 1.1 反例构造

尝试构造"另一套自洽解释"：

| 反例 | 假设 | 能否解释所有 F？ |
|---|---|---|
| **反例 A** | 设备老化导致 PLC 漂移 | ✗ F3 哈希校验通过证明是主动修改 |
| **反例 B** | 陈博士本身有心脏病 | ✗ F2 独立传感器记录血氧骤降 |
| **反例 C** | 王工程师篡改 PLC 嫁祸 | ✗ F4 02:30 门禁记录是刘博士 |
| **反例 D** | 李博士是凶手 | ✗ 李博士 03:30 才报警，无在场证据 |

**结论**：无其他自洽解释能贯穿所有 F。唯一性 ✓

### 1.2 命名约定的辨别能力

- `04-EN-1-2-4` 的 ID 列表 `[1, 2, 4]` 表明陈、刘、李都在场——与刘博士单独行动的时间表矛盾？
  - **不矛盾**：王工程师后来才加入（07:00），故 `04-EN-1-2-4` 是 04 时间段另一文件，可用 `04-EN-2-3-4` 区分
- 已通过 `tag_graph.md` 区分 ✓

## 2. 完备性验证（Completeness）

### 2.1 双证据原则

| F | 揭露文件数 | 状态 |
|---|---|---|
| F1 | 2 (03-ME, 01-CR) | ✓ |
| F2 | 2 (03-ME, 14-LA) | ✓ |
| F3 | 3 (04-EN, 09-CA, 22-AT) | ✓ |
| F4 | 2 (04-EN, 22-AT) | ✓ |
| F5 | 2 (14-LA, 22-AT) | ✓ |
| F6 | 2 (12-CO, 22-AT) | ✓ |
| F7 | 2 (22-AT, 25-WI) | ✓ |
| F8 | 2 (09-CA, 25-WI) | ✓ |
| F9 | 2 (14-LA, 22-AT) | ✓ |
| F10 | **2 (14-LA, 22-AT)** | ✓（已修补：在 14-LA-4 中补充陈博士发出听证会邀请） |

### 2.2 教程解锁链

- [x] `name` 在 02-BR 解锁
- [x] `note` 在 03-ME 解锁
- [x] `find` 在 09-CA 解锁
- [x] `title` 在 14-LA 解锁
- [x] `act` 在 22-AT 解锁
- [x] `hangman` 在 00-final-note 解锁
- [x] `help / list / back / save / inbox` 启动即解锁

### 2.3 meta 元素可达

- [x] 00-dream（须知文件名）
- [x] 00-final-note（$is_complete + message2）
- [x] 25-WI-2（22-AT 的 tag 链）

### 2.4 文件总数

**19 个**（charter 目标 24，演示规模精简 5 个，**已文档化**）
- 00 段 7 个 ✓
- 01-26 段 12 个 ✓

> 与 spec 中"推荐 95-100"的差异：本 worked example 选用较小规模以演示方法论。**完整规模需扩展到 95+**。

## 3. 可达性验证（Reachability）

### 3.1 公开文件遍历

从 00-readme 出发：
```
00-readme
  ↓
01-CR-1 (00-readme → 01-CR-1)
  ↓
02-BR-1-2-3-4-5-6 (01-CR-1 → 02-BR)
  ↓
03-ME-1-2 / 04-EN-1-2-4 (02-BR → 03-ME / 04-EN)
  ↓
05-CA-3-5 (04-EN → 05-CA)
  ↓
09-CA-1-2-3-4-5-6 (05-CA → 09-CA)
  ↓
12-CO-2 (09-CA → 12-CO)
  ↓
14-LA-4 (03-ME / 12-CO → 14-LA)
  ↓
18-LA-2-4 (14-LA → 18-LA)
  ↓
21-AT-2-5 (18-LA → 21-AT)
  ↓
22-AT-1-2-3-4-5-6 (21-AT → 22-AT)
  ↓
25-WI-2 (22-AT → 25-WI-2)
```

**所有公开文件可达** ✓

### 3.2 隐藏文件触发

- **00-dream**：无 tag 链，玩家通过 `00-references` 中暗示或 `find dream` 得知
- **00-final-note**：通过 `$is_complete` 触发 inbox 提示
- **25-WI-2**：通过 22-AT 的 tag `25-WI-2` 触发

### 3.3 死链检测

无死链 ✓

### 3.4 状态机一致性

- `$first_help / $first_list / $first_note`：一次性触发，无矛盾 ✓
- `$seen_name / $seen_note / $seen_find / $seen_title / $seen_act / $seen_hangman`：每个标志位只在一个文件中设置，无矛盾 ✓

## 4. TypeHelp 9 项硬约束专项回检

| # | 约束 | 验证证据 | 状态 |
|---|---|---|---|
| C1 | 单一文本框 | Box passage 未修改 | ✓ |
| C2 | 无 inventory | 全部证据以文件形式存在 | ✓ |
| C3 | 文件名 = 元数据 | naming_matrix.md 完整 | ✓ |
| C4 | tag 承担互引 | tag_graph.md 完整 | ✓ |
| C5 | 进度 = 收集数 | $cache_max = 17 (19-2) | ✓ |
| C6 | meta 元素存在 | 3 个隐藏文件 | ✓ |
| C7 | 教程渐进 | tutorial_design.md 6 个解锁点 | ✓ |
| C8 | 多视角多文件 | 10 个 F 每个 ≥ 2 个文件 | ✓ |
| C9 | 唯一结局 | ending_design.md 路径单一 | ✓ |

## 5. 验证结论

- **唯一性** ✓
- **完备性** ✓（F10 已修补）
- **可达性** ✓
- **9 项硬约束** 全通过

**PASS**：可进入 Task 11 (Twine 实现)

## 6. 已知限制

- 演示规模 19 个文件（vs. 完整规模 95-100）
- 无 playtest_log.md（需真实玩家测试）
- 无 hangman 完整谜题（沿用 TypeHelp 原版）

> 限制已文档化，方法论本身可扩展到完整规模。

---

## 7. 常见 SugarCube 报错排查指引

> 本章节是 [Twine Implementer 自检 4](file:///d:/WorkSpace/projects/TxtGame/.trae/specs/typehelp-novel-design/prompts/twine-implementer.md) 的人读版。Twine HTML 部署到浏览器后，SugarCube 引擎解析 `<tw-passagedata>` 体内的 Twine 宏（`<<if>>` / `<<for>>` / `<<type>>` 等）时报错。本节归纳三类最常见根因与对应定位/修复方法。

### 7.1 报错模式：`Error: cannot find a closing tag for macro <<X>>`

- **症状**：控制台抛出 `cannot find a closing tag for macro <<X>>` 后跟一段源文本。
- **位置**：SugarCube 引擎的 `Wikifier.Parser.parseBody` 函数（参考 [island-death.html:6857](file:///d:/WorkSpace/projects/TxtGame/games/island-death/island-death.html#L6857)）。
- **触发条件**：当 `<<name>>` 是 body-tag 宏（`macro.tags !== undefined`），解析器从 `w.nextMatch` 起向后搜索 `<</name>>` 或 `<<endname>>` 关闭标签，但**始终未找到**（`opened` 计数器未归零）。
- **关键观察**：错误指向的宏名 `<<X>>` **不一定是损坏宏名**。parser 在嵌套 wikify 上下文中可能把**真正损坏的宏（`<<if>>` / `<<for>>`）的关闭标签消费给外层宏**，剩下的内层 `<<type>>` body 找不到关闭就报 `<<type>>`。所以排查时**必须从报错位置往前回溯**。

### 7.2 三类根因 + 定位 + 修复

#### 根因 A：关闭标签真缺失

- **症状**：passage body 内 `<<if>>` 开了但漏写 `<</if>>`。
- **定位**：
  ```bash
  python .trae/scripts/check_twine_escape.py <your_file>.html
  # 期望输出：errors 里出现 macro-pair-mismatch，kind 显示 "<<X>> open=N close=M"
  ```
- **修复**：在漏写关闭的位置补 `<</X>>` 或 `<<endX>>`（SugarCube 两种写法都接受）。
- **预防**：在 commit 前跑 `check_twine_escape.py`（退出码非 0 时 CI 拒收）。

#### 根因 B：HTML 实体损坏（`&` 丢失）

- **症状**：`&lt;&lt;if&gt;&gt;` 变成 `lt;&lt;if&gt;&gt;`（前导 `&` 被吞）。
- **触发场景**：
  - 文本编辑器/AI 生成器把 `&` 当 HTML 实体起始符处理掉
  - Python/Java 字符串模板的 `&` 转义问题
  - 直接用 Notepad/部分 IDE 编辑 HTML 时 regex 替换误伤
- **定位**：
  ```bash
  python .trae/scripts/check_twine_escape.py <your_file>.html
  # 期望输出：errors 里出现 amp-missing-lt 或 amp-missing-gt
  ```
  或手动 grep：
  ```bash
  # 应返回 0 行；非 0 说明有 `&` 丢失
  grep -P '(?<!&)lt;<<' <your_file>.html
  ```
- **修复**：把 `lt;<<` 改回 `&lt;&lt;`，把 `gt;>>` 改回 `&gt;&gt;`。
- **预防**：Twine HTML 文件的编辑/生成流程中**禁止**任何"清洗 `&`"的操作；输出前用 `check_twine_escape.py` 校验。

#### 根因 C：嵌套宏错位

- **症状**：内层 `<<type>>` 出现在外层 `<<if>>` 体中，外层 `<<if>>` 关闭但内层 `<<type>>` 已被消费；剩下的 `<<type>>` body 找不到关闭。
- **触发场景**：
  - 模板拼装/AI 改写 passage 时破坏缩进结构
  - 复制粘贴不同 passage 内容时，闭合标签对错位置
- **定位**：
  - `check_twine_escape.py` 会报 `macro-pair-mismatch`（配对数差）
  - 但 `check_twine_escape.py` 的"配对数"是**必要不充分**条件：配平 ≠ 正确
  - 必须在浏览器开发者工具里看报错源文本（`w.source.slice(matchStart, w.nextMatch)`），从报错位置往回找
- **修复**：手动调整嵌套结构，确保内层宏完整地位于外层宏 body 内。
- **预防**：每个 passage body 的缩进必须用 IDE 格式化（推荐 4 空格），不要混用 tab/空格；commit 前人工 review 嵌套结构。

#### 根因 D：截断的 HTML 实体（`&lt;X"&gt;` / `&lt;X5&gt;`）

- **症状**：浏览器报 `Error: child tag <<elseif>> was found outside of …`（不是 `cannot find a closing tag`）—— SugarCube 把 `&lt;/now&gt;` 误识别为伪宏关闭，导致 `<<elseif>>` 上下文错位
- **触发场景**：
  - AI 生成 passage 时把字符串提前闭合：`&lt;/nowrap&gt;` → `&lt;now""&gt;`（双引号截断 + 提前闭合）
  - 字符串模板 / JavaScript 字符串里嵌入 HTML 实体时 `&` 双重转义
  - 复制粘贴含 HTML 实体 + JS 引号的混合内容
- **示例**（实测 5 处全部被 `check_twine_escape.py` 抓到）：
  ```
  原意：  <<set $acts[_act - 1] to "<nowrap>" + ... + "</nowrap>">>
  污染：  <<set $acts[_act - 1] to "<now">> + ...              ← &lt;now""&gt; 被识别为 <now">>
  ```
- **定位**：
  ```bash
  python .trae/scripts/check_twine_escape.py <your_file>.html
  # 期望输出：errors 里出现 truncated-entity
  ```
- **修复**：把 `&lt;X"&gt;` 还原成 `&lt;Y&gt;`（Y 是原本的完整标签名，如 `nowrap` / `div` / `span`）。
- **预防**：Twine Implementer 在 AI 输出 passage 后**必须**跑 `check_twine_escape.py`；发现 truncated-entity 即驳回重做，禁止绕过。

### 7.3 排查流程（按推荐顺序）

1. 跑 `python .trae/scripts/check_twine_escape.py <file>.html`
2. 若输出 0 error：问题在**嵌套结构错位**（根因 C），需要人工 review
3. 若输出 `macro-pair-mismatch`：是**根因 A**（关闭缺失），按报错补 `<</X>>`
4. 若输出 `amp-missing-lt` / `amp-missing-gt`：是**根因 B**（`&` 丢失），补 `&`
5. 若输出 `bare-macro-open`：body 内有未转义的 `<<`，将 `<<` 改为 `&lt;&lt;`
6. 若输出 `truncated-entity`：是**根因 D**（HTML 实体被双引号 / 数字截断），把 `&lt;X"&gt;` 还原成完整标签名
7. 若输出 `cjk-questionable-question` warning：中文字符旁有 `?`，可能是工具链污染，**人工确认**是否为原始内容
8. 全部 PASS 后，在浏览器里**真跑一次**游戏流（按 [checklist.md](file:///d:/WorkSpace/projects/TxtGame/.trae/specs/typehelp-novel-design/checklist.md) 补全引擎），不再抛错才算真正 PASS

### 7.4 与本 example 的关系

本 example-blackbox 当前已通过 `check_twine_escape.py` 扫描（0 error / 0 warning）。在 `TypeHelp_NewGame_embedded.html`（705KB，已装填引擎、未加任何 Story* 自定义 passage）上浏览器实测 SugarCube 解析正常，无 `cannot find a closing tag` / `<<elseif>>` 报错；左下角 ui-bar 显示引擎默认 2 项（Saves + Restart），与 `galley-villa/TypeHelp.html` 一致。

> **关于 ui-bar 的常见误解澄清**（之前曾误以为需要"加 5 个 Story* passage 覆盖硬编码"，经 Playwright 实测**错误**）：
> - `StoryTitle` passage **不能**覆盖硬编码 `<h1 id="story-title">`——引擎 `setPageElement` 列表里没有该映射（看 galley-villa 引擎 L15853：banner/subtitle/author/caption 可覆盖，title 不可），加进去也不会生效
> - `StoryCaption` / `StoryMenu` 加进去会**污染**默认 ui-bar（caption 内容被覆盖 / menu-story ul 是空）；除非确有特殊需求，否则**不要**加
> - 引擎默认 menu-core 注入 4 项：saves / settings / restart / share；没有 `Setting` passage 自动移除 settings、没有 `StoryShare` passage 自动移除 share——所以正常只显示 2 项（Saves + Restart），**这与 galley-villa 一致**，是 SugarCube 默认行为
> - 工具链污染（中文 → `?`）的根因不在本计划范围；如需彻底解决需在 `twine-implementer` 的 prompt 中明确要求"输出前对 body 做 HTML 实体完整性断言"，作为前置防御。

---

## 8. 引擎装填工作流（自动）

> 本章节是 §7 的**前置**防线：与其等用户复制引擎时引入 `&` 丢失或缩进错位再排查，不如**让 Twine Implementer 在产出时自动装填引擎**，从根因上消除"双击 HTML 只看到裸 ui-bar"。

### 8.1 工作流

```
Twine Implementer 生成 TypeHelp_NewGame.html（44KB placeholder）
        ↓
自动调用 embed_sugarcube_engine.py
        ↓
产出 TypeHelp_NewGame_embedded.html（704KB 自包含可双击运行）
        ↓
自动调用 verify_embed.py 做 5/5 校验
        ↓
不通过则驳回上游，通过则复制到 games/<name>/<name>.html（仓内可玩产物）
        ↓
交付 Playtester
```

> **重要**：`.trae/specs/.../TypeHelp_NewGame_embedded.html` 是**开发期中间产物**（`.trae/` 被 `.gitignore` 屏蔽，不入仓），真正的可玩文件必须 `cp` 到 `games/<game-codename>/<game-codename>.html`（仓内追踪，可玩文件）。缺失这步会**让用户跑到的还是旧版**，与 example-blackbox / `galley-villa` / `island-death` 的真实仓库结构脱节。

### 8.2 工具脚本

| 脚本 | 职责 | 调用时机 |
|---|---|---|
| `.trae/scripts/embed_sugarcube_engine.py` | 从参考 TypeHelp.html 抽 14 个引擎块（2 script + 12 style），注入目标 HTML | Twine Implementer 产出后立即调用 |
| `.trae/scripts/verify_embed.py` | 校验目标 HTML 已装填引擎：5 条硬条件（script-sugarcube > 100KB / script-libraries > 100KB / ≥10 style 块 / 总大小 > 500KB / twine 实体完整性） | 装填后立即调用 |
| `.trae/scripts/check_twine_escape.py` | Twine 实体完整性专项扫描（防止 `cannot find a closing tag`） | `verify_embed.py` 内部调用 |

### 8.3 调用模板

```bash
# Step 1: 装填引擎
python .trae/scripts/embed_sugarcube_engine.py \
    --reference games/galley-villa/TypeHelp.html \
    --target TypeHelp_NewGame.html \
    --out TypeHelp_NewGame_embedded.html

# Step 2: 校验（必须返回 0）
python .trae/scripts/verify_embed.py TypeHelp_NewGame_embedded.html

# Step 3: 复制到 games/ 仓内可玩产物（关键！缺这步用户跑的还是旧版）
cp TypeHelp_NewGame_embedded.html ../games/<game-codename>/<game-codename>.html
```

### 8.4 本次实测结果

```
=== embed-sugarcube-engine ===
Replaced placeholders: 2
Inserted new blocks:   11
Skipped (already real): 1
Total engine blocks:   14
Output size:           704873 bytes

=== verify-embed ===
[PASS] script-sugarcube > 100KB  (440853 bytes)
[PASS] script-libraries > 100KB  (193225 bytes)
[PASS] >= 10 style blocks  (12 style blocks)
[PASS] total size > 500KB  (723468 bytes)
[PASS] check_twine_escape.py PASS  (exit=0)
OVERALL: PASS
```

### 8.5 与本项目的关联

- `twine-implementer.md` 的「约束 2」与「自检 5」已纳入此工作流
- `checklist.md` L.8 已从"待用户手工复制"改为"自动装填"
- `SKILL.md` 9 阶段流程表 Twine Implementer 行已注明「自包含可双击运行」
- 下次用本 skill 启动新项目时，Twine Implementer 会自动调用上述脚本，**不再需要用户手工复制引擎**

---

## 9. 诊断陷阱（来自 worked example 实测）

> 本节是**反面教材**——列出在 worked example 实施过程中**真实犯过**的诊断错误，作为下次诊断的方法论警示。

### 9.1 症状导向误诊（最致命）

**事件还原**：用户报"左下角 save/restart 显示不太对" + "有 `<<elseif>>` 报错 2026/6/22 22:39:49"

**错误反应**（直接臆想修复方案）：
- "硬编码 `Type Help` 需要用 `StoryTitle` passage 覆盖" → 加了无效
- "默认 ui-bar 是 4 项需要用 `StoryMenu` 覆盖成 2 项" → 加了反而破坏
- "`<<elseif>>` 报错是 `&lt;now""&gt;` 截断导致" → 修了这处但**没复现**用户报错

**实际真相**（Playwright 实测）：
- `games/island-death/island-death.html` Playwright 启动 `pageerror=0 / console.error=0`，**没有任何报错**——用户报的是历史版本/浏览器缓存
- 引擎默认 2 项 Saves/Restart 是 SugarCube 默认行为，**galley-villa 自身也只有 2 项**——不是 bug
- 我臆想的"加 5 个 Story* passage 覆盖"是**错误修复**，必须撤销

**方法论教训**：
1. **症状必须先用 Playwright 复现**——没复现 = 不存在 = 0 改动
2. **参考实现必须先对比**——galley-villa 怎么做的？它没修也工作吗？
3. **修复方案必须先实测证明有效**——不能凭直觉就改源
4. **"修复"的方向可能完全错了**——症状是真实的，但根因诊断错了，导致修复无效甚至有害

### 9.2 静态分析必要不充分

**事件还原**：`check_twine_escape.py` 报 0 errors + `verify_embed.py` 5/5 PASS → 以为"游戏可玩"

**真相**：0 errors 只代表"5 类已知的 HTML 实体污染都不存在"，**不代表**引擎不报其他错（wikifier 嵌套错位、JS 运行时错误、L10n 异常、ui-bar 渲染异常等）

**实测反例**：worked example「黑匣子」装填后静态分析全 PASS，但 Playwright 实测发现：
- 0 errors ✓
- 但 ui-bar 显示**只有 2 项**（用户误以为"显示不太对"）—— 实际是默认行为
- `#story-title` 仍是硬编码 `Type Help`（因为 `StoryTitle` passage 不能覆盖）

**方法论教训**：
- 静态分析 PASS = 必要不充分
- **充分条件** = Playwright 启动 + 0 pageerror / 0 console.error + 关键 UI 元素渲染正常
- 没有 Playwright 实测的"完成" = 假完成

### 9.3 流程链断裂（仓内 vs 仓外）

**事件还原**：在 `.trae/specs/.../TypeHelp_NewGame_embedded.html` 修得完美，但**没复制到** `games/<name>/<name>.html`

**真相**：
- `.trae/` 被 `.gitignore` 屏蔽 → **仓内可玩产物是 `games/<name>/<name>.html`**
- `.trae/specs/.../TypeHelp_NewGame_embedded.html` 是**开发期中间产物**（不入仓）
- `embed_sugarcube_engine.py` 只负责"装填引擎"，**不**负责"分发到 `games/`"

**方法论教训**：
- 完整流程：**生成源 → 装填引擎 → 校验 → 复制到 `games/<name>/<name>.html` → 在 `games/` 上 Playwright 实测**
- 任何修复**只在** `.trae/` 内部做（不入仓）= 任务**没完成**
- `embed_sugarcube_engine.py` 的 `--out` 参数**默认覆盖源文件**，没有 `--out-games` 之类的"分发"参数——这是工具设计缺陷，应在工具链加 `cp_to_games.py` 显式最后一步

### 9.4 文档自指污染

**事件还原**：错误知识"加 5 个 Story* passage 覆盖 ui-bar 硬编码"被写进 `verification_report.md` 错误根因段 + 错误速查表 + `twine-implementer.md` → 下次 Twine Implementer 引用时**自动采用错误修复**

**根因**：
- 文档之间互相引用（`twine-implementer.md` 引 `verification_report.md`，`SKILL.md` 引两者）—— 引用是好事
- **但**错误文档的引用链让错误知识**比正确知识传播更广**：错误是"确定的、看起来合理的"，正确是"沉默的、不显眼的"
- 错误结论被 Playwright 推翻后**没立即更新文档**——文档成为"错误知识化石"

**方法论教训**：
1. 任何修复方案写进文档**前**，必须 Playwright 实测证明它有效
2. 实测推翻结论时，**立即**更新文档（包括错误段落、修正为"反例"+"实测结果"）
3. 文档之间引用时，**必须**验证被引用文档的当前内容（不是初始内容）
4. 错误速查表里的"修复"列**必须**是经过实测验证的方案，不是"看起来对"的方案

### 9.5 引擎知识盲区（4 个常见误解）

| 误解 | 真相 | 证据 |
|---|---|---|
| `StoryTitle` passage 可以覆盖 `<h1 id="story-title">` | **不能**。引擎 `setPageElement` 列表里**没有** `story-title → StoryTitle` 映射 | galley-villa 引擎 L15853：banner/subtitle/author/caption 可覆盖，title 不可 |
| `StoryCaption` passage 是无害的 caption 覆盖 | **会污染**默认 caption 元素，丢掉项目自己设计的 caption | 加后 `<div id="story-caption">` 显示"按 F12..."而不是项目设计的"返回 Box" |
| `StoryMenu` 可以塞纯文本"存档\n重新开始" | **不行**。`StoryMenu` 必须用 `<li>` 元素，纯文本导致 `<ul id="menu-story">` 是空 ul | Playwright 实测：`#menu-story li count: 0` |
| 引擎默认 4 项菜单 = Saves/Settings/Restart/Share | **默认 2 项**。`Setting.isEmpty() → 移除 settings`，`Story.has("StoryShare")` 失败 → 移除 share | galley-villa 引擎 L15947-15966；galley 自身也只有 2 项 |

**方法论教训**：涉及 ui-bar 任何修改前，**先读 galley-villa 引擎代码对应段**（`setPageElement` L15853 / ui-bar HTML 注入 L15881-15886 / menu 项可见性逻辑 L15947-15966），**不**凭 SugarCube 文档脑补。

### 9.6 一次性诊断（不复现就下结论）

**事件还原**：用户报"有 `<<elseif>>` 报错" → 立即在源文件 grep `&lt;now""&gt;` → 找到 5 处 → 修复 → 报告完成

**真相**：
- grep 找到的 5 处是**我之前对话中自己写的**污染（AI 生成 passage 时的截断）
- 用户的 `games/island-death/island-death.html`（仓内可玩产物）**早就不含这 5 处截断**——之前的 commit 已经修了
- 修复的是**已修复的文件**——无用功

**方法论教训**：
1. 诊断前**先确认用户实际跑的文件**——不是 grep 自己环境里的源文件
2. 诊断前**先复现**——Playwright 启动 + pageerror 监听
3. 诊断前**先看 git log**——这文件最近改过吗？改了什么？哪个 commit？
4. **不要**把"我修了我自己造的 bug"当作"我修了用户的 bug"

---

## 10. 总结：方法论更新清单

> 本 worked example 实测后，以下方法论内容已更新：

| 文档 | 新增/更新内容 |
|---|---|
| `SKILL.md` | §8「经验教训与反模式」5 小节（症状导向 / 静态分析必要不充分 / 流程链断裂 / 文档自指污染 / 引擎知识盲区）|
| `twine-implementer.md` | 「易错陷阱」5 陷阱（Story* 误解 / 截断实体 / 流程链 / 静态分析必要不充分 / 未实测先修）|
| `verification_report.md` | §9「诊断陷阱」6 小节（本节），§7.4 + §8.1 流程图加 Step 3 `cp` 节点 |
| `checklist.md` | §M「诊断与发布门禁」（Playwright 实测 + cp 到 games/ 强制门禁）|

**核心方法论升级**：
- ❌ 旧："静态分析 PASS = 完成"
- ✅ 新："Playwright 实测 + 关键 UI 元素渲染正常 = 完成"（静态分析是必要不充分）

- ❌ 旧："Twine Implementer 产出 `TypeHelp_NewGame.html`"
- ✅ 新："Twine Implementer 产出 `games/<name>/<name>.html`（仓内可玩产物）"

- ❌ 旧："加 Story* passage 覆盖 ui-bar 硬编码"
- ✅ 新："**不要**加自定义 Story* passage；改 L10n 字符串 / 加 `Setting` / `StoryShare` passage 控制 ui-bar"
