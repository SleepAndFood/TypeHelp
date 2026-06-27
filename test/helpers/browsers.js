/**
 * 浏览器可用性检测 helper
 * 供 framework-drift 等纯文件系统测试在 beforeAll 里 skip 掉整个 test.describe
 *
 * 防御目标：
 *   1. 避免"Playwright 浏览器未装"时整批测试 10s 超时后 fail
 *   2. 集中检查逻辑，方便后续切换检测策略（如改检查 PLAYWRIGHT_BROWSERS_PATH）
 *
 * 检测策略：
 *   - 调用 playwright 的 chromium.executablePath() 拿到当前版本期望的二进制路径
 *   - existsSync 验证
 *   - 任何抛错（浏览器没装 / 版本不匹配）一律返回 false
 *
 * 严格遵循 SKILL.md §8.11 的"环境优雅降级"模式：
 *   不让环境问题掩盖真实业务问题——没浏览器就 skip，有浏览器就真跑
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

/**
 * @returns {Promise<boolean>} true = 当前 playwright 期待的 chromium 已就绪
 */
export async function browsersAvailable() {
  try {
    const exe = chromium.executablePath();
    return existsSync(exe);
  } catch {
    return false;
  }
}
