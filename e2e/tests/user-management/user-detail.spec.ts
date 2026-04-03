import { test, expect } from '@playwright/test';

/**
 * User Detail Dialog E2E Tests
 *
 * These tests cover functionality that cannot be tested in unit tests:
 * 1. Actual DOM operations and rendering
 * 2. Opening and closing dialogs
 * 3. Form validation and submission flow
 * 4. Real interactions with backend APIs
 */

test.describe('User Detail Dialog - Integration Tests', () => {
  // Run before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to user management page
    await page.goto('http://localhost:4200/controllers/1/users');

    // Wait for page to finish loading
    await page.waitForLoadState('networkidle');
  });

  test('should open user detail dialog when clicking on user row', async ({ page }) => {
    // Click on user row
    await page.locator('mat-row').first().click();

    // Verify dialog opens
    await expect(page.locator('h2[mat-dialog-title]')).toBeVisible();
    await expect(page.locator('[mat-dialog-content]')).toBeVisible();

    // Verify form fields exist
    await expect(page.locator('input[formcontrolname="username"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="email"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="full_name"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="is_active"]')).toBeVisible();
  });

  test('should display user information in dialog', async ({ page }) => {
    // Click on first user
    await page.locator('mat-row').first().click();

    // Verify user information is displayed
    const username = await page.locator('input[formcontrolname="username"]').inputValue();
    expect(username).toBeTruthy();

    const email = await page.locator('input[formcontrolname="email"]').inputValue();
    expect(email).toContain('@');
  });

  test('should update user full name', async ({ page }) => {
    // Click on user row
    await page.locator('mat-row').first().click();

    // Get original value
    const originalName = await page.locator('input[formcontrolname="full_name"]').inputValue();

    // Update full name
    const newName = `Updated ${originalName}`;
    await page.fill('input[formcontrolname="full_name"]', newName);

    // Click Save button
    await page.click('button:has-text("Save")');

    // Wait for save to complete
    await page.waitForTimeout(1000);

    // Verify success message
    await expect(page.locator('.toast-success, [class*="success"]')).toBeVisible({ timeout: 5000 });

    // Reopen user details to verify update
    await page.locator('mat-row').first().click();
    const updatedName = await page.locator('input[formcontrolname="full_name"]').inputValue();
    expect(updatedName).toBe(newName);
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Click on user row
    await page.locator('mat-row').first().click();

    // Enter invalid email
    await page.fill('input[formcontrolname="email"]', 'invalid-email');

    // Try to save
    await page.click('button:has-text("Save")');

    // Verify error message
    await expect(page.locator('mat-error:has-text("valid email")')).toBeVisible();
  });

  test('should close dialog when clicking Cancel', async ({ page }) => {
    // Open dialog
    await page.locator('mat-row').first().click();

    // Verify dialog is visible
    await expect(page.locator('[mat-dialog-container]')).toBeVisible();

    // Click Cancel button
    await page.click('button:has-text("Cancel")');

    // Verify dialog closes
    await expect(page.locator('[mat-dialog-container]')).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('User Detail Dialog - Change Password', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/controllers/1/users');
    await page.waitForLoadState('networkidle');
  });

  test('should open change password dialog', async ({ page }) => {
    // Open user details
    await page.locator('mat-row').first().click();

    // Click Change Password button
    await page.click('button:has-text("Change Password")');

    // Verify password dialog opens
    await expect(page.locator('h2:has-text("Change Password")')).toBeVisible();
    await expect(page.locator('input[formcontrolname="password"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="confirmPassword"]')).toBeVisible();
  });

  test('should show validation error when passwords do not match', async ({ page }) => {
    // Open user details and password dialog
    await page.locator('mat-row').first().click();
    await page.click('button:has-text("Change Password")');

    // Enter different passwords
    await page.fill('input[formcontrolname="password"]', 'newpassword123');
    await page.fill('input[formcontrolname="confirmPassword"]', 'differentpassword');

    // Try to save
    await page.click('button:has-text("Change")');

    // Verify error message
    await expect(page.locator('mat-error')).toBeVisible();
  });

  test('should successfully change password', async ({ page }) => {
    // Open user details and password dialog
    await page.locator('mat-row').first().click();
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

test.describe('User Detail Dialog - Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v2/controllers/1/users/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Open user details
    await page.locator('mat-row').first().click();

    // Try to modify and save
    await page.fill('input[formcontrolname="full_name"]', 'Test User');
    await page.click('button:has-text("Save")');

    // Verify error message is displayed
    await expect(page.locator('.toast-error, [class*="error"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle network errors', async ({ page }) => {
    // Mock network error
    await page.route('**/api/v2/controllers/1/users/**', route => {
      route.abort('failed');
    });

    // Open user details
    await page.locator('mat-row').first().click();

    // Try to modify and save
    await page.fill('input[formcontrolname="full_name"]', 'Test User');
    await page.click('button:has-text("Save")');

    // Verify error message is displayed
    await expect(page.locator('.toast-error, [class*="error"]')).toBeVisible({ timeout: 5000 });
  });
});
