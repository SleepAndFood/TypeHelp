# ending_design：结局设计

> Meta & Tutorial Designer Agent 产出 · TypeHelp C9 约束
> 项目代号：`island-death`

---

## 1. 结局策略

**单一真结局**（TypeHelp C9）：玩家存活 + 真相公开 + 5人被捕。

珊瑚湾不设支线结局。meta元素"玩家即陷阱"已足够冲击，多结局会稀释"清算"主题。玩家要么成功（真结局），要么在过程中"死亡"（游戏结束提示，但只有一个通关路径）。

---

## 2. 真结局触发条件

```javascript
$is_complete === true
&& $final_message_viewed === true
&& hasVisited("00-final-note-0") === true
```

### 前置条件链
1. 玩家收集齐三处物证：NAS隐藏分区（19-04-PL-1）+ 离线硬盘（25-05-PL-1）+ 云盘证据（26-05-PL-1）
2. 玩家拼出完整真相（27-05-PL-1）
3. 玩家触发反制路径（28-05-PL-1）
4. 警方登岛（29-05-PL-1）
5. 清算（30-05-PL-1）→ `$is_complete = true`
6. 玩家阅读 inbox 中的 message2
7. 玩家阅读 00-final-note-0

---

## 3. 触发流程

```
Step 1: 玩家收集到 $cache_max - 2 个公开文件
        ↓
Step 2: $is_complete = true
        inbox 显示 2 条消息：
        - message1- "案件已移交检察机关"
        - message2- "你收到了一封来自'自己'的信"
        ↓
Step 3: 玩家阅读 message2
        $final_message_viewed = true
        ↓
Step 4: 00-final-note-0 解锁（通过 inbox 链接）
        ↓
Step 5: 玩家阅读 00-final-note-0
        ↓
Step 6: Box passage 检测 hasVisited("00-final-note-0")
        → goto "End"
        ↓
Step 7: End passage 显示：
        - 真结局文本："清算"
        - 陈某手写信最后一行的引用
        - "THE END"
```

---

## 4. 游戏结束（非通关）条件

玩家在调查过程中"死亡"的条件——仅作为叙事提示，不阻止继续游戏：

| 条件 | 触发 | 效果 |
|---|---|---|
| 第4幕中段未触发反制 | 读取23-04-PL-1后，48分钟内未到达24-04-PL-1 | 00-meta-warning弹出，提示"你正在走前3任的路" |
| 过度暴露调查意图 | 连续3次在对话中选择"追问"选项 | 李某开始监视玩家，后续文件解锁速度减慢 |

**注意**：这些不是"坏结局"——它们是叙事压力机制，迫使玩家加速推进反制路径。

---

## 5. 结局可达性矩阵

| 步骤 | 必须文件 | 如果缺失 |
|---|---|---|
| 物证收集 | 19-04-PL-1, 25-05-PL-1, 26-05-PL-1 | 无法拼出完整真相，27-05-PL-1不触发 |
| 反制路径 | 28-05-PL-1 | 警方不会登岛，29-05-PL-1不触发 |
| 结局触发 | 30-05-PL-1, 00-final-note-0 | 无法到达 End passage |

**所有步骤可达**——每个必须文件在 tag 图中均有明确路径。 ✓

---

## 6. meta 结局元素

- **00-dream-0**：结局后回溯，玩家发现梦境中的"白发老人"就是江某
- **00-final-note-0**：玩家写给下一任管家的信（形成"4任管家"的循环叙事）
- **30-05-PL-1**：陈某手写信最后一行的引用——"如果成功了，替我去看看大陆的日出"

---

**Meta & Tutorial Designer 签字**：✓ 已完成
**日期**：2026-06-22
**Handoff**：→ Formal Verifier