import { test, expect } from '@playwright/test';

/**
 * 简单的验证测试 - 确保 Playwright 设置正确
 */
test.describe('Playwright Setup Verification', () => {
  test('should load the application', async ({ page }) => {
    // 导航到应用首页
    await page.goto('/');

    // 等待页面加载
    await expect(page).toHaveTitle(/GNS3 Web UI/);
  });

  test('should navigate to controllers page', async ({ page }) => {
    await page.goto('/controllers');

    // 验证页面标题或关键元素
    await expect(page.locator('body')).toBeVisible();
  });

  test('should take a screenshot', async ({ page }) => {
    await page.goto('/');

    // 截图
    await page.screenshot({ path: 'test-results/screenshot.png' });

    // 验证截图文件存在（通过不抛出错误）
    expect(true).toBe(true);
  });
});
