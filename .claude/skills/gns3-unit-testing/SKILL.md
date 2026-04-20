---
name: unit-testing
description: This skill should be used when the user asks to "write tests", "create unit tests", "add test coverage", mentions "vitest", "jasmine", "karma", "testing", or discusses unit testing patterns, mocking strategies, or test quality.
version: 2.0.0
---

# Unit Testing Skills

## Running Tests

```bash
# Service tests
yarn test --include='**/services/**/*.spec.ts'

# Component tests
yarn test --include='**/components/**/*.spec.ts'

yarn test --watch                     # watch mode
```

---

## Test Templates

### Component Template

```typescript
describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    vi.clearAllMocks(); // Reset mock call counts

    await TestBed.configureTestingModule({
      imports: [MyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {         // ← Always guard before destroy
      fixture.destroy();
    }
  });
});
```

### Service Template

Services have no DOM. With `destroyAfterEach: true` in test-setup, the injector is rebuilt per test.

```typescript
describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    vi.clearAllMocks(); // Reset mock call counts

    TestBed.configureTestingModule({
      providers: [MyService],
    });
    service = TestBed.inject(MyService);
  });

  // afterEach not needed — destroyAfterEach handles it
});
```

### Global Stub Template (WebSocket, localStorage, etc.)

```typescript
describe('MyService with WebSocket', () => {
  beforeAll(() => {
    vi.stubGlobal('WebSocket', MockWebSocket); // Stub once
  });

  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket); // Re-set — other files may have unstubbed it
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.unstubAllGlobals(); // Must cleanup!
  });
});
```

---

## What to Test

| Target | What to Test |
|--------|--------------|
| **Inputs** | Does the component respond correctly when parent passes different values? |
| **Outputs** | Does clicking a button emit the expected event to the parent? |
| **Methods** | After calling a method, do expected side effects occur (API calls, state changes)? |
| **Properties** | After changing property A, does property B update correctly? |
| **Edge Cases** | Empty array, API returns 500, null/undefined input |

## What NOT to Test

- Private methods
- Implementation details — only test behavior
- Multiple assertions in one `it` — split them

---

## AAA Pattern

Every test has three clearly separated sections:

```typescript
it('should filter results when search text changes', () => {
  // Arrange — set up mock data
  mockService.getResults.mockReturnValue(of([{ id: 1, name: 'test' }]));

  // Act — call the method under test
  component.search('test');

  // Assert — verify outcomes
  expect(component.filteredResults.length).toBe(1);
});
```

---

## Resource Cleanup Table

| Test Type | `fixture.destroy()` | `httpMock.verify()` | `discardPeriodicTasks()` |
|-----------|--------------------|--------------------|------------------------|
| Component, no HTTP | required | not needed | needed if service has `interval` |
| Component, with HTTP | required | required | needed if service has `interval` |
| Service, no HTTP | not needed | not needed | needed if service has `interval` |
| Service, with HTTP | not needed | required | needed if service has `interval` |

**Rule**: clean up whatever resource the test touches — DOM with `destroy`, HTTP with `verify`, timer with `discardPeriodicTasks`.

---

## Angular 21 Specifics

- **Signal inputs**: use `fixture.componentRef.setInput('key', value)` instead of direct property assignment
- **Zoneless**: change detection is explicit — always call `fixture.detectChanges()` after triggering changes
- **Mock functions returning Observable**: use `.mockReturnValue(of(...))`, not just `vi.fn()`
- **Do NOT use `fakeAsync`/`tick()`** — they rely on Zone.js which doesn't exist in Zoneless mode

---

## Key Learnings (From Fixing 114 Failing Tests)

These rules were extracted from a real debugging session that brought 114 failing tests → 0.

### 1. Defensive Fixture Destroy

If `beforeEach` fails, `fixture` is `undefined` — guard before destroying.

```typescript
// ❌ WRONG
afterEach(() => { fixture.destroy(); });

// ✅ RIGHT
afterEach(() => { if (fixture) { fixture.destroy(); } });
```

### 2. Always Unstub Global Stubs

`vi.stubGlobal()` pollutes all subsequent tests unless cleaned up.

```typescript
// ✅ RIGHT
beforeAll(() => { vi.stubGlobal('WebSocket', mockWebSocket); });
afterAll(() => { vi.unstubAllGlobals(); });
```

### 3. Clear Mocks Between Tests

Mock call counts accumulate across tests without explicit clearing.

```typescript
// ✅ RIGHT — add to every beforeEach
beforeEach(() => { vi.clearAllMocks(); });
```

### 4. Fake Timers + Async

Fake timers block async operations — manually advance them.

```typescript
// ✅ RIGHT
it('should wait for async', async () => {
  await asyncOperation();
  await vi.runAllTimersAsync();
  expect(result).toBe('done');
});
```

### 5. DOM Cleanup

Appended DOM elements persist across tests — always remove them.

```typescript
// ✅ RIGHT
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

### 6. Re-stub in beforeEach

Other test files calling `vi.unstubAllGlobals()` may clear your stubs.

```typescript
// ✅ RIGHT — re-stub every test, don't assume it persists
beforeEach(() => { vi.stubGlobal('WebSocket', MockWebSocket); });
```

---

## Lifecycle Hooks Quick Reference

| Hook | Purpose | Caution |
|------|---------|---------|
| `beforeAll` | One-time setup (stub globals) | Must pair with `afterAll` cleanup |
| `afterAll` | Clean global stubs | Use `vi.unstubAllGlobals()` |
| `beforeEach` | Setup before each test | `vi.clearAllMocks()`, reset state |
| `afterEach` | Cleanup after each test | `if (fixture) fixture.destroy()`, clean DOM |

## Vitest Key APIs

| API | Purpose | When to Use |
|-----|---------|-------------|
| `vi.stubGlobal()` | Mock global objects | `beforeAll` + `afterAll` pair |
| `vi.unstubAllGlobals()` | Clean global stubs | In `afterAll` |
| `vi.clearAllMocks()` | Clear mock call counts | `beforeEach` |
| `vi.runAllTimersAsync()` | Advance fake timers | In async tests with fake timers |
| `vi.useFakeTimers()` | Enable fake timers | In `beforeEach` |
| `vi.useRealTimers()` | Restore real timers | In `afterEach` |

---

## Testing Checklist

### Test Structure
- [ ] `vi.clearAllMocks()` in every `beforeEach`
- [ ] `if (fixture)` guard in every `afterEach` with `fixture.destroy()`
- [ ] Global stubs cleaned in `afterAll` with `vi.unstubAllGlobals()`
- [ ] Each test is independent — no execution order dependencies

### Mock Management
- [ ] Mock call counts reset with `vi.clearAllMocks()`
- [ ] Global stubs re-set in `beforeEach` (not just `beforeAll`)
- [ ] No shared mutable state between tests

### Async Tests
- [ ] `vi.runAllTimersAsync()` used when fake timers are active
- [ ] Not mixing `fixture.whenStable()` with fake timers
- [ ] Async operations explicitly awaited

### DOM
- [ ] Created DOM elements tracked and removed in `afterEach`
- [ ] No leftover elements between tests

---

## Reference Examples

- `src/app/components/topology-summary/topology-summary.component.spec.ts` — 65 tests passing
- `src/app/components/template/template.component.spec.ts` — 32 tests passing
- `src/app/services/xterm.service.spec.ts` — 39 tests passing
- `src/app/services/notification.service.spec.ts` — 16 tests passing (global stub pattern)

---

**Last Updated**: 2026-04-04