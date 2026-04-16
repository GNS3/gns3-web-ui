# Unit Testing Best Practices

> **Key Learnings** - Extracted from fixing test pollution
>
> **Results**: 114 failing tests → 0 failing tests (100% success rate)

---

## Core Principles

### 1. Defensive Cleanup - Always Check Before Destroy

**Problem**: If `beforeEach` fails, `fixture` is `undefined`, causing secondary errors.

```typescript
// ❌ WRONG: Assume fixture always exists
afterEach(() => {
  fixture.destroy();
});

// ✅ RIGHT: Check before destroying
afterEach(() => {
  if (fixture) {
    fixture.destroy();
  }
});
```

**Impact**: 30+ files had this issue. Fixing it dramatically reduced flaky tests.

---

### 2. Global State Management - Stub What You Unstub

**Problem**: `vi.stubGlobal()` modifies real global objects, affecting all subsequent tests.

```typescript
// ❌ WRONG: Stub without cleanup
beforeAll(() => {
  vi.stubGlobal('WebSocket', mockWebSocket);
});
// WebSocket remains mocked after tests finish!

// ✅ RIGHT: Always pair with cleanup
beforeAll(() => {
  vi.stubGlobal('WebSocket', mockWebSocket);
});

afterAll(() => {
  vi.unstubAllGlobals(); // Must cleanup!
});
```

**Impact**: 8 files used `vi.stubGlobal()` without cleanup, causing severe test pollution.

---

### 3. Mock State Isolation - Clear Between Tests

**Problem**: Mock call counts accumulate between tests.

```typescript
// ❌ WRONG: Mock calls accumulate
it('test 1', () => {
  mockFn(); // Call count = 1
});

it('test 2', () => {
  mockFn(); // Call count = 2!
  expect(mockFn).toHaveBeenCalledTimes(1); // Fails!
});

// ✅ RIGHT: Clear before each test
beforeEach(() => {
  vi.clearAllMocks(); // Reset all mock call counts
});
```

**Impact**: Adding `vi.clearAllMocks()` globally significantly improved test stability.

---

### 4. Fake Timers with Async Tests

**Problem**: Fake timers pause real time; async operations need manual advancement.

```typescript
// ❌ WRONG: Fake timers block async completion
it('should wait for async', async () => {
  await asyncOperation();
  expect(result).toBe('done'); // Times out!
});

// ✅ RIGHT: Advance timers in fake environment
it('should wait for async', async () => {
  await asyncOperation();
  await vi.runAllTimersAsync(); // Advance all timers
  expect(result).toBe('done');
});
```

**Impact**: Fixed validator tests (34 tests) and choose-name-dialog test.

---

### 5. DOM Cleanup - Leave No Trace

**Problem**: Created DOM elements accumulate, causing subsequent test failures.

```typescript
// ❌ WRONG: Create DOM without cleanup
const element = document.createElement('div');
document.body.appendChild(element);
// DOM remains after test finishes!

// ✅ RIGHT: Track and cleanup
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

**Impact**: Added global `document.body.innerHTML = ''` cleanup.

---

### 6. Test Independence - No Execution Order Dependencies

**Problem**: Tests should run independently in any order.

```typescript
// ❌ WRONG: Tests depend on execution order
describe('Group A', () => {
  it('test A', () => {
    globalState = 'modified by A';
  });
});

describe('Group B', () => {
  it('test B', () => {
    expect(globalState).toBe('modified by A'); // Order dependency!
  });
});

// ✅ RIGHT: Each test is independent
beforeEach(() => {
  globalState = 'initial'; // Reset before each test
});
```

**Impact**: Tests pass regardless of execution order.

---

### 7. Stub Reset - Prevent Stub Pollution

**Problem**: Other tests' cleanup may clear your stubs.

```typescript
// ❌ WRONG: Assume stub exists
beforeEach(() => {
  // If another file called vi.unstubAllGlobals(),
  // WebSocket is no longer mocked!
  new WebSocket('ws://localhost');
});

// ✅ RIGHT: Ensure stub exists
beforeEach(() => {
  vi.stubGlobal('WebSocket', MockWebSocket); // Re-set every time
  new WebSocket('ws://localhost');
});
```

**Impact**: Fixed notification.service tests (16 tests).

---

## Testing Checklist

### Test Structure
- [ ] Clean all mocks and state in `beforeEach`
- [ ] Clean DOM and temporary resources in `afterEach`
- [ ] Use `if (fixture)` check before destroying
- [ ] Clean global stubs in `afterAll`

### Mock Management
- [ ] Use `vi.clearAllMocks()` to reset mock call counts
- [ ] Always `unstub` global objects
- [ ] Re-set module-level stubs in `beforeEach`

### Async Tests
- [ ] Use `vi.runAllTimersAsync()` in fake timer environment
- [ ] Avoid mixing `fixture.whenStable()` with fake timers
- [ ] Explicitly wait for async operations

### Environment Isolation
- [ ] Each test is independent and can run alone
- [ ] No dependencies on test execution order
- [ ] No shared state (isolate with `beforeEach`)

---

## Common Pitfalls

### Pitfall 1: Global Side Effects Not Cleaned

```typescript
// ❌ DANGEROUS
beforeAll(() => {
  vi.stubGlobal('localStorage', mockStorage);
});
// Forgot to cleanup in afterAll!

// ✅ SAFE
beforeAll(() => {
  vi.stubGlobal('localStorage', mockStorage);
});

afterAll(() => {
  vi.unstubAllGlobals();
});
```

### Pitfall 2: Mock State Leakage

```typescript
// ❌ DANGEROUS
describe('Test Suite', () => {
  const mockFn = vi.fn();

  it('test 1', () => {
    mockFn();
  });

  it('test 2', () => {
    expect(mockFn).toHaveBeenCalledTimes(1); // Actually 2!
  });
});

// ✅ SAFE
describe('Test Suite', () => {
  const mockFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test 1', () => {
    mockFn();
  });

  it('test 2', () => {
    expect(mockFn).toHaveBeenCalledTimes(1); // Correctly 1
  });
});
```

### Pitfall 3: Fake Timers Blocking Async

```typescript
// ❌ DANGEROUS
beforeEach(() => {
  vi.useFakeTimers();
});

it('should wait for async', async () => {
  await asyncOperation(); // Waits forever
  expect(result).toBe('done');
});

// ✅ SAFE
beforeEach(() => {
  vi.useFakeTimers();
});

it('should wait for async', async () => {
  await asyncOperation();
  await vi.runAllTimersAsync(); // Advance time
  expect(result).toBe('done');
});
```

---

## Quick Reference

### Lifecycle Hooks

| Hook | Purpose | Caution |
|------|---------|---------|
| `beforeAll` | One-time setup (stub globals) | Must pair with `afterAll` cleanup |
| `afterAll` | Clean global stubs | Use `vi.unstubAllGlobals()` |
| `beforeEach` | Setup before each test | Clear mocks, reset state |
| `afterEach` | Cleanup after each test | Destroy fixtures, clean DOM |

### Vitest Key APIs

| API | Purpose | When to Use |
|-----|---------|-------------|
| `vi.stubGlobal()` | Mock global objects | `beforeAll` + `afterAll` pair |
| `vi.unstubAllGlobals()` | Clean global stubs | In `afterAll` |
| `vi.clearAllMocks()` | Clear mock call counts | `beforeEach` or `afterEach` |
| `vi.runAllTimersAsync()` | Advance fake timers | In async tests |
| `vi.useFakeTimers()` | Enable fake timers | In `beforeEach` |
| `vi.useRealTimers()` | Restore real timers | In `afterEach` |

---

## Related Resources

- **Vitest Docs**: https://vitest.dev/
- **Testing Library**: https://testing-library.com/
- **Project Test Config**: `src/test-setup.ts`, `vitest.config.ts`

---

**Last Updated**: 2026-04-04
**Success Rate**: 114 failing tests → 0 failing tests (100%)

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
