import { test, expect } from '@playwright/test';

/**
 * LoggedUserComponent E2E Tests
 *
 * These tests cover functionality that cannot be tested in unit tests:
 * 1. User login and authentication flow
 * 2. Copy Token to clipboard (requires real clipboard API)
 * 3. Change password dialog interactions
 * 4. DOM element creation and deletion
 */

test.describe('Logged User Component - Integration Tests', () => {
  // Assume user is already logged in
  test.beforeEach(async ({ page }) => {
    // Navigate to user page
    await page.goto('http://localhost:4200/controllers/1/users');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display logged user information', async ({ page }) => {
    // Verify user menu button exists
    const userMenuButton = page.locator('button[mattooltip="User menu"]');
    await expect(userMenuButton).toBeVisible();

    // Click user menu
    await userMenuButton.click();

    // Verify user information is displayed
    await expect(page.locator('.user-menu')).toBeVisible();
    await expect(page.locator('.user-menu')).toContainText('admin');
  });

  test('should copy auth token to clipboard', async ({ page }) => {
    // Click user menu
    await page.click('button[mattooltip="User menu"]');

    // Click Copy Token button
    const copyTokenButton = page.locator('button:has-text("Copy Token")');
    await expect(copyTokenButton).toBeVisible();
    await copyTokenButton.click();

    // Verify success message is displayed
    await expect(page.locator('.toast-success, [class*="success"]')).toBeVisible({ timeout: 5000 });

    // Verify clipboard content (requires browser context)
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText).toBeTruthy();
    expect(clipboardText.length).toBeGreaterThan(0);
  });

  test('should open change password dialog', async ({ page }) => {
    // Click user menu
    await page.click('button[mattooltip="User menu"]');

    // Click Change Password button
    const changePasswordButton = page.locator('button:has-text("Change Password")');
    await expect(changePasswordButton).toBeVisible();
    await changePasswordButton.click();

    // Verify password dialog opens
    await expect(page.locator('h2:has-text("Change Password")')).toBeVisible();
    await expect(page.locator('[mat-dialog-content]')).toBeVisible();

    // Verify form fields
    await expect(page.locator('input[formcontrolname="password"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="confirmPassword"]')).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    // Open change password dialog
    await page.click('button[mattooltip="User menu"]');
    await page.click('button:has-text("Change Password")');

    // Enter different passwords
    await page.fill('input[formcontrolname="password"]', 'newpassword123');
    await page.fill('input[formcontrolname="confirmPassword"]', 'differentpassword');

    // Verify error message
    await expect(page.locator('mat-error')).toBeVisible();
  });

  test('should successfully change password', async ({ page }) => {
    // Open change password dialog
    await page.click('button[mattooltip="User menu"]');
    await page.click('button:has-text("Change Password")');

    // Enter new password
    const newPassword = 'newpassword123';
    await page.fill('input[formcontrolname="password"]', newPassword);
    await page.fill('input[formcontrolname="confirmPassword"]', newPassword);

    // Click change button
    await page.click('button:has-text("Change")');

    // Wait for request to complete
    await page.waitForTimeout(2000);

    // Verify success message
    await expect(page.locator('.toast-success, [class*="success"]')).toBeVisible({ timeout: 5000 });

    // Verify dialog closes
    await expect(page.locator('h2:has-text("Change Password")')).not.toBeVisible();
  });
});

test.describe('Logged User Component - Error Handling', () => {
  test('should handle clipboard errors gracefully', async ({ page }) => {
    // Mock clipboard API to return error
    await page.addInitScript(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: () => Promise.reject(new Error('Clipboard denied')),
        },
      });
    });

    // Click user menu
    await page.goto('http://localhost:4200/controllers/1/users');
    await page.click('button[mattooltip="User menu"]');

    // Try to copy token
    await page.click('button:has-text("Copy Token")');

    // Verify error message is displayed
    await expect(page.locator('.toast-error, [class*="error"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle password change errors', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/v2/users/*/password', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Password too weak' }),
      });
    });

    // Open change password dialog
    await page.goto('http://localhost:4200/controllers/1/users');
    await page.click('button[mattooltip="User menu"]');
    await page.click('button:has-text("Change Password")');

    // Enter password
    await page.fill('input[formcontrolname="password"]', 'weak');
    await page.fill('input[formcontrolname="confirmPassword"]', 'weak');
    await page.click('button:has-text("Change")');

    // Verify error message
    await expect(page.locator('.toast-error, [class*="error"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Logged User Component - DOM Operations', () => {
  test('should create and remove textarea element when copying token', async ({ page }) => {
    // Click user menu
    await page.goto('http://localhost:4200/controllers/1/users');
    await page.click('button[mattooltip="User menu"]');

    // Click Copy Token
    await page.click('button:has-text("Copy Token")');

    // Verify textarea element is created (by listening to DOM)
    const textareaCreated = await page.evaluate(() => {
      return document.querySelector('textarea[style*="position: absolute"]') !== null;
    });

    expect(textareaCreated).toBe(true);

    // Verify textarea element is removed
    await page.waitForTimeout(100);

    const textareaRemoved = await page.evaluate(() => {
      return document.querySelector('textarea[style*="position: absolute"]') === null;
    });

    expect(textareaRemoved).toBe(true);
  });

  test('should clean up DOM elements properly', async ({ page }) => {
    // Copy token multiple times
    await page.goto('http://localhost:4200/controllers/1/users');
    await page.click('button[mattooltip="User menu"]');

    // First copy
    await page.click('button:has-text("Copy Token")');
    await page.waitForTimeout(500);

    // Second copy
    await page.click('button:has-text("Copy Token")');
    await page.waitForTimeout(500);

    // Verify no orphaned textarea elements
    const orphanedTextareas = await page.evaluate(() => {
      return document.querySelectorAll('textarea[style*="position: absolute"]').length;
    });

    expect(orphanedTextareas).toBe(0);
  });
});
