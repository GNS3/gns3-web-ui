# E2E Tests Quick Start

## Installation

```bash
# Install Playwright
yarn add -D @playwright/test

# Install browsers
npx playwright install --with-deps
```

## Running Tests

```bash
# Run all E2E tests
yarn e2e

# Run in UI mode (recommended for development)
yarn e2e:ui

# Run in browser (debug mode)
yarn e2e:headed

# Debug mode
yarn e2e:debug
```

## Directory Structure

```
e2e/
├── playwright.config.ts    # Playwright configuration
├── tests/                  # Test cases
│   └── user-management/
│       └── user-detail.spec.ts
└── README.md              # This file
```

## Currently Covered Tests

### User Detail Dialog (user-detail.spec.ts)

✅ **Implemented Tests:**
- Open user detail dialog
- Display user information
- Update user full name
- Email validation error
- Close dialog
- Change password dialog
- Password mismatch validation
- Successfully change password
- API error handling
- Network error handling

## Next Steps

Need to implement E2E tests for:

### LoggedUserComponent
- [ ] User login flow
- [ ] Copy token to clipboard
- [ ] Change password dialog
- [ ] Error handling

### WebConsoleFullWindowComponent
- [ ] Open console
- [ ] Terminal initialization
- [ ] WebSocket connection
- [ ] Input/output testing
- [ ] Copy/paste operations
- [ ] Keyboard shortcuts
- [ ] Theme switching
- [ ] Window resizing
- [ ] Resource cleanup

## Development Tips

### 1. Use UI Mode for Development

```bash
yarn e2e:ui
```

UI mode provides:
- Visual test runner
- Timeline viewer
- Network request monitoring
- Screenshots and videos
- Interactive debugging

### 2. Debugging Tips

```typescript
// Pause test execution
await page.pause();

// Take screenshot
await page.screenshot({ path: 'screenshot.png' });

// View page content
console.log(await page.content());

// Wait for specific element
await expect(page.locator('.dialog')).toBeVisible();
```

### 3. Selector Best Practices

```typescript
// ✅ Good: Use semantic selectors
page.getByRole('button', { name: 'Save' })
page.getByText('Welcome')
page.getByLabel('Email')

// ✅ Good: Use test ID (add data-testid in HTML)
page.locator('[data-testid="save-button"]')

// ❌ Avoid: CSS classes (may change)
page.locator('.btn-primary')
page.locator('#submit-btn')
```

### 4. Wait Strategies

```typescript
// ✅ Good: Wait for specific condition
await expect(page.locator('.dialog')).toBeVisible();
await page.waitForSelector('.dialog', { state: 'visible' });
await page.waitForResponse('**/api/users');

// ❌ Bad: Fixed delay
await page.waitForTimeout(5000);
```

## Troubleshooting

### Test Timeout

```typescript
// Increase timeout
test.setTimeout(60000);

// Or
await page.click('button', { timeout: 10000 });
```

### Element Not Found

```typescript
// Wait for element to appear
await page.waitForSelector('button', { state: 'attached' });

// Or use expect
await expect(page.locator('button')).toBeVisible({ timeout: 10000 });
```

### Network Issues

```typescript
// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for specific response
await page.waitForResponse('**/api/users');
```

## CI/CD Integration

Add to `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [master, develop]
  pull_request:
    branches: [master, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: yarn install
      - run: npx playwright install --with-deps
      - run: yarn e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Full Guide](../docs/testing/e2e-testing-guide.md)
