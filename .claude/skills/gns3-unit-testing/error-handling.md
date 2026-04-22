# Error Handling Testing

## Pattern for Testing Error Callbacks

```typescript
import { throwError } from 'rxjs';

describe('error handling', () => {
  it('should display error message when service fails', async () => {
    const mockError = { error: { message: 'Node busy' } };
    mockService.method.mockReturnValue(throwError(() => mockError));

    // Spy on component's internal cdr instance
    const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

    component.methodThatFails();

    // Advance fake timers for async error handling
    await vi.runAllTimersAsync();

    expect(mockToasterService.error).toHaveBeenCalledWith('Node busy');
    expect(cdrSpy).toHaveBeenCalled();
  });
});
```

## Common Error Scenarios

### 1. Error with error.message property

```typescript
const mockError = { error: { message: 'Specific error' } };
mockService.method.mockReturnValue(throwError(() => mockError));
// Expects: toasterService.error('Specific error')
```

### 2. Error with err.message

```typescript
const error = new Error('Network failed');
mockService.method.mockReturnValue(throwError(() => error));
// Expects: toasterService.error('Network failed')
```

### 3. Error without message

```typescript
const error = {};
mockService.method.mockReturnValue(throwError(() => error));
// Expects: toasterService.error('Failed to <action>')
```

## AAA Pattern for Error Tests

```typescript
it('should handle error gracefully', async () => {
  // Arrange - set up error
  const error = new Error('Test error');
  mockService.method.mockReturnValue(throwError(() => error));
  const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

  // Act - trigger error
  component.methodThatFails();
  await vi.runAllTimersAsync();

  // Assert - verify error handling
  expect(mockToasterService.error).toHaveBeenCalled();
  expect(cdrSpy).toHaveBeenCalled();
});
```

## Reference Examples

- `src/app/components/project-map/context-menu/actions/stop-node-action/stop-node-action.component.spec.ts` — lines 249-309
