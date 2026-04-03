import { test, expect } from '@playwright/test';

/**
 * LoggedUserComponent E2E 测试
 *
 * 这些测试覆盖了在单元测试中无法测试的功能：
 * 1. 用户登录和认证流程
 * 2. 复制 Token 到剪贴板（需要真实的剪贴板 API）
 * 3. 更改密码对话框交互
 * 4. DOM 元素的创建和删除
 */

test.describe('Logged User Component - Integration Tests', () => {
  // 假设用户已经登录
  test.beforeEach(async ({ page }) => {
    // 导航到用户页面
    await page.goto('http://localhost:4200/controllers/1/users');

    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display logged user information', async ({ page }) => {
    // 验证用户菜单按钮存在
    const userMenuButton = page.locator('button[mattooltip="User menu"]');
    await expect(userMenuButton).toBeVisible();

    // 点击用户菜单
    await userMenuButton.click();

    // 验证用户信息显示
    await expect(page.locator('.user-menu')).toBeVisible();
    await expect(page.locator('.user-menu')).toContainText('admin');
  });

  test('should copy auth token to clipboard', async ({ page }) => {
    // 点击用户菜单
    await page.click('button[mattooltip="User menu"]');

    // 点击复制 Token 按钮
    const copyTokenButton = page.locator('button:has-text("Copy Token")');
    await expect(copyTokenButton).toBeVisible();
    await copyTokenButton.click();

    // 验证成功消息显示
    await expect(page.locator('.toast-success, [class*="success"]')).toBeVisible({ timeout: 5000 });

    // 验证剪贴板内容（需要浏览器上下文）
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText).toBeTruthy();
    expect(clipboardText.length).toBeGreaterThan(0);
  });

  test('should open change password dialog', async ({ page }) => {
    // 点击用户菜单
    await page.click('button[mattooltip="User menu"]');

    // 点击更改密码按钮
    const changePasswordButton = page.locator('button:has-text("Change Password")');
    await expect(changePasswordButton).toBeVisible();
    await changePasswordButton.click();

    // 验证密码对话框打开
    await expect(page.locator('h2:has-text("Change Password")')).toBeVisible();
    await expect(page.locator('[mat-dialog-content]')).toBeVisible();

    // 验证表单字段
    await expect(page.locator('input[formcontrolname="password"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="confirmPassword"]')).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    // 打开更改密码对话框
    await page.click('button[mattooltip="User menu"]');
    await page.click('button:has-text("Change Password")');

    // 输入不同的密码
    await page.fill('input[formcontrolname="password"]', 'newpassword123');
    await page.fill('input[formcontrolname="confirmPassword"]', 'differentpassword');

    // 验证错误消息
    await expect(page.locator('mat-error')).toBeVisible();
  });

  test('should successfully change password', async ({ page }) => {
    // 打开更改密码对话框
    await page.click('button[mattooltip="User menu"]');
    await page.click('button:has-text("Change Password")');

    // 输入新密码
    const newPassword = 'newpassword123';
    await page.fill('input[formcontrolname="password"]', newPassword);
    await page.fill('input[formcontrolname="confirmPassword"]', newPassword);

    // 点击更改按钮
    await page.click('button:has-text("Change")');

    // 等待请求完成
    await page.waitForTimeout(2000);

    // 验证成功消息
    await expect(page.locator('.toast-success, [class*="success"]')).toBeVisible({ timeout: 5000 });

    // 验证对话框关闭
    await expect(page.locator('h2:has-text("Change Password")')).not.toBeVisible();
  });
});

test.describe('Logged User Component - Error Handling', () => {
  test('should handle clipboard errors gracefully', async ({ page }) => {
    // Mock clipboard API 返回错误
    await page.addInitScript(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: () => Promise.reject(new Error('Clipboard denied')),
        },
      });
    });

    // 点击用户菜单
    await page.goto('http://localhost:4200/controllers/1/users');
    await page.click('button[mattooltip="User menu"]');

    // 尝试复制 Token
    await page.click('button:has-text("Copy Token")');

    // 验证错误消息显示
    await expect(page.locator('.toast-error, [class*="error"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle password change errors', async ({ page }) => {
    // Mock API 返回错误
    await page.route('**/api/v2/users/*/password', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Password too weak' }),
      });
    });

    // 打开更改密码对话框
    await page.goto('http://localhost:4200/controllers/1/users');
    await page.click('button[mattooltip="User menu"]');
    await page.click('button:has-text("Change Password")');

    // 输入密码
    await page.fill('input[formcontrolname="password"]', 'weak');
    await page.fill('input[formcontrolname="confirmPassword"]', 'weak');
    await page.click('button:has-text("Change")');

    // 验证错误消息
    await expect(page.locator('.toast-error, [class*="error"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Logged User Component - DOM Operations', () => {
  test('should create and remove textarea element when copying token', async ({ page }) => {
    // 点击用户菜单
    await page.goto('http://localhost:4200/controllers/1/users');
    await page.click('button[mattooltip="User menu"]');

    // 点击复制 Token
    await page.click('button:has-text("Copy Token")');

    // 验证 textarea 元素被创建（通过监听 DOM）
    const textareaCreated = await page.evaluate(() => {
      return document.querySelector('textarea[style*="position: absolute"]') !== null;
    });

    expect(textareaCreated).toBe(true);

    // 验证 textarea 元素被删除
    await page.waitForTimeout(100);

    const textareaRemoved = await page.evaluate(() => {
      return document.querySelector('textarea[style*="position: absolute"]') === null;
    });

    expect(textareaRemoved).toBe(true);
  });

  test('should clean up DOM elements properly', async ({ page }) => {
    // 多次复制 Token
    await page.goto('http://localhost:4200/controllers/1/users');
    await page.click('button[mattooltip="User menu"]');

    // 第一次复制
    await page.click('button:has-text("Copy Token")');
    await page.waitForTimeout(500);

    // 第二次复制
    await page.click('button:has-text("Copy Token")');
    await page.waitForTimeout(500);

    // 验证没有遗留的 textarea 元素
    const orphanedTextareas = await page.evaluate(() => {
      return document.querySelectorAll('textarea[style*="position: absolute"]').length;
    });

    expect(orphanedTextareas).toBe(0);
  });
});
