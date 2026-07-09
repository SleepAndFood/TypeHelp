# Inference Simulator 引导文件 · island-death

> 本文件给"模拟玩家"使用，不含任何剧情真相。
> 经 Formal Verifier 脱敏审查冻结。
> §3 为操作者注释，launcher 脚本会剥离，不注入 Simulator prompt。

## 0. 题材与基调（Simulator 可见）
- 题材：南海私人岛屿 / 社会派推理 / 暴风雪山庄变体
- 基调：meta 心理恐怖 + 合谋叙事
- 时代：2017-2024 现代
- 地点：南海珊瑚湾私人岛屿

## 1. 玩家角色（Simulator 可见）
- 玩家身份：第 4 任管家（meta 元素）

## 2. 玩法预期（Simulator 可见）
- 命令格式：单文本框命令（list / find / 文件名 / help / save / back / name / note / title / act / hangman）
- 证据形式：所有证据以可读文件形式存在（无 inventory / 无点击物体）
- 进度：进度 = 已收集文件数（达到阈值触发结局）
- 文件命名：SS-AA-X-Y 格式（SS=段号, AA=幕号, X=地点/人物缩写, Y=在场人数）

## 3. 禁止透露项（仅操作者可见，launcher 剥离，不注入 Simulator）
> 本节是给操作者 / Verifier 的检查清单，确保 Simulator prompt 不含以下信息。
- F 事实列表（F1-F15）：[绝不告诉 Agent]
- 文件清单 / tag 图 / 真相时间线
- 双证据链 / 唯一性反例
- 任何"作者已设计但游戏未呈现"的信息
- 投毒 / 伪造自杀 / 合谋的具体细节

## 4. 试玩基线（Simulator 可见）
- 步数上限：30
- 卡死判定：连续 3 步无新信息
- 多解容忍度：1
- trials: 1

## 5. 通过标准（仅操作者可见，launcher 剥离，不注入 Simulator）
- required_recall: 1.0
- optional_recall: 0.5
- 失败归因上限: 0
