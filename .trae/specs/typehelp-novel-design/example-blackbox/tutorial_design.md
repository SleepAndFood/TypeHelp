# tutorial_design：渐进教程设计

> Tutorial Designer Agent 产出 · 取代 L0-L3 提示

---

## 1. 教程策略

TypeHelp 无"提示"按钮，教程通过两种方式渐进解锁：
1. **[@] 叙述者注**承载教程文本
2. **<<set $seen_xxx to true>>** 标志解锁，新命令出现在 help 列表

## 2. 命令解锁时间表

| 命令 | 解锁位置 | 触发标志 | 教程文本 |
|---|---|---|---|
| `help` | 启动后立即 | `StoryInit` | 00-readme + Box 默认 |
| `list` | 启动后立即 | `StoryInit` | 00-readme 提到 |
| `back` | 启动后立即 | `StoryInit` | 隐式 |
| `save` | 启动后立即 | `StoryInit` | 00-readme 提到 |
| `inbox` | 启动后立即 | `StoryInit` | 00-readme 提到 |
| `name` | 02-BR（第一幕中段，首次 3+ 角色对话） | `$seen_name` | "试试输入 `name 2 刘医生`" |
| `title` | 14-LA（第三幕） | `$seen_title` | "给时间码取个标题" |
| `act` | 22-AT（第四幕） | `$seen_act` | "给幕取标题" |
| `note` | 03-ME（验尸后） | `$seen_note` | "用 `note` 记录重要发现" |
| `find` | 09-CA（第二幕末） | `$seen_find` | "用 `find 关键词` 搜索" |
| `hangman` | 00-final-note（meta） | `$seen_hangman` | "玩 hangman 解锁真相" |

## 3. 一次性提示（$first_xxx）

| 一次性 | 触发 | 内容 |
|---|---|---|
| `$first_help` | 首次输入 help | "欢迎, $username!..." |
| `$first_list` | 首次输入 list | "已收集文件: (点击阅读)" |
| `$first_note` | 首次输入 note | 提示字符限制 300 |

## 4. 教程节奏时间轴

```
启动
  ↓ [$first_help, $first_list]
00-readme (intro)
  ↓
01-CR-1 (无教程，氛围)
  ↓
02-BR-1-2-3-4-5-6 ──→ $seen_name = true
  ↓
03-ME-1-2 ──→ $seen_note = true
  ↓
04-EN-1-2-4 (无教程，关键证据)
  ↓
05-CA-3-5
  ↓
09-CA-1-2-3-4-5-6 ──→ $seen_find = true
  ↓
12-CO-2
  ↓
14-LA-4 ──→ $seen_title = true
  ↓
18-LA-2-4
  ↓
21-AT-2-5
  ↓
22-AT-1-2-3-4-5-6 ──→ $seen_act = true
  ↓ [达到 $cache_max - 2]
inbox → message2 → 00-final-note ──→ $seen_hangman = true
  ↓
25-WI-2 → End
```

## 5. 教程文本样例

### 02-BR 中的 name 教程

```
[@] 注：如果你不喜欢数字命名系统，可以试试输入"name 2 刘医生"指令，
[@] 这个指令能将 2 号人员的名字显示为"刘医生"。你可以给相应编号的人员
[@] 取任意昵称，仅输入"name"指令可以查询你之前输入了哪些昵称。
<<set $seen_name to true>>
```

### 03-ME 中的 note 教程

```
[@] 注：信息量大？试试 "note 刘医生反复强调心脏骤停" 来记录你的发现。
[@] 笔记最多 300 字符，但已足够。
<<set $seen_note to true>>
```

### 09-CA 中的 find 教程

```
[@] 注：想回溯某个关键词？试试 "find PLC" 或 "find 氧气"。
[@] 这会在你已收集的文件中全文搜索。
<<set $seen_find to true>>
```

### 14-LA 中的 title 教程

```
[@] 注：你已经走到第 14 段时间了。试试 "title 14 数据恢复" 给这段时间取个标题。
[@] 标题会显示在文件列表顶部。
<<set $seen_title to true>>
```

### 22-AT 中的 act 教程

```
[@] 注：四幕结构？试试 "act 4 清算" 给第四幕取标题。
<<set $seen_act to true>>
```

### 00-final-note 中的 hangman 教程

```
[@] 注：现在，你可以玩 hangman 小游戏了。输入 "hangman" 开始。
[@] 这是最后的彩蛋。
<<set $seen_hangman to true>>
```

## 6. 自检

- [x] `name` 在第一幕首次 3+ 角色对话（02-BR）解锁 ✓
- [x] `note` 在第一具尸体后（03-ME）解锁 ✓
- [x] `find` 在第二幕中段（09-CA）解锁 ✓
- [x] `title` 在第三幕（14-LA）解锁 ✓
- [x] `act` 在第四幕（22-AT）解锁 ✓
- [x] `hangman` 在 meta（00-final-note）解锁 ✓
- [x] `[$first_xxx]` 一次性提示触发条件完整 ✓
- [x] `[$seen_xxx]` 状态机无矛盾 ✓

## 7. 与 TypeHelp C7 约束对齐

教程渐进式解锁，分布在 4 幕中 ✓
无一次性塞给所有命令 ✓
