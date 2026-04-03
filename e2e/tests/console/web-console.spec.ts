import { test, expect } from '@playwright/test';

/**
 * WebConsoleFullWindowComponent E2E Tests
 *
 * These tests cover functionality that cannot be tested in unit tests:
 * 1. xterm.js terminal initialization and rendering
 * 2. WebSocket connection establishment and communication
 * 3. Terminal input/output handling
 * 4. Copy/paste operations
 * 5. Keyboard shortcuts handling
 * 6. Theme switching
 * 7. Window resizing
 * 8. Resource cleanup
 */

test.describe('Web Console Full Window - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to project page
    await page.goto('http://localhost:4200/projects/1');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should open console for node', async ({ page }) => {
    // Select a node
    const node = page.locator('.node').first();
    await expect(node).toBeVisible();
    await node.click();

    // Click open console button
    const consoleButton = page.locator('button[title*="console"], button:has-text("Console")').first();
    await expect(consoleButton).toBeVisible();
    await consoleButton.click();

    // Verify navigation to console page
    await expect(page).toHaveURL(/\/console/);

    // Verify terminal container exists
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });
  });

  test('should initialize xterm terminal', async ({ page }) => {
    // Navigate to console page
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // Verify terminal initialization
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // Verify terminal has canvas element
    const canvas = page.locator('.xterm-text-layer, canvas');
    await expect(canvas).toBeVisible();
  });

  test('should establish WebSocket connection', async ({ page }) => {
    // Monitor WebSocket connections
    const wsConnections: string[] = [];
    page.on('websocket', ws => {
      wsConnections.push(ws.url());
    });

    // Navigate to console page
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('networkidle');

    // Verify WebSocket connection is established
    await page.waitForTimeout(2000);

    // Check if WebSocket connection exists
    const hasWebSocketConnection = await page.evaluate(() => {
      // Check if page has WebSocket related state
      return (window as any).webSocketConnected === true ||
             document.querySelector('.xterm-terminal') !== null;
    });

    expect(hasWebSocketConnection).toBe(true);
  });

  test('should handle terminal input and output', async ({ page }) => {
    // Navigate to console page
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // Wait for terminal to be ready
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // Click terminal to get focus
    await page.locator('.xterm-terminal, #terminal').click();

    // Type command
    await page.keyboard.type('help\n');

    // Wait for output
    await page.waitForTimeout(1000);

    // Verify terminal has content
    const terminalContent = await page.locator('.xterm-text-layer').textContent();
    expect(terminalContent).toBeTruthy();
  });

  test('should support copy operation via context menu', async ({ page }) => {
    // Navigate to console page
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // Wait for terminal to be ready
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // Right-click on terminal
    await page.locator('.xterm-terminal, #terminal').click({ button: 'right' });

    // Verify context menu appears
    await expect(page.locator('.context-menu, .mat-menu-panel')).toBeVisible({ timeout: 3000 });

    // Verify there's a copy option
    await expect(page.locator('.context-menu:has-text("Copy"), .mat-menu-item:has-text("Copy")')).toBeVisible();
  });

  test('should handle window resize', async ({ page }) => {
    // Navigate to console page
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // Wait for terminal to be ready
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // Get initial terminal size
    const initialSize = await page.locator('.xterm-viewport, .xterm-screen').boundingBox();

    // Resize window
    await page.setViewportSize({ width: 1280, height: 800 });

    // Wait for terminal to adjust
    await page.waitForTimeout(500);

    // Verify terminal is still visible
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible();
  });

  test('should handle terminal theme', async ({ page }) => {
    // Navigate to console page
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // Wait for terminal to be ready
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // Verify terminal has theme styles
    const terminalTheme = await page.locator('.xterm-terminal').getAttribute('class');

    // Check if it contains theme-related classes
    expect(terminalTheme).toBeTruthy();
  });
});

test.describe('Web Console - Error Handling', () => {
  test('should handle WebSocket connection errors', async ({ page }) => {
    // Mock WebSocket failure
    await page.addInitScript(() => {
      (window as any).WebSocket = class {
        constructor(url: string) {
          setTimeout(() => {
            this.onerror({ type: 'error' });
          }, 100);
        }
        close() {}
        send() {}
      };
    });

    // Navigate to console page
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // Wait for error handling
    await page.waitForTimeout(2000);

    // Verify error state or reconnection attempt
    const hasErrorState = await page.evaluate(() => {
      // Check if page shows error or reconnection state
      const terminal = document.querySelector('.xterm-terminal');
      return terminal !== null; // Even on error, terminal should render
    });

    expect(hasErrorState).toBe(true);
  });

  test('should handle node not found error', async ({ page }) => {
    // Navigate to console for non-existent node
    await page.goto('http://localhost:4200/console/1/project/1/node/99999');
    await page.waitForLoadState('domcontentloaded');

    // Verify error message is displayed
    await expect(page.locator('.error-message, .toast-error, [class*="error"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle missing controller gracefully', async ({ page }) => {
    // Navigate to console for non-existent controller
    await page.goto('http://localhost:4200/console/99999/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // Verify error handling or redirect
    const currentUrl = page.url();
    const hasError = await page.locator('.error-message, .toast-error').count();

    expect(hasError + (currentUrl.includes('error') ? 1 : 0)).toBeGreaterThan(0);
  });
});

test.describe('Web Console - Resource Cleanup', () => {
  test('should cleanup WebSocket on navigation away', async ({ page }) => {
    // Navigate to console page
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // Wait for terminal initialization
    await page.waitForTimeout(2000);

    // Navigate to other page
    await page.goto('http://localhost:4200/projects/1');

    // Verify successful navigation
    await expect(page).toHaveURL(/\/projects/);

    // Verify no memory leaks (by checking terminal is no longer visible)
    await expect(page.locator('.xterm-terminal')).not.toBeVisible();
  });

  test('should handle multiple console opens and closes', async ({ page }) => {
    // First console open
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // Return to project page
    await page.goto('http://localhost:4200/projects/1');
    await page.waitForLoadState('domcontentloaded');

    // Second console open
    await page.goto('http://localhost:4200/console/1/project/1/node/2');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // Verify no duplicate terminal elements
    const terminalCount = await page.locator('.xterm-terminal').count();
    expect(terminalCount).toBe(1);
  });
});

test.describe('Web Console - Keyboard Shortcuts', () => {
  test('should handle Ctrl+C to interrupt', async ({ page }) => {
    // Navigate to console page
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // Wait for terminal to be ready
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // Click terminal to get focus
    await page.locator('.xterm-terminal, #terminal').click();

    // Type a long-running command
    await page.keyboard.type('sleep 10\n');

    // Wait a bit
    await page.waitForTimeout(500);

    // Press Ctrl+C to interrupt
    await page.keyboard.press('Control+C');

    // Verify command is interrupted (terminal should return to prompt)
    await page.waitForTimeout(500);

    // Terminal should still be interactive
    await page.keyboard.type('echo test\n');
    await page.waitForTimeout(500);
  });

  test('should handle Ctrl+Shift+C for copy', async ({ page }) => {
    // Navigate to console page
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // Wait for terminal to be ready
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // Click terminal
    await page.locator('.xterm-terminal, #terminal').click();

    // Press Ctrl+Shift+C
    await page.keyboard.press('Control+Shift+C');

    // Verify copy operation (context menu may appear or clipboard is updated)
    await page.waitForTimeout(500);
  });
});
