/**
 * L1 静态分析 helper（配置驱动）
 * 5 个独立分析函数，每个返回违规列表；测试仅断言 toEqual([]) 或特定条目
 */

/**
 * 哪些 passage 名称被当作"系统/系统辅助"豁免命名检查
 */
function getSystemNames(config) {
  return new Set([
    config.commandRouterPassage || 'Box',
    'StoryInit', 'StoryCaption', 'StoryBanner', 'StoryMenu',
    'StoryTitle', 'StoryAuthor', 'StorySubtitle', 'list',
    config.testingPassage || 'Testing vars',
  ]);
}

/**
 * 哪些 passage 名称应被视为"meta / 辅助"豁免命名检查
 * 默认：所有以 metaPrefix 开头的 + metaFiles 列出的
 */
function isMetaPassage(p, config) {
  if (p.name.startsWith(config.metaPrefix || '00-')) return true;
  for (const m of config.metaFiles || []) {
    if (p.name === `${config.metaPrefix || '00-'}${m}`) return true;
  }
  return false;
}

/**
 * Twine tags 字段是混合用途：
 * - 形如 `01-LR-1-2` 的 → 真实 passage 引用
 * - 形如 `100,200` 的纯数字 → 编辑器位置元数据
 * - 其他 → 自由分类标签
 * 因此只对"形如 passage 命名"的 tag 做引用检查
 */
function looksLikePassageName(tag) {
  // 至少含一个非数字字符，且长度 ≥ 3
  return /^[A-Za-z0-9-]+$/.test(tag) && /[A-Za-z-]/.test(tag) && tag.length >= 3;
}

export function findBrokenRefs(passages, _config) {
  const names = new Set(passages.map((p) => p.name));
  const broken = [];
  for (const p of passages) {
    for (const tag of p.tags) {
      if (looksLikePassageName(tag) && !names.has(tag)) {
        broken.push({ from: p.name, missing: tag });
      }
    }
  }
  return broken;
}

export function findNamingViolations(passages, config) {
  const re = new RegExp(config.namingPattern);
  const sys = getSystemNames(config);
  // 显式从 config 读取 systemPassages（兜底）
  const extraSys = new Set(config.systemPassages || []);

  return passages
    .filter((p) => !isMetaPassage(p, config))
    .filter((p) => !sys.has(p.name))
    .filter((p) => !extraSys.has(p.name))
    // 单段无连字符的纯单词 passage（如 Hangman setup / Background）视作引擎内部辅助，跳过
    .filter((p) => p.name.includes('-'))
    .filter((p) => !re.test(p.name))
    .map((p) => p.name);
}

/**
 * 人物 ID 规则（更宽容）：
 * - 形式：1-2 位数字 或 单大写字母（K、@ 等）
 * - 位置：passage 名的最后 1-2 个 token
 * 这样可避免把 "PL" "BB" "AA" 等地点缩写误判为人物
 */
const PERSON_TOKEN = /^[0-9]{1,2}$|^[A-Z@]$/;

export function findInvalidPeopleIds(passages, config) {
  const set = new Set(config.peopleIds || []);
  if (set.size === 0) return [];
  const invalid = [];
  for (const p of passages) {
    if (isMetaPassage(p, config)) continue;
    const parts = p.name.split('-');
    const tail = parts.slice(-2).filter((t) => PERSON_TOKEN.test(t));
    for (const tok of tail) {
      if (!set.has(tok)) {
        invalid.push({ passage: p.name, badId: tok });
      }
    }
  }
  return invalid;
}

export function findHiddenFileIssues(passages, config) {
  const issues = [];
  const names = new Set(passages.map((p) => p.name));
  // 默认只检查 hiddenFiles 是否真实存在；
  // 当 config.strictListExclusion === true 时，再检查 list passage 是否硬编码引用了它们
  const strict = !!config.strictListExclusion;

  for (const hidden of config.hiddenFiles || []) {
    if (!names.has(hidden)) {
      issues.push({ kind: 'missing', hidden });
      continue;
    }
    if (strict) {
      const listPassage = passages.find((p) => p.name === 'list');
      if (listPassage) {
        const tokenRe = /\b([0-9]{2}(?:-[0-9A-Za-z@]+)+)\b/g;
        const tokens = new Set();
        let m;
        while ((m = tokenRe.exec(listPassage.text)) !== null) tokens.add(m[1]);
        if (tokens.has(hidden)) {
          issues.push({ kind: 'listed', hidden });
        }
      }
    }
  }
  return issues;
}

export function findDeadLinks(passages, _config) {
  const names = new Set(passages.map((p) => p.name));
  const linkRe = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
  const broken = [];
  for (const p of passages) {
    let m;
    while ((m = linkRe.exec(p.text)) !== null) {
      const target = m[1].trim();
      // 只检查形如 passage 名的 ASCII target（中文/UI 标签忽略）
      if (!/^[A-Za-z0-9-]+$/.test(target)) continue;
      if (!names.has(target)) {
        broken.push({ from: p.name, target });
      }
    }
  }
  return broken;
}
