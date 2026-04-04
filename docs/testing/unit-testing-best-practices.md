# Unit Testing Best Practices

> **关键要点总结** - 从实际测试污染修复中提取的经验教训
>
> **修复成果**：从 114 个失败测试减少到 0 个（100% 成功率）

---

## 🔑 核心原则

### 1. 防御性清理 - Always Check Before Destroy

**问题**：如果 `beforeEach` 失败，`fixture` 为 `undefined`，会导致二次错误。

```typescript
// ❌ 错误：假设 fixture 总是存在
afterEach(() => {
  fixture.destroy(); // 如果 beforeEach 失败，这里会崩溃
});

// ✅ 正确：检查是否存在
afterEach(() => {
  if (fixture) {
    fixture.destroy();
  }
});
```

**影响**：30+ 个文件有这个问题，修复后大幅减少随机失败。

---

### 2. 全局状态管理 - Stub What You Unstub

**问题**：`vi.stubGlobal()` 修改的是真正的全局对象，影响所有后续测试。

```typescript
// ❌ 错误：stub 了但没有清理
beforeAll(() => {
  vi.stubGlobal('WebSocket', mockWebSocket);
});
// 测试结束后，WebSocket 仍然是 mock 的！

// ✅ 正确：成对出现
beforeAll(() => {
  vi.stubGlobal('WebSocket', mockWebSocket);
});

afterAll(() => {
  vi.unstubAllGlobals(); // 必须清理！
});
```

**影响**：8 个文件使用了 `vi.stubGlobal()` 但没有清理，导致严重的测试污染。

---

### 3. Mock 状态隔离 - Clear Between Tests

**问题**：Mock 调用次数会在测试间累积。

```typescript
// ❌ 错误：mock 调用累积
it('test 1', () => {
  mockFn(); // 调用次数 = 1
});

it('test 2', () => {
  mockFn(); // 调用次数 = 2！
  expect(mockFn).toHaveBeenCalledTimes(1); // 失败！
});

// ✅ 正确：每个测试前清理
beforeEach(() => {
  vi.clearAllMocks(); // 重置所有 mock 调用计数
});
```

**影响**：全局添加 `vi.clearAllMocks()` 后，测试稳定性显著提升。

---

### 4. Fake Timers 与异步测试

**问题**：Fake timers 会暂停真实时间，异步操作需要手动推进。

```typescript
// ❌ 错误：fake timers 阻止异步完成
it('should wait for async', async () => {
  await asyncOperation();
  expect(result).toBe('done'); // 超时！时间被暂停了
});

// ✅ 正确：运行 timers 推进异步
it('should wait for async', async () => {
  await asyncOperation();
  await vi.runAllTimersAsync(); // 推进所有 timers
  expect(result).toBe('done');
});
```

**影响**：修复了 validator 测试（34 个测试）和 choose-name-dialog 测试。

---

### 5. DOM 清理 - Leave No Trace

**问题**：创建 DOM 元素不清理会累积，导致后续测试失败。

```typescript
// ❌ 错误：创建 DOM 不清理
const element = document.createElement('div');
document.body.appendChild(element);
// 测试结束后 DOM 仍然存在！

// ✅ 正确：追踪并清理
const elements: HTMLElement[] = [];

beforeEach(() => {
  const el = document.createElement('div');
  elements.push(el);
  document.body.appendChild(el);
});

afterEach(() => {
  elements.forEach(el => el.remove());
  elements.length = 0;
});
```

**影响**：全局添加 `document.body.innerHTML = ''` 清理。

---

### 6. 测试独立性 - No Execution Order Dependencies

**问题**：测试应该可以单独运行，任何顺序都应该通过。

```typescript
// ❌ 错误：测试依赖执行顺序
describe('Group A', () => {
  it('test A', () => {
    globalState = 'modified by A';
  });
});

describe('Group B', () => {
  it('test B', () => {
    expect(globalState).toBe('modified by A'); // 依赖顺序！
  });
});

// ✅ 正确：每个测试独立
beforeEach(() => {
  globalState = 'initial'; // 每个测试前重置
});
```

**影响**：测试执行顺序改变时仍然通过。

---

### 7. Stub 重设 - Prevent Stub Pollution

**问题**：其他文件的清理可能清除你的 stub。

```typescript
// ❌ 错误：假设 stub 已经存在
beforeEach(() => {
  // 如果其他文件调用了 vi.unstubAllGlobals()，
  // WebSocket 不再是 mock 的！
  new WebSocket('ws://localhost');
});

// ✅ 正确：确保 stub 存在
beforeEach(() => {
  vi.stubGlobal('WebSocket', MockWebSocket); // 每次重新设置
  new WebSocket('ws://localhost');
});
```

**影响**：修复了 notification.service 测试（16 个测试）。

---

## 📋 测试检查清单

### 测试结构
- [ ] `beforeEach` 中清理所有 mock 和状态
- [ ] `afterEach` 中清理 DOM 和临时资源
- [ ] 使用 `if (fixture)` 检查后再销毁
- [ ] 全局 stub 在 `afterAll` 中清理

### Mock 管理
- [ ] 使用 `vi.clearAllMocks()` 清理 mock 调用
- [ ] Stub 全局对象时必须 `unstub`
- [ ] 模块级 stub 在 `beforeEach` 中重新设置

### 异步测试
- [ ] Fake timers 环境使用 `vi.runAllTimersAsync()`
- [ ] 避免 `fixture.whenStable()` 与 fake timers 混用
- [ ] 明确等待异步操作完成

### 环境隔离
- [ ] 每个测试独立，可单独运行
- [ ] 不依赖测试执行顺序
- [ ] 不共享状态（使用 `beforeEach` 隔离）

---

## 🚨 常见陷阱

### 陷阱 1：全局副作用未清理

```typescript
// ❌ 危险
beforeAll(() => {
  vi.stubGlobal('localStorage', mockStorage);
});
// 忘记在 afterAll 中清理！

// ✅ 安全
beforeAll(() => {
  vi.stubGlobal('localStorage', mockStorage);
});

afterAll(() => {
  vi.unstubAllGlobals();
});
```

### 陷阱 2：Mock 状态泄漏

```typescript
// ❌ 危险
describe('Test Suite', () => {
  const mockFn = vi.fn();

  it('test 1', () => {
    mockFn();
  });

  it('test 2', () => {
    expect(mockFn).toHaveBeenCalledTimes(1); // 实际是 2！
  });
});

// ✅ 安全
describe('Test Suite', () => {
  const mockFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test 1', () => {
    mockFn();
  });

  it('test 2', () => {
    expect(mockFn).toHaveBeenCalledTimes(1); // 正确是 1
  });
});
```

### 陷阱 3：Fake Timers 阻止异步

```typescript
// ❌ 危险
beforeEach(() => {
  vi.useFakeTimers();
});

it('should wait for async', async () => {
  await asyncOperation(); // 永远等待
  expect(result).toBe('done');
});

// ✅ 安全
beforeEach(() => {
  vi.useFakeTimers();
});

it('should wait for async', async () => {
  await asyncOperation();
  await vi.runAllTimersAsync(); // 推进时间
  expect(result).toBe('done');
});
```

---

## 🎯 快速参考

### 生命周期钩子

| 钩子 | 用途 | 注意事项 |
|------|------|----------|
| `beforeAll` | 一次性设置（stub 全局对象） | 必须配对 `afterAll` 清理 |
| `afterAll` | 清理全局 stub | 使用 `vi.unstubAllGlobals()` |
| `beforeEach` | 每个测试前的设置 | 清理 mock、重置状态 |
| `afterEach` | 每个测试后的清理 | 销毁 fixture、清理 DOM |

### Vitest 关键 API

| API | 用途 | 何时使用 |
|-----|------|----------|
| `vi.stubGlobal()` | Mock 全局对象 | `beforeAll` + `afterAll` 配对 |
| `vi.unstubAllGlobals()` | 清理全局 stub | `afterAll` 中 |
| `vi.clearAllMocks()` | 清理 mock 调用计数 | `beforeEach` 或 `afterEach` |
| `vi.runAllTimersAsync()` | 推进 fake timers | 异步测试中 |
| `vi.useFakeTimers()` | 启用 fake timers | `beforeEach` 中 |
| `vi.useRealTimers()` | 恢复真实 timers | `afterEach` 中 |

---

## 📚 相关资源

- **Vitest 官方文档**: https://vitest.dev/
- **Testing Library**: https://testing-library.com/
- **项目测试配置**: `src/test-setup.ts`, `vitest.config.ts`

---

**最后更新**: 2026-04-04
**修复成果**: 从 114 个失败测试 → 0 个失败测试（100% 成功率）
