import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置文件
 * 用于 GNS3 Web UI 的 E2E 测试
 */
export default defineConfig({
  // 测试文件位置
  testDir: './tests',

  // 完全并行运行测试
  fullyParallel: true,

  // CI 环境下禁止 only 测试
  forbidOnly: !!process.env.CI,

  // CI 环境下重试 2 次
  retries: process.env.CI ? 2 : 0,

  // CI 环境下使用 1 个 worker
  workers: process.env.CI ? 1 : undefined,

  // 报告器配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],

  // 全局配置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:4200',

    // 失败时跟踪
    trace: 'on-first-retry',

    // 失败时截图
    screenshot: 'only-on-failure',

    // 失败时保留视频
    video: 'retain-on-failure',

    // 操作超时
    actionTimeout: 10 * 1000,

    // 导航超时
    navigationTimeout: 30 * 1000,
  },

  // 不同浏览器的测试项目
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 可选：取消注释以测试其他浏览器
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // 开发服务器配置
  webServer: {
    command: 'yarn ng serve',
    port: 4200,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
