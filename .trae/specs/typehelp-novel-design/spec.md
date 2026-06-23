# TypeHelp 文字推理游戏·剧本设计方法论（最终版 v3）

> 本文档基于对 `TypeHelp.html` 源码（pid 1 Box、108 readme、109–112 inbox/messages、113 Background、114 Start、116 final-note、117 Loading、118 End、71 act-structure、104 references、105 dream、106 invitation 等）的逐段阅读，校准了前期方法论中"框架无关"的假设，输出一套与 TypeHelp 引擎能力 **1:1 对齐** 的设计方法论。

---

## 0. 核心立场

**TypeHelp 不是"选项式 AVG"，而是"终端 + 证据浏览器 + meta 叙事"**。
玩家不点 `<</link>>` 跳转，而是在文本框输入**文件名 / 关键字 / 命令**。
游戏的核心动作是**搜集、检索、交叉对比**。剧本的本质，是为这个动作设计"足够丰富又能交叉验证"的证据集。

---

## 1. 来自源码的 9 项硬约束

> 任何设计如果违反这 9 项硬约束，在 TypeHelp 引擎下不可实现或体验崩塌。

| # | 硬约束 | 源码依据 | 对设计的影响 |
|---|---|---|---|
| **C1** | **所有交互通过 Box 单一文本框输入命令** | pid 1 `Box` 是唯一命令分发器，所有 `<<elseif>>` 分支处理命令 | 不能设计"点击物体调查"类动作；只能设计"输入字符串" |
| **C2** | **玩家没有 inventory / 道具栏 / 询问 NPC 机制** | `$cache` 数组是唯一"收集物"；没有 `inventory` 变量 | 证据必须**全部以文件形式可读取**；不可"问 A 关于 B"获取信息 |
| **C3** | **文件名 = 元数据 = 隐式线索** | `02-EN-1-6-7-10` = 时间 02 / 地点 EN(玄关) / 在场 1,6,7,10 | 文件名本身就是谜题一部分，必须在设计稿中固化 |
| **C4** | **tag 字段承担"文件互引图"** | 列表显示灰色数字 = 引用数（pid 1 list 段 `tag_count -= 1 if $cache.includes(_tags[_j])`） | 每个文件必须显式声明"读了它能解锁谁" |
| **C5** | **进度 = 收集文件数** | `$cache_max = 98`；`(_progress >= 98 - 2) → $is_complete = true` | 总文件数应设计为 95–100（扣除 2 个隐藏） |
| **C6** | **meta 元素必须存在** | 00-dream、00-final-note、25-WI-K、hidden tag `25-WI-K` | meta 元素是 TypeHelp 的灵魂，至少 2 个隐藏文件 |
| **C7** | **教程渐进式解锁** | `$seen_name / $seen_title / $seen_note / $seen_find / $seen_hangman` 标志 | 不能一次性塞给玩家所有命令；必须分布在 4 幕中 |
| **C8** | **多视角通过"同事件多文件"实现** | 例如 02-EN-1-6-7-10 与 03-LI-1-4-5-6-7-8-9 都包含人物 1,6,7 | 同一事件必须被 ≥ 2 个文件以不同视角记录 |
| **C9** | **唯一结局 = 收集阈值 + 阅读 final-note** | `$is_complete && $final_message_viewed && visited(00-final-note) → End` | 设计唯一的"通关条件"；其他结局都是伪结局或未完成态 |

---

## 2. 设计哲学：4 个不再"模糊"

| 前期方法论 | 最终版（校准后） |
|---|---|
| "任务链" | **"文件证据集"**——不是节点跳转，是 N 个文件的"证据密度设计" |
| "跳转 DAG" | **"标签互引图 (Tag Reference Graph)"**——是 has-a 关系，不是 next 关系 |
| "Q-Tree" | **"三轴交叉矩阵 (Time × Location × Character)"**——以证据轴替代推理检查点 |
| "节点触发条件" | **"出现人物列表 (presence list)"**——以 `人物ID列表` 表达"谁在场" |

---

## 3. 九阶段设计流程（按 TypeHelp 适配）

> 流程编号 0-8，详见 `prompts/README.md` 与 `skills/typehelp-novel-design/SKILL.md`。
> 本 spec.md 中"阶段 4 命名约定矩阵"在 8-Agent 体系下并入"阶段 3 文件内容设计"（File Designer 兼做命名 + 内容）；"阶段 6 渐进教程"在 8-Agent 体系下并入"阶段 5 教程与 meta"。详见 [第 8 节：与 8-Agent 体系对齐](#8-与-8-agent-体系对齐)。

### 阶段 0：立项 Charter

| 字段 | 必填 | 说明 |
|---|---|---|
| 题材 | ✓ | 嘉利别墅型 / 办公室密室 / 太空船 / 民国药铺等 |
| 基调 | ✓ | 古典本格 / 新本格 / 心理悬疑 / meta 恐怖 |
| 时代 | ✓ | 时间与世界观 |
| 核心诡计 | ✓ | 时间 / 身份 / 信息差 / 物证 / meta 等 |
| 目标受众 | ✓ | 推理老手 / 新手 / 混合 |
| 目标文件数 | ✓ | 推荐 95–100，扣除 2 隐藏后约 95 |
| 幕数 | ✓ | 默认 4 幕，参考 `$act_starts = ["00","07","14","21","99"]` |
| meta 方向 | ✓ | 调查员视角 / 旁观者视角 / 嵌套循环等 |

**产出**：`charter.md`

### 阶段 1：真相设计（Truth Design，**与前期一致**）

产出 `truth.md` + `timeline.json`：
- 完整时间线（精确到分钟）
- 客观事实表 F1, F2, ...
- 最终真相段
- 物理可行性自检

**与 TypeHelp 的接口**：所有 F 事实最终必须**显式出现在某文件的文本中**（C2 约束）。

### 阶段 2：三轴交叉矩阵（取代 Q-Tree）

设计三条**正交证据轴**，每条轴上的事实只能在该轴对应的文件类型中揭露：

| 轴 | 设计要点 | 在 TypeHelp 中的体现 |
|---|---|---|
| **时间轴 T (01-26)** | 每段时间有 1 个"核心事件" | 时间码 `XX` 必须连续覆盖所有幕 |
| **地点轴 L (2 字母编码)** | 每个地点有 1 个"地标特征" | 地点码 `LC` 至少 5 个，每个地点 3-6 个文件 |
| **人物轴 P (1-12 编号)** | 每个人都有"在场记录" | 人物 ID 出现在 presence list 中 |

**三轴交叉表 `axis_matrix.md`** 模板：

| 事实 F | 揭露于文件 | 时间码 | 地点码 | 涉及人物 |
|---|---|---|---|---|
| F1 死亡时间 18:05 | 04-ST-1-5-8 | 04 | ST | 1,5,8 |
| F2 凶手有钥匙 | 02-EN-1-6-7-10 | 02 | EN | 1,6,7,10 |
| F3 监控 18:30 失效 | 11-??-?... | 11 | ?? | ... |

**关键检查**：每个 F 至少在 2 个不同文件/视角中出现（**双证据原则**）。

### 阶段 3：文件内容设计（含命名约定，File Designer 负责）

为每个文件设计内容，**3 段式模板**：

```
<文件名> (tags="<关联文件名1> <关联文件名2> ...")

[@] <叙述者注>——教程/氛围/meta
    - 若首次出现某命令：在行内 <<set $seen_xxx to true>>

[角色ID] <对话/陈述>
    - 数字 ID 必须与 $people 数组一致
    - 不出现的角色不许乱挂 ID
    - 同事件不同文件的 ID 列表必须严格反映"谁在场"

[@] <补充注>——提示/暗示/伏笔
```

**关键规则**：
1. 同一事件必须被 ≥ 2 个文件以**不同角色视角**描述（C8）
2. 每个文件至少 1 行 `[@]` 注——这是教程/伏笔/进度解锁的唯一载体
3. 关键证据**不能藏在隐喻里**——必须显式陈述
4. 时间戳、地点名、人物名必须**与 truth.md 完全一致**

**命名约定（File Designer 同时负责）**——设计完整的 `XX-LC-?` 编码表：

**时间码 XX**：

| 码 | 含义 | 必含事件 |
|---|---|---|
| 00 | meta 层（readme / dream / final-note / invitation / references / act-structure / audio-recovery / list-of-names） | 8 个固定结构 |
| 01-06 | 第一幕 IGNORANCE | 启程/抵达/初遇 |
| 07-13 | 第二幕 CONFUSION | 第一次死亡/怀疑 |
| 14-20 | 第三幕 TERROR | 加速死亡/真相浮出 |
| 21-26 | 第四幕 RECKONING | 揭示/收束 |

**地点码 LC**（示例，需根据题材重设）：

| 码 | 地点 | 至少文件数 |
|---|---|---|
| EN | 玄关 / Entrance | 2-3 |
| LI | 客厅 / Living Room | 3-5 |
| ST | 书房 / Study | 3-4 |
| KI | 厨房 / Kitchen | 2-3 |
| DI | 餐厅 / Dining | 1-2 |
| ED | 卧室 / Bedroom | 1-2 |
| AT | 阁楼 / Attic | 1-2（meta 场景） |
| WI | ？？ | 1（meta 隐藏） |

**presence list 规则**：
- 数字 1-12 = 固定角色
- `K` = Katherine（电话女声）
- `@` = 叙述者
- 列表必须按"事件实际在场"填入，**不可空挂**

**产出**：`file_index.md` + `naming_matrix.md`

### 阶段 4：标签互引图（取代 DAG）

每个文件的 `tags="..."` 字段必须显式列出**"读了它能解锁谁"**。

**互引设计原则**：
1. **就近引用**：同时间码 / 同地点码的文件互相引用
2. **视角引用**：同事件的不同视角文件互相引用
3. **教程引用**：含 `[@]` 教程的文件引用后续需要该命令的文件
4. **meta 引用**：meta 文件引用 25-WI-K 这类隐藏文件

**互引图模板 `tag_graph.md`**：

```
01-QU-1-11 ──→ 02-EN-1-6-7-10 ──→ 03-LI-1-4-5-6-7-8-9
                                      ↓
04-ST-????  ←─┘                      ↓
  ↓                                   ↓
25-WI-K  ←────── (隐藏 meta 收束) ────┘
```

**自检**：图中所有文件可达；无孤立节点；无环（如果故意设计"回头查"，需文档说明）。

### 阶段 5：教程与 meta 设计（Meta & Tutorial Designer 负责）

教程与 meta 元素在 8-Agent 体系下由同一 Agent 产出。

#### 5a. 渐进教程设计（取代 L0-L3 提示）

TypeHelp 没有"提示"按钮，**教程通过 `[@]` 行 + `<<set $seen_xxx to true>>` 渐进解锁**。

| 命令 | 首次出现位置 | 解锁逻辑 |
|---|---|---|
| `name` | 第一次有 3+ 角色对话的文件 | `<<set $seen_name to true>>` |
| `title` | 第三幕 | 让玩家开始整理时间线 |
| `act` | 第一幕结束时 | 玩家开始思考分段 |
| `note` | 第一具尸体发现后 | 玩家需要记笔记 |
| `find` | 第二幕中段 | 玩家需要回溯 |
| `hangman` | 第四幕初 | meta 解锁小游戏 |

**自检**：每条命令的首次出现时间合理（不早不晚）；`[$first_xxx]` 一次性提示有触发条件。

**产出**：`tutorial_design.md`

#### 5b. 隐藏文件与结局

**隐藏文件清单**（参考 TypeHelp）：

| 文件 | 触发条件 | 内容性质 |
|---|---|---|
| `00-dream` | 必须已知文件名 | 诗歌/双关/伏笔拼图 |
| `00-final-note` | `$is_complete` + 阅读 message2 | meta 真相揭示 |
| `25-WI-K` | 通过 `25-AT-1` 的 tag 链 | meta 收束场景 |

**结局设计**：
- **唯一真结局**：收集阈值 + 阅读 `00-final-note` → 触发 `End`
- **伪结局**：收集不足 → 卡在 `00-act-structure` 附近的提示
- **meta 结局**：未触发 → hangman 永远玩不到完整单词

**产出**：`hidden_files.md` + `ending_design.md`

### 阶段 6：形式化验证（Formal Verifier 负责）

对阶段 0-5 全部设计文档执行**三性检查**：
- 唯一性：是否存在另一套自洽解释能贯穿所有文件？
- 完备性：每个 F 至少 2 个文件揭露？教程解锁链完整？meta 元素全部可达？
- 可达性：从 00-readme 出发能否遍历所有公开文件？隐藏文件有显式触发路径？

**机械验证方法**（Formal Verifier Agent 在 `verification_report.md` 中执行）：
1. **完备性**：按 `F × 揭露文件数` 列表逐项核验，至少 2 个文件标记 PASS。
2. **可达性**：从 `00-readme` 出发对 tag 互引图做 BFS/DFS，所有公开文件被访问到 → PASS。
3. **唯一性**：构造 ≥ 3 个"另一套自洽解释"反例，全被驳倒 → PASS。
4. **TypeHelp 9 项硬约束**：按 `C1-C9` 逐项回检，附证据（文件路径 / 行号 / 截图引用）。

**重要**：
- Formal Verifier 是**唯一有驳回权**的角色。即使 Director 签字，也可 FAIL。
- FAIL 时**必须**给出具体修补建议（不是"重做"）。

**产出**：`verification_report.md`（Part 1 唯一性 / Part 2 完备性 / Part 3 可达性 / Part 4 9 项硬约束 / Part 5 结论 PASS|FAIL / Part 6 修补建议）

### 阶段 7：Twine 实现（Twine Implementer 负责）

把全部设计文档**1:1 翻译**为单文件 Twine HTML 游戏：
- 严格按 `file_index.md` 翻译文件内容（3 段式：[@] / [ID] / [@]）
- 严格按 `tag_graph.md` 翻译 `tags="..."` 字段
- 保留 TypeHelp 引擎核心结构（Box / StoryInit / 启动流 / inbox / messages / End）
- 5 个文件随机抽样自检 1:1 一致性

**约束**：
- 不做任何设计决策
- 不新增文件 / 不修改 truth / 不改 presence list / 不改 tags / 不改 $seen_xxx 触发位置
- 如果发现设计文档有问题 → 驳回给 Director，不擅自修改

**产出**：`TypeHelp_NewGame.html`（双击 HTML 即可在浏览器运行，与原 TypeHelp 引擎一致）

### 阶段 8：黑盒测试（Playtester 负责）

**黑盒模式**——Playtester 只看 `TypeHelp_NewGame.html`，不看任何设计文档。

**真实试玩**（推荐 3-5 名未接触过剧本的人）：
- 记录试玩路径（≥ 30 个交互）
- 记录卡点（卡顿 > 3 分钟）
- 记录误解（被游戏误导的地方）
- 记录结局（真结局 / 假结局 / 卡死）
- 体验评分（命名解码 / 教程节奏 / 线索充分性 / meta 可达性 / 整体可玩性）

**回流**：试玩数据回流到 Director，Director 决定是否返工（修改设计 → 走 RFC 流程）。

**产出**：`playtest_log.md`

---

## 4. 三性验证（与前期一致，校准到 TypeHelp）

### 唯一性 (Uniqueness)
- 是否存在**另一套自洽解释**能贯穿所有文件？
- 若有 → 加 `辨别线索` 到某文件
- TypeHelp 特有：利用"命名约定"作为辨别工具（不同视角文件 ID 列表的细微差异）

### 完备性 (Completeness)
- 每个 F 至少 2 个文件揭露
- 教程解锁链完整（每条命令都有首次出现）
- meta 元素全部可达
- 文件总数 ≈ 95–100（避免 $cache_max 计算偏差）
- **机械验证方法**：Formal Verifier Agent 在 `verification_report.md` 中按 `F × 揭露文件数` 列表逐项核验，至少 2 个文件标记 PASS。

### 可达性 (Reachability)
- 从 `00-readme` 出发，沿 tag 互引图能否遍历所有公开文件？
- 隐藏文件有显式触发路径吗？
- 是否存在"读了 A 但 B 的 tag 不指向 A 的后续"的死链？
- **TypeHelp 特有**：`$first_xxx` 与 `$seen_xxx` 状态机是否完整（无矛盾标志位）
- **机械验证方法**：从 `00-readme` 出发对 tag 互引图做 BFS/DFS，所有公开文件被访问到 → PASS；否则列出未达文件清单。

---

## 5. 测试验证

| 阶段 | 方法 | 通过标准 |
|---|---|---|
| 白盒 | 设计者按预期路径通关 | 完成率 100% |
| 黑盒 | 3-5 名未接触者 | 完成率 ≥ 80%，真结局率 30-60% |
| 命名解码 | 玩家能否独立推断命名规则 | 无需提示 |
| 教程节奏 | 玩家是否在恰当时机学到命令 | $seen_xxx 全部为 true |
| meta 触发 | 玩家是否找到 00-final-note | ≥ 70% |
| `find` 检索 | 关键词搜索能否命中关键证据 | 核心关键词都能命中 |

---

## 6. 交付物清单

> 引擎适配版，**所有交付物均为设计文档**，最终汇总为一个 Twine 项目源码。

| 文件 | 性质 | 验证 |
|---|---|---|
| `charter.md` | 立项 | Director 签字 |
| `truth.md` | 真相 | Truth Designer 自检 |
| `timeline.json` | 时间线 | 物理可行 |
| `axis_matrix.md` | 三轴交叉 | 双证据 |
| `file_index.md` | 文件内容大纲 | ID 列表与 truth 一致 |
| `naming_matrix.md` | 命名约定 | 完整无缺 |
| `tag_graph.md` | 互引图 | 无环 / 无孤立 |
| `tutorial_design.md` | 渐进教程 | 节奏合理 |
| `hidden_files.md` | 隐藏文件 | 触发可达 |
| `ending_design.md` | 结局 | 唯一性 |
| `verification_report.md` | 三性验证 | 全 PASS |
| `playtest_log.md` | 试玩记录 | 指标达标 |
| `TypeHelp_NewGame.html` | 最终源码 | 与设计一致 |

---

## 7. 与前期方法论的关系

| 阶段 | 前期 | 最终版 | 变化原因 |
|---|---|---|---|
| 流程起点 | 5 阶段 | 9 阶段（含立项 + 验证 + 实现 + 试玩） | 增加 charter、形式化验证、Twine 实现、黑盒测试 |
| 推理建模 | Q-Tree | **三轴交叉矩阵** | TypeHelp 不支持"问 NPC" |
| 任务链 | DAG | **标签互引图** | TypeHelp 无跳转 |
| 线索分配 | Clue Matrix | **文件内容大纲** | 证据形态是文件 |
| 提示分级 | L0-L3 | **渐进教程** | TypeHelp 无提示按钮 |
| 验证 | 三性 | 三性 + 命名解码 | 命名是 TypeHelp 独有 |
| Agent 体系 | 10 Agent | **8 Agent（合并版）** | 命名 + 文件内容合并为 File Designer；教程 + meta 合并为 Meta & Tutorial Designer；新增 Playtester |

**核心区别**：把"页面跳转"思维换成"证据交叉"思维，把"提示"换成"教程解锁"。

---

## 8. 与 8-Agent 体系对齐

> 本 spec.md 早期按 10-Agent 拆分编写（Axis Architect / Naming Designer / File Content Writer / Tutorial Designer / Meta Designer 各为独立 Agent）。
> 为降低 Agent 调度复杂度、避免交付物过细，将 10-Agent 体系**合并**为 8-Agent 体系，**与 `prompts/` 中实际提示词一一对应**：

| 阶段 | spec.md 早期（10-Agent） | prompts/ 当前（8-Agent） | 合并原因 |
|---|---|---|---|
| 2 | Axis Architect | **Inference Architect** | 命名统一为"推理架构师" |
| 3 | File Content Writer | **File Designer** | 命名 + 内容在同一 Agent 内，handoff 更少 |
| 3 (旧) | Naming Designer | 合并入 File Designer | 命名约定可与 file_index 同步产出，无独立价值 |
| 5 | Tutorial Designer | **Meta & Tutorial Designer** | 教程节奏与 meta 文件同源（都依赖 file_index 触发点） |
| 5 (旧) | Meta Designer | 合并入 Meta & Tutorial Designer | 同上 |
| 7 | — | **Twine Implementer** | 之前漏写，补充 |
| 8 | — | **Playtester** | 之前漏写，补充 |

**当前 8-Agent 一览**（与 `prompts/*.md` 一一对应）：

| # | Agent | 提示词 | 产出 | TypeHelp 对应物 |
|---|---|---|---|---|
| 00 | Director | `director.md` | `charter.md` | 全部（立项总控） |
| 01 | Truth Designer | `truth-designer.md` | `truth.md`, `timeline.json` | 全部（被引用） |
| 02 | Inference Architect | `inference-architect.md` | `axis_matrix.md` | 时间码 / 地点码 / 人物轴 |
| 03 | File Designer | `file-designer.md` | `naming_matrix.md`, `file_index.md` | `tw-passagedata` 文件名 + 文本 |
| 04 | Tag Graph Designer | `tag-graph-designer.md` | `tag_graph.md` | `tags="..."` 字段 |
| 05 | Meta & Tutorial Designer | `meta-tutorial-designer.md` | `tutorial_design.md`, `hidden_files.md`, `ending_design.md` | `$seen_xxx` / 隐藏文件 / End |
| 06 | Formal Verifier | `formal-verifier.md` | `verification_report.md` | 三性检查（独立否决） |
| 07 | Twine Implementer | `twine-implementer.md` | `TypeHelp_NewGame.html` | 最终源码 |
| 08 | Playtester | `playtester.md` | `playtest_log.md` | 真实用户数据 |

> 触发顺序与并行规则详见 `prompts/README.md` 第 2、5 节。

---

## 9. 一句话心法

> **TypeHelp 剧本设计 = 为一个"终端"设计 N 个有"自描述文件名 + 互引标签 + 视角差异 + 教程解锁"四元组的文件，并保证这 N 个文件在 $cache 累加到阈值时，拼出唯一真相。**
