# Async Testing

## Fake Timers Pattern

When testing async operations in Zoneless Angular, use fake timers:

```typescript
describe('async tests', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should wait for async operation', async () => {
    mockService.method.mockReturnValue(of({ data: 'test' }));

    component.methodWithAsyncCall();

    // Advance fake timers to allow async operations to complete
    await vi.runAllTimersAsync();

    expect(component.data).toBe('test');
  });
});
```

## Common Async Patterns

### Observable Streams

```typescript
it('should handle Observable response', async () => {
  mockService.getData.mockReturnValue(of({ result: 'success' }));

  component.loadData();

  await vi.runAllTimersAsync();

  expect(component.result).toBe('success');
});
```

### Error Streams

```typescript
it('should handle Observable error', async () => {
  mockService.getData.mockReturnValue(throwError(() => new Error('Failed')));

  component.loadData();

  await vi.runAllTimersAsync();

  expect(component.error).toBeTruthy();
});
```

### Nested Subscriptions

```typescript
it('should handle nested async operations', async () => {
  mockService.method1.mockReturnValue(of({ id: 1 }));
  mockService.method2.mockReturnValue(of({ name: 'test' }));

  component.chainedAsyncCall();

  await vi.runAllTimersAsync();

  expect(component.data.name).toBe('test');
});
```

## Vitest Timer APIs

| API | Purpose | When to Use |
|-----|---------|-------------|
| `vi.useFakeTimers()` | Enable fake timers | In `beforeAll` |
| `vi.useRealTimers()` | Restore real timers | In `afterAll` |
| `vi.runAllTimersAsync()` | Advance fake timers | In async tests |
| `vi.clearAllTimers()` | Clear pending timers | In `afterEach` |

## Important Notes

- **Do NOT use `fakeAsync`/`tick()`** — they rely on Zone.js
- Always use `async` function when using `runAllTimersAsync()`
- Fake timers block real async operations — manually advance them
