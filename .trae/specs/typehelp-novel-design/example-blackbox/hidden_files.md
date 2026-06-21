# hidden_files + ending_design：隐藏文件与结局

> Meta Designer Agent 产出

---

# A. 隐藏文件设计（hidden_files.md）

## A.1 三个隐藏文件

### 00-dream（HIDDEN · 伏笔）

- **触发**：必须已知文件名
- **玩家获取方式**：通过 `00-references` 中"一些文件被排除在常规列表之外"的暗示，玩家推断出存在 `00-` 段的其他文件
- **内容性质**：meta 诗歌 / 伏笔拼图
- **解锁 meta 元素**：与 25-WI-2 互为伏笔
- **不被 `$cache_max` 计算**（与 TypeHelp 源码一致：`$cache.includes("00-dream")` 时 `_progress -= 1`）

### 00-final-note（HIDDEN · meta 真相）

- **触发**：
  1. `$cache.length >= $cache_max - 2`（与 TypeHelp 一致：扣除 00-dream 和 00-final-note 后达到阈值）
  2. 阅读 message2-（"调查员遗书"通知）
- **玩家获取方式**：自动解锁，无须输入文件名
- **内容性质**：调查员遗书，meta 真相
- **触发 End**：阅读后自动跳转到 End passage

### 25-WI-2（HIDDEN · meta 收束）

- **触发**：阅读 22-AT-1-2-3-4-5-6（其 tag 指向 25-WI-2）
- **玩家获取方式**：22-AT 文件末尾 `[@]` 注提示"如果你理解了，请阅读 25-WI-2"
- **内容性质**：meta 收束，调查员与刘医生的"对话"
- **不影响通关**：通关后作为彩蛋阅读

## A.2 隐藏文件可见性矩阵

| 隐藏文件 | 在 `list` 中显示？ | 触发阅读方式 |
|---|---|---|
| 00-dream | 否（源码 pid 1 list 段无检查） | 须知文件名，直接输入 |
| 00-final-note | 否 | `$is_complete` 后 inbox 提示 |
| 25-WI-2 | 否（不含在 `$cache_max` 内的统计） | 读 22-AT 后 [@] 提示 |

## A.3 隐藏文件的内容守则

- 不可包含**新事实 F**（避免幽灵线索）
- 只承载**氛围 / 伏笔 / meta 反思**
- 与 truth.md 真相自洽

---

# B. 结局设计（ending_design.md）

## B.1 唯一真结局（True Ending）

**触发条件**：
```javascript
$is_complete === true
&& $final_message_viewed === true
&& hasVisited("00-final-note") === true
```

**触发流程**：
1. 玩家收集到 `$cache_max - 2` 个公开文件
2. `$is_complete = true`，inbox 显示 2 条消息
3. 玩家阅读 message2-
4. `$final_message_viewed = true`
5. 玩家阅读 `00-final-note`（通过 inbox 解锁）
6. Box passage 检测 `hasVisited("00-final-note")` → `goto "End"`
7. End passage 显示 hangman ASCII art + "THE END"

**通关文案**（End passage）：
```
hangman ASCII art
THE END
原案件：曙光号 2187-04-12 事件
凶手：刘医生
动机：向地球黑市倒卖飞船稀缺药物
方法：篡改 PLC 氧气回收器参数
```

## B.2 伪结局（False Ending）

**触发条件**：
- `$is_complete === false`
- 玩家在任何时刻输入 `end`（无此命令）
- 或在阅读 22-AT 后直接退出（无通关）

**体验**：玩家读完全部公开文件但未触发隐藏文件，悬而未决。
（说明：本 worked example 不实现"伪结局"分支，以简化复杂度）

## B.3 meta 结局（Meta Ending）

**触发条件**：
- 完成真结局后
- 玩家主动输入 `25-WI-2`

**体验**：调查员（玩家）理解自己与刘博士"对称"——两人都是听完/参与后成为故事一部分的人。Hangman 的最后一行字母填满，揭示单词 **"FOREVER"**（与 TypeHelp 原版对齐）。

## B.4 结局可达性矩阵

| 结局 | 触发条件 | 可达性 |
|---|---|---|
| 真结局 | $is_complete + final-note 阅读 | 100%（白盒）|
| meta 结局 | 真结局 + 主动输 25-WI-2 | 100% |
| 伪结局 | 未达成 | N/A（不实现） |
| 死局 | 不存在 | ✓ C9 约束满足 |

## B.5 与 TypeHelp C6 / C9 约束对齐

- [x] 至少 2 个隐藏文件（实际 3 个）✓
- [x] meta 元素存在 ✓
- [x] 唯一结局路径明确 ✓
- [x] 无死局 ✓
