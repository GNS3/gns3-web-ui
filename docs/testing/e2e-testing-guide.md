# GNS3 Web UI - E2E 测试实施指南

## 概述

本文档描述如何为 GNS3 Web UI 设置和实施端到端 (E2E) 测试，覆盖那些在单元测试中无法测试的组件：
- `logged-user.component.spec.ts` (10 个测试)
- `web-console-full-window.component.spec.ts` (36 个测试)

## 推荐方案: Playwright

Playwright 是现代、快速且可靠的 E2E 测试框架，支持所有主流浏览器。

### 为什么选择 Playwright？

1. **跨浏览器支持**: Chrome, Firefox, Safari, Edge
2. **快速执行**: 并行测试执行
3. **强大的选择器**: 专为动态 Web 应用设计
4. **自动等待**: 智能等待元素可见/可点击
5. **网络拦截**: 可以 mock API 响应
6. **截图/视频**: 失败时自动捕获
7. **TypeScript 支持**: 原生 TypeScript 支持

## 安装步骤

### 1. 安装 Playwright

```bash
yarn add -D @playwright/test
yarn add -D @playwright/test
npx playwright install --with-deps
```

### 2. 创建 E2E 测试目录结构

```
gns3-web-ui/
├── e2e/
│   ├── fixtures/           # 测试数据
│   │   ├── users.ts
│   │   ├── controllers.ts
│   │   └── nodes.ts
│   ├── pages/              # 页面对象模型
│   │   ├── base.page.ts
│   │   ├── login.page.ts
│   │   ├── user-management.page.ts
│   │   └── console.page.ts
│   ├── tests/              # 测试用例
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

### 3. 配置文件

#### `e2e/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

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
  },
  "include": ["**/*.ts"]
}
```

### 4. 页面对象模型 (Page Object Model)

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

#### `e2e/pages/user-management.page.ts`

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class UserManagementPage extends BasePage {
  readonly addUserButton: Locator;
  readonly userTable: Locator;
  readonly userRows: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addUserButton = page.getByRole('button', { name: /add user/i });
    this.userTable = page.locator('mat-table');
    this.userRows = page.locator('mat-row');
    this.deleteButton = page.getByRole('button', { name: /delete/i });
  }

  async goto() {
    await this.goto('/controllers/1/users');
  }

  async clickAddUser() {
    await this.click(this.addUserButton);
  }

  async getUserCount(): Promise<number> {
    return await this.userRows.count();
  }

  async deleteUser(username: string) {
    const row = this.page.locator(`mat-row:has-text("${username}")`);
    await row.locator('button[mat-icon-delete]').click();
    await this.page.getByRole('button', { name: /confirm/i }).click();
  }
}
```

### 5. 测试夹具 (Fixtures)

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

### 6. 测试用例示例

#### `e2e/tests/user-management/user-detail.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { UserManagementPage } from '../../pages/user-management.page';
import { testUsers } from '../../fixtures/users';

test.describe('User Detail Dialog', () => {
  test.beforeEach(async ({ page }) => {
    // 登录并导航到用户管理页面
    await page.goto('/controllers/1/users');
    // 假设已经登录
  });

  test('should open user detail dialog', async ({ page }) => {
    const userMgmtPage = new UserManagementPage(page);

    // 点击用户行打开详情对话框
    await page.locator('mat-row:has-text("admin")').click();

    // 验证对话框打开
    await expect(page.locator('h2:has-text("admin")')).toBeVisible();
    await expect(page.locator('[mat-dialog-content]')).toBeVisible();
  });

  test('should update user information', async ({ page }) => {
    // 点击用户
    await page.locator('mat-row:has-text("testuser")').click();

    // 修改用户信息
    await page.fill('input[formcontrolname="full_name"]', 'Updated Name');

    // 保存更改
    await page.click('button:has-text("Save")');

    // 验证成功消息
    await expect(page.locator('.toast-success')).toContainText('User testuser updated');
  });

  test('should open change password dialog', async ({ page }) => {
    // 打开用户详情
    await page.locator('mat-row:has-text("testuser")').click();

    // 点击更改密码按钮
    await page.click('button:has-text("Change Password")');

    // 验证密码对话框打开
    await expect(page.locator('h2:has-text("Change Password")')).toBeVisible();
  });
});
```

#### `e2e/tests/console/web-console.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Web Console Full Window', () => {
  test('should open console for node', async ({ page }) => {
    // 导航到项目并选择节点
    await page.goto('/projects/1');
    await page.locator('.node:has-text("vpcs")').click();

    // 打开控制台
    await page.click('button[title="Open console"]');

    // 验证控制台窗口打开
    await expect(page).toHaveURL(/\/console\/.+/);

    // 验证终端初始化
    await expect(page.locator('.xterm-terminal')).toBeVisible();
  });

  test('should handle terminal input and output', async ({ page }) => {
    await page.goto('/console/1/node/2');

    // 等待终端就绪
    await expect(page.locator('.xterm-terminal')).toBeVisible();

    // 输入命令
    await page.keyboard.type('help\n');

    // 验证输出
    await expect(page.locator('.xterm-terminal')).toContainText('help');
  });

  test('should support copy/paste operations', async ({ page }) => {
    await page.goto('/console/1/node/2');

    // 右键点击终端
    await page.locator('.xterm-terminal').click({ button: 'right' });

    // 验证上下文菜单出现
    await expect(page.locator('.context-menu:has-text("Copy")')).toBeVisible();
  });
});
```

### 7. Mock API 响应

对于某些测试，你可能需要 mock API 响应：

```typescript
import { test, expect } from '@playwright/test';

test('should handle API errors gracefully', async ({ page }) => {
  // Mock API 响应
  await page.route('**/api/v2/controllers/1/users/**', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  });

  await page.goto('/controllers/1/users');
  await page.locator('mat-row:has-text("testuser")').click();

  // 验证错误消息显示
  await expect(page.locator('.toast-error')).toBeVisible();
});
```

### 8. 添加 NPM 脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:debug": "playwright test --debug",
    "e2e:headed": "playwright test --headed",
    "e2e:report": "playwright show-report"
  }
}
```

### 9. CI/CD 集成

#### `.github/workflows/e2e-tests.yml`

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

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: yarn install

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: yarn e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-screenshots
          path: test-results/
          retention-days: 30
```

## 运行 E2E 测试

### 开发模式

```bash
# 运行所有测试（无头模式）
yarn e2e

# 运行测试并显示浏览器
yarn e2e:headed

# 使用 Playwright UI（交互式测试运行器）
yarn e2e:ui

# 调试模式
yarn e2e:debug
```

### 特定测试

```bash
# 运行特定测试文件
yarn e2e user-management.spec.ts

# 运行特定测试套件
yarn e2e --grep "User Detail"

# 在特定浏览器上运行
yarn e2e --project=chromium
```

## 最佳实践

### 1. 测试隔离
- 每个测试应该独立运行
- 使用 `beforeEach` 设置测试数据
- 使用 `afterEach` 清理数据

### 2. 等待策略
```typescript
// ❌ 不好：使用固定延迟
await page.waitForTimeout(5000);

// ✅ 好：等待特定元素
await expect(page.locator('.dialog')).toBeVisible();
```

### 3. 选择器策略
```typescript
// ❌ 不好：使用 CSS 类（可能变化）
await page.click('.btn-primary');

// ✅ 好：使用语义化选择器
await page.click('button:has-text("Save")');
await page.click('[data-testid="save-button"]');
```

### 4. 数据管理
- 使用测试专用的数据库/控制器
- 在测试前设置已知状态
- 在测试后清理数据

### 5. 网络条件
```typescript
// 测试慢速网络
test('should handle slow network', async ({ page }) => {
  await page.context().setOffline(true);
  // 测试离线行为
  await page.context().setOffline(false);
});
```

## 覆盖的单元测试场景

### LoggedUserComponent (10 个测试)

1. **组件创建**: 验证组件正确渲染
2. **路由参数**: 验证从路由获取 controller ID
3. **用户信息加载**: 验证用户数据正确显示
4. **错误处理**: 验证 API 错误正确显示
5. **更改密码对话框**: 验证对话框正确打开
6. **复制 Token**: 验证剪贴板操作
7. **DOM 操作**: 验证 textarea 创建和删除

### WebConsoleFullWindowComponent (36 个测试)

1. **终端初始化**: 验证 xterm.js 终端创建
2. **WebSocket 连接**: 验证控制台 WebSocket 连接
3. **主题切换**: 验证终端主题更新
4. **快捷键处理**: 验证复制/粘贴快捷键
5. **窗口调整**: 验证终端适配窗口大小
6. **清理操作**: 验证组件销毁时正确清理资源

## 预期效果

实施 E2E 测试后，你将能够：

1. **验证完整用户流程**: 从登录到操作控制台的完整流程
2. **测试浏览器兼容性**: 在多个浏览器上运行测试
3. **捕获集成问题**: 发现单元测试无法发现的集成问题
4. **回归测试**: 确保新功能不破坏现有功能
5. **文档作用**: 测试用例作为功能文档

## 下一步

1. 安装 Playwright
2. 创建基本的页面对象
3. 实现第一个 E2E 测试
4. 逐步添加更多测试
5. 集成到 CI/CD 流程

## 参考资源

- [Playwright 官方文档](https://playwright.dev)
- [最佳实践](https://playwright.dev/docs/best-practices)
- [Angular + Playwright 示例](https://playwright.dev/docs/frameworks-angular)
