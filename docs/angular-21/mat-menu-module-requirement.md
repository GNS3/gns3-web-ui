# Angular Material Menu Module Requirement

## Issue Description

When using `mat-menu-item` in standalone components with Angular Material 21, menu items may not render correctly. Specifically, the menu items appear misaligned or displayed incorrectly in the context menu.

### Symptoms

- Menu items appear side-by-side instead of vertically stacked
- Missing Material Design styling classes on menu item buttons
- Inconsistent rendering between different menu items in the same menu

### Root Cause

When using standalone components with Angular Material, simply importing `MatButtonModule` and `MatIconModule` is not sufficient for `mat-menu-item` to work correctly. The component must also import `MatMenuModule`.

Without `MatMenuModule`, the `mat-menu-item` directive does not properly apply Material Design styling, resulting in missing CSS classes like `mat-mdc-menu-item` and `mat-focus-indicator`.

## Affected Components

The following components in the GNS3 web-ui project were identified as having this issue:

1. `console-device-action`
2. `edit-link-style-action`
3. `edit-style-action`
4. `edit-text-action`
5. `isolate-node-action`
6. `reload-node-action`
7. `start-node-action`
8. `stop-node-action`
9. `suspend-node-action`
10. `unisolate-node-action`

## Solution

For any component that uses `mat-menu-item` in its template, ensure `MatMenuModule` is included in the component's imports array.

### Correct Implementation

```typescript
import { ChangeDetectionStrategy, Component, OnChanges, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';

@Component({
  selector: 'app-example-action',
  templateUrl: './example-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleActionComponent {
  // ...
}
```

### Incorrect Implementation

```typescript
// Missing MatMenuModule - will cause rendering issues
imports: [MatButtonModule, MatIconModule],
```

## Detection

To check if a component using `mat-menu-item` is missing `MatMenuModule`:

1. Open browser DevTools (F12)
2. Inspect the menu item element
3. Compare CSS classes with working menu items

**Working component:**
```html
<button mat-menu-item class="mat-mdc-menu-item mat-focus-indicator">
```

**Broken component (missing MatMenuModule):**
```html
<button mat-menu-item class="mat-menu-item">
  <!-- Missing: mat-mdc-menu-item and mat-focus-indicator -->
```

## Additional Notes

- This issue was observed during migration from Angular 14 to Angular 21
- The same requirement applies regardless of whether using `*ngIf` or `@if` control flow syntax
- `MatMenuModule` is required for the `mat-menu-item` directive to properly apply styling

## References

- [Angular Material Menu Documentation](https://material.angular.io/components/menu/overview)
- [Angular Standalone Components](https://angular.dev/guide/components/importing)
