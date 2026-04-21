---
name: error-handler
description: Add standardized error handling to Observable subscriptions in Angular (Zoneless + OnPush)
version: 1.0.0
---

# Error Handler (Zoneless + OnPush)

## Core Principles

1. Always use object syntax: `subscribe({ next, error })`
2. Extract server message: `err.error?.message`
3. Trigger change detection: `markForCheck()`
4. Display user-friendly error via `toasterService.error()`

---

## Standard Pattern

```typescript
this.service.addTemplate(controller, data).subscribe({
  next: (result) => {
    this.toasterService.success('Template added');
    this.dialogRef.close();
  },
  error: (err) => {
    const message = err.error?.message || err.message || 'Failed to add template';
    this.toasterService.error(message);
    this.changeDetector.markForCheck();
  }
});
```

---

## Checklist

- [ ] Convert to object syntax: `subscribe({ next, error })`
- [ ] Extract message: `err.error?.message || err.message || 'fallback'`
- [ ] Call `toasterService.error(message)`
- [ ] Call `markForCheck()` after error handling
- [ ] Verify component has `ChangeDetectionStrategy.OnPush`

---

## Common Fallback Messages

| Operation | Fallback Message |
|-----------|------------------|
| addTemplate | `'Failed to add template'` |
| createCompute | `'Failed to create compute'` |
| deleteTemplate | `'Failed to delete template'` |
| saveTemplate | `'Failed to save template'` |
| updateCompute | `'Failed to update compute'` |
| deleteCompute | `'Failed to delete compute'` |

---

## ChangeDetectorRef Variable Names

Common names in codebase: `changeDetector`, `cd`, `cdr`, `changeDetectorRef`

Example with `cd`:
```typescript
error: (err) => {
  this.toasterService.error('Failed to add compute: ' + err.error?.message);
  this.cd.markForCheck();
}
```

---

## Example Fix

**Before:**
```typescript
this.service.add(data).subscribe((res) => this.goBack());
```

**After:**
```typescript
this.service.add(data).subscribe({
  next: (res) => this.goBack(),
  error: (err) => {
    const message = err.error?.message || err.message || 'Failed to add data';
    this.toasterService.error(message);
    this.cd.markForCheck();
  }
});
```

---

**Last Updated**: 2026-04-21
