import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  // 优先用完整 chromium（已装在 C:\Users\MrSun\AppData\Local\ms-playwright\chromium-1228）
  // 不强制 channel: 'chrome' 以避免 headless shell 缺失问题
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
    launchOptions: {
      // 若 headless shell 缺失，回退到完整 chromium binary
      channel: undefined,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        // 用 Playwright 自带的 chromium（已通过 npx playwright install 装过）
        // 不再强求 headless shell
        headless: true,
      },
    },
  ],
});
