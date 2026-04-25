---
name: unit-testing
description: This skill should be used when the user asks to "write tests", "create unit tests", "add test coverage", mentions "vitest", "jasmine", "karma", "testing", or discusses unit testing patterns, mocking strategies, or test quality.
version: 2.0.0
---

# Unit Testing Skills

## Running Tests

```bash
yarn test --include='**/services/**/*.spec.ts'     # Service tests
yarn test --include='**/components/**/*.spec.ts'   # Component tests
yarn test --watch                                  # Watch mode
```

## Quick Reference

| Topic | File |
|-------|------|
| Component Testing | `component-testing.md` |
| Service Testing | `service-testing.md` |
| Error Handling | `error-handling.md` |
| Async Testing | `async-testing.md` |
| inject() Dependencies | `inject-dependencies.md` |
| Testing Checklist | `checklist.md` |

## Core Principles

1. **Always clear mocks**: `vi.clearAllMocks()` in every `beforeEach`
2. **Guard fixture destroy**: `if (fixture) fixture.destroy()`
3. **Spy on component internals**: Use `vi.spyOn(component['cdr'])` for `inject()` dependencies
4. **Handle async properly**: Use `await vi.runAllTimersAsync()` with fake timers
5. **Test behavior, not implementation**: Focus on what users see, not how it works

## Angular 21 Specifics

- **Signal inputs**: `fixture.componentRef.setInput('key', value)`
- **Zoneless**: No `fakeAsync`/`tick()` - use `vi.runAllTimersAsync()`
- **Change Detection**: Explicit with `OnPush` - call `fixture.detectChanges()`

## Key Patterns

| Pattern | File |
|---------|------|
| Mock Observable streams | `service-testing.md` |
| Test error callbacks | `error-handling.md` |
| Wait for async operations | `async-testing.md` |
| Test inject() services | `inject-dependencies.md` |

---

**Last Updated**: 2026-04-23
