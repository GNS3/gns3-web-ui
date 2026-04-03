import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration file
 * For GNS3 Web UI E2E testing
 */
export default defineConfig({
  // Test files location
  testDir: './tests',

  // Run tests in fully parallel mode
  fullyParallel: true,

  // Fail on `only` in CI environment
  forbidOnly: !!process.env.CI,

  // Retry 2 times in CI environment
  retries: process.env.CI ? 2 : 0,

  // Use 1 worker in CI environment
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],

  // Global configuration
  use: {
    // Base URL
    baseURL: 'http://localhost:4200',

    // Trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Keep video on failure
    video: 'retain-on-failure',

    // Action timeout
    actionTimeout: 10 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Optional: Uncomment to test other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Development server configuration
  webServer: {
    command: 'yarn ng serve',
    port: 4200,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
