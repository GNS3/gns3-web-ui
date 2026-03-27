# Angular Material Checkbox in Zoneless Mode

## Overview

This document describes the recommended patterns for using `mat-checkbox` in Angular 21 Zoneless applications.

## Updated Recommendations (2026-03-27)

**⚠️ IMPORTANT**: The recommendations below have been updated for Zoneless architecture. The previous guidance to use `FormsModule` with `[ngModel]` is **no longer recommended** for display-only checkboxes.

## Recommended Pattern: Use `[checked]` for Display-Only Checkboxes

For checkboxes that only need to display a checked state (not two-way binding), use the `[checked]` property binding:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-example',
  template: `
    <mat-checkbox [checked]="isChecked" (change)="onChange($event.checked)">
      Example setting
    </mat-checkbox>
  `,
  imports: [MatCheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {
  isChecked = true;

  onChange(checked: boolean) {
    this.isChecked = checked;
    // Handle the change
  }
}
```

### Why Use `[checked]` Instead of `[ngModel]`?

| Aspect | `[ngModel]` with FormsModule | `[checked]` (Recommended) |
|--------|----------------------------|--------------------------|
| **Zoneless Compatible** | ⚠️ Requires FormsModule | ✅ No dependencies |
| **Bundle Size** | ❌ Adds FormsModule overhead | ✅ Minimal |
| **Purpose** | Two-way binding | Display state |
| **Modern Angular** | Legacy pattern | ✅ Recommended |
| **Performance** | Good | ✅ Better (no forms overhead) |

### When to Use Each Pattern

**Use `[checked]` when:**
- ✅ Checkbox only displays a state
- ✅ You handle changes via `(change)` event
- ✅ No form validation needed
- ✅ Building a settings UI with toggle switches

**Use `[(ngModel)]`` only when:**
- ⚠️ Part of a reactive form with validation
- ⚠️ Multiple form fields that need to be managed together
- ⚠️ You need form features like `ngModelOptions`

**Prefer `model()` signals when:**
- ✅ You need two-way binding in Zoneless architecture
- ✅ Working with modern Angular 17+ patterns
- ✅ Want the best performance with signals

## Migration Example

### Before (Using `[ngModel]`)

```html
<!-- ❌ Legacy approach - requires FormsModule -->
<mat-checkbox [ngModel]="isVisible" (change)="toggleVisibility($event.checked)">
  Show labels
</mat-checkbox>
```

```typescript
@Component({
  imports: [MatCheckboxModule, FormsModule], // FormsModule required
  // ...
})
export class SettingsComponent {
  isVisible = true;
}
```

### After (Using `[checked]`)

```html
<!-- ✅ Modern Zoneless approach - no FormsModule needed -->
<mat-checkbox [checked]="isVisible" (change)="toggleVisibility($event.checked)">
  Show labels
</mat-checkbox>
```

```typescript
@Component({
  imports: [MatCheckboxModule], // FormsModule NOT required
  // ...
})
export class SettingsComponent {
  isVisible = true;
}
```

## Real-World Example

From GNS3 Web UI (migrated 2026-03-27):

```html
<!-- project-map.component.html - Map Settings Menu -->
<mat-menu #viewMenu="matMenu" [overlapTrigger]="false">
  <div class="options-item">
    <mat-checkbox [checked]="isInterfaceLabelVisible" (change)="toggleShowInterfaceLabels($event.checked)">
      Show interface labels
    </mat-checkbox><br />
    <mat-checkbox [checked]="isConsoleVisible" (change)="toggleShowConsole($event.checked)">
      Show console
    </mat-checkbox><br />
    <mat-checkbox [checked]="isTopologySummaryVisible" (change)="toggleShowTopologySummary($event.checked)">
      Show topology/controllers summary
    </mat-checkbox><br />
    <!-- ... more checkboxes ... -->
  </div>
</mat-menu>
```

## Common Issues and Solutions

### Issue 1: Checkbox Not Showing Correct State

**Symptom**: Checkbox appears unchecked despite bound value being `true`.

**Root Cause**: In Zoneless mode with OnPush, change detection must be explicit.

**Solution**:
```typescript
toggleVisibility(checked: boolean) {
  this.isVisible = checked;
  this.cd.markForCheck(); // ✅ Explicit change detection
}
```

### Issue 2: Using `[ngModel]` Without FormsModule

**Symptom**: Console error or checkbox not working.

**Previous Solution** (Not Recommended):
```typescript
// ❌ Don't add FormsModule just for display checkboxes
imports: [FormsModule, MatCheckboxModule]
```

**Better Solution** (Recommended):
```typescript
// ✅ Use [checked] instead
imports: [MatCheckboxModule] // No FormsModule needed
```

## Migration Status

The following components have been migrated to use `[checked]`:

| Component | Date | Checkboxes Migrated |
|-----------|------|-------------------|
| `project-map.component.html` | 2026-03-27 | 8 checkboxes |

### Pending Migration

Approximately 40 files still use `[ngModel]` or `[(ngModel)]` for checkboxes. See [ngModel Migration Tracker](./ngmodel-migration-tracker.md) for complete inventory.

## Best Practices

1. **Prefer `[checked]` for settings UI**: Most checkboxes in settings menus are display-only
2. **Use `model()` for forms**: If you need two-way binding, use signal-based `model()`
3. **Avoid FormsModule overhead**: Only import when actually using form features
4. **Always use OnPush**: Required for Zoneless, ensures explicit change detection
5. **Call `markForCheck()`**: After state changes in async operations

## Related Documentation

- [ngModel Migration Tracker](./ngmodel-migration-tracker.md) - Track ngModel → signals migration
- [Model Input Signals](./model-input-signals.md) - Using `model()` for two-way binding
- [Component Tracker](./component-tracker.md) - Component migration status

## References

- [Angular Material Checkbox Documentation](https://material.angular.io/components/checkbox/overview)
- [Angular Zoneless Guide](https://angular.dev/guide/zoneless)
- [Angular Inputs Documentation](https://angular.dev/guide/components/inputs)

---

**Last Updated**: 2026-03-27
**Status**: ✅ Recommendations updated for Zoneless architecture
