# E2E Testing Implementation Guide for GNS3 Web UI

## Overview

This document describes how to implement and run end-to-end (E2E) tests for GNS3 Web UI, covering components that cannot be tested in unit tests:
- `logged-user.component.spec.ts` (10 tests)
- `web-console-full-window.component.spec.ts` (36 tests)

## Recommended Solution: Playwright

Playwright is a modern, fast, and reliable E2E testing framework that supports all major browsers.

### Why Playwright?

1. **Cross-browser support**: Chrome, Firefox, Safari, Edge
2. **Fast execution**: Parallel test execution
3. **Powerful selectors**: Designed for modern dynamic web apps
4. **Auto-waiting**: Smart waiting for elements to be visible/clickable
5. **Network interception**: Can mock API responses
6. **Screenshots/videos**: Automatic capture on failure
7. **TypeScript support**: Native TypeScript support

## Installation Steps

### 1. Install Playwright

```bash
yarn add -D @playwright/test
npx playwright install --with-deps
```

### 2. Create E2E Test Directory Structure

```
gns3-web-ui/
├── e2e/
│   ├── fixtures/           # Test data
│   │   ├── users.ts
│   │   ├── controllers.ts
│   │   └── nodes.ts
│   ├── pages/              # Page Object Model
│   │   ├── base.page.ts
│   │   ├── login.page.ts
│   │   ├── user-management.page.ts
│   │   └── console.page.ts
│   ├── tests/              # Test cases
│   │   ├── user-management/
│   │   │   ├── login.spec.ts
│   │   │   ├── user-detail.spec.ts
│   │   │   └── change-password.spec.ts
│   │   └── console/
│   │       └── web-console.spec.ts
│   ├── playwright.config.ts
│   └── tsconfig.json
└── package.json
```

### 3. Configuration Files

#### `e2e/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

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
```

#### `e2e/tsconfig.json`

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "../dist-e2e",
    "module": "commonjs",
    "types": ["node"]
  }
}
```

### 4. Page Object Model (POM)

#### `e2e/pages/base.page.ts`

```typescript
import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string = '') {
    await this.page.goto(path);
  }

  async click(locator: Locator | string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.click();
  }

  async fill(locator: Locator | string, value: string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.fill(value);
  }

  async waitForSelector(locator: Locator | string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor();
  }

  async isVisible(locator: Locator | string): Promise<boolean> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.isVisible();
  }

  async getText(locator: Locator | string): Promise<string> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.textContent() || '';
  }
}
```

### 5. Test Fixtures

#### `e2e/fixtures/users.ts`

```typescript
export const testUsers = {
  admin: {
    username: 'admin',
    password: 'admin',
    email: 'admin@gns3.local',
    full_name: 'Administrator',
  },
  regularUser: {
    username: 'testuser',
    password: 'testpass',
    email: 'test@example.com',
    full_name: 'Test User',
  },
};
```

### 6. Test Case Examples

See existing test files:
- `e2e/tests/user-management/user-detail.spec.ts`
- `e2e/tests/users/logged-user.spec.ts`
- `e2e/tests/console/web-console.spec.ts`

### 7. Mock API Responses

```typescript
import { test, expect } from '@playwright/test';

test('should handle API errors gracefully', async ({ page }) => {
  // Mock API response
  await page.route('**/api/v2/controllers/1/users/**', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  });

  await page.goto('/controllers/1/users');
  await page.locator('mat-row:has-text("testuser")').click();

  // Verify error message is displayed
  await expect(page.locator('.toast-error')).toBeVisible();
});
```

## Running E2E Tests

### Development Mode

```bash
# Run all tests (headless mode)
yarn e2e

# Run tests and show browser
yarn e2e:headed

# Use Playwright UI (interactive test runner)
yarn e2e:ui

# Debug mode
yarn e2e:debug
```

### Specific Tests

```bash
# Run specific test file
yarn e2e user-detail.spec.ts

# Run specific test suite
yarn e2e --grep "User Detail"

# Run on specific browser
yarn e2e --project=chromium
```

## Best Practices

### 1. Test Isolation
- Each test should run independently
- Use `beforeEach` to set up test data
- Use `afterEach` to clean up data

### 2. Wait Strategies

```typescript
// ❌ Bad: Use fixed delay
await page.waitForTimeout(5000);

// ✅ Good: Wait for specific element
await expect(page.locator('.dialog')).toBeVisible();
```

### 3. Selector Strategies

```typescript
// ❌ Bad: Use CSS classes (may change)
await page.click('.btn-primary');

// ✅ Good: Use semantic selectors
await page.click('button:has-text("Save")');
await page.click('[data-testid="save-button"]');
```

### 4. Data Management
- Use test-specific database/controller
- Set known state before tests
- Clean up data after tests

### 5. Network Conditions

```typescript
// Test slow network
test('should handle slow network', async ({ page }) => {
  await page.context().setOffline(true);
  // Test offline behavior
  await page.context().setOffline(false);
});
```

## Covered Unit Test Scenarios

### LoggedUserComponent (10 tests)

1. **Component creation**: Verify component renders correctly
2. **Route parameters**: Verify controller ID retrieval from route
3. **User info loading**: Verify user data displays correctly
4. **Error handling**: Verify API errors display correctly
5. **Change password dialog**: Verify dialog opens correctly
6. **Copy token**: Verify clipboard operations
7. **DOM operations**: Verify textarea creation and deletion

### WebConsoleFullWindowComponent (36 tests)

1. **Terminal initialization**: Verify xterm.js terminal creation
2. **WebSocket connection**: Verify console WebSocket connection
3. **Theme switching**: Verify terminal theme updates
4. **Keyboard shortcuts**: Verify copy/paste shortcuts
5. **Window resizing**: Verify terminal adapts to window size
6. **Cleanup operations**: Verify component destroys resources properly

## Expected Results

After implementing E2E tests, you will be able to:

1. **Test complete user flows**: From login to console operations
2. **Test browser compatibility**: Run tests on multiple browsers
3. **Catch integration issues**: Discover issues unit tests can't find
4. **Regression testing**: Ensure new features don't break existing functionality
5. **Documentation**: Test cases serve as feature documentation

## Next Steps

1. Install Playwright
2. Create basic page objects
3. Implement first E2E test
4. Gradually add more tests
5. Integrate into CI/CD pipeline

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Angular + Playwright Examples](https://playwright.dev/docs/frameworks-angular)
