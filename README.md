# TxtGame · 多剧本文字推理游戏合集

> 基于 SugarCube / Twine 引擎的纯文本交互式推理游戏合集。
> 每个剧本是独立、可玩的 HTML 单文件 + 配套设计文档。

---

## 剧本索引

| 剧本 | 题材 | 基调 | 文件 | 状态 |
|------|------|------|------|------|
| [嘉利别墅 (Galley Villa)](games/galley-villa/) | 1936 英国古堡暴风雪山庄 | meta 心理恐怖 | `TypeHelp.html` | 完整可玩（原版） |
| [岛主之死 (Coral Bay)](games/island-death/) | 2017–2024 南海私人岛屿 | 社会派 + 法律推理 + meta | `island-death.html` | 设计完成，8 阶段全过 |
| [沈家山庄事件](games/terminal-mystery/) | 暴风雪山庄 | 早期探索 | 仅 4 段文件 | **不完整**，仅作参考 |

> **剧透警告**：剧情细节请进入单剧本 README 查看（含 ⛔ 剧透区）。

---

## 统一游戏机制

| 命令 | 用法 | 说明 |
|------|------|------|
| `help` | `help` | 查看帮助信息与可用命令列表 |
| `list` | `list` 或 `list 2` | 查看已收集的文件列表，可按幕分页 |
| `back` | `back` | 返回上一页 |
| `save` | `save` | 打开存档界面 |
| `name` | `name 1 约翰` | 给编号人物取自定义昵称 |
| `note` | `note 内容` | 记录笔记（最多 300 字符） |
| `find` | `find 关键词` | 在已发现文件中全文搜索 |
| `title` | `title 03 标题文字` | 给时间段取自定义标题 |
| `act` | `act 1 标题文字` | 给幕取自定义标题 |
| `hangman` | `hangman` 或 `hangman a` | 猜字母小游戏（后期解锁） |

### 文件命名规则（TypeHelp 引擎默认）

```
SS-AA-X-Y
 ↑  ↑  ↑ ↑
 │  │  │ └─ 在场人数（可选）
 │  │  └─── 在场者编号（1-9 缩写，连接表示多人）
 │  └────── 地点缩写（2-3 字母）
 └───────── 段号（01-99，按时间顺序）
```

**示例**：
- `02-BR-1-2-3-4-5-6` = 第 2 段 / 地点 BR（舰桥）/ 在场者 1,2,3,4,5,6
- `01-ST-001` = 第 1 段 / 地点 ST（书房）/ 在场者 001
- `XX-XX-?????` = 损坏文件，需要根据上下文推断完整文件名

### 通用操作流程

1. 下载对应剧本的 `.html` 文件
2. 用任意现代浏览器（Chrome / Firefox / Edge / Safari）直接打开
3. 在文本框中输入命令，按回车执行
4. 输入文件名直接打开对应故事文件

无需安装任何依赖，无需联网。

---

## 设计方法论

本合集中的剧本均基于 **TypeHelp 文字推理游戏剧本设计方法论** 设计（9 阶段 + 8 Agent 协作 + 9 项硬约束）。

**方法论约束**（每个剧本必须满足）：

| # | 约束 | 含义 |
|---|------|------|
| C1 | 单一文本框命令 | 不能设计点击物体调查 |
| C2 | 无 inventory / 无询问 NPC | 证据必须以文件形式可读 |
| C3 | 文件名 = 元数据 | 文件名本身是谜题一部分 |
| C4 | tag 字段承担互引 | 取代跳转 DAG |
| C5 | 进度 = 收集文件数 | $cache_max ≈ 95-100 |
| C6 | meta 元素必须存在 | 至少 2-3 个隐藏文件 |
| C7 | 教程渐进式解锁 | $seen_xxx 标志分布在 4-5 幕 |
| C8 | 多视角通过同事件多文件 | 每个事件至少 2 个文件揭露 |
| C9 | 唯一结局 = 阈值 + final-note | 单一通关路径 |

每个剧本目录下的 `*.md` / `*.json` 文件即为该方法论的产出文档，按 9 阶段顺序命名：

1. `charter.md` —— Director 立项
2. `truth.md` + `timeline.json` —— Truth Designer 真相
3. `axis_matrix.md` —— Inference Architect 三轴矩阵
4. `naming_matrix.md` + `file_index.md` —— File Designer 文件
5. `tag_graph.md` —— Tag Graph Designer 标签图
6. `tutorial_design.md` + `hidden_files.md` + `ending_design.md` —— Meta & Tutorial Designer
7. `verification_report.md` —— Formal Verifier 三性检查
8. `<game>.html` —— Twine Implementer 翻译（产物名与剧本内容相符，如 `island-death.html`）
9. `playtest_log.md` —— Playtester 试玩

辅助文档：`physics_constraints.md` / `legal_constraints.md` / `cast_id_map.md`（按需）。

---

## 仓库结构

```
TxtGame/
├── README.md                        ← 本文件
├── .gitignore                       ← 屏蔽 .trae/ 与 IDE 私有
├── games/                           ← 所有剧本
│   ├── galley-villa/                ← 嘉利别墅（原版）
│   │   ├── README.md
│   │   └── TypeHelp.html
│   ├── island-death/                ← 岛主之死
│   │   ├── README.md
│   │   ├── charter.md
│   │   ├── truth.md
│   │   ├── timeline.json
│   │   ├── axis_matrix.md
│   │   ├── naming_matrix.md
│   │   ├── file_index.md
│   │   ├── tag_graph.md
│   │   ├── tutorial_design.md
│   │   ├── hidden_files.md
│   │   ├── ending_design.md
│   │   ├── verification_report.md
│   │   ├── physics_constraints.md
│   │   ├── legal_constraints.md
│   │   ├── cast_id_map.md
│   │   └── island-death.html
│   └── terminal-mystery/            ← 沈家山庄（早期探索）
│       ├── README.md
│       └── 00-04 段文件
└── .trae/                           ← IDE 私有配置（已屏蔽，不入仓）
```

---

## 如何贡献新剧本

1. 在 `games/<your-game-codename>/` 下创建目录
2. 按 9 阶段方法论顺序产出对应文档（从 `charter.md` 开始）
3. 使用 `TypeHelp.html` 引擎作为基础生成 `<game>.html`（产物名 = 剧本内容名，如 `island-death.html`）
4. 在本 README 的"剧本索引"表添加新行
5. 在该剧本目录下添加 `README.md`，遵循其他剧本的 README 模板

新剧本推荐：先在 Solo Agent 中跑完 Director 阶段产出 `charter.md`，再继续。

---

## 致谢

- **William Rous** — TypeHelp 原作者
- **Akita23508** — TypeHelp 中文翻译
- **SugarCube** — 游戏引擎 [GitHub](https://github.com/tmedwards/sugarcube)
- **Twine** — 交互式故事开发工具 [官网](https://twinery.org/)
- **TypeHelp 文字推理游戏剧本设计方法论**（9 阶段 + 8 Agent）
