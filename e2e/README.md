# E2E 测试快速开始

## 安装

```bash
# 安装 Playwright
yarn add -D @playwright/test

# 安装浏览器
npx playwright install --with-deps
```

## 运行测试

```bash
# 运行所有 E2E 测试
yarn e2e

# 在 UI 模式下运行（推荐用于开发）
yarn e2e:ui

# 在浏览器中运行（调试模式）
yarn e2e:headed

# 调试特定测试
yarn e2e:debug
```

## 目录结构

```
e2e/
├── playwright.config.ts    # Playwright 配置
├── tests/                  # 测试用例
│   └── user-management/
│       └── user-detail.spec.ts
└── README.md              # 本文件
```

## 当前覆盖的测试

### 用户详情对话框 (user-detail.spec.ts)

✅ **已实现测试:**
- 打开用户详情对话框
- 显示用户信息
- 更新用户全名
- 邮箱验证错误
- 关闭对话框
- 更改密码对话框
- 密码不匹配验证
- 成功更改密码
- API 错误处理
- 网络错误处理

## 下一步

需要实现的 E2E 测试：

### LoggedUserComponent
- [ ] 用户登录流程
- [ ] 复制 Token 到剪贴板
- [ ] 更改密码对话框
- [ ] 错误处理

### WebConsoleFullWindowComponent
- [ ] 打开控制台
- [ ] 终端初始化
- [ ] WebSocket 连接
- [ ] 输入/输出测试
- [ ] 复制/粘贴操作
- [ ] 快捷键处理
- [ ] 主题切换
- [ ] 窗口调整
- [ ] 资源清理

## 开发提示

### 1. 使用 UI 模式开发

```bash
yarn e2e:ui
```

UI 模式提供：
- 可视化测试运行
- 时间轴查看器
- 网络请求监控
- 截图和视频
- 交互式调试

### 2. 调试技巧

```typescript
// 暂停测试执行
await page.pause();

// 截图
await page.screenshot({ path: 'screenshot.png' });

// 查看页面内容
console.log(await page.content());

// 等待特定元素
await expect(page.locator('.dialog')).toBeVisible();
```

### 3. 选择器最佳实践

```typescript
// ✅ 使用语义化选择器
page.getByRole('button', { name: 'Save' })
page.getByText('Welcome')
page.getByLabel('Email')

// ✅ 使用测试 ID（在 HTML 中添加 data-testid）
page.locator('[data-testid="save-button"]')

// ❌ 避免 CSS 类（可能变化）
page.locator('.btn-primary')
page.locator('#submit-btn')
```

### 4. 等待策略

```typescript
// ✅ 好：等待特定条件
await expect(page.locator('.dialog')).toBeVisible();
await page.waitForSelector('.dialog', { state: 'visible' });
await page.waitForResponse('**/api/users');

// ❌ 不好：固定延迟
await page.waitForTimeout(5000);
```

## 故障排查

### 测试超时

```typescript
// 增加超时时间
test.setTimeout(60000);

// 或者
await page.click('button', { timeout: 10000 });
```

### 元素未找到

```typescript
// 等待元素出现
await page.waitForSelector('button', { state: 'attached' });

// 或使用 expect
await expect(page.locator('button')).toBeVisible({ timeout: 10000 });
```

### 网络问题

```typescript
// 等待网络空闲
await page.waitForLoadState('networkidle');

// 等待特定响应
await page.waitForResponse('**/api/users');
```

## CI/CD 集成

在 `.github/workflows/e2e.yml` 中添加：

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

## 资源

- [Playwright 文档](https://playwright.dev)
- [最佳实践](https://playwright.dev/docs/best-practices)
- [调试指南](https://playwright.dev/docs/debug)
- [完整指南](../docs/testing/e2e-testing-guide.md)
