# 环境配置说明

本文文档说明 TxtGame 项目在国内网络环境下的 npm / Playwright 代理配置，
以及 Chromium 伪版本兼容方案（自动从最接近的源版本复制到目标版本）。

## 1. 一次性环境变量（PowerShell）

在运行 `npm install` 或 `npx playwright install` **之前**设置以下环境变量：

```powershell
# npm 走阿里云（已被 .npmrc 持久化，理论上不需要再设；这里作备份）
$env:npm_config_registry = "https://registry.npmmirror.com"

# Playwright 浏览器下载代理（关键）
$env:PLAYWRIGHT_DOWNLOAD_HOST = "https://npmmirror.com/mirrors/playwright"
$env:PLAYWRIGHT_BROWSERS_DOWNLOAD_HOST = "https://cdn.npmmirror.com/binaries/playwright"

# 浏览器安装位置（可选，避开沙箱不能写的 %LOCALAPPDATA%）
# $env:PLAYWRIGHT_BROWSERS_PATH = "d:\WorkSpace\projects\TxtGame\.cache\ms-playwright"
```

## 2. Playwright 1223 → 1228 伪版本复制

### 为什么

- `@playwright/test@1.61.0` 期待 **chromium-1228**（Chrome for Testing 149.0.7827.55）
- 阿里云镜像 `builds/chromium/1228/` **只同步了 linux-arm64**，**没有 win64** 镜像
- 完整下载 URL `https://npmmirror.com/mirrors/playwright/builds/cft/149.0.7827.55/win64/chrome-win64.zip` 始终返回 404
- 但本机（或其他机器）可能已经装了 **chromium-1223**（Chrome 148.0.7778.96，win64 完整）

### 怎么做

```powershell
$src = "C:\Users\MrSun\AppData\Local\ms-playwright"
Copy-Item -Path "$src\chromium-1223"              -Destination "$src\chromium-1228"              -Recurse -Force
Copy-Item -Path "$src\chromium_headless_shell-1223" -Destination "$src\chromium_headless_shell-1228" -Recurse -Force
```

`INSTALLATION_COMPLETE` 标志会随复制一起带过去，Playwright 会接受这是合法安装。

### 系统性方案

把上述命令封装进 `package.json` 的 `postinstall` 钩子：

```json
{
  "scripts": {
    "postinstall": "node scripts/copy-playwright-fallback.js"
  }
}
```

脚本行为：
- 读 `playwright-core/browsers.json` 拿目标版本（自动适配未来 1229/1230/...）
- 目标版本已存在 → 跳过
- 选最接近且 ≤ 目标的源版本 → 复制为 `chromium-<目标>` 和 `chromium_headless_shell-<目标>`
- 无合适源 → 打 warning 但**不阻塞 `npm install`**
- 跨平台：纯 Node.js（不依赖 PowerShell）
- 调试：`TXT_GAME_FALLBACK_DRY_RUN=1` 只打印不写；`TXT_GAME_SKIP_FALLBACK_COPY=1` 整个跳过

详见 [`scripts/copy-playwright-fallback.js`](../scripts/copy-playwright-fallback.js)。

## 3. 沙箱限制（TRAE IDE）

TRAE 沙箱默认禁止在 `C:\Users\MrSun\AppData\Local\ms-playwright\` 下创建 `__dirlock`。
解决方案：

- 方案 A：设 `PLAYWRIGHT_BROWSERS_PATH` 指向项目本地目录（沙箱允许）
- 方案 B：把整个 `C:\Users\MrSun\AppData\Local\ms-playwright\` 加入沙箱白名单
- 方案 C：执行 `npx playwright install` 时使用"非沙箱"模式（`requires_approval: true`）

当前默认走方案 C，由 IDE 用户手动批准。

## 4. 验证步骤

```bash
# 1. npm registry
npm config get registry
# 期望输出: https://registry.npmmirror.com

# 2. Playwright 浏览器路径
npx playwright --version
npx playwright install --dry-run chromium
# 期望输出: Install location: C:\Users\MrSun\AppData\Local\ms-playwright\chromium-1228

# 3. 跑 E2E
npm run test:e2e
# 期望: 23 passed
```

## 5. 常见错误速查

| 症状 | 根因 | 修复 |
|---|---|---|
| `EPERM: __dirlock` 报错 | 沙箱拦截 ms-playwright 目录 | 设 PLAYWRIGHT_BROWSERS_PATH 到非用户目录 |
| `Download failed 404 ...chrome-win64.zip` | 阿里云镜像未同步 win64 | 走 §2 的 1223→1228 复制方案 |
| `Cannot find module 'playwright-core/browsers.json'` | 1223 目录没复制过去 | 重做 §2 |
| L5 23 个测试全 fail 在 `waitForSelector('input')` | 测试不处理"点击开始"首页过渡 | 已修：见 `test/helpers/e2e-launch.js` |
