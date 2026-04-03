import { test, expect } from '@playwright/test';

/**
 * 用户详情对话框 E2E 测试
 *
 * 这些测试覆盖了在单元测试中无法测试的功能：
 * 1. 实际的 DOM 操作和渲染
 * 2. 对话框的打开和关闭
 * 3. 表单验证和提交流程
 * 4. 与后端 API 的真实交互
 */

test.describe('User Detail Dialog - Integration Tests', () => {
  // 在每个测试前运行
  test.beforeEach(async ({ page }) => {
    // 导航到用户管理页面
    await page.goto('http://localhost:4200/controllers/1/users');

    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test('should open user detail dialog when clicking on user row', async ({ page }) => {
    // 点击用户行
    await page.locator('mat-row').first().click();

    // 验证对话框打开
    await expect(page.locator('h2[mat-dialog-title]')).toBeVisible();
    await expect(page.locator('[mat-dialog-content]')).toBeVisible();

    // 验证表单字段存在
    await expect(page.locator('input[formcontrolname="username"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="email"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="full_name"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="is_active"]')).toBeVisible();
  });

  test('should display user information in dialog', async ({ page }) => {
    // 点击第一个用户
    await page.locator('mat-row').first().click();

    // 验证用户信息显示
    const username = await page.locator('input[formcontrolname="username"]').inputValue();
    expect(username).toBeTruthy();

    const email = await page.locator('input[formcontrolname="email"]').inputValue();
    expect(email).toContain('@');
  });

  test('should update user full name', async ({ page }) => {
    // 点击用户行
    await page.locator('mat-row').first().click();

    // 获取原始值
    const originalName = await page.locator('input[formcontrolname="full_name"]').inputValue();

    // 更新全名
    const newName = `Updated ${originalName}`;
    await page.fill('input[formcontrolname="full_name"]', newName);

    // 点击保存按钮
    await page.click('button:has-text("Save")');

    // 等待保存完成
    await page.waitForTimeout(1000);

    // 验证成功消息
    await expect(page.locator('.toast-success, [class*="success"]')).toBeVisible({ timeout: 5000 });

    // 重新打开用户详情验证更新
    await page.locator('mat-row').first().click();
    const updatedName = await page.locator('input[formcontrolname="full_name"]').inputValue();
    expect(updatedName).toBe(newName);
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // 点击用户行
    await page.locator('mat-row').first().click();

    // 输入无效邮箱
    await page.fill('input[formcontrolname="email"]', 'invalid-email');

    // 尝试保存
    await page.click('button:has-text("Save")');

    // 验证错误消息
    await expect(page.locator('mat-error:has-text("valid email")')).toBeVisible();
  });

  test('should close dialog when clicking Cancel', async ({ page }) => {
    // 打开对话框
    await page.locator('mat-row').first().click();

    // 验证对话框可见
    await expect(page.locator('[mat-dialog-container]')).toBeVisible();

    // 点击取消按钮
    await page.click('button:has-text("Cancel")');

    // 验证对话框关闭
    await expect(page.locator('[mat-dialog-container]')).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('User Detail Dialog - Change Password', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/controllers/1/users');
    await page.waitForLoadState('networkidle');
  });

  test('should open change password dialog', async ({ page }) => {
    // 打开用户详情
    await page.locator('mat-row').first().click();

    // 点击更改密码按钮
    await page.click('button:has-text("Change Password")');

    // 验证密码对话框打开
    await expect(page.locator('h2:has-text("Change Password")')).toBeVisible();
    await expect(page.locator('input[formcontrolname="password"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="confirmPassword"]')).toBeVisible();
  });

  test('should show validation error when passwords do not match', async ({ page }) => {
    // 打开用户详情和密码对话框
    await page.locator('mat-row').first().click();
    await page.click('button:has-text("Change Password")');

    // 输入不同的密码
    await page.fill('input[formcontrolname="password"]', 'newpassword123');
    await page.fill('input[formcontrolname="confirmPassword"]', 'differentpassword');

    // 尝试保存
    await page.click('button:has-text("Change")');

    // 验证错误消息
    await expect(page.locator('mat-error')).toBeVisible();
  });

  test('should successfully change password', async ({ page }) => {
    // 打开用户详情和密码对话框
    await page.locator('mat-row').first().click();
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

test.describe('User Detail Dialog - Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API 错误
    await page.route('**/api/v2/controllers/1/users/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // 打开用户详情
    await page.locator('mat-row').first().click();

    // 尝试修改并保存
    await page.fill('input[formcontrolname="full_name"]', 'Test User');
    await page.click('button:has-text("Save")');

    // 验证错误消息显示
    await expect(page.locator('.toast-error, [class*="error"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle network errors', async ({ page }) => {
    // Mock 网络错误
    await page.route('**/api/v2/controllers/1/users/**', route => {
      route.abort('failed');
    });

    // 打开用户详情
    await page.locator('mat-row').first().click();

    // 尝试修改并保存
    await page.fill('input[formcontrolname="full_name"]', 'Test User');
    await page.click('button:has-text("Save")');

    // 验证错误消息显示
    await expect(page.locator('.toast-error, [class*="error"]')).toBeVisible({ timeout: 5000 });
  });
});
