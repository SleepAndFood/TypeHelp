# Framework Diff 模板 · &lt;game-name&gt;

> 本文档对照参考实现（`games/galley-villa/TypeHelp.html`）记录新剧本 `<game-name>.html` 的**框架级差异决策**。
> 来源：SKILL.md §8.6 — Twine Implementer 完成后**必须**产出。
> 判定 3 类：**必须对齐**（删/改）/ **保留设计差异**（剧情变量差异）/ **修复原版 bug**。

---

## 1. StoryInit 差异

> 框架级：`UIBar.destroy()` / `Config.history.maxStates` / `$cache_max` / `$people` / `$act_starts`

| 项 | 参考实现 | 本剧本 | 判定 | 理由 |
|---|---|---|---|---|
| `UIBar.destroy()` | 行 XX：有 | 行 XX：&lt;有/无&gt; |  |  |
| `Config.history.maxStates` | 行 XX：1 | 行 XX：&lt;值&gt; |  |  |
| `$cache_max` | 行 XX：98 | 行 XX：&lt;值&gt; |  |  |
| `$people` | 行 XX：12 人 | 行 XX：&lt;N&gt; 人 |  |  |
| `$act_starts` | 行 XX：5 段 | 行 XX：&lt;N&gt; 段 |  |  |

## 2. StoryMenu 差异

> 框架级：菜单项可见性 / `&lt;li&gt;` 结构

| 项 | 参考实现 | 本剧本 | 判定 | 理由 |
|---|---|---|---|---|
| `&lt;li&gt;` 数量 | 行 XX：2 项 | 行 XX：&lt;N&gt; 项 |  |  |

## 3. StoryCaption 差异

> 框架级：`#story-caption` 内容

| 项 | 参考实现 | 本剧本 | 判定 | 理由 |
|---|---|---|---|---|
| 是否覆盖 | 否 |  |  |  |

## 4. PassageHeader / PassageFooter 差异

> 框架级：每个 passage 顶部 / 底部是否统一注入

| 项 | 参考实现 | 本剧本 | 判定 | 理由 |
|---|---|---|---|---|
| PassageHeader | 行 XX：无 |  |  |  |
| PassageFooter | 行 XX：无 |  |  |  |

## 5. 决策理由汇总

### 5.1 必须对齐（已删除 / 已修改）
- [ ]

### 5.2 保留设计差异（剧情驱动）
- [ ]

### 5.3 修复原版 bug（如有）
- [ ]

---

## 完成度自检

- [ ] 5 个章节均填写
- [ ] 4 项基线（UI bar / 历史策略 / L10n / 反馈风格）已说明
- [ ] 与 `games/&lt;name&gt;/README.md` 互引

## 提交

```
git add games/framework_diff.template.md
git commit -m "feat(framework): add framework_diff.md template per SKILL.md §8.6"
```
