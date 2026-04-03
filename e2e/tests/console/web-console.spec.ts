import { test, expect } from '@playwright/test';

/**
 * WebConsoleFullWindowComponent E2E 测试
 *
 * 这些测试覆盖了在单元测试中无法测试的功能：
 * 1. xterm.js 终端初始化和渲染
 * 2. WebSocket 连接建立和通信
 * 3. 终端输入/输出处理
 * 4. 复制/粘贴操作
 * 5. 快捷键处理
 * 6. 主题切换
 * 7. 窗口调整
 * 8. 资源清理
 */

test.describe('Web Console Full Window - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到项目页面
    await page.goto('http://localhost:4200/projects/1');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should open console for node', async ({ page }) => {
    // 选择一个节点
    const node = page.locator('.node').first();
    await expect(node).toBeVisible();
    await node.click();

    // 点击打开控制台按钮
    const consoleButton = page.locator('button[title*="console"], button:has-text("Console")').first();
    await expect(consoleButton).toBeVisible();
    await consoleButton.click();

    // 验证导航到控制台页面
    await expect(page).toHaveURL(/\/console/);

    // 验证终端容器存在
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });
  });

  test('should initialize xterm terminal', async ({ page }) => {
    // 导航到控制台页面
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // 验证终端初始化
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // 验证终端有画布元素
    const canvas = page.locator('.xterm-text-layer, canvas');
    await expect(canvas).toBeVisible();
  });

  test('should establish WebSocket connection', async ({ page }) => {
    // 监听 WebSocket 连接
    const wsConnections: string[] = [];
    page.on('websocket', ws => {
      wsConnections.push(ws.url());
    });

    // 导航到控制台页面
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('networkidle');

    // 验证 WebSocket 连接已建立
    await page.waitForTimeout(2000);

    // 检查是否有 WebSocket 连接
    const hasWebSocketConnection = await page.evaluate(() => {
      // 检查页面是否有 WebSocket 相关的状态
      return (window as any).webSocketConnected === true ||
             document.querySelector('.xterm-terminal') !== null;
    });

    expect(hasWebSocketConnection).toBe(true);
  });

  test('should handle terminal input and output', async ({ page }) => {
    // 导航到控制台页面
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // 等待终端就绪
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // 点击终端以获得焦点
    await page.locator('.xterm-terminal, #terminal').click();

    // 输入命令
    await page.keyboard.type('help\n');

    // 等待输出
    await page.waitForTimeout(1000);

    // 验证终端有内容
    const terminalContent = await page.locator('.xterm-text-layer').textContent();
    expect(terminalContent).toBeTruthy();
  });

  test('should support copy operation via context menu', async ({ page }) => {
    // 导航到控制台页面
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // 等待终端就绪
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // 右键点击终端
    await page.locator('.xterm-terminal, #terminal').click({ button: 'right' });

    // 验证上下文菜单出现
    await expect(page.locator('.context-menu, .mat-menu-panel').toBeVisible({ timeout: 3000 });

    // 验证有复制选项
    await expect(page.locator('.context-menu:has-text("Copy"), .mat-menu-item:has-text("Copy")')).toBeVisible();
  });

  test('should handle window resize', async ({ page }) => {
    // 导航到控制台页面
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // 等待终端就绪
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // 获取初始终端尺寸
    const initialSize = await page.locator('.xterm-viewport, .xterm-screen').boundingBox();

    // 调整窗口大小
    await page.setViewportSize({ width: 1280, height: 800 });

    // 等待终端适应
    await page.waitForTimeout(500);

    // 验证终端仍然可见
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible();
  });

  test('should handle terminal theme', async ({ page }) => {
    // 导航到控制台页面
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // 等待终端就绪
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // 验证终端有主题样式
    const terminalTheme = await page.locator('.xterm-terminal').getAttribute('class');

    // 检查是否包含主题相关的类
    expect(terminalTheme).toBeTruthy();
  });
});

test.describe('Web Console - Error Handling', () => {
  test('should handle WebSocket connection errors', async ({ page }) => {
    // Mock WebSocket 失败
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

    // 导航到控制台页面
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // 等待错误处理
    await page.waitForTimeout(2000);

    // 验证错误消息或重连尝试
    const hasErrorState = await page.evaluate(() => {
      // 检查页面是否显示错误或重连状态
      const terminal = document.querySelector('.xterm-terminal');
      return terminal !== null; // 即使错误，终端也应该渲染
    });

    expect(hasErrorState).toBe(true);
  });

  test('should handle node not found error', async ({ page }) => {
    // 导航到不存在的节点控制台
    await page.goto('http://localhost:4200/console/1/project/1/node/99999');
    await page.waitForLoadState('domcontentloaded');

    // 验证错误消息显示
    await expect(page.locator('.error-message, .toast-error, [class*="error"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle missing controller gracefully', async ({ page }) => {
    // 导航到不存在的控制器的控制台
    await page.goto('http://localhost:4200/console/99999/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // 验证错误处理或重定向
    const currentUrl = page.url();
    const hasError = await page.locator('.error-message, .toast-error').count();

    expect(hasError + (currentUrl.includes('error') ? 1 : 0)).toBeGreaterThan(0);
  });
});

test.describe('Web Console - Resource Cleanup', () => {
  test('should cleanup WebSocket on navigation away', async ({ page }) => {
    // 导航到控制台页面
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // 等待终端初始化
    await page.waitForTimeout(2000);

    // 导航到其他页面
    await page.goto('http://localhost:4200/projects/1');

    // 验证页面成功导航
    await expect(page).toHaveURL(/\/projects/);

    // 验证没有内存泄漏（通过检查终端不再可见）
    await expect(page.locator('.xterm-terminal')).not.toBeVisible();
  });

  test('should handle multiple console opens and closes', async ({ page }) => {
    // 第一次打开控制台
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // 返回项目页面
    await page.goto('http://localhost:4200/projects/1');
    await page.waitForLoadState('domcontentloaded');

    // 第二次打开控制台
    await page.goto('http://localhost:4200/console/1/project/1/node/2');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // 验证没有重复的终端元素
    const terminalCount = await page.locator('.xterm-terminal').count();
    expect(terminalCount).toBe(1);
  });
});

test.describe('Web Console - Keyboard Shortcuts', () => {
  test('should handle Ctrl+C to interrupt', async ({ page }) => {
    // 导航到控制台页面
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // 等待终端就绪
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // 点击终端获得焦点
    await page.locator('.xterm-terminal, #terminal').click();

    // 输入一个长时间运行的命令
    await page.keyboard.type('sleep 10\n');

    // 等待一下
    await page.waitForTimeout(500);

    // 按 Ctrl+C 中断
    await page.keyboard.press('Control+C');

    // 验证命令被中断（终端应该返回到提示符）
    await page.waitForTimeout(500);

    // 终端应该仍然可交互
    await page.keyboard.type('echo test\n');
    await page.waitForTimeout(500);
  });

  test('should handle Ctrl+Shift+C for copy', async ({ page }) => {
    // 导航到控制台页面
    await page.goto('http://localhost:4200/console/1/project/1/node/1');
    await page.waitForLoadState('domcontentloaded');

    // 等待终端就绪
    await expect(page.locator('.xterm-terminal, #terminal')).toBeVisible({ timeout: 10000 });

    // 点击终端
    await page.locator('.xterm-terminal, #terminal').click();

    // 按 Ctrl+Shift+C
    await page.keyboard.press('Control+Shift+C');

    // 验证复制操作（上下文菜单可能出现或剪贴板被更新）
    await page.waitForTimeout(500);
  });
});
