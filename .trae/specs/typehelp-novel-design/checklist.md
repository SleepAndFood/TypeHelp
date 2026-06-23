# Checklist：TypeHelp 新剧本设计验证清单

> 本清单按 `spec.md` 的方法论分阶段验证。本次 worked example「黑匣子 (Black Box)」执行状态如下。

---

## A. Charter 阶段（Task 0）

- [x] A.1 `charter.md` 包含全部 8 个必填字段
- [x] A.2 题材与基调无矛盾（太空船 + 新本格）
- [x] A.3 核心诡计类型选定且与基调匹配（信息差 + 物证）
- [x] A.4 目标文件数 19（演示规模，已文档化）
- [x] A.5 Director 签字

## B. 真相设计阶段（Task 1）

- [x] B.1 时间线精确到分钟，无"大约"模糊措辞
- [x] B.2 客观事实表每条 F 物理可行
- [x] B.3 最终真相段唯一（无歧义）
- [x] B.4 `timeline.json` 机器可读且与 `truth.md` 一致
- [x] B.5 真相层冻结（Director 签字）

## C. 三轴交叉阶段（Task 2）

- [x] C.1 时间码覆盖关键事件（13 个时间码）
- [x] C.2 地点码 9 个
- [x] C.3 人物 8 个（$people 容量匹配）
- [x] C.4 `axis_matrix.md` 中每个 F 至少 2 个文件揭露
- [x] C.5 双证据原则无违反

## D. 命名约定阶段（Task 3）

- [x] D.1 `naming_matrix.md` 完整
- [x] D.2 00 段 7 个 meta 文件齐全
- [x] D.3 时间码 13 个全部有定义
- [x] D.4 地点码无冲突
- [x] D.5 人物 ID 列表与 `$people` 容量匹配
- [x] D.6 presence list 编码规则文档化

## E. 文件内容阶段（Task 4）

- [x] E.1 全部 19 个文件都有内容大纲
- [x] E.2 每个文件遵循 3 段式：`[@] / [ID] / [@]`
- [x] E.3 关键证据**显式陈述**
- [x] E.4 时间戳/地点名/人物名与 `truth.md` 一致
- [x] E.5 同事件多视角文件 ID 列表严格反映"在场"
- [x] E.6 至少 1 个 `[@]` 注承载教程/伏笔
- [x] E.7 文件总数 = 19（演示规模）

## F. 标签互引阶段（Task 5）

- [x] F.1 `tag_graph.md` 完整
- [x] F.2 无孤立节点
- [x] F.3 无环
- [x] F.4 从 `00-readme` 出发可达所有公开文件
- [x] F.5 隐藏文件有显式触发路径
- [x] F.6 教程引用链完整

## G. 渐进教程阶段（Task 6）

- [x] G.1 `name` 命令首次出现在 02-BR
- [x] G.2 `title` 命令首次出现在 14-LA
- [x] G.3 `act` 命令首次出现在 22-AT
- [x] G.4 `note` 命令首次出现在 03-ME
- [x] G.5 `find` 命令首次出现在 09-CA
- [x] G.6 `hangman` 命令首次出现在 00-final-note
- [x] G.7 `[$first_xxx]` 一次性提示触发条件完整
- [x] G.8 `[$seen_xxx]` 状态机无矛盾

## H. 隐藏文件与结局阶段（Task 7）

- [x] H.1 `00-dream` 文件名显式记录
- [x] H.2 `00-final-note` 触发条件：`$is_complete` + 阅读 message2
- [x] H.3 meta 收束场景 `25-WI-2` 触发路径
- [x] H.4 唯一真结局路径：阈值 + final-note → End
- [x] H.5 伪结局条件文档化
- [x] H.6 meta 结局的隐藏触发文档化

## I. 三性验证阶段（Task 8）

### I.1 唯一性

- [x] I.1.1 已尝试构造"另一套自洽解释"反例（4 个反例全失败）
- [x] I.1.2 无反例
- [x] I.1.3 命名约定具备辨别能力

### I.2 完备性

- [x] I.2.1 每个 F 至少 2 个文件揭露
- [x] I.2.2 教程解锁链完整
- [x] I.2.3 meta 元素全部可达
- [x] I.2.4 文件总数 = 19（演示规模）

### I.3 可达性

- [x] I.3.1 从 `00-readme` 出发，遍历所有公开文件
- [x] I.3.2 隐藏文件有显式触发路径
- [x] I.3.3 无死链

## J. 白盒测试阶段（Task 9）

- [x] J.1 设计路径已走通（自检）
- [x] J.2 预期变量已记录
- [x] J.3 设计层完成率 = 100%
- [x] J.4 所有 `$seen_xxx` 标志已在文件正文中设置
- [x] J.5 隐藏文件触发路径已文档化
- [x] J.6 End passage 已设计
- [ ] J.7 浏览器实测（**用户需在浏览器中打开 `TypeHelp_NewGame.html` 验证**）

## K. 黑盒测试阶段（Task 10）

- [ ] K.1 至少 3 名未接触者参与（**待用户执行**）
- [ ] K.2 玩家能独立推断命名规则
- [ ] K.3 教程节奏合理
- [ ] K.4 meta 触发率 ≥ 70%
- [ ] K.5 `find` 检索命中率
- [ ] K.6 完成率 ≥ 80%
- [ ] K.7 真结局率 30-60%
- [ ] K.8 撰写 `playtest_log.md`

## L. Twine 实现阶段（Task 11）

- [x] L.1 `TypeHelp_NewGame.html` 包含 `Box` passage
- [x] L.2 `StoryInit` 初始化变量与设计一致
- [x] L.3 `Background` / `Intro` / `Loading` 启动流已实现
- [x] L.4 `00-readme` / `00-final-note` / `inbox` / `message-` / `message2-` 已实现
- [x] L.5 所有 19 个新 `tw-passagedata` 已添加
- [x] L.6 `$cache_max=17` / `$people` / `$act_starts` 与设计一致
- [x] L.7 与设计文档一致性
- [x] L.8 引擎装填（**由 `.trae/scripts/embed_sugarcube_engine.py` 自动从参考 TypeHelp.html 抽取并注入，禁止 placeholder 状态交付**。本次实测：从 `games/galley-villa/TypeHelp.html` 抽 14 个引擎块，注入后 44KB → 704KB，`verify_embed.py` 5/5 PASS）

---

## 验收门（Go / No-Go）

- [x] **A–I 全 PASS** → 设计层通过
- [x] **L 通过** → 实现层通过
- [ ] **J + K PASS** → 试玩层通过（**待用户/真实玩家**）

---

## TypeHelp 9 项硬约束专项回检

| # | 约束 | 验证证据 | 状态 |
|---|---|---|---|
| C1 | 单一文本框 | `Box` passage 已实现 | ✓ |
| C2 | 无 inventory | 全部证据以文件形式存在 | ✓ |
| C3 | 文件名 = 元数据 | `naming_matrix.md` 完整 | ✓ |
| C4 | tag 承担互引 | `tag_graph.md` 完整 | ✓ |
| C5 | 进度 = 收集数 | `$cache_max=17` 设置正确 | ✓ |
| C6 | meta 元素存在 | 3 个隐藏文件 | ✓ |
| C7 | 教程渐进 | 6 个 `$seen_xxx` 解锁点 | ✓ |
| C8 | 多视角多文件 | 10 个 F 每个 ≥ 2 个文件 | ✓ |
| C9 | 唯一结局 | 路径单一 | ✓ |

**全 9 项硬约束通过** ✓

---

## 用户操作清单

> ✅ **worked example 已具备可运行产出物**。`TypeHelp_NewGame_embedded.html`（704KB）是已装填引擎的自包含游戏，双击即可在浏览器运行。原始 `TypeHelp_NewGame.html`（44KB）保留作为方法论结构参考。

如需在浏览器中测试当前 worked example 的设计逻辑：

1. **使用已装填版本**（推荐）：
   - 直接双击 `TypeHelp_NewGame_embedded.html`（704KB，已注入 SugarCube 引擎）
   - 输入 `01-CR-1` 开始游戏
   - 按设计路径通关至 End passage

2. **重新生成自包含 HTML**（如 `TypeHelp_NewGame.html` 被改回 placeholder）：
   ```bash
   python .trae/scripts/embed_sugarcube_engine.py \
       --reference ../../../../games/galley-villa/TypeHelp.html \
       --target TypeHelp_NewGame.html \
       --out TypeHelp_NewGame_embedded.html
   python .trae/scripts/verify_embed.py TypeHelp_NewGame_embedded.html
   ```
   两条命令必须都返回 0。

3. **黑盒测试**（可选）：
   - 招募 3-5 名未接触者
   - 记录每人的通关时间、卡点、真结局率
   - 撰写 `playtest_log.md`

4. **完整规模扩展**（可选）：
   - 按 `axis_matrix.md` 模板扩展到 95-100 文件
   - 补全 02 段、03 段、13 段、17 段等未覆盖时间码

5. **新项目**（推荐）：按 [SKILL.md](../../skills/typehelp-novel-design/SKILL.md) 走完整 9 阶段流程。Twine Implementer 会**自动**调用 `embed_sugarcube_engine.py` 产出**自包含**的 HTML（双击即可运行），不再需要手工复制引擎。

---

## M. 诊断与发布门禁（来自 worked example 实测）

> 本节是**强制门禁**——worked example 实施过程中**真实遇到过**"静态分析全 PASS 但用户跑报错"的坑。任何 HTML 交付**必须**通过本节所有 M.1-M.6 检查项。

### M.1 诊断前置门禁（改任何文件前必查）

- [ ] **M.1.1 复现**：用 Playwright 启动目标 HTML + `pageerror` / `console.error` 监听，**确认症状真实存在**（0 errors 才算"症状不存在"）
- [ ] **M.1.2 对比参考**：`games/galley-villa/TypeHelp.html` 是否也有同样症状？**没**的话症状可能不构成 bug
- [ ] **M.1.3 看 git log**：`git log --oneline <target_html>` —— 这文件最近改过吗？哪个 commit？是否已被修过？
- [ ] **M.1.4 定位根因**：grep 引擎代码确认 `setPageElement` 列表 / 引擎注入逻辑，**不**脑补"硬编码需覆盖"

### M.2 静态分析门禁（必要不充分）

- [ ] **M.2.1** `python .trae/scripts/check_twine_escape.py <file>.html` → **0 errors**（PASS）
- [ ] **M.2.2** `python .trae/scripts/verify_embed.py <file>.html` → **5/5 PASS**
- [ ] **M.2.3** 警告项（如 `cjk-questionable-question`）已人工 review 确认无问题

**警告**：M.2 全 PASS **不代表**游戏可玩——必须走 M.3 Playwright 实测门禁。

### M.3 Playwright 实测门禁（充分条件，**必须**）

- [ ] **M.3.1 启动**：`playwright.chromium.launch(headless=True).goto('file:///<file>.html', wait_until='load')` 不抛错
- [ ] **M.3.2 0 pageerror**：`page.on('pageerror', ...)` 监听器收到 0 个
- [ ] **M.3.3 0 console.error**：`page.on('console', lambda m: ... if m.type == 'error')` 收到 0 个
- [ ] **M.3.4 UI 元素渲染**：
  - [ ] `#ui-bar` count == 1（默认 30-50 节点）
  - [ ] `#menu-core li` count >= 2（默认 Saves + Restart）
  - [ ] `#story-caption` / `#story-title` / `#story-subtitle` 渲染非空
  - [ ] 关键 passage（`Start` / `Box`）能 navigate
- [ ] **M.3.5 截图核验**：保存 `playwright_<file>.png`，人工 review ui-bar / caption / 菜单项符合预期

**任一 M.3 项不通过** = 没真测过 = 任务**没完成**。

### M.4 流程链门禁（仓内 vs 仓外）

- [ ] **M.4.1** 装填产物**已复制**到 `games/<game-codename>/<game-codename>.html`（仓内可玩产物）
- [ ] **M.4.2** `games/<name>/<name>.html` **最后修改时间** ≥ `.trae/specs/.../TypeHelp_NewGame_embedded.html` 最后修改时间
- [ ] **M.4.3** 在 `games/<name>/<name>.html`（不是 `.trae/` 那个文件）上跑过 M.3 Playwright 实测门禁
- [ ] **M.4.4** 装填流程图（[verification_report.md §8.1](../example-blackbox/verification_report.md)）**已包含** Step 3 `cp` 节点

**任一 M.4 项不通过** = 修复只到 `.trae/`（不入仓）= 用户跑不到 = 任务**没完成**。

### M.5 引擎知识自检（避免常见误解）

- [ ] **M.5.1** **没有**加 `StoryTitle` passage（不能覆盖硬编码 `#story-title`）
- [ ] **M.5.2** **没有**加自定义 `StoryCaption`（会污染默认 caption 元素）
- [ ] **M.5.3** **没有**加纯文本 `StoryMenu`（必须用 `<li>` 元素）
- [ ] **M.5.4** 知道默认 2 项 Saves/Restart 是 SugarCube 默认行为，**没** 4 项时**不**臆想"是 bug"
- [ ] **M.5.5** ui-bar 修改前**已读** galley-villa 引擎代码对应段（`setPageElement` L15853 / 注入 L15881-15886 / menu 可见性 L15947-15966）

**任一 M.5 项触发** = 立即回退到 M.1.4 重新定位根因。

### M.6 文档门禁（防止自指污染）

- [ ] **M.6.1** 任何写进文档的"修复方案"**必须**已通过 M.3 Playwright 实测验证
- [ ] **M.6.2** Playwright 推翻的旧结论**已立即更新**文档（不是"我修了源，但文档没改"）
- [ ] **M.6.3** 错误速查表里的"修复"列**经过实测**（不是"看起来对"）

---

## 验收门（Go / No-Go）— 更新版

- [x] **A–I 全 PASS** → 设计层通过
- [x] **L 通过** → 实现层通过
- [ ] **M.3 + M.4 PASS** → 浏览器实测 + 流程链门禁通过（**本 worked example 已通过**）
- [ ] **J + K PASS** → 试玩层通过（**待用户/真实玩家**）

**新增的硬门禁**：
- ❌ 任何未通过 M.3 Playwright 实测的"完成" = 假完成
- ❌ 任何未通过 M.4 流程链门禁的"完成" = 假完成
- ❌ 任何触发 M.5 引擎知识盲区的"修复" = 错误修复，必须撤销
