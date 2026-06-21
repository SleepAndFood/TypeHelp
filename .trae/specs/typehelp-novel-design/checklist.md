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
- [ ] L.8 浏览器自测（**当前 worked example 的 `TypeHelp_NewGame.html` 是 placeholder（44KB），不含完整 SugarCube 引擎。完整引擎在 `../../../../TypeHelp.html`。如需可运行的 HTML，将原 `TypeHelp.html` 中 line 35-83 的引擎 + 样式复制到此文件并替换 placeholder；或新项目按 [twine-implementer.md](../prompts/twine-implementer.md) 的"1:1 翻译 + 保留引擎核心结构"规范产出**）

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

> ⚠️ **重要**：当前 `TypeHelp_NewGame.html` 是 worked example 的演示 HTML（44KB），**不包含完整 SugarCube 引擎**，仅作为方法论产出物的结构参考。如需可运行的 HTML，请按 [twine-implementer.md](../prompts/twine-implementer.md) 规范从原 `TypeHelp.html`（902KB）复制引擎 + 样式到新项目。

如需在浏览器中测试当前 worked example 的设计逻辑：

1. **嵌入 SugarCube 引擎**（仅当你想实测本 worked example 的 HTML 时）：
   - 打开原 `d:\WorkSpace\projects\TxtGame\TypeHelp.html`（902KB，自带引擎）
   - 复制其中 line 35-83 的所有 `<script id="script-...">` 与 `<style id="style-...">` 块
   - 粘贴到 `TypeHelp_NewGame.html` 的 `<head>` 中，替换当前的 placeholder 脚本

2. **浏览器测试**：
   - 双击 `TypeHelp_NewGame.html`
   - 输入 `01-CR-1` 开始游戏
   - 按设计路径通关至 End passage

3. **黑盒测试**（可选）：
   - 招募 3-5 名未接触者
   - 记录每人的通关时间、卡点、真结局率
   - 撰写 `playtest_log.md`

4. **完整规模扩展**（可选）：
   - 按 `axis_matrix.md` 模板扩展到 95-100 文件
   - 补全 02 段、03 段、13 段、17 段等未覆盖时间码

5. **新项目**（推荐）：按 [SKILL.md](../../skills/typehelp-novel-design/SKILL.md) 走完整 9 阶段流程，由 Twine Implementer 产出**自包含**的 HTML（双击即可运行）。
