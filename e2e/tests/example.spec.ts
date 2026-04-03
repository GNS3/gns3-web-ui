import { test, expect } from '@playwright/test';

/**
 * Simple verification test - Ensure Playwright setup is correct
 */
test.describe('Playwright Setup Verification', () => {
  test('should load the application', async ({ page }) => {
    // Navigate to application home page
    await page.goto('/');

    // Wait for page to load
    await expect(page).toHaveTitle(/GNS3 Web UI/);
  });

  test('should navigate to controllers page', async ({ page }) => {
    await page.goto('/controllers');

    // Verify page title or key elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('should take a screenshot', async ({ page }) => {
    await page.goto('/');

    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshot.png' });

    // Verify screenshot file exists (by not throwing an error)
    expect(true).toBe(true);
  });
});
