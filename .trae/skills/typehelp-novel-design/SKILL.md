---
name: "typehelp-novel-design"
description: "为 TypeHelp 文字推理游戏设计新剧本。提供真相优先方法论、三轴交叉矩阵、标签互引图、三性验证、9 项硬约束、8 个 Agent 协作提示词。当用户要求设计 TypeHelp 剧本、启动新项目、或按既定方法论产出设计文档时调用。"
---

# TypeHelp 文字推理游戏剧本设计

> 本 skill 封装了 TypeHelp 文字推理游戏剧本设计的**完整方法论 + 多角色 Agent 协作框架**，可直接用于启动新项目或指导已有项目迭代。

---

## 1. 何时调用本 skill

满足以下任一条件时调用：

- 用户说"设计一个 TypeHelp 剧本"
- 用户说"启动一个新项目"
- 用户说"按方法论产出 X 文档"
- 用户说"用 8 个 agent 协作"
- 用户说"调用 TypeHelp 提示词框架"
- 用户提供 `charter.md` 后要求继续推进

**不要**在以下场景调用：

- 用户想玩游戏（不是设计剧本）
- 用户想修改 TypeHelp 引擎本身
- 用户想了解 TypeHelp 是什么（用 TRAE-product-knowledge）

---

## 2. 快速开始

### 2.1 单 Agent 平台（推荐新手）

按 9 阶段顺序执行（立项 → 真相 → 矩阵 → 文件 → 标签 → meta → 验证 → 实现 → 试玩），每次启动一个 Agent 角色：

```
启动 Director → 产 charter.md
   ↓
启动 Truth Designer → 产 truth.md + timeline.json
   ↓
启动 Inference Architect → 产 axis_matrix.md
   ↓
启动 File Designer → 产 naming_matrix.md + file_index.md
   ↓
启动 Tag Graph Designer → 产 tag_graph.md
   ↓
启动 Meta & Tutorial Designer → 产 tutorial_design.md + hidden_files.md + ending_design.md
   ↓
启动 Formal Verifier → 产 verification_report.md（独立否决权）
   ↓
启动 Twine Implementer → 产 TypeHelp_NewGame.html
   ↓
启动 Playtester（黑盒）→ 产 playtest_log.md
```

### 2.2 多 Agent 平台（支持并行）

```
Phase 1（串行）：Director → Truth Designer
Phase 2（串行）：Inference Architect → File Designer（File Designer 兼任命名 + 内容）
Phase 3（可并行）：Tag Graph Designer ∥ Meta & Tutorial Designer
Phase 4（串行）：Formal Verifier（独立否决，**所有设计文档齐备后才介入**）
Phase 5（串行）：Twine Implementer
Phase 6（可并行）：Playtester × 3-5 真实玩家
```

---

## 3. 核心方法论（精简版）

> 完整方法论见 `.trae/specs/typehelp-novel-design/spec.md`

### 3.1 4 大底层原则

1. **公平博弈**：玩家解谜所需信息必须在游戏内可获取
2. **无死局**：任意状态都存在通往终点的路径
3. **契诃夫之枪**：出现过的元素必须有用途
4. **三一律**：时间/地点/逻辑自洽

### 3.2 TypeHelp 9 项硬约束

| # | 约束 | 影响 |
|---|---|---|
| C1 | 单一文本框命令 | 不能设计点击物体调查 |
| C2 | 无 inventory / 无询问 NPC | 证据必须以文件形式可读 |
| C3 | 文件名 = 元数据（XX-LC-?） | 文件名本身是谜题一部分 |
| C4 | tag 字段承担互引 | 取代跳转 DAG |
| C5 | 进度 = 收集文件数 | $cache_max ≈ 95-100 |
| C6 | meta 元素必须存在 | 至少 2-3 个隐藏文件 |
| C7 | 教程渐进式解锁 | $seen_xxx 标志分布在 4 幕 |
| C8 | 多视角通过同事件多文件 | 每个 F 至少 2 个文件揭露 |
| C9 | 唯一结局 = 阈值 + final-note | 单一通关路径 |

### 3.3 9 阶段流程

| # | 阶段 | 产出 | 负责 Agent |
|---|---|---|---|
| 0 | 立项 | `charter.md` | Director |
| 1 | 真相设计 | `truth.md` + `timeline.json` | Truth Designer |
| 2 | 三轴交叉 | `axis_matrix.md` | Inference Architect |
| 3 | 文件内容 | `naming_matrix.md` + `file_index.md` | File Designer |
| 4 | 标签互引 | `tag_graph.md` | Tag Graph Designer |
| 5 | 教程与 meta | `tutorial_design.md` + `hidden_files.md` + `ending_design.md` | Meta & Tutorial Designer |
| 6 | 形式化验证 | `verification_report.md` | Formal Verifier |
| 7 | Twine 实现 | `TypeHelp_NewGame.html`（自包含可双击运行） | Twine Implementer |
| 8 | 黑盒测试 | `playtest_log.md` | Playtester |

### 3.4 三性验证

- **唯一性**：是否存在另一套自洽解释能贯穿所有文件？若有 → 加辨别线索
- **完备性**：每个 F 至少 2 个文件揭露？教程命令是否全部触发？meta 元素是否全部可达？
- **可达性**：从 00-readme 出发能否遍历所有公开文件？隐藏文件是否有显式触发路径？

### 3.5 双证据原则

任何关键结论必须由 **≥ 2 条独立证据**支持，且来自**不同获取路径**（物证 + 证词 / 现场 + 文档 / 视角 A + 视角 B）。

---

## 4. 8 个 Agent 提示词

> 完整 system prompt 见 `.trae/specs/typehelp-novel-design/prompts/`

| # | Agent | 文件 | 关键职责 |
|---|---|---|---|
| 00 | Director | [director.md](../specs/typehelp-novel-design/prompts/director.md) | 立项、真相冻结、阶段门禁、冲突仲裁 |
| 01 | Truth Designer | [truth-designer.md](../specs/typehelp-novel-design/prompts/truth-designer.md) | 仅写客观世界状态（不写谜题） |
| 02 | Inference Architect | [inference-architect.md](../specs/typehelp-novel-design/prompts/inference-architect.md) | 三轴交叉矩阵 + 双证据 |
| 03 | File Designer | [file-designer.md](../specs/typehelp-novel-design/prompts/file-designer.md) | 命名约定 + 3 段式文件内容 |
| 04 | Tag Graph Designer | [tag-graph-designer.md](../specs/typehelp-novel-design/prompts/tag-graph-designer.md) | tags 互引图（取代 DAG） |
| 05 | Meta & Tutorial Designer | [meta-tutorial-designer.md](../specs/typehelp-novel-design/prompts/meta-tutorial-designer.md) | 隐藏文件 + 渐进教程 + 结局 |
| 06 | Formal Verifier | [formal-verifier.md](../specs/typehelp-novel-design/prompts/formal-verifier.md) | 三性检查（独立否决权） |
| 07 | Twine Implementer | [twine-implementer.md](../specs/typehelp-novel-design/prompts/twine-implementer.md) | 设计 → TypeHelp HTML 1:1 翻译 |
| 08 | Playtester | [playtester.md](../specs/typehelp-novel-design/prompts/playtester.md) | 黑盒试玩 + 卡点记录 |

### 4.1 关键约束：每个 Agent 只产一类文档

| Agent | 可修改 | 禁止修改 |
|---|---|---|
| Director | 所有文档（签字权） | — |
| Truth Designer | truth.md, timeline.json | 其他 |
| Inference Architect | axis_matrix.md | truth.md（须走 RFC） |
| File Designer | naming_matrix.md, file_index.md | truth.md, axis_matrix.md |
| Tag Graph Designer | tag_graph.md | 上游所有已冻结文档 |
| Meta & Tutorial Designer | tutorial_design.md, hidden_files.md, ending_design.md | 上游 |
| Formal Verifier | verification_report.md | 不修改任何上游（仅检查） |
| Twine Implementer | TypeHelp_NewGame.html | 不得变更设计 |
| Playtester | playtest_log.md | 不读任何设计文档 |

### 4.2 handoff 协议

> 完整协议见 [handoff-protocol.md](../specs/typehelp-novel-design/prompts/handoff-protocol.md)

每个 Agent 完成时必须产出：

```json
{
  "from": "<上游 Agent>",
  "to": "<下游 Agent>",
  "deliverables": ["<文件1>", "<文件2>"],
  "assumptions": ["<假设1>"],
  "open_questions": ["<未解决>"],
  "blockers": ["<阻塞>"],
  "next_step": "<给下游的指示>"
}
```

---

## 5. 启动新项目

把 [startup-template.md](../specs/typehelp-novel-design/prompts/startup-template.md) 中的 yaml 填好，发送给 Director Agent。

最小必填字段：
- 题材
- 风格
- 目标时长
- 目标玩家
- 难度
- 特殊约束

可选字段：参考作品、meta 元素、结局数等。

---

## 6. 工作流示例（端到端）

```yaml
# 用户输入
题材: 太空船 / 封闭环境
风格: 新本格
目标时长: 60 分钟
目标玩家: 推理新手到中级
难度: 3
特殊约束: 单机离线 / 不可超自然
参考诡计: 信息差 + 物证
meta 元素: 调查员视角
```

**Step 1**: 把上述 yaml 喂给 Director Agent

**Step 2**: Director 产 `charter.md`（8 字段 + 风险 + 签字）

**Step 3**: Director handoff → Truth Designer

**Step 4**: Truth Designer 产 `truth.md` + `timeline.json`
- 至少 5 个 F 事实
- 物理可行性 100% 通过
- Director 签字冻结真相层

**Step 5**: Truth Designer handoff → Inference Architect

**Step 6**: Inference Architect 产 `axis_matrix.md`
- 三轴定义（T × L × P）
- 每个 F 至少 2 个文件揭露
- 唯一性自检（构造反例）

**Step 7**: Inference Architect handoff → File Designer

**Step 8**: File Designer 产 `naming_matrix.md` + `file_index.md`
- 所有文件遵循 3 段式
- 关键证据显式陈述
- presence list 与 truth.md 一致

**Step 9**: File Designer handoff → Tag Graph Designer

**Step 10**: Tag Graph Designer 产 `tag_graph.md`
- tags 字段表
- 可达性 / 孤立 / 环自检

**Step 11**: Tag Graph Designer handoff → Meta & Tutorial Designer

**Step 12**: Meta & Tutorial Designer 产 `tutorial_design.md` + `hidden_files.md` + `ending_design.md`
- 6 个命令解锁位置
- 3 个隐藏文件触发路径
- 真结局触发流程

**Step 13**: Meta & Tutorial Designer handoff → Formal Verifier

**Step 14**: Formal Verifier 产 `verification_report.md`
- 唯一性 / 完备性 / 可达性
- 9 项硬约束专项回检
- 独立否决权：FAIL → 驳回上游

**Step 15**: Formal Verifier PASS → handoff → Twine Implementer

**Step 16**: Twine Implementer 产 `TypeHelp_NewGame.html`
- 1:1 翻译 file_index.md
- tags 字段 1:1 翻译
- 5 个抽样验证
- **必须调用 `.trae/scripts/embed_sugarcube_engine.py` 从参考 TypeHelp.html 抽取引擎并装填**（禁止只输出 placeholder）
- 通过 `.trae/scripts/verify_embed.py` 5/5 检查（脚本大小 / 块数 / twine 实体完整性）

**Step 17**: Twine Implementer handoff → Playtester

**Step 18**: Playtester 产 `playtest_log.md`
- 真实试玩（不查设计文档）
- 招募 3-5 名真实玩家
- 数据统计

---

## 7. 关键守则

### 7.1 真相优先

> 先有真相，再有推论，最后才有线索。任何"先写场景再补真相"的设计，注定会留下幽灵线索或多解。

### 7.2 真相冻结

真相层（truth.md）一旦 Director 签字，所有下游修改须经 Verifier 重跑三性检查。

### 7.3 Verifier 否决权

Formal Verifier 是项目唯一有"驳回上游"权力的角色。Director 不可绕过 FAIL。

### 7.4 物理可行

所有诡计必须现实可重现。超能力、运气巧合、不明机制 → 重新设计。

### 7.5 显式陈述

关键证据**直接写**："03:15 氧气从 21% 跌至 9%"，**不**写"氧气似乎有异常"。

### 7.6 显式文件名

`XX-LC-?` 编码：`02-BR-1-2-3-4-5-6` = 时间 02 / 地点 BR(舰桥) / 在场 1,2,3,4,5,6。

### 7.7 presence list 严格

ID 列表必须严格反映"谁在场"。同事件不同文件 ID 列表必须完全一致。

---

## 8. 经验教训与反模式（来自 worked example 实测）

> 本节记录**系统性的方法论教训**，而不是单点 bug 修复。这些教训是 worked example「黑匣子」实施过程中**反复验证**的：症状导向误诊、未实测先修、流程链断裂、文档自指污染——这些问题在多次独立任务中**重复出现**，必须上升到方法论层防御。

### 8.1 症状导向诊断陷阱（最常见、最致命）

**症状**：用户报"左下角 save/restart 显示不太对" / "有 `<<elseif>>` 报错" → Agent 立即**臆想**一个修复方案（"加 StoryTitle 覆盖硬编码"），不等实测就改源

**根因**：人类和 LLM 都有"快速归因"倾向——看到症状就想给处方，没验证"症状是否真实存在"

**反模式**：
- ❌ 用户报"显示不对" → 立即改源
- ❌ 看到报错文字 → 立即改 `<title>` 标签 / 加 passage 覆盖
- ❌ 凭直觉写修复，不读参考实现

**正确做法**：
- ✅ **Step 1：复现**。Playwright 启动目标 HTML + pageerror 监听 + console.error 监听，**确认症状真实存在**（`games/island-death/island-death.html` 经实测 0 errors，"有 `<<elseif>>` 报错"是用户浏览器缓存或历史版本）
- ✅ **Step 2：对比参考**。看 `galley-villa/TypeHelp.html` 是否也有同样"症状"——**如果参考实现不修也工作，说明症状可能不构成 bug**（galley 没有自定义 Story* passage，默认 2 项 Saves/Restart 是 SugarCube 默认行为）
- ✅ **Step 3：定位根因**。不臆想"硬编码需覆盖"，而是 grep 引擎代码确认 `setPageElement` 列表 / 引擎注入逻辑（实测：`setPageElement` 列表里**没有** `story-title → StoryTitle` 映射，加了也无效）
- ✅ **Step 4：下结论 + 改**。基于实测结论改；**0 改动**也是合法结论（"症状是默认行为，不修"）

**自检问题**（改任何文件前必问）：
1. 我看到的症状在 Playwright/浏览器里**真的复现**了吗？
2. 参考实现（galley-villa）有没有这个症状？**没**的话是不是我误解了？
3. 我的修复方案**是实测过**的，还是**凭直觉**的？

### 8.2 静态分析必要不充分

**症状**：`check_twine_escape.py` 报 0 errors → 认为 "SugarCube 解析 OK"
**真相**：0 errors 只代表"5 类已知的 HTML 实体污染都不存在"，**不代表**引擎不报其他错（wikifier 嵌套错位、JS 运行时错误、L10n 异常等）

**反模式**：
- ❌ `verify_embed.py` 5/5 PASS + `check_twine_escape.py` 0 errors → 直接 commit
- ❌ 把"静态分析 PASS"等同于"游戏可玩"

**正确做法**：
- ✅ 静态分析 PASS 是**必要不充分**条件——PASS 后还**必须** Playwright 启动 + console.error 监听 + 截图核验
- ✅ 完整门禁链：`check_twine_escape.py` 0 errors → `verify_embed.py` 5/5 PASS → Playwright 0 pageerror / 0 console.error → 关键 UI 元素（`#ui-bar` / `#menu-core` / `#story-caption`）渲染正常

### 8.3 流程链断裂（仓内 vs 仓外）

**症状**：在 `.trae/specs/.../TypeHelp_NewGame_embedded.html` 修得完美，但 `games/<name>/<name>.html` 没同步 → 用户跑到的还是旧版

**根因**：
- `.trae/` 被 `.gitignore` 屏蔽 → **仓内可玩产物是 `games/<name>/<name>.html`**
- `.trae/specs/.../TypeHelp_NewGame_embedded.html` 是**开发期中间产物**（不入仓）
- `embed_sugarcube_engine.py` 只负责"装填引擎"，不负责"分发到 `games/`"

**反模式**：
- ❌ `embed_sugarcube_engine.py` + `verify_embed.py` 5/5 PASS → 以为"任务完成"
- ❌ 装填产物放在 `.trae/` 内就不管了
- ❌ 修改了 `TypeHelp_NewGame.html` 源 + 重装填 → 不复制到 `games/`

**正确做法**：
- ✅ 完整流程：**生成源 → 装填引擎 → 校验 → 复制到 `games/<name>/<name>.html` → 在 `games/` 上 Playwright 实测**
- ✅ Step 3 `cp` 必须在装填流程里**显式**存在（`verification_report.md` §8.1 工作流图已加此节点）
- ✅ 任何修复只在 `.trae/` 内部做（不入仓）= 任务**没完成**

### 8.4 文档自指污染

**症状**：错误知识（如"加 5 个 Story* passage 覆盖 ui-bar 硬编码"）写进 `verification_report.md` 错误根因段 → 下次 Twine Implementer 引用 → 错误知识自我强化

**根因**：文档之间互相引用是好事，但**错误文档**的引用链会让错误知识**比正确知识传播更广**（错误是"确定的、看起来合理的"，正确是"沉默的、不显眼的"）

**反模式**：
- ❌ "根因 D：截断的 HTML 实体 → 修复 = 加 5 个 Story* passage 覆盖"（错误）→ 写入文档 → 下次自动引用
- ❌ 错误结论被 Playwright 推翻后**不更新文档**（"我修了源，但文档没改"）

**正确做法**：
- ✅ 任何修复方案写进文档**前**，必须 Playwright 实测证明它有效
- ✅ 实测推翻结论时，**立即**更新文档（包括错误段落、修正为"反例"+"实测结果"）
- ✅ 文档之间引用时，**必须**验证被引用文档的当前内容（不是初始内容）

### 8.5 引擎知识盲区（常见 4 个误解）

| 误解 | 真相 | 证据 |
|---|---|---|
| `StoryTitle` passage 可以覆盖 `<h1 id="story-title">` | **不能**。引擎 `setPageElement` 列表里**没有** `story-title → StoryTitle` 映射 | galley-villa 引擎 L15853：banner/subtitle/author/caption 可覆盖，title 不可 |
| `StoryCaption` passage 是无害的 caption 覆盖 | **会污染**默认 caption 元素，丢掉项目自己设计的 caption | 加后 `<div id="story-caption">` 显示"按 F12..."而不是"返回 Box" |
| `StoryMenu` 可以塞纯文本"存档\n重新开始" | **不行**。`StoryMenu` 必须用 `<li>` 元素，纯文本导致 `<ul id="menu-story">` 是空 ul | Playwright 实测：`#menu-story li count: 0` |
| 引擎默认 4 项菜单 = Saves/Settings/Restart/Share | **默认 2 项**。`Setting.isEmpty() → 移除 settings`，`Story.has("StoryShare")` 失败 → 移除 share | galley-villa 引擎 L15947-15966；galley 自身也只有 2 项 |

**正确做法**：涉及 ui-bar 任何修改前，**先读 galley-villa 引擎代码对应段**（`setPageElement` L15853 / ui-bar HTML 注入 L15881-15886 / menu 项可见性逻辑 L15947-15966），不凭 SugarCube 文档脑补。

### 8.6 框架性配置漂移（Twine Implementer 必做：完整 diff 参考实现）

**症状**：新剧本做完后，用户报"我原版看不到这些 UI 元素"——发现 StoryInit 漏了 `UIBar.destroy()` + `Config.history.maxStates=1` 这两行框架级配置

**根因**：
- Twine Implementer 阶段只关注"实现 file_index.md"——**不**关注"和参考实现的框架级配置对齐"
- "我能跑起来"≠"和原版行为一致"——前者是必要条件，后者是规范
- 框架级配置（UI bar、历史回溯、Save 菜单、StoryMenu caption、PassageHeader/Footer）会**直接影响玩家体验**，但藏在 StoryInit 的十几行代码里，**单点遗漏**会整体漂移

**反模式**：
- ❌ 只看 file_index.md → 实现 passage → 装填引擎 → 跑通
- ❌ "原版也叫 X，新剧本也叫 X" → 假设行为一致
- ❌ grep 命中数 40 vs 38 → "差不多" → 草率结论"完全一致"（**本次实际踩坑**——`UIBar` 命中数没差异，但内容差异巨大）

**正确做法**：
- ✅ Twine Implementer 完成后，**强制做一次完整 diff**：把新剧本的 StoryInit / StoryMenu / StoryCaption / PassageHeader / PassageFooter / tw-storydata 元数据与参考 TypeHelp.html **逐行对比**
- ✅ 差异分 3 类处理：
  - **必须对齐**（删/改）：框架行为差异（UI bar、历史、菜单项）
  - **保留**（设计差异）：剧情变量差异（people / nicknames / 文件名数量等）
  - **修复原版 bug**：本次发现 PassageHeader 在原版有卡死 bug（00-readme 无 textbox 无返回链接），原 TypeHelp 自身就该加
- ✅ diff 完成后写 `framework_diff.md`（在 `games/<name>/` 下）记录决策理由
- ✅ **不要**凭命中数下"完全一致"结论——必须看内容

**自检问题**（Twine Implementer 完成后必问）：
1. 我的 StoryInit 哪些行和参考实现**不同**？每行的处理理由是什么？
2. 我加的 StoryCaption / PassageHeader / StoryMenu 是不是**原版也有的**？还是我**新加的设计**？是 bug 修复还是新设计？
3. 框架级配置（UI bar / 历史 / 默认菜单）行为是不是和原版**完全一致**？

### 8.7 输入 sanitize 必须支持 L10n 字符集

**症状**：`find 陈` / `note 钱某与江某的矛盾` / `find 监控` 全部失败，返"用法：find 关键词"或"暂无笔记"

**根因**（举一反三）：
- Box passage 用 `new RegExp("[^A-Za-z0-9-...]")` 净化输入
- **字符集只含 ASCII**，中文（CJK `\u4e00-\u9fff`）不在白名单 → 中文被**全数清空**
- trim 后命令退化为单 token → 触发"用法"或"暂无"分支
- **单一 sanitization 缺陷**同时影响 3 类功能（find 关键词 / note 内容 / 任意中文命令的 stale state）

**反模式**：
- ❌ 写英文场景 → sanitize 只考虑 ASCII → 中文剧本直接挂
- ❌ 修复 1 处后**不举一反三**——只补 find 的关键字，不补 note 的内容字段
- ❌ 没意识到"输入净化"是**所有命令的咽喉**，一处错全盘错

**正确做法**：
- ✅ L10n 剧本（中文/日文/韩文）的 sanitize 正则**必须**包含目标字符集范围：
  - 中文：`\u4e00-\u9fff`（CJK Unified Ideographs）
  - 日文/韩文：`\u3040-\u30ff` / `\uac00-\ud7af`
  - 全角符号：`\uff00-\uffef`（`（` `）` `，` `。` 等）
- ✅ sanitize 函数要**集中**在 Box passage 顶部一处（不分散到各命令）
- ✅ 修一处**必查全盘**：find / note / hangman / name / help / 任何接受 keyword 的命令都受影响
- ✅ 写 `regex_l10n_test.md` 列出所有字符集范围 + 测试用例

**自检问题**：
1. 我的 sanitize 正则字符集是**纯 ASCII** 还是**含目标语言字符集**？
2. 我剧本的目标语言是中文/日文/韩文/英文？
3. 修改 sanitize 后，**所有**接受 keyword 的命令都验证过了吗？

### 8.8 状态机必须显式重置（防御 stale state）

**症状**：玩家输入 `帮`（纯中文），游戏显示"进度已保存"——但用户根本没按 save

**根因**：
- Box passage 处理命令的逻辑：
  ```
  if (raw_input not empty) { $command = raw_input.toLowerCase() }
  // ... 处理 $command
  ```
- `raw_input` 因 sanitize 被清空 → `$command` **未重置** → 保留上一条命令的值
- 上次是 `save` → 这次触发 `save` 分支 → 误执行

**反模式**：
- ❌ "raw 为空就什么都不做"——错误地推断空 raw 等于无操作，**忽略**状态遗留
- ❌ 单元测试时 raw 总是有值 → 测不到 stale state → 漏到集成

**正确做法**：
- ✅ 把 if 改为**显式 if-else**：
  ```
  if (raw_input is empty) { $command = "" }
  else                    { $command = raw_input.toLowerCase() }
  ```
- ✅ 处理命令时**先检查 `$command is ""` 早退**，不让"空命令"穿透到任何分支
- ✅ Playtester 阶段**专门测**"sanitize 后变空的输入"——这是 stale state 的温床

**自检问题**：
1. 我的命令处理逻辑，raw 为空时**$command 是什么**？是显式重置还是保持上次值？
2. 我有没有测过"输入后被 sanitize 干掉"的场景？

### 8.9 反馈完整性（操作结果必须可见）

**症状**：`load` 命令**静默**——玩家不知道是否加载成功

**根因**：
- SugarCube `Save.slots.load(0)` 本身静默
- Box passage 直接 `<<run Save.slots.load(0)>>` → 无任何反馈
- 玩家不知道发生了什么 → 不敢再用

**反模式**：
- ❌ 调底层 API → 假设成功 → 不给反馈
- ❌ "没报错就是成功"——技术视角，不是用户视角
- ❌ 反馈文案不一致（中英混用 / 风格不统一）

**正确做法**：
- ✅ 任何**有副作用**的命令（save / load / note / name / find）都**必须**有可见反馈
- ✅ 反馈分 3 类：
  - **成功**："进度已保存。" / "笔记已记录。"
  - **失败**："没有可加载的存档。请先 save。" / "用法：find 关键词"
  - **静默合法**（如 inbox 无消息）："暂无消息。"——同样要有，只是说"没东西"
- ✅ 反馈文案**统一风格**（全中文 / 全英文 / 统一 emoji / 统一格式）
- ✅ Playtester 阶段**专门检查**每条命令的反馈（`get_passage_text` 抓取验证）

**自检问题**：
1. 我的每条命令，玩家执行后**看到什么**？
2. 反馈文案是统一风格吗？还是中英混用 / 风格漂移？
3. 失败状态（找不到文件 / 没有存档）有没有友好的错误提示？

### 8.10 跨剧本一致性（仓内多剧本规范）

**症状**：用户报"原版 TypeHelp 看不到 UI bar，新版却看到了"——同一个仓内两个剧本行为不一致

**根因**（举一反三）：
- 仓内会有**多个剧本**（island-death / galley-villa / terminal-mystery 等）
- 每个剧本独立实现，但**框架级配置应该共享规范**（UI bar 处理、历史策略、L10n、PassageHeader 等）
- 没有仓级规范 → 每个 Twine Implementer 各自决策 → 单点漂移

**反模式**：
- ❌ 每个剧本独立决定 UI bar 怎么处理
- ❌ 没有仓级 README 规范"所有剧本必须做的事"
- ❌ 改一个剧本**不通知**其他剧本的维护者

**正确做法**：
- ✅ 仓根 [README.md](file:///d:/WorkSpace/projects/TxtGame/README.md) 顶部加**"多剧本规范"**章节，列出所有剧本必须遵守的：
  - 框架级配置（UI bar 销毁 / 历史禁用 / PassageHeader 模式）
  - L10n 字符集白名单
  - 反馈文案风格
  - 测试规范（Playtester 3 阶段）
- ✅ 每个剧本的 `games/<name>/README.md` 写**与基线规范的差异**（如有）
- ✅ 跨剧本共享工具脚本（`embed_sugarcube_engine.py` / `verify_embed.py` / Playtester harness）放仓根 `tools/` 或 `.trae/scripts/`

**自检问题**：
1. 我的剧本和仓内其他剧本**框架级行为**一致吗？
2. 仓根 README 有没有"多剧本规范"章节？
3. 我加的特殊 passage（StoryCaption / PassageHeader）是不是**所有剧本都需要**？是基线还是单剧本扩展？

### 8.11 Playwright 黑盒测试的 6 个常见陷阱

**症状**：脚本跑到一半卡死 / 90% 进度后无输出 / 进程不退出

**根因**（本次实际踩坑）：

1. **`page.fill()` 在 `<<type 100ms>>` 动画下卡死**：fill 等待元素 stable，但 `<<type>>` 让文本持续变化 → 永远等不到 stable
2. **`page.keyboard.type` 不自动 focus**：直接 type → 输入进错地方
3. **`page.evaluate()` 不支持 `timeout` 参数**：会直接 `TypeError`
4. **元素默认 30s timeout**：顺序测试中一个 hang 整批卡死
5. **Playwright Chromium 进程不退出**：`with sync_playwright()` exit 时 driver 进程卡死 → Python 进程不退出 → 后续脚本不跑
6. **HTTP server 端口被占/进程被杀**：`Get-NetTCPConnection` 显示端口空但实际起不来

**反模式**：
- ❌ 用 `inp.fill(cmd)` —— 100% 在 `<<type>>` 动画下卡死
- ❌ `page.evaluate(..., timeout=5000)` —— 直接报错
- ❌ Playtester A/B/C 跑在**同一个** Python 进程 —— A hang B 也卡
- ❌ `browser.close()` 后就以为进程退出了 —— 实际是僵尸

**正确做法**（参考本次实际跑通的 [run_a_postfix.py](file:///d:/WorkSpace/projects/TxtGame/.tmp/run_a_postfix.py)）：
- ✅ 输入用 `inp.click() + page.keyboard.type(cmd, delay=2) + page.keyboard.press('Enter')`
- ✅ `page.set_default_timeout(5000)` 全局设置，元素找不到 5s 就放弃
- ✅ `inp.click(timeout=3000)` 显式短超时
- ✅ **每个 Playtester 跑独立 Python 进程**——一个 hang 不影响其他
- ✅ 跑完看 `Get-Item *.log` LastWriteTime 确认写完，**手动 kill** 僵尸进程
- ✅ HTTP server 用 `Start-Process -WindowStyle Hidden` 启动，跑前 `Get-NetTCPConnection -LocalPort` 验证 listening
- ✅ 长任务（>60 条命令）必须用 `check_default_timeout` + 短超时，不依赖 Playwright 默认 30s

**自检问题**：
1. 我的 Playwright 脚本，输入用 `fill` 还是 `click+keyboard.type`？
2. 我设置全局 `set_default_timeout` 了吗？
3. Playtester A/B/C 是同一个进程还是独立进程？
4. 我有没有验证 HTTP server 真的在 listening？
5. 跑完脚本后 Python 进程真的退出了吗？`Get-Process python` 还有残留吗？

---

## 9. 引用文件

### 9.1 方法论

- [spec.md](../specs/typehelp-novel-design/spec.md) — 完整方法论（含 9 项硬约束推导）
- [tasks.md](../specs/typehelp-novel-design/tasks.md) — 任务清单
- [checklist.md](../specs/typehelp-novel-design/checklist.md) — 验证清单

### 8.2 Agent 提示词

位于 `.trae/specs/typehelp-novel-design/prompts/`：
- README.md
- startup-template.md
- handoff-protocol.md
- director.md
- truth-designer.md
- inference-architect.md
- file-designer.md
- tag-graph-designer.md
- meta-tutorial-designer.md
- formal-verifier.md
- twine-implementer.md
- playtester.md

### 9.3 Worked Example

`example-blackbox/` — 「黑匣子 / Black Box」太空船推理游戏，含完整 11 个设计文档 + TypeHelp HTML 源码。可作为方法论的应用示例参考。

---

## 10. 错误速查

| 错误 | 原因 | 修复 |
|---|---|---|
| 玩家卡在命令不会用 | 教程未渐进 | 检查 $seen_xxx 触发位置 |
| 玩家卡在文件名不会输入 | 命名规则不清晰 | 在 00-readme 加示例 |
| 多解 | 唯一性失败 | 加辨别线索到某文件 |
| 死链 | 互引图断裂 | 修补 tag 链 |
| 幽灵线索 | 真相未冻结就写文件 | 回退到 Truth Designer 补 F 事实 |
| 玩家无法推理 | 双证据不足 | 每 F 补到 ≥ 2 文件 |
| meta 触发率低 | 隐藏文件不可达 | 显式提示触发路径 |
| Verifier 总 FAIL | 真相 / 矩阵 / 文件三者矛盾 | 走 RFC 流程统一 |
| 双击 HTML 只看到裸 ui-bar / tw-storydata | Twine Implementer 没装填引擎，placeholder 沉默通过自检 | 强制走 `embed_sugarcube_engine.py` + `verify_embed.py` 5/5 PASS |
| `child tag <<elseif>> was found outside of …` 报错 | wikifier 嵌套栈错位：**常见根因**是 passage body 中有 `&lt;X"&gt;` 截断实体（AI 写 passage 时字符串提前闭合），也可能是 `<<if>>`/`<<else>>` 配对错位 | 先跑 `check_twine_escape.py` 自检 5 查 `truncated-entity`；0 error 时需人工 review wikifier 嵌套栈（错误行号常常错位，须看源上下文） |
| 想覆盖左下角标题为自定义中文 | `StoryTitle` passage **不能**覆盖 `<h1 id="story-title">`（引擎 setPageElement 列表里**没有** `story-title → StoryTitle` 映射——参考 galley-villa 引擎 L15853：banner/subtitle/author/caption 可覆盖，title 不可） | 不要加 `StoryTitle` passage；改 `<title>` 标签 + `<tw-storydata name>` 即可 |
| 想汉化左下角 Saves/Restart 菜单 | 引擎默认 menu-core 是 4 项：saves / settings / restart / share，**没** `Setting` passage 自动移除 settings、**没** `StoryShare` passage 自动移除 share——所以正常只显示 2 项（Saves + Restart） | 这是 **SugarCube 默认行为**，galley-villa 也只有 2 项；如要 4 项全显示，加 `Setting`（任意内容即可让 settings 出现）和 `StoryShare` passage；如要汉化项名，参考引擎 L10n 对象（`savesTitle` / `settingsTitle` / `restartTitle` / `shareTitle`），在 StoryInit 里覆盖 |
| 中文 find / note / 任意中文命令全部失败 | Box passage 的 sanitize 正则**字符集只含 ASCII**（`[A-Za-z0-9-...]`），中文 CJK `\u4e00-\u9fff` 不在白名单 → 输入被全数清空 → trim 后变空 → 命令退化为单 token → 触发"用法"或"暂无"分支。**举一反三**：本类缺陷**单一 sanitization 同时影响 3+ 类功能**（find 关键词 / note 内容 / 任意中文命令）；修一处必查全盘 | sanitize 正则补 CJK：`new RegExp("[^A-Za-z0-9-:;,.!?()\\[\\]'\"*£$%/#~=+_|^¬@ \\u4e00-\u9fff\\uff00-\uffef]","g")`；日文剧本补 `\u3040-\u30ff`；韩文补 `\uac00-\ud7af`；**所有**接受 keyword 的命令（find/note/help/name/hangman）都跑回归 |
| 玩家输入被 sanitize 干掉的字符后，误触发上次命令（stale state） | Box passage 处理逻辑 `if (raw_input not empty) { $command = raw_input.toLowerCase() }`，raw 因 sanitize 清空后 `$command` **未重置** → 保留上次值 → 穿透到对应分支误执行（如输入"帮"显示"进度已保存"）。**举一反三**：单元测试时 raw 总是有值，**测不到** stale state，必须**专门**构造"sanitize 后变空"的输入 | 显式 if-else：`if ($raw_input is "") { $command = "" } <<else>> { $command = $raw_input.toLowerCase() }`；处理命令前**先检查** `$command is ""` 早退，不让空命令穿透任何分支；Playtester 阶段**专门测**"sanitize 后变空"输入 |
| 新剧本与原版框架级配置漂移（UI bar 出现 / 历史回退可用） | Twine Implementer 阶段只关注实现 file_index.md，**不**关注和参考实现的框架级配置对齐；"能跑"≠"和原版行为一致"。本次实际踩坑：StoryInit 漏了 `<<run UIBar.destroy()>>` + `<<set Config.history.maxStates to 1>>` 这两行。**举一反三**：grep 命中数 40 vs 38 草率下结论"完全一致"——**命中数没差异但内容差异巨大**，必须看内容 | Twine Implementer 完成后**强制做一次完整 diff**（StoryInit / StoryMenu / StoryCaption / PassageHeader / PassageFooter / tw-storydata 元数据 vs 参考实现），差异分 3 类处理（必须对齐 / 保留设计差异 / 修复原版 bug），写 `framework_diff.md` 记录决策 |
| load 静默无反馈，玩家不知道是否加载成功 | `<<run Save.slots.load(0)>>` 本身静默，Box passage 直接调用底层 API 不给反馈。**举一反三**：任何**有副作用**的命令（save/load/note/name/find/help）都必须有可见反馈；技术视角的"没报错就是成功" ≠ 用户视角 | 调用后加反馈：成功 `"进度已加载。"` / 失败 `"没有可加载的存档。请先 save。"` / 静默合法（如 inbox 空）也要有 `"暂无消息。"`；反馈文案**统一风格**（全中文 / 全英文）；Playtester 用 `get_passage_text` 抓取验证每条命令的反馈 |
| 错误消息中英混用 | Box passage 用 `<<=$fail_message>>` 引用变量，但**变量值是英文**（如 `"Usage: find <keyword>"`），上层包装中文包裹"参数无效"——视觉风格漂移。**举一反三**：第 5.9 阶段**没** "文案风格规约"就交付 → 实现时各凭感觉 | 把 `<<=$fail_message>>` 内容改中文（`"用法：find 关键词"`）；建立**全局文案风格规约**（全中文 / 全英文 / 标点统一），写在 `tutorial_design.md` §风格 一节 |
| 文件路径中的反斜杠被吞（`XX-AG-1\XX-DR-1` 变 `XX-AG-1XX-DR-1`） | sanitize 正则不含 `\` → 反斜杠被替换为空 → 复合文件名变成拼接串。**举一反三**：和"CJK 被吞"是**同一根因**（字符集白名单不全），但表现完全不同（中文 = 整段被吞，反斜杠 = 拼接相邻 token） | sanitize 白名单**显式**包含 `\\`；所有"会被用户输入且会被净化"的特殊字符（`\\` `/` `:` `*` `?` `'` `"` `<` `>` `|`）都列白名单 + 写测试用例 |

---

## 11. 一句话心法

> **TypeHelp 剧本设计 = 为一个"终端"设计 N 个有"自描述文件名 + 互引标签 + 视角差异 + 教程解锁"四元组的文件，并保证这 N 个文件在 $cache 累加到阈值时，拼出唯一真相。**
