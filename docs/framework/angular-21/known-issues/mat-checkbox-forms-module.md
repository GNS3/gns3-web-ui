# Angular Material Checkbox FormsModule Requirement

## Issue Description

When using `mat-checkbox` with `[ngModel]` binding in standalone components with Angular Material 21 and OnPush change detection strategy, the checkbox may not display the correct checked state even when the bound value is `true`.

### Symptoms

- Checkbox appears unchecked despite the bound value being `true`
- Default `true` values for settings like `symbolScaling`, `isTopologySummaryVisible`, etc. are not reflected in the UI
- The checkbox only shows the correct state after user interaction (clicking)

### Root Cause

The `ngModel` directive from `FormsModule` is required for two-way binding with `mat-checkbox`. When `FormsModule` is not imported in a standalone component:

1. The `[ngModel]` binding does not function properly
2. The initial checked state is not correctly rendered
3. Change detection does not properly propagate value changes to the view

This is especially problematic with `ChangeDetectionStrategy.OnPush`, where Angular relies on explicit change detection triggers.

## Affected Components

The following component in the GNS3 web-ui project was identified as having this issue:

- `project-map` - Map settings checkboxes (`symbolScaling`, `isInterfaceLabelVisible`, `isTopologySummaryVisible`, etc.)

## Solution

For any component that uses `mat-checkbox` with `[ngModel]` binding, ensure `FormsModule` is included in both the TypeScript imports and the component's `imports` array.

### Correct Implementation

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-example',
  template: `
    <mat-checkbox [ngModel]="isChecked" (change)="onChange($event.checked)">
      Example setting
    </mat-checkbox>
  `,
  imports: [FormsModule, MatCheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {
  isChecked = true;
}
```

### Incorrect Implementation

```typescript
// Missing FormsModule - ngModel will not work correctly
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  imports: [MatCheckboxModule], // Missing FormsModule
})
export class ExampleComponent {
  isChecked = true; // Will not display correctly
}
```

## Verification

To verify the fix:

1. Open the map settings menu in the project map view
2. Check that the "Scale symbols" checkbox is checked by default (when `symbolScaling` is `true` in localStorage or defaults to `true`)
3. Verify other default-true settings also display correctly

## Additional Notes

- This issue was observed during migration from Angular 14 to Angular 21
- The same requirement applies regardless of component architecture (standalone vs module-based)
- When using `[(ngModel)]` (two-way binding), `FormsModule` is also required
- `CommonModule` does not include `FormsModule` functionality

## References

- [Angular Forms Documentation](https://angular.dev/guide/forms)
- [Angular Material Checkbox](https://material.angular.io/components/checkbox/overview)
- [Standalone Components](https://angular.dev/guide/components/importing)
