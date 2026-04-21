---
name: error-handler
description: Add standardized error handling to Observable subscriptions in Angular (Zoneless + OnPush)
version: 1.2.0
---

# Error Handler Skill

## Core Pattern

```typescript
.subscribe({
  next: (value) => { /* success */ },
  error: (err) => {
    const message = err.error?.message || err.message || 'Failed to <action>';
    toasterService.error(message);
    cdr.markForCheck();
  },
});
```

## Rules

1. **Error message**: `err.error?.message || err.message || 'Failed to <action>'`
2. **UI update**: Always call `cdr.markForCheck()` (OnPush strategy)
3. **Display**: `toasterService.error(message)`

## Fallback Format

`'Failed to <action>'` — e.g., `'Failed to delete node'`, `'Failed to load templates'`

---

**Last Updated**: 2026-04-21
