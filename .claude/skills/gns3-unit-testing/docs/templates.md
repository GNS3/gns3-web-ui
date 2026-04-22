# Test Templates

Quick copy-paste templates for common test scenarios.

---

## Component Template

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

---

## Service Template

Services have no DOM. With `destroyAfterEach: true` in test-setup, the injector is rebuilt per test.

```typescript
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

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

---

## Global Stub Template (WebSocket, localStorage, etc.)

```typescript
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';

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

## Error Handling with inject() Pattern

```typescript
describe('error handling', () => {
  it('should display error message when service fails', async () => {
    const mockError = { error: { message: 'Node busy' } };
    mockService.method.mockReturnValue(throwError(() => mockError));

    // Spy on component's internal instance (NOT the mock!)
    const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

    component.methodThatFails();

    // Advance fake timers for async error handling
    await vi.runAllTimersAsync();

    expect(mockToasterService.error).toHaveBeenCalledWith('Node busy');
    expect(cdrSpy).toHaveBeenCalled();
  });
});
```

---

## Mock Service with Observable

```typescript
// Success case
mockService.getData.mockReturnValue(of({ id: 1, name: 'test' }));

// Error case
mockService.getData.mockReturnValue(throwError(() => new Error('Failed')));
```
