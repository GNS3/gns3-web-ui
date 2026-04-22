# Service Testing

## Template

```typescript
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [MyService],
    });
    service = TestBed.inject(MyService);
  });

  // afterEach not needed — destroyAfterEach handles it
});
```

## Mocking Service Methods

### Return Observable

```typescript
// Success case
mockService.getData.mockReturnValue(of({ id: 1, name: 'test' }));

// Error case
mockService.getData.mockReturnValue(throwError(() => new Error('Failed')));
```

### Multiple Calls

```typescript
mockService.method
  .mockReturnValueOnce(of({ id: 1 }))  // First call
  .mockReturnValueOnce(of({ id: 2 }))  // Second call
  .mockReturnValue(of({ id: 3 }));     // All subsequent calls
```

## Testing Async Operations

```typescript
it('should handle async operation', async () => {
  mockService.fetchData.mockReturnValue(of({ data: 'test' }));

  await service.loadData();

  expect(service.data).toBe('test');
});
```

## Reference Examples

- `src/app/services/xterm.service.spec.ts` — 39 tests passing
- `src/app/services/notification.service.spec.ts` — 16 tests passing (global stub pattern)
