/**
 * 命令路由纯函数（TDD RED 后的 GREEN 实现）
 * 来源：参考 D:\WorkSpace\projects\TxtGame\.tmp\twine-game-test-guide.html 第 4 节
 *
 * parseCommand(rawInput, state) → { action, args, newState }
 *   action: 'noop' | 'help' | 'list' | 'back' | 'save'
 *         | 'name' | 'note' | 'find' | 'openFile' | 'error'
 *   args:  { ... } 视 action 而定
 *   newState: 状态增量变更
 */
export function parseCommand(rawInput, state) {
  const input = (rawInput || '').trim();
  if (!input) return { action: 'noop' };

  const parts = input.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const restRaw = rawInput.replace(/^\s*\S+\s*/, ''); // 保留原大小写

  // help
  if (cmd === 'help') {
    return { action: 'help', args: {}, newState: {} };
  }

  // list / list N
  if (cmd === 'list') {
    if (parts.length > 2) return { action: 'error', message: '参数过多' };
    if (parts.length === 1) return { action: 'list', args: { page: 0 }, newState: {} };
    const n = parseInt(parts[1], 10);
    if (Number.isNaN(n)) return { action: 'error', message: 'Invalid command' };
    const totalPages = 4; // 通用化默认值；实际剧本可在 config 中指定
    const page = Math.max(0, Math.min(totalPages - 1, n - 1));
    return { action: 'list', args: { page }, newState: {} };
  }

  // back
  if (cmd === 'back') return { action: 'back', args: {}, newState: {} };

  // save
  if (cmd === 'save') return { action: 'save', args: {}, newState: {} };

  // name
  if (cmd === 'name') {
    if (parts.length === 1) return { action: 'name', args: { mode: 'list' }, newState: {} };
    const target = parts[1];
    if (target === '#') {
      const nickname = restRaw.replace(/^#\s*/, '').trim();
      return {
        action: 'name',
        args: { mode: 'setUsername', value: nickname },
        newState: { username: nickname },
      };
    }
    if (!state.people.includes(target)) {
      return { action: 'error', message: '指令无效' };
    }
    if (parts.length === 2) {
      return { action: 'name', args: { mode: 'delete', target }, newState: {} };
    }
    const nickname = restRaw.replace(/^\S+\s*/, '').trim();
    return {
      action: 'name',
      args: { mode: 'set', target, value: nickname },
      newState: { nicknames: { ...(state.nicknames || {}), [target]: nickname } },
    };
  }

  // note
  if (cmd === 'note') {
    if (parts.length === 1) return { action: 'note', args: { mode: 'list' }, newState: {} };
    const content = restRaw.trim().substring(0, 300);
    return {
      action: 'note',
      args: { mode: 'add', content },
      newState: { notes: [...(state.notes || []), content] },
    };
  }

  // find
  if (cmd === 'find') {
    const term = restRaw.trim() || ' ';
    return { action: 'find', args: { term }, newState: {} };
  }

  // 文件名直接输入
  const cache = state.cache || [];
  if (cache.includes(input)) {
    return { action: 'openFile', args: { fileName: input }, newState: {} };
  }
  if (isValidFileName(input, state)) {
    return {
      action: 'openFile',
      args: { fileName: input },
      newState: { cache: [...cache, input] },
    };
  }

  return { action: 'error', message: `"${input}"` };
}

export function isValidFileName(input, state) {
  const pattern = state.namingPattern || '^[0-9]{2}-[A-Za-z]{2,3}(-[0-9A-Za-z]+)+$';
  return new RegExp(pattern).test(input);
}
