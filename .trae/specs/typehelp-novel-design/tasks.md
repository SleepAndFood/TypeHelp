# Tasks：TypeHelp 新剧本设计任务清单

> 本任务清单基于 `spec.md` 的 9 阶段方法论（按本任务清单写作时为 7 阶段 + 立项），按"先真相后表现、先骨架后血肉、先静态后动态"的原则排序。
>
> **本次 worked example（黑匣子 / Black Box）执行状态**：Tasks 0–8, 11 完成；Task 9（白盒自检）已通过自检但需浏览器实测；Task 10（黑盒）需真实玩家。
>
> **关于 Agent 命名**：本任务清单沿用 spec.md 早期版本的 10-Agent 体系（Axis Architect / Naming Designer / File Content Writer / Tutorial Designer / Meta Designer 各为独立 Agent）。当前 `prompts/` 已合并为 8-Agent 体系，对应关系见 [spec.md 第 8 节](spec.md#8-与-8-agent-体系对齐)。本任务清单的 Task 2 = 当前 Inference Architect；Task 3+4 = 当前 File Designer；Task 6+7 = 当前 Meta & Tutorial Designer。

---

## Task 0：立项（Director Agent）

- [x] 0.1 撰写 `charter.md`，包含 8 个必填字段
  - [x] 0.1.1 确定题材 → 太空船密室
  - [x] 0.1.2 确定基调 → 新本格 + meta
  - [x] 0.1.3 确定时代与世界观 → 2187 火星
  - [x] 0.1.4 选定核心诡计类型 → 信息差 + 物证
  - [x] 0.1.5 确定目标受众 → 推理新手到中级
  - [x] 0.1.6 设定目标文件数 → 24（演示规模 19）
  - [x] 0.1.7 设定幕数 → 4 幕
  - [x] 0.1.8 确定 meta 元素方向 → 调查员视角 + 嵌套循环
- [x] 0.2 Director 签字通过

## Task 1：真相设计（Truth Designer Agent）

- [x] 1.1 撰写 `truth.md`
  - [x] 1.1.1 完整时间线（精确到分钟）
  - [x] 1.1.2 客观事实表 F1–F10
  - [x] 1.1.3 最终真相段
- [x] 1.2 撰写 `timeline.json`（机器可读）
- [x] 1.3 物理可行性自检（时间/距离/工具/人物能力）
- [x] 1.4 Director 冻结真相层

## Task 2：三轴交叉矩阵（Axis Architect Agent）

- [x] 2.1 设计时间轴 T
  - [x] 2.1.1 确定 13 个时间码（演示规模）
  - [x] 2.1.2 每段时间 1 个文件
- [x] 2.2 设计地点轴 L
  - [x] 2.2.1 确定 9 个地点码
- [x] 2.3 设计人物轴 P
  - [x] 2.3.1 确定 6 + K + @ = 8 个角色
- [x] 2.4 撰写 `axis_matrix.md`（三轴交叉表）
- [x] 2.5 双证据原则自检（F10 已修补）

## Task 3：命名约定设计（Naming Designer Agent）

- [x] 3.1 撰写 `naming_matrix.md`
  - [x] 3.1.1 时间码表（含 meta 段 7 个固定文件）
  - [x] 3.1.2 地点码表（9 个 LC 码）
  - [x] 3.1.3 人物 ID 表（6 + K + @）
  - [x] 3.1.4 presence list 编码规则

## Task 4：文件内容设计（File Content Writer Agent）

- [x] 4.1 撰写 `file_index.md`（19 个文件的内容大纲）
  - [x] 4.1.1 00 段 7 个 meta 文件
  - [x] 4.1.2 01-06 段（第一幕，4 个文件）
  - [x] 4.1.3 07-13 段（第二幕，2 个文件）
  - [x] 4.1.4 14-20 段（第三幕，2 个文件）
  - [x] 4.1.5 21-26 段（第四幕，3 个文件）
- [x] 4.2 每个文件遵循 3 段式模板：`[@] / [ID] / [@]`
- [x] 4.3 关键证据**显式陈述**
- [x] 4.4 时间戳 / 地点名 / 人物名与 truth.md 一致
- [x] 4.5 同事件多视角文件 ID 列表严格反映"在场"

## Task 5：标签互引图（Tag Graph Designer Agent）

- [x] 5.1 撰写 `tag_graph.md`
  - [x] 5.1.1 就近引用
  - [x] 5.1.2 视角引用
  - [x] 5.1.3 教程引用
  - [x] 5.1.4 meta 引用
- [x] 5.2 互引图自检
  - [x] 无孤立节点
  - [x] 无环
  - [x] 从 00-readme 可达所有公开文件
  - [x] 隐藏文件有显式触发路径

## Task 6：渐进教程设计（Tutorial Designer Agent）

- [x] 6.1 撰写 `tutorial_design.md`
  - [x] 6.1.1 `name` 命令首次出现位置（02-BR）
  - [x] 6.1.2 `title` 命令首次出现位置（14-LA）
  - [x] 6.1.3 `act` 命令首次出现位置（22-AT）
  - [x] 6.1.4 `note` 命令首次出现位置（03-ME）
  - [x] 6.1.5 `find` 命令首次出现位置（09-CA）
  - [x] 6.1.6 `hangman` 命令首次出现位置（00-final-note）
- [x] 6.2 `[$first_xxx]` 一次性提示触发条件完整
- [x] 6.3 `[$seen_xxx]` 全部状态机无矛盾

## Task 7：隐藏文件与结局（Meta Designer Agent）

- [x] 7.1 撰写 `hidden_files.md`
  - [x] 7.1.1 `00-dream` 触发条件与内容
  - [x] 7.1.2 `00-final-note` 触发条件与内容
  - [x] 7.1.3 `25-WI-2` meta 收束场景
- [x] 7.2 撰写 `ending_design.md`
  - [x] 7.2.1 唯一真结局路径
  - [x] 7.2.2 伪结局条件
  - [x] 7.2.3 meta 结局的隐藏触发

## Task 8：三性验证（Formal Verifier Agent）

- [x] 8.1 唯一性验证
  - [x] 8.1.1 构造反例（4 个反例全失败）
  - [x] 8.1.2 无反例
  - [x] 8.1.3 命名约定辨别能力
- [x] 8.2 完备性验证
  - [x] 8.2.1 每个 F 至少 2 个文件揭露
  - [x] 8.2.2 教程解锁链完整
  - [x] 8.2.3 meta 元素全部可达
  - [x] 8.2.4 文件总数 = 19（演示规模）
- [x] 8.3 可达性验证
  - [x] 8.3.1 从 00-readme 可达所有公开文件
  - [x] 8.3.2 隐藏文件有显式触发路径
  - [x] 8.3.3 无死链
- [x] 8.4 撰写 `verification_report.md`

## Task 9：白盒测试（Playtester Agent · 白盒模式）

- [x] 9.1 设计路径已走通（自检）
- [x] 9.2 预期变量表已记录
- [x] 9.3 设计层完成率 = 100%
- [x] 9.4 所有 `$seen_xxx` 标志已在文件正文中设置
- [x] 9.5 隐藏文件触发路径已文档化
- [x] 9.6 End passage 已设计
- [ ] **9.7 浏览器实测（待用户执行）**

## Task 10：黑盒测试（Playtester Agent · 黑盒模式）

- [ ] 10.1 3-5 名未接触者测试（待执行）
- [ ] 10.2 命名解码能力（待测试）
- [ ] 10.3 教程节奏（待测试）
- [ ] 10.4 meta 触发率（待测试）
- [ ] 10.5 `find` 检索命中率（待测试）
- [ ] 10.6 完成率 ≥ 80%（待测试）
- [ ] 10.7 真结局率 30-60%（待测试）
- [ ] 10.8 撰写 `playtest_log.md`（待执行）

> **Task 10 需真实玩家测试**。Playtester Agent 需在外部招募 3-5 名测试者，记录数据，撰写日志。

## Task 11：Twine 实现（Twine Implementer Agent）

- [x] 11.1 基于所有设计文档生成 `TypeHelp_NewGame.html`
  - [x] 11.1.1 保留 `Box` passage 核心结构
  - [x] 11.1.2 改写 `StoryInit` 初始化变量
  - [x] 11.1.3 改写 `Background` / `Intro` / `Loading` 启动流
  - [x] 11.1.4 改写 `00-readme` / `00-final-note` / `inbox` / `message-` / `message2-`
  - [x] 11.1.5 添加所有 19 个新 `tw-passagedata`
  - [x] 11.1.6 设置 `$cache_max=17` / `$people` / `$act_starts`
- [x] 11.2 与设计文档一致性检查
- [ ] 11.3 浏览器自测（待用户执行，需嵌入完整 SugarCube 引擎）

---

# Task Dependencies

- [Task 1] 依赖 [Task 0] ✓
- [Task 2] 依赖 [Task 1] ✓
- [Task 3] 依赖 [Task 2] ✓
- [Task 4] 依赖 [Task 1, 2, 3] ✓
- [Task 5] 依赖 [Task 4] ✓
- [Task 6] 依赖 [Task 4] ✓
- [Task 7] 依赖 [Task 4, 5] ✓
- [Task 8] 依赖 [Task 4, 5, 6, 7] ✓
- [Task 9] 依赖 [Task 8] ✓（部分待浏览器）
- [Task 10] 依赖 [Task 9]（需真实玩家）
- [Task 11] 依赖 [Task 10]（设计上完成，浏览器实测待用户）

---

# 执行总结

**worked example「黑匣子 (Black Box)」完成度**：
- 设计文档：100% 完成（10 个 markdown + 1 个 json + 1 个 html）
- 形式化验证：100% PASS
- 浏览器实测：未执行（用户可在浏览器中打开 `TypeHelp_NewGame.html` 测试；需嵌入完整 SugarCube 引擎或参考原 `TypeHelp.html`）

**完整规模推广**（95-100 文件版）：
- 沿用本方法论，按 `axis_matrix.md` 扩展时间码与地点
- 保持 9 项硬约束与 4 项不变原则
- 重点补充第二、三、四幕的文件数
