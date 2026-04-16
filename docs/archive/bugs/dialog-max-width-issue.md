# Angular Material Dialog Max-Width Issue

## Problem

When using `MatDialog` to open a dialog with a custom width (e.g., `width: '1000px'`), the dialog would not respect the specified width and instead render at approximately 560px wide.

### Example

```typescript
const dialogRef = this.dialog.open(AddAceDialogComponent, {
  width: '1000px',  // This was being ignored
  autoFocus: false,
  disableClose: true,
});
```

The dialog would render at ~560px instead of 1000px.

## Root Cause

Angular Material 3 (M3) dialog component has a default CSS variable `--mat-dialog-container-max-width` set to `560px`. This is defined in:

```
node_modules/@angular/material/dialog/_m3-dialog.scss
```

The key CSS rule is:

```css
.cdk-overlay-pane.mat-mdc-dialog-panel {
  max-width: var(--mat-dialog-container-max-width, 560px);
}
```

Even when passing `width: '1000px'` to `MatDialog.open()`, the `max-width` property was not being overridden because the CSS variable takes precedence.

## Solution

To fix this issue, you need to:

### 1. Add a `panelClass` to your dialog configuration

```typescript
const dialogRef = this.dialog.open(AddAceDialogComponent, {
  width: '1000px',
  autoFocus: false,
  disableClose: true,
  panelClass: 'add-ace-dialog-panel',  // Add this
  data: { endpoints: this.endpoints() }
});
```

### 2. Define CSS to override the variable in your panel class

In `src/styles/_dialogs.scss` (or your global styles):

```scss
.add-ace-dialog-panel {
  --mat-dialog-container-max-width: 1000px;

  mat-dialog-container,
  .mat-mdc-dialog-container {
    width: 1000px;
    max-width: 1000px;
  }
}
```

## Alternative Approaches

### Using `::ng-deep` (Not Recommended)

You could use `::ng-deep` to pierce style isolation, but this is deprecated:

```scss
.add-ace-dialog-panel {
  ::ng-deep .mat-mdc-dialog-container {
    width: 1000px;
    max-width: 1000px;
  }
}
```

### Calling `updateSize()` after opening

```typescript
const dialogRef = this.dialog.open(AddAceDialogComponent, {
  width: '1000px',
  // ...
});
dialogRef.updateSize('1000px');
```

This approach is not ideal as it may cause a visual flash.

## Key Takeaways

1. Angular Material 3 dialogs use CSS variables for default sizing
2. The `width` option sets `width` but not `max-width` in the overlay pane
3. Always set `--mat-dialog-container-max-width` CSS variable when you need a custom max-width
4. The `panelClass` approach is the cleanest solution for style customization

## Related Files

- `src/styles/_dialogs.scss` - Global dialog styles
- `src/app/components/acl-management/acl-management.component.ts` - Example usage
- `node_modules/@angular/material/dialog/_m3-dialog.scss` - Material source

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
