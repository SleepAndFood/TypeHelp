# Framework Diff · galley-villa

> 本剧本即**参考实现**。`TypeHelp.html` 由 William Rous 原版 + Akita23508 中文翻译，是其他剧本的 diff 基线。
> 基线 = 0 差异；所有判定填"**保留（基线）**"。
> 与 [`games/framework_diff.template.md`](../framework_diff.template.md) 同构。

---

## 1. StoryInit 差异

| 项 | 参考实现 | 本剧本 | 判定 | 理由 |
|---|---|---|---|---|
| `UIBar.destroy()` | 行 637：有 | 行 637：有 | 保留（基线） | 本剧本即参考实现 |
| `Config.history.maxStates` | 行 606：1 | 行 606：1 | 保留（基线） | 历史回退禁用（推理游戏无回退） |
| `$cache_max` | 行 616：98 | 行 616：98 | 保留（基线） | 文件接近 100 个，符合 C5 |
| `$people` | 行 640：14（12+K+@） | 行 640：14 | 保留（基线） | 嘉利别墅角色规模 |
| `$act_starts` | 行 632：5 段 | 行 632：5 段 | 保留（基线） | 四幕 + 终点（00/07/14/21/99） |

## 2. StoryMenu 差异

| 项 | 参考实现 | 本剧本 | 判定 | 理由 |
|---|---|---|---|---|
| `&lt;li&gt;` 数量 | 行 无 passage：2 项（默认） | 行 无 passage：2 项 | 保留（基线） | 无自定义 StoryMenu → SugarCube 默认 Saves/Restart 2 项 |

## 3. StoryCaption 差异

| 项 | 参考实现 | 本剧本 | 判定 | 理由 |
|---|---|---|---|---|
| 是否覆盖 | 否（行 无 passage） | 否 | 保留（基线） | 无 StoryCaption → 引擎不渲染 `#story-caption`，避免污染默认 caption |

## 4. PassageHeader / PassageFooter 差异

| 项 | 参考实现 | 本剧本 | 判定 | 理由 |
|---|---|---|---|---|
| PassageHeader | 行 无：无 | 无 | 保留（基线） | 不在每 passage 顶部统一注入 |
| PassageFooter | 行 5113：有 | 行 5113：有 | 保留（基线） | Box passage 末尾的"跳过开头"链接（与基线一致） |

## 5. 决策理由汇总

### 5.1 必须对齐（已删除 / 已修改）
- 无（基线无需对齐）

### 5.2 保留设计差异（剧情驱动）
- 无（基线无差异）

### 5.3 修复原版 bug（如有）
- 无（基线无 bug 需修复）

---

## 完成度自检

- [x] 5 个章节均填写（全部为"保留（基线）"）
- [x] 4 项基线（UI bar / 历史策略 / L10n / 反馈风格）已说明
  - UI bar：UIBar.destroy() 销毁（避免 UI 干扰阅读）
  - 历史策略：maxStates=1（推理游戏无回退）
  - L10n：英文原文（无 CJK sanitize 需求）
  - 反馈风格：英文（与原版一致）
- [x] 与 `games/galley-villa/README.md` 互引
