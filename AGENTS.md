> **AI 协作者请先读本文件** —— 本文件是 TxtGame 仓库的 AI 协作总入口，所有 Claude / Cursor / Trae / 其他 AI Agent 进入项目后**第一步**读它。

# AGENTS.md · TxtGame AI 协作入口

---

## §1 项目一句话定位

TxtGame = **多剧本文字推理游戏合集**（SugarCube/Twine + TypeHelp 引擎），采用 **9 阶段方法论 + 8 Agent 协作** 模式设计新剧本。

---

## §2 AI 必读顺序（5 个文件，编号 1-5）

按优先级读完以下 5 个文件再开始任何工作：

| # | 文件 | 作用 |
|---|---|---|
| 1 | [AGENTS.md](file:///d:/WorkSpace/projects/TxtGame/AGENTS.md) | 仓级入口（本文件，5 章节：定位 / 必读 / 规范 / 禁止 / 入口） |
| 2 | [README.md](file:///d:/WorkSpace/projects/TxtGame/README.md) | 项目总览（剧本索引 / 统一机制 / 贡献流程） |
| 3 | [SKILL.md](file:///d:/WorkSpace/projects/TxtGame/.trae/skills/typehelp-novel-design/SKILL.md) | 9 阶段方法论 + 8 Agent 提示词索引 |
| 4 | [typehelp-novel-design spec.md](file:///d:/WorkSpace/projects/TxtGame/.trae/specs/typehelp-novel-design/spec.md) | 完整方法论推导（含 9 项硬约束来源） |
| 5 | `games/<target>/README.md` | 目标剧本说明（替换 `<target>` 为实际剧本目录名） |

> **人类贡献者**也可参照本文件 §3 节的规范速查。

---

## §3 仓级规范速查（4 张子表）

### 表 1：方法论 9 项硬约束 C1–C9

| # | 约束 | 含义 |
|---|---|---|
| C1 | 单一文本框命令 | 所有交互经 Box passage 文本框，不设计点击物体 |
| C2 | 无 inventory / 无询问 NPC | 证据必须以文件形式可读 |
| C3 | 文件名 = 元数据 | `XX-LC-?` 编码本身是谜题一部分 |
| C4 | tag 字段承担互引 | `tags="..."` 取代跳转 DAG |
| C5 | 进度 = 收集文件数 | `$cache_max` ≈ 95–100 |
| C6 | meta 元素必须存在 | 至少 2-3 个隐藏文件 |
| C7 | 教程渐进式解锁 | `$seen_xxx` 标志分布在 4 幕 |
| C8 | 多视角通过同事件多文件 | 每个 F 至少 2 个文件揭露（双证据原则） |
| C9 | 唯一结局 = 阈值 + final-note | 单一通关路径 |

### 表 2：5 层测试金字塔

| 层 | 工具 | 入口 | 覆盖目标 |
|---|---|---|---|
| L1 静态 | cheerio + Vitest | `test/static/*.test.js` | passage 引用、命名、人物编号、链接 |
| L2 单元 | Vitest | `test/unit/*.test.js` | 命令路由纯函数 + 首页清洗 / 构建脚本（index-page / generate-games-json / build-index） |
| L3 叙事 | Node + Vitest | `test/narrative/*.test.js` | 时间线、线索、人物代词 |
| L4 渲染 | jsdom + Vitest | `test/render/*.test.js` | SugarCube 引擎初始化、passage 渲染 |
| L5 E2E | Playwright | `test/e2e/*.test.js` | 真实浏览器关键路径冒烟（含 index.html 首页：正常 / XSS / fetch 失败） |

> **L0 build 阶段**（在门禁 A/B/C 之前）：`run-all.js` 显式跑 `build:games` + `build:index:check`（drift 检测），任何失败立即终止。

### 表 3：CI 强制门禁链（来自 SKILL.md §6）

| 步骤 | 命令 | 通过条件 |
|---|---|---|
| A | `python .trae/scripts/check_twine_escape.py <html>` | 0 errors |
| B | `python .trae/scripts/verify_embed.py <html>` | 5/5 PASS |
| C | `python .trae/scripts/check_twine_macro_stack.py <html>` | 0 errors |
| D | `npx playwright test test/e2e/{l10n-sanitize,stale-state,feedback-audit,index-page}.test.js` | 全 PASS |

> 4 步门禁在 L1 静态分析**之前**执行，任一失败 → 整个 job 失败，后续测试不执行。无 HTML 的剧本（`terminal-mystery`）跳过 A/B/C。

### 表 4：多剧本共享基线（来自 SKILL.md §8.10）

| 基线 | 要求 |
|---|---|
| UI bar | `<<run UIBar.destroy()>>` 或 `framework_diff.md` 显式说明 |
| 历史策略 | `<<set Config.history.maxStates to N>>`（N ≤ 阈值）或 `framework_diff.md` 显式说明 |
| L10n 字符集 | sanitize 正则含 `\u4e00-\u9fff`（中文）或显式说明"本剧本为纯英文" |
| 反馈风格 | 全中文 / 全英文（**不允许中英混用**） |

---

## §4 禁止行为清单（5 条）

| # | 禁止 | 原因 |
|---|---|---|
| 1 | **凭直觉改源** | 任何修改前**必须**先复现症状（Playwright + `pageerror` 监听 + `console.error` 监听），不脑补修复（SKILL.md §8.1） |
| 2 | **跳过 SKILL.md 流程** | 新增 / 修改剧本必须走 9 阶段方法论，**不**直接复制其他剧本的 HTML 或设计文档 |
| 3 | **复制粘贴其他剧本设计** | 每个剧本独立设计 `truth.md`、FC 事实、文件清单、tag 互引图，**不**允许跨剧本混用 |
| 4 | **改 `.trae/specs/` 历史文档** | `spec.md` / `tasks.md` / `checklist.md` 是历史产物，更新应**新建** spec，原文档保持不变 |
| 5 | **提交 `.trae/.tmp/` 中间产物** | 开发期中间产物（Playwright log / scratch HTML / 验证脚本输出）**不入仓**，仅 `.trae/skills/` / `.trae/specs/` / `.trae/scripts/` 共享内容可入仓 |

---

## §5 入口指向（SKILL.md 关键章节）

- **[§6 工作流](file:///d:/WorkSpace/projects/TxtGame/.trae/skills/typehelp-novel-design/SKILL.md)**：端到端 9 阶段流程（按章顺序执行：Director → Truth Designer → ... → Playtester）
- **[§8 经验教训](file:///d:/WorkSpace/projects/TxtGame/.trae/skills/typehelp-novel-design/SKILL.md)**：11 条实测教训（症状导向诊断陷阱 / 流程链断裂 / 文档自指污染 / L10n sanitize / stale state / 反馈完整性 / 跨剧本一致性 / Playwright 6 陷阱 等）——**修改任何文件前先读**
- **[§10 错误速查](file:///d:/WorkSpace/projects/TxtGame/.trae/skills/typehelp-novel-design/SKILL.md)**：12 条具体错误 + 修复（遇到错误**先查表**再下手）

---

## 一句话心法

> **vibe coding 项目 = 把方法论 + Agent 入口 + 强制门禁 + 防御性测试"全部入仓 + 全部 CI 化"** —— 任何一步留在仓外或留在口头，就一定会随时间漂移。
