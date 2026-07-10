# tag 解锁机制修复设计 · act1→act2 文件发现断崖

> 日期：2026-07-10
> 影响范围：island-death 剧本 + TypeHelp 框架 Box passage
> 根因：C4 tag 互引设计有文档无实现

---

## 1. 问题

Inference Simulator 黑盒试玩发现：act1（8 个文件）读完后，纯文本玩家无法发现 act2-act5 的 28 个文件。两次"通关"均依赖作弊（trial1 猜隐藏文件名 / trial2 读 DOM data-tags）。

### 根因

- **设计意图**（tag_graph.md / file_index.md / tutorial_design.md）：
  - C4："tag 字段承担互引，tags=\"...\" 取代跳转 DAG"
  - file_index.md L30："你当前已**解锁**的文件可以通过 list 命令查看"
  - find 是"搜索相关文件"（暗示能发现未读文件）

- **实现现实**（Box passage 代码）：
  - `$cache` 只在玩家输入正确文件名时 push（[Box L414-415](file:///d:/WorkSpace/projects/TxtGame/games/island-death/island-death.html#L414)）
  - `find_results` 只遍历 `$cache`（[L578](file:///d:/WorkSpace/projects/TxtGame/games/island-death/island-death.html#L578)）→ 只搜已读文件
  - `list` 只遍历 `$cache`（[L478](file:///d:/WorkSpace/projects/TxtGame/games/island-death/island-death.html#L478)）→ 只列已读文件
  - **没有任何代码读取 passage 的 tags 字段来"解锁"互引文件**

**落差本质**：设计文档说 tag 承担互引，但实现中 tag 只是 SugarCube passage 的元数据属性（data-tags），从未被任何命令逻辑读取。"解锁"机制在设计中被描述但从未实现。

---

## 2. 修复方案

### 2.1 框架层：tag 解锁机制

#### 新增 `$unlocked` 状态变量

StoryInit passage 新增：
```javascript
<<set $unlocked to ["00-readme"]>>  // 已解锁文件（含已读 + tag 指向未读）
```

- `$cache`：已读文件（不变，用于进度统计）
- `$unlocked`：已解锁文件（$cache 超集，含 tag 指向但未读的）

#### 读取文件时解锁 tag 指向的文件

Box passage 文件名跳转分支（L410-428），玩家输入文件名跳转后，读取该文件 tags 并将指向文件加入 `$unlocked`：
```javascript
// $cache.push($command) 之后追加
<<set _tags to tags($command)>>
<<for _i to 0; _i lt _tags.length; _i++>>
  <<if not $unlocked.includes(_tags[_i]) and Story.has(_tags[_i])>>
    <<run $unlocked.push(_tags[_i])>>
  <</if>>
<</for>>
<<set $unlocked to $unlocked.sort()>>
```

#### find 改为搜已解锁文件内容

find_results passage（L578）从遍历 `$cache` 改为遍历 `$unlocked`。搜文件名+内容，返回文件名链接。符合设计意图"搜索相关文件发现新线索"。

#### list 改为列已解锁文件

list passage（L478）从遍历 `$cache` 改为遍历 `$unlocked`。已读和未读文件视觉区分（已读普通色，未读高亮）。

#### 隐藏文件保护

`00-` 前缀隐藏文件（00-chen-video / 00-su-identity / 00-meta-warning / 00-dream / 00-final-note-0）保持各自触发条件，不被 tag 自动解锁。从 tag_graph.md 验证：公开文件 tags 不指向隐藏文件（除 30-05-PL-1 → 00-final-note-0），对 00-final-note-0 做特殊过滤（由 `$is_complete` 触发）。

### 2.2 剧本层：线索文本补充

3 处 `[@]` 补充块末尾追加搜索提示（不剧透文件名，只给关键词）：

| 文件 | 追加内容 |
|---|---|
| 05-01-PL-1 | "陈某在信中提到'A份在NAS隐藏分区里'——那里的文件似乎是江某本人的工作记录。如果你想了解江某死前到底发现了什么，试试 find 江某 或 find 填海。" |
| 06-01-PL-1 | "韩某还提到，陈某生前曾在NAS里整理过一批2017年的旧档案——江某死前那几天发生了什么？输入 list 查看已解锁的文件，或试试 find 2017。" |
| 19-04-PL-1 | "NAS分区的三个文件夹里还有更多文件——surveillance_logs/、jiang_files/、zhou_files/。这些文件已解锁，输入 list 查看第二幕和第三幕的完整文件列表。" |

### 2.3 通用性

框架层修复在 TypeHelp Box passage 层面生效，所有使用相同结构的剧本（galley-villa 等）受益。剧本层只需确保 tag_graph.md 的 tag 字段正确。

---

## 3. 验证标准

1. **纯黑盒通关**：子代理只通过 Playwright 文本框交互（help/list/find/name/文件名），不读 DOM/源码/猜文件名，从 00-readme 推进到 30-05-PL-1 结局
2. **防作弊机制**：用脚本提取玩家目视可见的纯文本喂给 AI 子代理，杜绝 DOM 检查
3. **CI 门禁通过**：Python A/B/C 门禁 + L1-L5 测试无回归
4. **循环验证**：若子代理仍卡死，分析卡点→补充线索→重试，直到纯黑盒通关

---

## 4. 改动文件清单

| 文件 | 改动 |
|---|---|
| island-death.html → StoryInit | 新增 `$unlocked` |
| island-death.html → Box passage | 文件名跳转后解锁 tags |
| island-death.html → find_results | 遍历 `$unlocked` |
| island-death.html → list | 遍历 `$unlocked` + 已读/未读视觉区分 |
| island-death.html → 05-01-PL-1 | `[@]` 追加搜索提示 |
| island-death.html → 06-01-PL-1 | `[@]` 追加搜索提示 |
| island-death.html → 19-04-PL-1 | `[@]` 追加搜索提示 |
| file_index.md | 同步更新 3 处设计文档 |
