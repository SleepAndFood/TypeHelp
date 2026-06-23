/**
 * L4 渲染环境搭建：jsdom + SugarCube HTML
 */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

let activeDom = null;

/**
 * 加载 HTML 并返回 { window, document, dom, ready: Promise }
 * ready 在 SugarCube 引擎初始化完成后 resolve
 */
export function createGameEnv(htmlPath) {
  const abs = path.resolve(process.cwd(), htmlPath);
  const html = fs.readFileSync(abs, 'utf-8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    url: 'file://' + abs.replace(/\\/g, '/'),
  });
  activeDom = dom;
  const { window } = dom;

  // 等到 window 上出现 Story / State / SugarCube 或超时
  const ready = new Promise((resolve, reject) => {
    const deadline = Date.now() + 8000;
    const tick = () => {
      if (window.Story || window.SugarCube || window.State) {
        return resolve();
      }
      if (Date.now() > deadline) {
        return reject(new Error('SugarCube 引擎初始化超时（8s）'));
      }
      setTimeout(tick, 50);
    };
    tick();
  });

  return { window, document: window.document, dom, ready };
}

export function teardown() {
  if (activeDom) {
    try {
      activeDom.window.close();
    } catch {}
    activeDom = null;
  }
}

export function isRenderSupported(config) {
  return !!(config && config.htmlFile);
}
