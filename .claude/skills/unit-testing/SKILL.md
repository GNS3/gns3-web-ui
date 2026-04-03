---
name: unit-testing
description: This skill should be used when the user asks to "write tests", "create unit tests", "add test coverage", mentions "vitest", "jasmine", "karma", "testing", or discusses unit testing patterns, mocking strategies, or test quality.
version: 1.1.0
---

# Unit Testing Skills

## Running Tests

```bash
# Service tests (CI: yarn test --include="**/services/**/*.spec.ts")
yarn test --include='**/services/**/*.spec.ts'

# Component tests (CI: yarn test --include="**/components/**/*.spec.ts")
yarn test --include='**/components/**/*.spec.ts'

yarn test --watch                     # watch mode
```

## Test Templates

Copy the right template for your test type.

### Component Template

Components have DOM and change detection — they need cleanup.

```typescript
describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();  // ← component MUST have this
  });
});
```

### Service Template

Services have no DOM. With `destroyAfterEach: true` in test-setup, the injector is rebuilt per test.

```typescript
describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MyService],
    });
    service = TestBed.inject(MyService);
  });

  // afterEach not needed — destroyAfterEach handles it
});
```

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

## Resource Cleanup Table

Clean up **only what the test uses**. DOM → `destroy`, HTTP → `verify`, timer → `discardPeriodicTasks`.

| Test Type | `fixture.destroy()` | `httpMock.verify()` | `discardPeriodicTasks()` |
|-----------|--------------------|--------------------|------------------------|
| Component, no HTTP | required | not needed | needed if service has `interval` |
| Component, with HTTP | required | required | needed if service has `interval` |
| Service, no HTTP | not needed | not needed | needed if service has `interval` |
| Service, with HTTP | not needed | required | needed if service has `interval` |

**Rule**: clean up whatever resource the test touches — DOM with `destroy`, HTTP with `verify`, timer with `discardPeriodicTasks`.

## Angular 21 Specifics

- **Signal inputs**: use `fixture.componentRef.setInput('key', value)` instead of direct property assignment
- **Zoneless**: change detection is explicit — always call `fixture.detectChanges()` after triggering changes
- **Mock functions returning Observable**: use `.mockReturnValue(of(...))`, not just `vi.fn()`
- **Do NOT use `fakeAsync`/`tick()`** — they rely on Zone.js which doesn't exist in Zoneless mode

## Reference Examples

- `src/app/components/topology-summary/topology-summary.component.spec.ts` — 65 tests passing
- `src/app/components/template/template.component.spec.ts` — 32 tests passing
- `src/app/services/xterm.service.spec.ts` — 39 tests passing
