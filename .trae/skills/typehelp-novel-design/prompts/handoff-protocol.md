# 交接协议（Handoff Protocol）

> 所有 Agent 间的交接必须使用本协议。
> 缺失字段视为交接不完整，下游 Agent 应驳回。

---

## 1. 交接单格式

每个 Agent 完成时必须产出 `handoff.json`（也可写在文档末尾）：

```json
{
  "from": "<上游 Agent 编号 + 名称>",
  "to": "<下游 Agent 编号 + 名称>",
  "deliverables": [
    "<产出文件 1>",
    "<产出文件 2>"
  ],
  "assumptions": [
    "<假设 1>",
    "<假设 2>"
  ],
  "open_questions": [
    "<未解决问题 1>",
    "<未解决问题 2>"
  ],
  "blockers": [
    "<阻塞项 1>"
  ],
  "next_step": "<给下游 Agent 的明确指示>",
  "deadline": "<如有>"
}
```

---

## 2. 各 Agent 的固定交接格式

### Director → Truth Designer
```json
{
  "from": "00-Director",
  "to": "01-Truth Designer",
  "deliverables": ["charter.md"],
  "assumptions": [
    "TypeHelp C2 约束（无询问 NPC）已遵守",
    "核心诡计已选定并写入 charter.md"
  ],
  "open_questions": [],
  "blockers": [],
  "next_step": "请基于 charter.md 撰写 truth.md + timeline.json。物理可行性必须 100% 通过。"
}
```

### Truth Designer → Inference Architect
```json
{
  "from": "01-Truth Designer",
  "to": "02-Inference Architect",
  "deliverables": ["truth.md", "timeline.json"],
  "assumptions": [
    "真相层已 Director 签字冻结",
    "至少 5 个 F 事实"
  ],
  "open_questions": [
    "若 F 事实过少，是否需要 Director 决定扩展诡计？"
  ],
  "blockers": [],
  "next_step": "请基于 truth.md 撰写 axis_matrix.md。每个 F 至少 2 个文件揭露。"
}
```

### Inference Architect → File Designer
```json
{
  "from": "02-Inference Architect",
  "to": "03-File Designer",
  "deliverables": ["axis_matrix.md"],
  "assumptions": [
    "三轴定义清晰",
    "F 事实双证据原则已自检"
  ],
  "open_questions": [
    "如某 F 反例构造成功，是否需要回退到 Truth Designer 改真相？"
  ],
  "blockers": [],
  "next_step": "请基于 axis_matrix.md 撰写 naming_matrix.md + file_index.md。presence list 严格按 truth。"
}
```

### File Designer → Tag Graph Designer
```json
{
  "from": "03-File Designer",
  "to": "04-Tag Graph Designer",
  "deliverables": ["naming_matrix.md", "file_index.md"],
  "assumptions": [
    "所有文件名符合 TypeHelp C3 约束",
    "关键证据已显式陈述"
  ],
  "open_questions": [],
  "blockers": [],
  "next_step": "请基于 file_index.md 撰写 tag_graph.md。"
}
```

### Tag Graph Designer → Meta & Tutorial Designer
```json
{
  "from": "04-Tag Graph Designer",
  "to": "05-Meta & Tutorial Designer",
  "deliverables": ["tag_graph.md"],
  "assumptions": [
    "可达性已自检",
    "无孤立节点"
  ],
  "open_questions": [],
  "blockers": [],
  "next_step": "请基于 tag_graph.md + file_index.md 撰写 tutorial_design.md + hidden_files.md + ending_design.md。"
}
```

### Meta & Tutorial Designer → Formal Verifier
```json
{
  "from": "05-Meta & Tutorial Designer",
  "to": "06-Formal Verifier",
  "deliverables": ["tutorial_design.md", "hidden_files.md", "ending_design.md"],
  "assumptions": [
    "6 个 $seen_xxx 都有触发位置",
    "3 个隐藏文件都有触发路径"
  ],
  "open_questions": [],
  "blockers": [],
  "next_step": "请执行三性检查。FAIL 时必须驳回并给出具体修补建议。"
}
```

### Formal Verifier → Twine Implementer
```json
{
  "from": "06-Formal Verifier",
  "to": "07-Twine Implementer",
  "deliverables": ["verification_report.md"],
  "assumptions": [
    "三性全 PASS",
    "9 项硬约束全过"
  ],
  "open_questions": [],
  "blockers": [],
  "next_step": "PASS 后请将所有设计文档翻译为 TypeHelp_NewGame.html。1:1 一致。"
}
```

### Twine Implementer → Playtester
```json
{
  "from": "07-Twine Implementer",
  "to": "08-Playtester",
  "deliverables": ["TypeHelp_NewGame.html"],
  "assumptions": [
    "5 个抽样文件 1:1 一致",
    "浏览器可打开"
  ],
  "open_questions": [],
  "blockers": [],
  "next_step": "请按 Playtester 工作流试玩。真实记录卡点与误解。"
}
```

### Playtester → Director
```json
{
  "from": "08-Playtester",
  "to": "00-Director",
  "deliverables": ["playtest_log.md"],
  "assumptions": [
    "试玩路径真实记录",
    "结局真实报告"
  ],
  "open_questions": [
    "如完成率 < 80%，是否需要返工？"
  ],
  "blockers": [],
  "next_step": "请基于试玩数据决定是否需要返工。"
}
```

---

## 3. 变更控制（RFC）

### RFC 触发条件
- 修改已 Director 签字冻结的文档（truth.md / timeline.json）
- 修改已 Formal Verifier PASS 的设计
- 修改已 Implementer 翻译的实现

### RFC 流程
1. 提议方撰写 RFC.md（含变更原因 + 影响分析 + 回滚方案）
2. 提交给 Director
3. Director 召集相关 Agent 评审
4. 评审通过 → Director 签字 → 实施变更
5. 实施后必须由 Formal Verifier 重跑三性检查

### RFC 模板
```markdown
# RFC-001：<变更标题>

## 提出方
<Agent 编号 + 名称>

## 变更原因
<为什么需要改？>

## 变更内容
<具体改什么？>

## 影响分析
- 受影响的 Agent：
- 受影响的文档：
- 风险评估：

## 回滚方案
<如果变更失败，如何回滚？>

## 测试方案
<如何验证变更成功？>
```

---

## 4. 紧急停止协议

任何 Agent 发现以下情况之一，**必须**立即停止并报告 Director：
- 物理可行性自检 FAIL
- 同一 F 事实有 > 1 个自洽解释
- 设计文档之间矛盾（如 truth.md 与 file_index.md 不一致）
- Implementer 发现设计无法 1:1 翻译

Director 收到紧急报告后：
- 召集相关 Agent
- 决定回滚 / 修改 / 重新设计
- 走 RFC 流程
