import { describe, test, expect } from 'vitest';
import { parseCommand } from '../../src/commandRouter.js';

const baseState = {
  people: ['1','2','3','4','5','6','7','8','9','10','11','12','K','@'],
  cache: ['00-readme', '01-QU-1-11'],
  nicknames: {},
  notes: [],
  namingPattern: '^[0-9]{2}-[A-Za-z]{2,3}(-[0-9A-Za-z@]+)+$',
};

describe('parseCommand', () => {
  test('空输入 / 纯空白 → noop', () => {
    expect(parseCommand('', baseState)).toEqual({ action: 'noop' });
    expect(parseCommand('   ', baseState)).toEqual({ action: 'noop' });
  });

  test('help 大小写不敏感', () => {
    expect(parseCommand('help', baseState).action).toBe('help');
    expect(parseCommand('HELP', baseState).action).toBe('help');
    expect(parseCommand('Help', baseState).action).toBe('help');
  });

  test('list 命令分页与边界', () => {
    expect(parseCommand('list', baseState)).toEqual({ action: 'list', args: { page: 0 }, newState: {} });
    expect(parseCommand('list 2', baseState).args.page).toBe(1);
    expect(parseCommand('list 5', baseState).args.page).toBe(3); // 越界夹到 3
    expect(parseCommand('list abc', baseState).action).toBe('error');
    expect(parseCommand('list 1 2', baseState).action).toBe('error');
  });

  test('back / save', () => {
    expect(parseCommand('back', baseState).action).toBe('back');
    expect(parseCommand('save', baseState).action).toBe('save');
  });

  test('name 4 模式', () => {
    expect(parseCommand('name', baseState).args.mode).toBe('list');
    const r1 = parseCommand('name 1 约翰', baseState);
    expect(r1.action).toBe('name');
    expect(r1.args.mode).toBe('set');
    expect(r1.args.target).toBe('1');
    expect(r1.newState.nicknames['1']).toBe('约翰');
    const r2 = parseCommand('name 1', { ...baseState, nicknames: { '1': 'John' } });
    expect(r2.args.mode).toBe('delete');
    expect(parseCommand('name 99 x', baseState).action).toBe('error');
    const r3 = parseCommand('name # 玩家', baseState);
    expect(r3.args.mode).toBe('setUsername');
    expect(r3.newState.username).toBe('玩家');
  });

  test('note 命令（带 300 截断）', () => {
    const r = parseCommand('note 这是一条笔记', baseState);
    expect(r.action).toBe('note');
    expect(r.args.mode).toBe('add');
    expect(r.newState.notes).toContain('这是一条笔记');
    const long = 'A'.repeat(400);
    const r2 = parseCommand('note ' + long, baseState);
    expect(r2.args.content.length).toBeLessThanOrEqual(300);
  });

  test('find 命令', () => {
    expect(parseCommand('find 钢琴', baseState).args.term).toBe('钢琴');
    expect(parseCommand('find', baseState).args.term).toBe(' ');
  });

  test('文件名直接输入', () => {
    expect(parseCommand('00-readme', baseState).action).toBe('openFile');
    const r = parseCommand('02-EN-1-2', baseState);
    expect(r.action).toBe('openFile');
    expect(r.newState.cache).toContain('02-EN-1-2');
    expect(parseCommand('not-a-file', baseState).action).toBe('error');
  });
});
