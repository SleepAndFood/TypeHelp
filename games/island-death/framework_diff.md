# Framework Diff · island-death

> 对照参考实现（`games/galley-villa/TypeHelp.html`）记录 `island-death.html` 的**框架级差异决策**。
> 来源：SKILL.md §8.6。本剧本是**重新设计**而非翻译版，5 幕社会派 + meta 悬疑，差异较多。
> 与 [`games/framework_diff.template.md`](../framework_diff.template.md) 同构。

---

## 1. StoryInit 差异

| 项 | 参考实现 | 本剧本 | 判定 | 理由 |
|---|---|---|---|---|
| `UIBar.destroy()` | 行 637：有 | 行 185：有 | 必须对齐 | 与基线一致（避免 UI 干扰） |
| `Config.history.maxStates` | 行 606：1 | 行 184：1 | 必须对齐 | 与基线一致（推理无回退） |
| `$cache_max` | 行 616：98 | 行 186：95 | 保留设计差异 | 5 幕双时间线总文件数 95（基线是 4 幕单线 98） |
| `$people` | 行 640：14（12+K+@） | 行 187：23（11-33） | 保留设计差异 | 22 角色 + 玩家@（cast_id_map.md），社会派角色规模 |
| `$act_starts` | 行 632：5 段（00/07/14/21/99） | 行 188：6 段（00/07/13/19/25/99） | 保留设计差异 | 5 幕叙事（2017/2021/2024 三时间线），每幕 6 段 |

## 2. StoryMenu 差异

| 项 | 参考实现 | 本剧本 | 判定 | 理由 |
|---|---|---|---|---|
| `&lt;li&gt;` 数量 | 行 无 passage：2 项（默认 Saves/Restart） | 行 无 passage：2 项 | 必须对齐 | 无自定义 StoryMenu → 引擎默认 2 项 |

## 3. StoryCaption 差异

| 项 | 参考实现 | 本剧本 | 判定 | 理由 |
|---|---|---|---|---|
| 是否覆盖 | 否（行 无 passage） | 是（行 173） | 保留设计差异 | 全局"← 返回 Box"链接，社会派元叙事需要明确导航 |

## 4. PassageHeader / PassageFooter 差异

| 项 | 参考实现 | 本剧本 | 判定 | 理由 |
|---|---|---|---|---|
| PassageHeader | 行 无：无 | 行 178：有 | 保留设计差异 | 全局 textbox，玩家在任意 passage 都能输入命令（社会派长篇需要） |
| PassageFooter | 行 5113：有（"跳过开头"链接） | 行 无：无 | 修复原版 bug | 基线 PassageFooter 在 00-readme（无 textbox）上造成玩家卡死，本剧本改用 Intro passage 内 `<<timed 5s>>` 自动跳转（行 228） |

## 5. 决策理由汇总

### 5.1 必须对齐（已删除 / 已修改）
- `UIBar.destroy()`：与基线一致（避免 UI 干扰阅读）
- `Config.history.maxStates=1`：与基线一致（推理游戏无回退）
- StoryMenu：不自定义（默认 2 项 Saves/Restart）

### 5.2 保留设计差异（剧情驱动）
- `$cache_max=95`：5 幕双时间线比基线 4 幕多 1 幕但文件略少
- `$people` 23 人：社会派 22 角色（基线 12 角色 + K + @）
- `$act_starts` 6 段：5 幕叙事（2017/2021/2024 三时间线）vs 基线 4 幕
- StoryCaption：全局"返回 Box"链接，元叙事需要明确导航
- PassageHeader：全局 textbox，社会派长篇跨 passage 调查

### 5.3 修复原版 bug（如有）
- 去掉 PassageFooter"跳过开头"链接：基线实现导致 00-readme（无 textbox）上玩家卡死，参考 [GitHub issue: 原版 PassageFooter bug]；本剧本改用 Intro passage 内 `<<timed 5s>>` 自动跳转，更友好

---

## 完成度自检

- [x] 5 个章节均填写
- [x] 4 项基线（UI bar / 历史策略 / L10n / 反馈风格）已说明
  - UI bar：UIBar.destroy() 销毁（与基线一致）
  - 历史策略：maxStates=1（与基线一致）
  - L10n：中文剧本，sanitize 正则含 `\u4e00-\u9fff`（基线是英文，无需 CJK）
  - 反馈风格：全中文（基线是英文）
- [x] 与 `games/island-death/README.md` 互引
