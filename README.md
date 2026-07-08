# TxtGame · 多剧本文字推理游戏合集

> 基于 SugarCube / Twine 引擎的纯文本交互式推理游戏合集。
> 每个剧本是独立、可玩的 HTML 单文件 + 配套设计文档。

[![GitHub Pages](https://github.com/MrSun/txtgame/actions/workflows/pages.yml/badge.svg)](https://github.com/MrSun/txtgame/actions/workflows/pages.yml)
[![Game Tests](https://github.com/MrSun/txtgame/actions/workflows/test.yml/badge.svg)](https://github.com/MrSun/txtgame/actions/workflows/test.yml)
[![License](https://img.shields.io/badge/license-CC--BY--4.0-blue.svg)](LICENSE)

🌐 **在线访问**：<https://mrsun.github.io/txtgame/>（部署到 GitHub Pages，无需本地启动）

---

## AI 协作入口

> 本项目的 AI Agent 协作通过仓根 [AGENTS.md](AGENTS.md) + 设计方法论 [SKILL.md](.trae/skills/typehelp-novel-design/SKILL.md) 进行。

**AI 协作者必读顺序**：

1. [AGENTS.md](AGENTS.md) — 仓级入口（5 个章节：C1–C9 / 5 层 / 4 步门禁 / 多剧本基线 / 禁止行为）
2. [README.md](README.md) — 本文件
3. [SKILL.md](.trae/skills/typehelp-novel-design/SKILL.md) — 9 阶段方法论 + 8 Agent 提示词
4. [typehelp-novel-design spec.md](.trae/specs/typehelp-novel-design/spec.md) — 完整方法论推导
5. `games/<target>/README.md` — 目标剧本说明

> **人类贡献者**也可参照 AGENTS.md 第 §3 节的规范速查。

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

### 通过首页启动（推荐）

仓库根目录提供 `index.html` 风格统一的剧本入口（**自包含单文件**，无外部 JS 依赖）：

1. `npm install`（首次需要）— 安装测试 / 构建依赖
2. `npm run build:games` — 扫描 `games/` 下的剧本 README，生成 `games.json`
3. `npm run build:index` — 把 `src/index-page.js` 转译并 inline 到 `index.html`（**部署到 GitHub Pages 前必跑**）
4. `npx serve .`（或任意静态文件服务器）启动本地服务
5. 浏览器打开 `http://localhost:3000`，点击任意剧本卡片即可进入

一键构建：`npm run build`（等价于 `build:games && build:index`）。

首页采用终端风暗色样式（与 SugarCube 引擎气质一致），对 `games.json` 中所有动态字段做了 XSS 转义，并对跳转 URL 做白名单校验（仅允许 `games/.../*.html`）。`fetch` 失败时自动回退到内置备用列表，保证即使 `games.json` 损坏也能找到剧本入口。

> ⚠️ **必须用 HTTP 服务打开**（`npx serve .` / `python -m http.server`），**不要**直接双击 `index.html`——浏览器 `file://` 协议下 `fetch('./games.json')` 被 CORS 拦截，**仅显示备用列表**（看不到真实剧本元数据，且 console 有 CORS 报错）。

### 部署到 GitHub Pages

每次 push 到 `main` 分支，`.github/workflows/pages.yml` 会自动：

1. 跑 `npm run build:games` — 重新生成 `games.json`
2. 跑 `npm run build:index:check` — 校验 `index.html` inline 内容与 `src/index-page.js` 一致（drift 检测）
3. 复制白名单文件到 `_site/`（`index.html` / `games.json` / `games/` / `README.md`），**显式排除** `src/` / `test/` / `scripts/` / `docs/` / `.worktrees/` / `.trae/` / `node_modules/` 等
4. 通过 `actions/deploy-pages@v4` 部署到 GitHub Pages

**首次启用 Pages 部署**：进入仓库 **Settings → Pages → Source**，选 **GitHub Actions**（不要选 "Deploy from a branch"，否则会暴露 `src/` 等非部署文件）。

部署路径形如 `https://<user>.github.io/<repo>/`（含 `index.html` / `games/...html` / `games.json`），无任何内部源码 / 测试 / 文档暴露。

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
├── index.html                       ← 剧本入口首页（自包含，inline 含 src/index-page.js 转译版）
├── games.json                       ← 首页元数据（npm run build:games 生成）
├── scripts/
│   ├── generate-games-json.js       ← 扫描 games/ 目录生成 games.json
│   └── build-index.js               ← 把 src/index-page.js inline 到 index.html
├── src/
│   ├── index-page.js                ← 首页 XSS 清洗 + 渲染纯函数（被 build-index 转译 + 被 test 引用）
│   ├── commandRouter.js             ← TypeHelp 引擎命令路由（test-only，纯函数）
│   └── static/l1-helpers.js         ← L1 静态分析 helpers（test-only）
├── .github/workflows/
│   ├── test.yml                     ← L1-L5 测试（PR + push to main 触发）
│   └── pages.yml                    ← GitHub Pages 部署（push to main 触发）
├── .gitignore                       ← 屏蔽 .worktrees/ .superpowers/ 等
├── games/                           ← 所有剧本（部署白名单）
│   ├── galley-villa/                ← 嘉利别墅（原版）
│   ├── island-death/                ← 岛主之死
│   └── terminal-mystery/            ← 沈家山庄（早期探索）
└── .trae/                           ← IDE 私有配置（已屏蔽，不入仓）
```

> **部署白名单**（由 `.github/workflows/pages.yml` 显式复制到 `_site/`，发布到 GitHub Pages）：
> `index.html` / `games.json` / `games/` / `README.md` —— 部署路径上**不出现** `src/` / `test/` / `scripts/` / `docs/` / `.worktrees/` / `.trae/` 等。

---

## 如何贡献新剧本

1. 在 `games/<your-game-codename>/` 下创建目录
2. 按 9 阶段方法论顺序产出对应文档（从 `charter.md` 开始）
3. 使用 `TypeHelp.html` 引擎作为基础生成 `<game>.html`（产物名 = 剧本内容名，如 `island-death.html`）
4. 在该剧本目录下添加 `README.md`（**首页生成脚本依赖以下模板字段，缺一不可**）：
   - **H1 标题**（可含英文副标题，用 `()` 包裹）：`# 中文名 (English Title)`
   - **首行 blockquote**（题材/基调）：`> 1936 英国古堡暴风雪山庄 + meta 心理恐怖`
   - **状态行**：`> **状态**：完整可玩`（若剧本无 HTML 文件，使用 `**不完整**` 会被自动改写为"早期探索 / 不可启动"）
   - **可玩文件链接**：`> **可玩文件**：[`TypeHelp.html`](TypeHelp.html)`（**或**确保目录内只有单个 `<codename>.html`）
   - **简介章节**：`## 简介\n\n<1-2 段>`（纯文本会被首页卡片截取前 280 字符）
5. 运行 `npm run build`（包含 `build:games` + `build:index`）重新生成首页元数据 + 同步 inline 内容
6. 在本 README 的"剧本索引"表添加新行

新剧本推荐：先在 Solo Agent 中跑完 Director 阶段产出 `charter.md`，再继续。

---

## 致谢

- **William Rous** — TypeHelp 原作者
- **Akita23508** — TypeHelp 中文翻译
- **SugarCube** — 游戏引擎 [GitHub](https://github.com/tmedwards/sugarcube)
- **Twine** — 交互式故事开发工具 [官网](https://twinery.org/)
- **TypeHelp 文字推理游戏剧本设计方法论**（9 阶段 + 8 Agent）
