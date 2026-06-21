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
| 7 | Twine 实现 | `TypeHelp_NewGame.html` | Twine Implementer |
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

## 8. 引用文件

### 8.1 方法论

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

### 8.3 Worked Example

`example-blackbox/` — 「黑匣子 / Black Box」太空船推理游戏，含完整 11 个设计文档 + TypeHelp HTML 源码。可作为方法论的应用示例参考。

---

## 9. 错误速查

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

---

## 10. 一句话心法

> **TypeHelp 剧本设计 = 为一个"终端"设计 N 个有"自描述文件名 + 互引标签 + 视角差异 + 教程解锁"四元组的文件，并保证这 N 个文件在 $cache 累加到阈值时，拼出唯一真相。**
