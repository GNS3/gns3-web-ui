# Component Testing

## Template

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [MyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });
});
```

## What to Test

| Target | What to Test |
|--------|--------------|
| **Inputs** | Does the component respond correctly when parent passes different values? |
| **Outputs** | Does clicking a button emit the expected event to the parent? |
| **Methods** | After calling a method, do expected side effects occur? |
| **Properties** | After changing property A, does property B update correctly? |
| **Edge Cases** | Empty array, API returns 500, null/undefined input |

## What NOT to Test

- Private methods
- Implementation details — only test behavior
- Multiple assertions in one `it` — split them

## Angular 21 Specifics

### Signal Inputs

```typescript
// ✅ Correct
fixture.componentRef.setInput('controller', mockController);

// ❌ Wrong
component.controller = mockController;
```

### Change Detection

Always call `fixture.detectChanges()` after triggering changes:

```typescript
component.ngOnChanges({ nodes: { currentValue: nodes } } as any);
fixture.detectChanges(); // ← Required!
```

## Reference Examples

- `src/app/components/topology-summary/topology-summary.component.spec.ts` — 65 tests passing
- `src/app/components/template/template.component.spec.ts` — 32 tests passing
