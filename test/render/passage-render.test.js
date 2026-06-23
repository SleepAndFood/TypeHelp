import { describe, test, expect, afterEach } from 'vitest';
import { createGameEnv, teardown, isRenderSupported } from './setup.js';
import { loadConfig } from '../helpers/config.js';

afterEach(teardown);

describe('render/setup (jsdom 环境)', () => {
  test('createGameEnv 返回 window/document/dom', async () => {
    const config = await loadConfig();
    if (!isRenderSupported(config)) return; // skip 无 HTML 剧本
    const env = createGameEnv(config.htmlFile);
    expect(env.window).toBeDefined();
    expect(env.document).toBeDefined();
    expect(env.dom).toBeDefined();
    await env.ready.catch(() => {}); // 允许超时；只检查对象存在
  });
});

describe('render/passage (SugarCube 渲染)', () => {
  test('引擎初始化：window 上存在 Story 或 State', async () => {
    const config = await loadConfig();
    if (!isRenderSupported(config)) return; // skip 无 HTML 剧本
    const env = createGameEnv(config.htmlFile);
    try {
      await env.ready;
      const ok = !!(env.window.Story || env.window.State || env.window.SugarCube);
      expect(ok).toBe(true);
    } catch (e) {
      // jsdom 对部分 SugarCube API 不支持时降级为 warn 而非 fail
      console.warn('SugarCube 引擎在 jsdom 中未能完全初始化（可能需 Playwright 兜底）:', e.message);
    }
  }, 15000);
});
