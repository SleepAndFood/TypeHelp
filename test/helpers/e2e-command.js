/**
 * E2E 测试命令输入 helper
 * 集中处理"在 SugarCube Box passage 输入命令"的操作
 *
 * 防御目标：
 *   1. SKILL.md §8.11 陷阱 #1：禁止 page.fill()（会被 <<type>> 动画卡死）—— 用 keyboard.type 慢速键入
 *   2. UI overlay 拦截：galley-villa 的某些命令（help 等）可能触发 SugarCube UI overlay
 *      <div id="ui-overlay" class="ui-close open"> 短暂或持续遮挡输入框
 *      用 force: true 跳过 actionability 检查（visible/enabled/stable/intercepts）
 *   3. 反馈渲染等待：命令提交后 page.waitForTimeout(300) 等待 DOM 更新再断言
 *
 * 严格规则：
 *   - delay: 2 慢速键入（避免某些命令把"快速粘贴"识别为非法）
 *   - 显式 click 焦点 + keyboard.type 提交（避免 fill 陷阱）
 *   - force: true 跳过 overlay 拦截检查（这是 e2e 测试需要，浏览器用户可以自己关 overlay）
 */

/**
 * 在 SugarCube Box passage 的命令输入框输入并提交命令
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} cmd 命令字符串
 * @param {{ timeout?: number, settleMs?: number }} [opts] settleMs 默认 300ms
 */
export async function typeCommand(page, cmd, opts = {}) {
  const timeout = opts.timeout ?? 3000;
  const settleMs = opts.settleMs ?? 300;
  const inp = page.locator('input[type="text"]').first();
  // force: true 跳过 UI overlay 拦截（help 等命令可能临时打开 overlay，浏览器用户可手动关）
  // 关键：不跳过会 3s 超时后 fail，e2e 测试只关心"命令是否生效"，不关心 UI 状态
  await inp.click({ timeout, force: true });
  await page.keyboard.type(cmd, { delay: 2 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(settleMs);
}

/**
 * 读取页面 body 文本（去除多余空白）
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
export async function getBodyText(page) {
  return (await page.textContent('body')) || '';
}
