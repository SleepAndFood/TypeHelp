# Agent 提示词框架总纲

> 本目录提供一套**多角色 Agent 协作开发 TypeHelp 文字推理游戏剧本**的提示词框架。
> 适用于任何支持 system prompt + 上下文注入的 LLM Agent 平台。

---

## 1. 框架结构

```
prompts/
├── README.md                   ← 本文件（总纲 + 协作流）
├── startup-template.md         ← Director 启动新项目时使用的输入模板
├── handoff-protocol.md         ← Agent 间交接协议（标准格式）
├── director.md                 ← 00 总导演
├── truth-designer.md           ← 01 真相设计师
├── inference-architect.md      ← 02 推理架构师
├── file-designer.md            ← 03 文件设计师
├── tag-graph-designer.md       ← 04 互引图设计师
├── meta-tutorial-designer.md   ← 05 Meta 与教程设计师
├── formal-verifier.md          ← 06 形式化验证员
├── twine-implementer.md        ← 07 Twine 实现器
└── playtester.md               ← 08 试玩员（黑盒）
```

---

## 2. 协作流（按方法论 9 阶段，阶段编号 0-8）

```
┌────────────────────────────────────────────────────────┐
│ Director（总导演）                                      │
│  · 接收项目启动请求                                     │
│  · 产出 charter.md                                      │
│  · 冻结真相层 / 阶段门禁 / 冲突仲裁                      │
└────────────┬───────────────────────────────────────────┘
             │ handoff
             ▼
┌────────────────────────────────────────────────────────┐
│ Truth Designer（真相设计师）                            │
│  · 产出 truth.md + timeline.json                        │
│  · 物理可行性自检                                       │
│  · 真相层冻结                                           │
└────────────┬───────────────────────────────────────────┘
             │ handoff
             ▼
┌────────────────────────────────────────────────────────┐
│ Inference Architect（推理架构师）                       │
│  · 产出 axis_matrix.md（三轴交叉表）                    │
│  · 双证据原则自检                                       │
└────────────┬───────────────────────────────────────────┘
             │ handoff
             ▼
┌────────────────────────────────────────────────────────┐
│ File Designer（文件设计师）                              │
│  · 产出 naming_matrix.md + file_index.md                │
│  · presence list 严格按 truth                          │
└────────────┬───────────────────────────────────────────┘
             │ handoff
             ▼
┌────────────────────────────────────────────────────────┐
│ Tag Graph Designer（互引图设计师）                       │
│  · 产出 tag_graph.md（标签互引图）                      │
│  · 无孤立 / 无环 / 可达性自检                            │
└────────────┬───────────────────────────────────────────┘
             │ handoff
             ▼
┌────────────────────────────────────────────────────────┐
│ Meta & Tutorial Designer（meta 与教程设计师）            │
│  · 产出 tutorial_design.md                              │
│  · 产出 hidden_files.md + ending_design.md              │
└────────────┬───────────────────────────────────────────┘
             │ handoff
             ▼
┌────────────────────────────────────────────────────────┐
│ Formal Verifier（形式化验证员）                          │
│  · 产出 verification_report.md                          │
│  · 唯一性 / 完备性 / 可达性三性检查                       │
│  · 可驳回上游产物                                       │
└────────────┬───────────────────────────────────────────┘
             │ handoff
             ▼
┌────────────────────────────────────────────────────────┐
│ Twine Implementer（Twine 实现器）                        │
│  · 产出 TypeHelp_NewGame.html                           │
│  · 与设计文档 1:1 对齐                                  │
└────────────┬───────────────────────────────────────────┘
             │ handoff
             ▼
┌────────────────────────────────────────────────────────┐
│ Playtester（试玩员，黑盒）                              │
│  · 产出 playtest_log.md                                 │
│  · 招募真实玩家测试                                     │
└────────────────────────────────────────────────────────┘
```

---

## 3. 阶段门禁（Director 把关）

| 阶段 | 门禁条件 | 否决权 |
|---|---|---|
| Charter | 8 字段完整 + Director 签字 | Director |
| Truth | 物理可行 + Director 冻结真相 | Director |
| Inference | 每个 F 至少 2 个文件揭露 | Director |
| File Design | presence list 与 truth 一致 | Director |
| Tag Graph | 无孤立 / 无环 | Director |
| Meta & Tutorial | 命令解锁节奏合理 | Director |
| Verification | 三性全 PASS | Formal Verifier（独立否决权）|
| Implementation | 与设计一致 | Implementer 自检 |
| Playtest | 完成率 ≥ 80% | Director |

---

## 4. 启动新项目

把 [startup-template.md](startup-template.md) 中的模板填好，发送给 Director Agent。
Director 会产 charter.md，然后按交接协议启动 Truth Designer。

---

## 5. 使用方法

**单 Agent 平台**：
- 按顺序逐个启动 Agent：Director → Truth → Inference → ... → Playtester
- 每次 handoff 时把上游产物 + Director 的下一阶段指令注入到新 Agent 的 system prompt

**多 Agent 平台**（支持并行）：
- Charter 后，Truth Designer 单线程（基础）
- Inference Architect 完成后可与 File Designer 串行（File Designer 兼任命名 + 内容）
- Tag Graph Designer 与 Meta & Tutorial Designer 可并行（都依赖 File Designer 产物）
- Formal Verifier **必须等所有设计文档齐备**才介入（独立否决权）
- Twine Implementer 必须等 Verifier PASS
- Playtester 必须等 Implementer 完成（黑盒测试）

---

## 6. 关键原则

1. **真相冻结**——Truth Designer 产出的真相层一旦 Director 签字，所有下游修改须经 Formal Verifier 重跑三性检查
2. **每层只产一类文档**——Agent 不越界，不修改上游已冻结产物
3. **handoff 标准化**——所有交接必须用 handoff-protocol.md 中的格式
4. **Verifier 否决权**——Formal Verifier 是唯一可"驳回上游"的角色
5. **可追溯**——每个决策都有 charter / truth / verifier 报告作为依据
