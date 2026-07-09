# 推理充分性测试框架设计

> 日期：2026-07-09
> 状态：待用户审查
> 范围：TypeHelp 文字推理游戏剧本 — 推理路径充分性验证

---

## 1. 问题陈述

### 1.1 现状

TxtGame 项目的 5 层测试金字塔（L1 静态 / L2 单元 / L3 叙事 / L4 渲染 / L5 E2E）覆盖了 passage 引用完整性、命令路由、时间线标记、引擎渲染、浏览器冒烟等维度。但**缺少"端到端推理路径"验证**——即"从初始信息出发，逐步打开文件，能否拼出 F 事实"的串行过程。

L3 的 `clue-coverage` 测试只检查关键字出现次数 ≥ 阈值（[test/helpers/clue.js](file:///d:/WorkSpace/projects/TxtGame/test/helpers/clue.js)），不验证"玩家能否实际读到这些关键字"。L3 的 `timeline` 测试只检查 `''地点''` sugar 标记是否存在，不验证"玩家能否构建完整事件顺序"。

### 1.2 目标

设计一个方案，让 Agent 模拟玩家行为：
1. 每次只给予有限的初始信息（`agent_profile.md`）
2. 通过已有信息推理获得其他章节信息
3. 直到推理完所有内容
4. 如果发现推理进入死胡同、出现逻辑谬误、信息不足等，就加以分析、优化、修改剧本

### 1.3 约束

- **不调外部 LLM API**：通过提示词约束 Agent 去执行（复用现有 Agent 会话能力，不引入外部推理服务）
- **样板策略**：island-death 同时承担"正向验证"和"压力测试"两个角色（galley-villa 完全不碰——它无设计文档链，从未走过 9 阶段方法论）
- **试玩次数**：可配置，默认 1 次
- **失败归因 9 类**：信息不足 / 歧义 / 推理谬误 / 死胡同 / meta 触发失败 / 命名不可推断 / 教程解锁错位 / 时空错位 / 无明示需有暗示

---

## 2. 架构概览

### 2.1 两层分离

| 层 | 工具 | 触发 | 成本 | 入口 |
|---|---|---|---|---|
| **L6 静态推理分析** | Vitest（纯 JS 图分析） | 每次 push / PR | 0（毫秒级） | `npm test`（自动含） |
| **L6 推理报告校验** | Vitest | 每次 push / PR | 0 | `npm test`（自动含） |
| **L6 Agent 推理模拟** | Simulator Agent 提示词 + Grader Agent 提示词 | 手工触发 | 人在环 | `npm run reasoning:simulate` |

**关键原则**：L6 Agent 推理模拟**不进 CI**（需要人在 IDE 启动 Agent），但 L6 的**产出**（`inference_report.md` + `inference_trace.json`）入仓后**被 CI 校验存在性 + 格式**。

### 2.2 Agent 角色扩展

现有 8 Agent → 扩展为 **10 Agent**：

| # | Agent | 改动 |
|---|---|---|
| 0 | Director | 加"推理充分性"门禁 |
| 1-5 | Truth / Inference / File / Tag / Meta | 产出新增"推理可读性"标注 |
| 6 | Formal Verifier | 三性检查 + 推理充分性（§11） |
| 7 | Twine Implementer | 不变 |
| 8 | Playtester | **收窄到技术层**（命令可用性 / UI 反馈 / 引擎 bug） |
| **9**（新） | **Inference Simulator** | 黑盒模拟玩家推理 |
| **10**（新） | **Inference Grader** | 白盒判定 F 命中 + 产出 recall / 失败归因 |

### 2.3 Playtester vs Simulator vs Grader 职责分离

| Agent | 视角 | 职责 | 产出 |
|---|---|---|---|
| Playtester | 黑盒 | 命令可用性 / UI 反馈 / 引擎层 bug | `playtest_log.md` |
| Simulator | 黑盒 | 推理路径 / 证据收集 / 推理轨迹 | `inference_trace.json`（过程，不含分数） |
| Grader | 白盒 | F 命中判定 / recall 计算 / 失败归因 | `inference_report.md` + `inference_grades.json`（分数） |

**核心原则**：Simulator 只产过程，Grader 产分数。职责分离，避免"自评"。

---

## 3. 静态推理图分析（L6 静态层）

### 3.1 数据模型

**节点**：
- `File(passagename, tags[], isHidden, unlockConditions[])`
- `Fact(F_id, description, exposes_in: File[], required_for_ending: boolean, verifiable_claims: string[])`

**边（双图模型）**：

| 图 | 边类型 | 数据源 | 含义 |
|---|---|---|---|
| tag 图 | File → File | HTML passage 的 `tags="..."` 属性 | 读完 A 可以通过 tag 互引直达 B |
| 解锁图 | File → File | HTML passage body 的 `<<set $seen_xxx>>` + `<<run $cache.push("...")>>` | 读完 A 触发条件后解锁 B |
| 揭露图 | File → Fact | `file_index.md` 的 `exposes: [F1, F2]` 标注 | A 文件正文显式揭露 F 事实 |

**可达性定义**：F 可达 = tag 图可达 ∪ 解锁图可达（两张图都不可达才判定为不可达）。

**孤儿定义**：非结局文件在**两张图都**无入边 = 孤儿节点。

### 3.2 算法

**算法 1 — F 可达性检测**：
```
对每个 F:
  1. 找 exposes_in[F] 集合（从 file_index.md 的 exposes 标注提取）
  2. 对每个揭露文件，在 tag 图 ∪ 解锁图上 BFS from "00-readme"
  3. 所有揭露文件都不可达 → 标记 "不可达" FAIL
  4. 最短路径 > maxSteps (30) → 标记 "长路径" 警告
```

**算法 2 — 死胡同检测**：
```
对每个公开文件 F:
  1. tag 图后继 ∪ 解锁图后继 = 空 AND F 不是结局文件 → 孤儿节点
  2. 多个孤儿形成连通分量 → 信息孤岛
```

**算法 3 — 双证据检查**：
```
对每个 F:
  1. exposes_in[F] 的文件数 < 2 → 标记 "证据不足" 警告
  2. exposes_in[F] 的文件全来自同一视角（同一人物 ID / 同一地点码）→ 标记 "视角单一" 警告
```

### 3.3 分层执行

| 子层 | 时机 | 职责 | 入仓 |
|---|---|---|---|
| L6a（设计期，人工触发） | 标注完成后 | 解析 HTML tags + 解锁逻辑 + file_index exposes，构建图，产出 `static-reasoning.json` | `test/reasoning/_reports/<game>.static-reasoning.json`（入仓） |
| L6b（CI，每次 push） | 每次 push / PR | 校验 `static-reasoning.json` 格式 + 基于入仓图重算可达性（不重建图） | 报告不入仓 |

**关键原则**：CI 不产出图，只消费入仓图。避免 CI 依赖设计期标注产出。

### 3.4 产物

`test/reasoning/_reports/<game>.static-reasoning.json`（入仓）：
```json
{
  "gameKey": "island-death",
  "generatedAt": "2026-07-09T12:00:00Z",
  "tagGraph": { "nodes": [...], "edges": [...] },
  "unlockGraph": { "nodes": [...], "edges": [...] },
  "facts": [
    {
      "fId": "F1",
      "exposesIn": ["11-11-MV-1", "21-SR-1"],
      "requiredForEnding": true,
      "verifiableClaims": ["赵某推江某", "23:40", "泳池"],
      "reachable": true,
      "shortestPath": 8,
      "evidenceCount": 2,
      "perspectiveDiversity": "sufficient"
    }
  ],
  "unreachableFacts": [],
  "longPathFacts": ["F8"],
  "orphans": [],
  "infoIslands": []
}
```

### 3.5 门禁

- `unreachableFacts.length > 0` → CI fail
- `orphans.length > 0` → CI fail（非结局文件无后继）
- `longPathFacts` → 警告（不 fail，提示 Director 审查）

---

## 4. 设计期"推理可读性"标注

### 4.1 truth.md 扩展

每个 F 事实增加 3 个字段：

| 字段 | 类型 | 含义 | 产出 Agent |
|---|---|---|---|
| `inferability` | `easy \| medium \| hard \| trap` | 推理难度 | Truth Designer |
| `required_for_ending` | `boolean` | 是否通关必需 | Meta & Tutorial Designer |
| `verifiable_claims` | `string[]` | 可机器匹配的关键词列表 | Truth Designer |

**示例**（island-death truth.md 的 F1 扩展）：
```markdown
| F1 | 江某于2017.08.11 23:40被赵某推入泳池，非意外落水 | 监控日志碎片 + 园丁证词 | inferability: medium | required_for_ending: true | verifiable_claims: ["赵某推江某", "23:40", "泳池", "非意外"] |
```

**verifiable_claims 设计原则**：
- 每个 claim 是一个可做子串/数值匹配的短语
- 覆盖 F 的"谁 + 何时 + 何地 + 做了什么"
- Grader 用 claim 覆盖率判定 F 命中（≥ 60% claims 被覆盖 = 命中）

### 4.2 file_index.md 扩展

每个文件条目增加 `exposes` 字段：

```markdown
### 11-11-MV-1
- **tags**: `10-11-MV-1, 12-12-CH-1`
- **exposes**: `F1, F2`          ← 新增
- **内容类型**: 玩家日志
```

**标注规则**：
- `exposes: F1, F2` 表示该文件正文显式揭露了 F1 和 F2
- 只标注"显式陈述"（C2 约束：证据以文件形式可读）
- 隐藏文件 / meta 文件也标注（它们可能揭露 meta 层 F）

### 4.3 axis_matrix.md 扩展

Part 5（三轴交叉表）增加 `evidence_gap` 列：
```markdown
| 事实 F | 揭露于文件 | 时间 | 地点 | 人物 | evidence_gap |
|---|---|---|---|---|---|
| F1 | 11-11-MV-1, 21-SR-1 | 11 | MV | 12, 16 | false |
| F8 | 05-04-SQ-1 | 05 | SQ | 15 | true ← 仅 1 个文件揭露 |
```

### 4.4 标注回填计划

island-death 的 file_index.md 约 95-110 个文件需逐个补 `exposes` 字段。truth.md 的 15 个 F 需补 `inferability` / `required_for_ending` / `verifiable_claims`。

**产出方式**：File Designer 阶段回填（PoC 前置工作）。

---

## 5. Inference Simulator Agent（第 9 个 Agent）

### 5.1 角色定位

你是**对该剧本一无所知的玩家**。你不读 truth.md / file_index.md / axis_matrix.md / tag_graph.md / verification_report.md / playtest_log.md。你**只能**：
- 打开 `games/<key>/<key>.html`（通过 Playwright 或人工操作）
- 像真人一样输入命令（list / find / 文件名等）
- 维护"已知信息摘要"（你的记忆）
- 每条推理必须引用**具体文件名 + 文件内原文片段**

### 5.2 输入

- `games/<key>/agent_profile.md`（唯一允许的设计期输入，经脱敏审查）
- `games/<key>/<key>.html`（游戏本身）
- **禁止注入**：truth.md / file_index.md / axis_matrix.md / tag_graph.md / verification_report.md / playtest_log.md / inference_report.md（历史版本）

### 5.3 输出

`inference_trace.json`（**过程，不含分数**）：
```json
{
  "gameKey": "island-death",
  "trialId": 1,
  "steps": [
    {
      "step": 1,
      "command": "00-readme",
      "response_summary": "欢迎来到珊瑚湾...",
      "reasoning": "了解游戏基本信息",
      "evidence_collected": [
        { "file": "00-readme", "quote": "你是第4任管家", "claim": "玩家是第4任管家" }
      ]
    },
    {
      "step": 5,
      "command": "11-11-MV-1",
      "response_summary": "2017年8月11日晚宴...",
      "reasoning": "想了解江某死亡当晚的情况",
      "evidence_collected": [
        { "file": "11-11-MV-1", "quote": "23:40泳池", "claim": "江某死于23:40泳池" }
      ]
    }
  ],
  "finalInference": "我认为赵某在23:40将江某推入泳池...",
  "outcome": "true_ending"
}
```

### 5.4 证据锚定约束

**每条推理必须引用具体文件名 + 文件内原文片段**。格式：
```json
{ "file": "11-11-MV-1", "quote": "23:40泳池", "claim": "江某死于23:40泳池" }
```

**未引用证据的推理不计分**（Grader 判定时忽略）。这迫使 Simulator 基于证据而非类型套话推理。

### 5.5 类型套话对照组

**baseline Simulator**：只给 `agent_profile.md` 的 §0 题材与基调 + §1 玩家角色，**不打开 HTML 文件**，不让 Agent 输入任何命令。直接要求 Agent 凭题材类型推理"你认为真相是什么"。

其 recall 作为"类型套话基线"——衡量 LLM 预训练数据中类似题材的先验知识能猜对多少。

真实 Simulator recall 必须**显著高于**基线才算有效（差值 ≥ 0.2）。否则判定为"Simulator 未基于证据推理"，结果不可信。

### 5.6 终止条件

- 达成结局（Simulator 自报"我认为真相是..."）
- 卡死（连续 3 步无新信息 / 步数 > 30 / Simulator 自报"放弃"）
- 超时（单次试玩 5 分钟）

### 5.7 试玩次数

可配置，默认 1 次。`agent_profile.md` 声明 `trials: N`。

- N=1：快速调试用
- N=3：门禁用（取最差值，暴露剧本最弱环节）
- N=5+：深度验证用

---

## 6. Inference Grader Agent（第 10 个 Agent）

### 6.1 角色定位

你是**阅卷者**。你持有 truth.md（白盒权限），接收 Simulator 的 `inference_trace.json`，判定 F 命中并产出 recall / 失败归因。

### 6.2 输入

- `truth.md`（含 `verifiable_claims` / `required_for_ending` 标注）
- `inference_trace.json`（Simulator 产出）
- `static-reasoning.json`（L6 静态分析产出，用于交叉校验）

### 6.3 F 命中判定

对每个 F：
1. 从 truth.md 提取 `verifiable_claims`
2. 扫描 Simulator 的 `evidence_collected` 中的 `claim` 字段
3. claim 覆盖 verifiable_claims 的比例 ≥ 60% → 判定 F 命中
4. 记录命中的 claim 列表 + 对应文件

### 6.4 recall 计算

```
required_recall = 命中的 required_for_ending=true 的 F 数 / required_for_ending=true 的 F 总数
optional_recall = 命中的 required_for_ending=false 的 F 数 / required_for_ending=false 的 F 总数
```

**通过标准**：
- `required_recall = 1.0`（通关必需 F 全部推理出）
- `optional_recall ≥ 0.5`（非必需 F 至少推一半）
- 9 类失败归因全为 0

### 6.5 失败归因

对每个**未命中**的 F，Grader 结合 `inference_trace.json` + `static-reasoning.json` 归因到 9 类之一：

| 类型 | 判定规则 | 派单 Agent |
|---|---|---|
| 信息不足 | exposes_in[F] 文件数 < 2 或静态不可达 | File Designer |
| 歧义 | Simulator 推理出"另一套解释"且文件支持 | File Designer |
| 推理谬误 | Simulator 自报推理与证据矛盾 | Meta & Tutorial Designer |
| 死胡同 | Simulator 连续 3 步无新文件 | Tag Graph Designer |
| meta 触发失败 | F 的揭露文件是隐藏文件且无解锁路径 | Meta & Tutorial Designer |
| 命名不可推断 | Simulator 尝试输入文件名但格式错误 | File Designer |
| 教程解锁错位 | Simulator 需要某命令但该命令未解锁 | Meta & Tutorial Designer |
| 时空错位 | Simulator 推理中时间/地点混乱 | Inference Architect |
| 无明示需有暗示 | 文件中存在该信息但既不明示也无暗示 | File Designer |

**判定规则细节**（消除边界模糊）：
- 文件内容中存在该信息但未明示 → "无明示需有暗示"
- 文件中完全无该信息 → "信息不足"
- Simulator 自己说"我觉得 X 但其实是 Y" → "推理谬误"
- Simulator 输入文件名但格式不对（如 `11-MV-1` 少了幕号） → "命名不可推断"

### 6.6 输出

`inference_grades.json`（**分数**）：
```json
{
  "gameKey": "island-death",
  "trialId": 1,
  "requiredRecall": 0.8,
  "optionalRecall": 0.4,
  "factsHit": ["F1", "F2", "F5", "F6", "F14", "F15", "F3", "F4"],
  "factsMissed": ["F7", "F8", "F11", "F13", "F12"],
  "failureCategorization": [
    { "fId": "F7", "type": "信息不足", "detail": "仅 05-04-SQ-1 揭露，无第二证据", "fixTarget": "File Designer" },
    { "fId": "F8", "type": "歧义", "detail": "Simulator 推理苏某知情，与真相矛盾", "fixTarget": "File Designer" },
    { "fId": "F11", "type": "meta 触发失败", "detail": "隐藏文件 00-coroner-report 无解锁路径", "fixTarget": "Meta & Tutorial Designer" }
  ],
  "typeBaseline": {
    "baselineRecall": 0.2,
    "simulatorRecall": 0.53,
    "valid": true
  }
}
```

`inference_report.md`（**人类可读报告**）：汇总多次试玩结果 + 9 类失败归因统计 + 改进建议。

---

## 7. agent_profile.md 规范

### 7.1 多阶段渐进产出

| 阶段 | Agent | 产出内容 |
|---|---|---|
| 阶段 0（Director） | Director | 初版：题材 / 基调 / 时代 / 地点 / 玩家角色 |
| 阶段 5（Meta & Tutorial） | Meta & Tutorial Designer | 补充：禁止透露项清单 + 试玩基线 + 通过标准 |
| 阶段 6（Verifier） | Formal Verifier | 冻结：脱敏审查（确认无 F 事实泄露） |

### 7.2 模板

```markdown
# Inference Simulator 引导文件 · <game>

> 本文件给"模拟玩家"使用，不含任何剧情真相。
> 经 Formal Verifier 脱敏审查冻结。

## 0. 题材与基调
- 题材：<如"南海私人岛屿 / 社会派">
- 基调：<如"meta 心理恐怖">
- 时代：<如"2017-2024 现代">
- 地点：<如"南海珊瑚湾私人岛屿">

## 1. 玩家角色（meta 元素时必须填写）
- 玩家身份：<如"第 4 任管家">

## 2. 玩法预期
- 命令格式：单文本框命令
- 证据形式：所有证据以可读文件形式存在
- 进度：进度 = 已收集文件数（达到阈值触发结局）

## 3. 禁止透露项（必须显式列出）
- F 事实列表：[绝不告诉 Agent]
- 文件清单 / tag 图 / 真相时间线
- 双证据链 / 唯一性反例
- 任何"作者已设计但游戏未呈现"的信息

## 4. 试玩基线
- 步数上限：30
- 卡死判定：连续 3 步无新信息
- 多解容忍度：1
- trials: 1

## 5. 通过标准
- required_recall: 1.0
- optional_recall: 0.5
- 失败归因上限: 0
```

---

## 8. 剧本修改流程（RFC 集成）

### 8.1 新增硬约束 C10

在 SKILL.md §3.2 的 9 项硬约束后追加：

| # | 约束 | 含义 |
|---|---|---|
| C10 | 推理充分性可验证 | 每个剧本必须通过 Inference Simulator + Grader 黑盒验证（required_recall = 1.0，9 类失败归因全为 0），且 L6 静态分析无不可达 F / 无孤儿文件 |

**C10 为过程约束**（非纯结果约束）：
- L6 静态（CI 硬门禁）：F 可达性 + 死胡同 → 阻塞
- L6 模拟（人工触发，质量门禁）：必须存在 `inference_report.md` 且 9 类归因有处理记录

### 8.2 RFC 流程

```
Grader 报告 FAIL（required_recall < 1.0 或 9 类失败 > 0）
  ↓
Director 审查 inference_report.md + inference_grades.json
  ↓
按 §6.5 派单映射 → 召集对应 Agent
  ↓
Agent 修改（区分 truth 冻结状态）：
  - truth 已冻结 → 走 RFC 不动 truth.md
  - truth 未冻结 → 允许 Truth Designer 修订，但须 Director 重新签字
  ↓
Formal Verifier 重跑三性 + 推理充分性专项检查
  ↓
PASS → 重跑 Simulator + Grader 验证
  ↓
Simulator + Grader PASS → inference_report.md 更新 → 流程结束
```

### 8.3 前置门禁

Simulator 只在 **L1-L5 全 PASS** 的剧本上跑。避免引擎 bug（如中文 sanitize 缺陷）被误归因为推理设计问题。

### 8.4 报告归档

| 文件 | 位置 | 入仓 |
|---|---|---|
| `inference_trace.json` | `games/<key>/inference_trace.json` | ✓ |
| `inference_grades.json` | `games/<key>/inference_grades.json` | ✓ |
| `inference_report.md` | `games/<key>/inference_report.md` | ✓ |
| `static-reasoning.json` | `test/reasoning/_reports/<game>.static-reasoning.json` | ✓ |

**Formal Verifier** 在 `verification_report.md` 新增 §11：
```markdown
### Part 11: 推理充分性验证（C10）
- Simulator 试玩次数：N
- required_recall：X.XX
- optional_recall：X.XX
- 类型套话基线：X.XX（valid: true/false）
- 9 类失败归因统计：
  | 类型 | 次数 | 具体定位 |
  |---|---|---|
- 结论：PASS / FAIL
- 修补建议（如有 FAIL）：<指向性建议>
```

---

## 9. CI 集成

### 9.1 L6 静态层测试

**新增文件**：
- `test/helpers/reasoning.js` — 图构建 + BFS + 死胡同检测纯函数
- `scripts/build-reasoning-graph.js` — L6a 脚本：解析 HTML + file_index.md，构建图，产出 `static-reasoning.json`（人工触发）
- `test/reasoning/static-reasoning.test.js` — L6b 测试：消费入仓的 `static-reasoning.json`，重算可达性 + 死胡同 + 断言无 FAIL（CI 跑）
- `test/reasoning/helpers.test.js` — 纯函数自测（用合成 fixture）
- `test/reasoning/report-validation.test.js` — L2 产出格式校验

**L6a / L6b 分离**：
- L6a（`scripts/build-reasoning-graph.js`）：人工触发，解析 HTML `tags=""` 属性 + `<<set $seen_xxx>>` / `<<run $cache.push()>>` + `file_index.md` 的 `exposes` 标注，构建图，产出 `test/reasoning/_reports/<game>.static-reasoning.json` 入仓
- L6b（`test/reasoning/static-reasoning.test.js`）：CI 跑，读入仓的 `static-reasoning.json`，重算 F 可达性 + 死胡同 + 双证据，断言无 FAIL。**不重建图**，只消费

**合成 fixture**（`tests-fixtures/reasoning-graph.html`）：
- 3 个文件：`00-readme` → `01-ST-1` → `02-BR-1`
- 2 个 F：F1 被 `01-ST-1` 揭露，F2 被 `02-BR-1` 揭露
- 1 个孤儿：`03-OR-1`（无 tag 指向，非结局）
- 预期：`unreachableFacts = []`，`orphans = ["03-OR-1"]`

**test.config.js 扩展**：
```javascript
reasoning: {
  enabled: true,
  maxSteps: 30,
  startPassage: '00-readme',
  endingPassages: [],
}
```

### 9.2 L6 报告校验测试

| # | 测试用例 | 验证目标 |
|---|---|---|
| R1 | 有 HTML 的剧本必须有 `inference_report.md` | 存在性 |
| R2 | 有 HTML 的剧本必须有 `inference_trace.json` + `inference_grades.json` | 存在性 |
| R3 | `inference_trace.json` 结构合规 | `steps[]` / `evidence_collected[]` / `finalInference` |
| R4 | `inference_grades.json` 结构合规 | `requiredRecall` / `optionalRecall` / `failureCategorization[]` |
| R5 | `inference_report.md` 含 9 类失败归因章节 | 格式校验 |

**豁免规则**：
- `terminal-mystery`（无 HTML）→ 跳过
- `galley-villa`（无设计文档链）→ 跳过
- 新剧本首次接入时给 30 天豁免期（`test.config.js` 声明 `reasoning.gracePeriod: true`）

### 9.3 手工触发

```json
// package.json scripts
"reasoning:build-graph": "node scripts/build-reasoning-graph.js",
"reasoning:simulate": "node scripts/reasoning-simulator-launcher.js"
```

**L6a 构图**：`npm run reasoning:build-graph -- --game=island-death` → 产出 `static-reasoning.json` → git add + commit

**launcher 职责**（`scripts/reasoning-simulator-launcher.js`）：
- 读 `games/<key>/agent_profile.md` + `test.config.js`
- 输出 Simulator + Grader 两段提示词到 stdout
- 不调 LLM API — 只做"组装 prompt + 指引"

**用户操作流程**：
1. `npm run reasoning:simulate -- --game=island-death`
2. 复制 stdout 的 Simulator 提示词
3. 在 IDE 中启动**新会话**（独立会话，禁止注入设计文档），粘贴提示词
4. Simulator 执行试玩 → 产出 `inference_trace.json`
5. 复制 stdout 的 Grader 提示词
6. 在 IDE 中启动**新会话**（白盒权限，可读 truth.md），粘贴提示词
7. Grader 判定 → 产出 `inference_grades.json` + `inference_report.md`
8. 存到 `games/island-death/` → git add + commit

---

## 10. 文档更新清单

| 文件 | 更新内容 |
|---|---|
| `AGENTS.md` §3 表 1 | 追加 C10 约束行 |
| `AGENTS.md` §3 表 2 | L1-L5 后追加 L6 推理分析层 |
| `AGENTS.md` §5 | §8 经验教训引用加"推理充分性"章节 |
| `README.md` §设计方法论 | 9 项硬约束 → 10 项 |
| `.trae/skills/typehelp-novel-design/SKILL.md` §3.2 | 9 项硬约束 → 10 项 |
| `.trae/skills/typehelp-novel-design/SKILL.md` §3.3 | 9 阶段 → 11 阶段（加阶段 9 Simulator + 阶段 10 Grader） |
| `.trae/skills/typehelp-novel-design/SKILL.md` §4 | 8 Agent → 10 Agent |
| `.trae/skills/typehelp-novel-design/SKILL.md` §6 | 工作流加 Step 19: Simulator + Step 20: Grader |
| `.trae/skills/typehelp-novel-design/SKILL.md` §8 | 加 §8.14 推理充分性测试经验教训 |
| `.trae/specs/typehelp-novel-design/prompts/` | 新增 `inference-simulator.md` + `inference-grader.md` |
| `.trae/specs/typehelp-novel-design/prompts/README.md` | Agent 索引加第 9、10 个 |
| `games/framework_diff.template.md` | 加"推理充分性配置"模板段 |

---

## 11. PoC 验证计划

### 11.1 阶段 A：L6 静态层框架搭建

**目标**：L6 静态分析在 island-death 上正确运行（能构建图 + 检测可达性）

**前置工作**：
1. island-death 的 file_index.md 逐文件补 `exposes` 标注（File Designer，约 95-110 文件）
2. island-death 的 truth.md 逐 F 补 `inferability` / `required_for_ending` / `verifiable_claims`（Truth Designer，15 个 F）
3. 从 island-death HTML 提取 `tags=""` 属性 + `<<set $seen_xxx>>` / `<<run $cache.push()>>` 解锁逻辑

**步骤**：
1. 写 `test/helpers/reasoning.js`（纯函数）
2. 写 `test/reasoning/helpers.test.js`（合成 fixture 自测）
3. 写 `test/reasoning/static-reasoning.test.js`（接 `forAllGames`）
4. 在 `games/island-death/test.config.js` 加 `reasoning` 配置
5. 跑 `npx vitest run test/reasoning/`

**退出条件**：
- helpers 自测全 PASS
- island-death 静态分析产出 `static-reasoning.json`
- 报告中至少 1 个 FAIL 项（用户已确认有死胡同）或至少标记出长路径 / 证据不足

### 11.2 阶段 B：L2 Agent 推理模拟在 island-death 上暴露问题

**目标**：Simulator + Grader 在 island-death 上跑出 recall + 失败归因

**步骤**：
1. 产出 `games/island-death/agent_profile.md`（多阶段渐进：Director 初版 → Meta 补禁止透露项 → Verifier 冻结）
2. 写 `.trae/specs/typehelp-novel-design/prompts/inference-simulator.md` + `inference-grader.md`
3. 写 `scripts/reasoning-simulator-launcher.js`
4. `npm run reasoning:simulate -- --game=island-death`
5. 启动 Simulator 会话 → 产出 `inference_trace.json`
6. 启动 Grader 会话 → 产出 `inference_grades.json` + `inference_report.md`
7. 跑类型套话对照组（baseline Simulator）

**退出条件**：
- island-death 修改前：required_recall < 1.0，至少 1 个失败归因
- 失败归因有**具体定位**（哪个 F / 哪个文件 / 为什么）
- 类型套话基线 valid: true（Simulator recall 显著高于基线）

### 11.3 阶段 C：island-death 剧本修复 + 重验

**目标**：按失败归因修改剧本 → 重跑 Simulator + Grader → 通过

**步骤**：
1. Director 审查 `inference_report.md`
2. 按派单映射召集对应 Agent 修改
3. 修改剧本文档 + HTML
4. 重跑 L1-L5 确认全 PASS
5. 重跑 L6 静态层 → 确认静态层也 PASS
6. 重跑 Simulator + Grader → 确认 required_recall = 1.0

**退出条件**：
- island-death 修改后：required_recall = 1.0，9 类失败归因 = 0
- `inference_report.md` + `inference_grades.json` + `inference_trace.json` 入仓
- `verification_report.md` §11 签字 PASS
- `npm test` 全 PASS（含 L6 新增测试）

### 11.4 阶段依赖

```
阶段 A（静态框架 + 标注回填）
  ↓ 不通过则修框架或补标注
阶段 B（Agent 模拟暴露问题）
  ↓ 必须先有静态基线
阶段 C（修复 + 重验）
  ↓ 最终产出
全流程结束
```

### 11.5 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| 标注回填工作量过大 | 中 | 阻塞 PoC | 分批回填：先回填 required_for_ending=true 的 F（约 8-10 个），验证流程跑通后再回填剩余 |
| Simulator "作弊" | 中 | 结果不可信 | 独立会话 + agent_profile 脱敏审查 + 证据锚定 + 类型套话对照 |
| Grader 判定不准 | 中 | recall 不可信 | verifiable_claims 用精确子串匹配，不用 LLM 主观判定 |
| island-death 死胡同无法修复 | 低 | 阻塞流程 | truth 未冻结 → 允许 Truth Designer 修订真相 |
| 9 类失败归因边界模糊 | 低 | 派单错误 | §6.5 判定规则细节已定义边界 |

---

## 12. PoC 完成标准（Definition of Done）

- [ ] `test/helpers/reasoning.js` + 自测 PASS
- [ ] island-death file_index.md 补 `exposes` 标注
- [ ] island-death truth.md 补 `inferability` / `required_for_ending` / `verifiable_claims`
- [ ] `test/reasoning/static-reasoning.test.js` 在 island-death 运行并暴露问题
- [ ] `.trae/specs/.../prompts/inference-simulator.md` + `inference-grader.md` 完成
- [ ] `games/island-death/agent_profile.md` 产出
- [ ] `games/island-death/inference_trace.json` 产出（修改前）
- [ ] `games/island-death/inference_grades.json` + `inference_report.md` 产出（修改前，暴露问题）
- [ ] island-death 剧本修改完成（走 RFC）
- [ ] `games/island-death/inference_*` 更新（修改后，required_recall = 1.0）
- [ ] `verification_report.md` §11 签字 PASS
- [ ] SKILL.md / AGENTS.md / README.md 文档更新
- [ ] `npm test` 全 PASS（含 L6 新增测试）
