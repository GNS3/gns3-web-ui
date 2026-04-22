# Testing Checklist

Use this checklist before considering a test file complete.

## Test Structure

- [ ] `vi.clearAllMocks()` in every `beforeEach`
- [ ] `if (fixture)` guard in every `afterEach` with `fixture.destroy()`
- [ ] Global stubs cleaned in `afterAll` with `vi.unstubAllGlobals()`
- [ ] Each test is independent — no execution order dependencies

## Mock Management

- [ ] Mock call counts reset with `vi.clearAllMocks()`
- [ ] Global stubs re-set in `beforeEach` (not just `beforeAll`)
- [ ] No shared mutable state between tests

## Angular 21 Compliance

- [ ] Signal inputs use `fixture.componentRef.setInput('key', value)`
- [ ] `fixture.detectChanges()` called after state changes
- [ ] No `fakeAsync`/`tick()` — use `vi.runAllTimersAsync()` instead

## Async Tests

- [ ] `vi.runAllTimersAsync()` used when fake timers are active
- [ ] `vi.useFakeTimers()` in `beforeAll` and `vi.useRealTimers()` in `afterAll`
- [ ] Async operations explicitly awaited
- [ ] No mixing of `fixture.whenStable()` with fake timers

## Error Handling

- [ ] For `inject()` dependencies: `vi.spyOn(component['service'])` NOT mock provider
- [ ] Error callbacks tested with `await vi.runAllTimersAsync()`
- [ ] Both `toasterService.error()` and `cdr.markForCheck()` verified

## DOM Cleanup

- [ ] Created DOM elements tracked and removed in `afterEach`
- [ ] No leftover elements between tests

## Resource Cleanup Table

| Test Type | `fixture.destroy()` | `httpMock.verify()` | `discardPeriodicTasks()` |
|-----------|--------------------|--------------------|------------------------|
| Component, no HTTP | required | not needed | needed if service has `interval` |
| Component, with HTTP | required | required | needed if service has `interval` |
| Service, no HTTP | not needed | not needed | needed if service has `interval` |
| Service, with HTTP | not needed | required | needed if service has `interval` |

**Rule**: Clean up whatever resource the test touches.
