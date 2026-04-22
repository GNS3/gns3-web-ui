# Testing inject() Dependencies

## The Problem

When components use Angular's `inject()` function, the component holds its own reference to the injected service, separate from the mock provided to TestBed.

```typescript
@Component({ ... })
export class MyComponent {
  private cdr = inject(ChangeDetectorRef);  // ← Internal reference
}
```

## The Solution

Spy on the component's internal instance, NOT the mock provider.

```typescript
// ❌ WRONG - spying on mock provider won't work
const mockChangeDetectorRef = { markForCheck: vi.fn() };
TestBed.configureTestingModule({
  providers: [
    { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef }
  ],
});
// ... later in test
expect(mockChangeDetectorRef.markForCheck).toHaveBeenCalled(); // ❌ Fails!

// ✅ RIGHT - spy on component's internal instance
const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
expect(cdrSpy).toHaveBeenCalled(); // ✅ Passes
```

## Common Pattern with Error Handling

```typescript
it('should call markForCheck after error', async () => {
  // Arrange
  const error = new Error('Test error');
  mockService.method.mockReturnValue(throwError(() => error));

  // Spy on component's internal instance
  const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

  // Act
  component.methodThatFails();
  await vi.runAllTimersAsync();

  // Assert
  expect(cdrSpy).toHaveBeenCalled();
});
```

## Why This Happens

1. `TestBed.configureTestingModule()` creates a mock provider
2. `inject()` creates a NEW instance in the component
3. The component's reference is different from the mock
4. Spying on the mock doesn't capture calls from the component's instance

## Common inject() Services to Test

| Service | Property Name | Usage |
|---------|--------------|-------|
| `ChangeDetectorRef` | `cdr` | `markForCheck()` after errors |
| `ToasterService` | `toasterService` | Error/success messages |
| `ActivatedRoute` | `route` | Query params, route data |
| `Router` | `router` | Navigation |

## Reference Examples

- `src/app/components/project-map/context-menu/actions/stop-node-action/stop-node-action.component.spec.ts` — line 299
- `src/app/components/drawings-listeners/link-created/link-created.component.spec.ts` — error handling tests
