---
name: error-handler
description: Add standardized error handling to Observable subscriptions in Angular (Zoneless + OnPush)
version: 1.1.0
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
    const message = err.error?.message || err.message || 'Failed to add docker template';
    this.toasterService.error(message);
    this.changeDetector.markForCheck();
  }
});
```

---

## Checklist

- [ ] Convert to object syntax: `subscribe({ next, error })`
- [ ] Extract message: `err.error?.message || err.message || 'fallback'`
- [ ] Use specific fallback with template/resource type
- [ ] Call `toasterService.error(message)`
- [ ] Call `markForCheck()` after error handling
- [ ] Verify component has `ChangeDetectionStrategy.OnPush`

---

## Fallback Message Format

### Pattern
```
'Failed to <action> <resource-type> <resource>'
```

### Template Operations

| Operation | Fallback Message |
|-----------|------------------|
| addTemplate (Docker) | `'Failed to add docker template'` |
| addTemplate (Cloud) | `'Failed to add cloud node template'` |
| addTemplate (Ethernet Hub) | `'Failed to add ethernet hub template'` |
| addTemplate (Ethernet Switch) | `'Failed to add ethernet switch template'` |
| addTemplate (IOS) | `'Failed to add ios template'` |
| addTemplate (IOU) | `'Failed to add iou template'` |
| addTemplate (QEMU) | `'Failed to add qemu template'` |
| addTemplate (VirtualBox) | `'Failed to add virtual box template'` |
| addTemplate (VMware) | `'Failed to add vmware template'` |
| addTemplate (VPCS) | `'Failed to add vpcs template'` |
| copyTemplate | `'Failed to copy <type> template'` |
| deleteTemplate | `'Failed to delete template'` |
| saveTemplate | `'Failed to save template'` |

### Compute Operations

| Operation | Fallback Message |
|-----------|------------------|
| createCompute | `'Failed to create compute'` |
| updateCompute | `'Failed to update compute'` |
| deleteCompute | `'Failed to delete compute'` |

---

## ChangeDetectorRef Variable Names

Common names in codebase: `changeDetector`, `cd`, `cdr`, `changeDetectorRef`

Example with `cd`:
```typescript
error: (err) => {
  this.toasterService.error('Failed to add docker template: ' + err.error?.message);
  this.cd.markForCheck();
}
```

---

## Example Fix

**Before:**
```typescript
this.dockerService.addTemplate(controller, data).subscribe((res) => this.goBack());
```

**After:**
```typescript
this.dockerService.addTemplate(controller, data).subscribe({
  next: (res) => this.goBack(),
  error: (err) => {
    const message = err.error?.message || err.message || 'Failed to add docker template';
    this.toasterService.error(message);
    this.cd.markForCheck();
  }
});
```

---

**Last Updated**: 2026-04-21
