# GNS3 Web UI CSS Style Guide

This document defines the CSS coding standards for the GNS3 Web UI project, ensuring consistency, maintainability, and performance in styling.

---

## 1. Angular Material Default Styles First

**Rule**: Prefer Angular Material's default styles. Avoid unnecessary style overrides.

```scss
// ✅ Correct: Use Material's default styles
mat-form-field {
  width: 100%;
}

// ❌ Wrong: Override Material's default styles
.mat-mdc-form-field {
  height: 50px;
}
```

---

## 2. No Color Fallback Values

**Rule**: Never use hardcoded color values as fallbacks. All colors must be obtained through Material theme variables.

```scss
// ✅ Correct: Use CSS variables
.card {
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}

// ❌ Wrong: Hardcoded fallback colors
.card {
  background-color: var(--mat-sys-surface, #ffffff);
  color: var(--mat-sys-on-surface, #000000);
}
```

> **Important**: If a Material theme variable is undefined, it's a bug in the theme generation system, not a fallback situation.

---

## 3. No Custom Colors in Components

**Rule**: Do not define custom background colors, text colors, or other colors in components. All colors must reference Material theme tokens.

```scss
// ✅ Correct: Use Material theme variables
.button {
  background-color: var(--mat-sys-primary);
  color: var(--mat-sys-on-primary);
}

// ❌ Wrong: Custom colors
.button {
  background-color: #2196f3;
  color: white;
}
```

---

## 4. No `!important`

**Rule**: Strictly prohibited. Solve style specificity through selector specificity.

```scss
// ✅ Correct: Increase priority through selectors
.form-field.mat-mdc-form-field {
  width: 100%;
}

// ❌ Wrong: Using !important
.form-field {
  width: 100% !important;
}
```

---

## 5. No `::ng-deep`

**Rule**: `::ng-deep` is deprecated. Do not use it. Use ViewEncapsulation or global styles.

```scss
// ✅ Correct: Use component styles or global styles
:host {
  display: block;
}

// ❌ Wrong: Using ::ng-deep
::ng-deep .mat-mdc-button {
  border-radius: 8px;
}
```

---

## 6. Clean Up Redundant Styles

**Rule**: Regularly clean up unused and duplicate style code. Keep style files lean.

```scss
// ❌ Wrong: Redundant styles
.card {
  width: 100%;
  margin: 0;
  padding: 0;
}

.card {
  width: 100%;
  margin: 0;
}

// ✅ Correct: Merge duplicate styles
.card {
  width: 100%;
  margin: 0;
  padding: 0;
}
```

---

## 7. Do Not Modify Third-Party Component Inner DOM

**Rule**: Strictly prohibited from modifying the inner DOM structure of third-party components (Angular Material).

If you must modify the size or margin of an Angular Material component, prefer:

1. **CSS Variables (Custom Properties)**
2. **Density System**

```scss
// ✅ Correct: Use CSS variables
mat-form-field {
  --mdc-text-field-container-height: 56px;
  --mat-form-field-container-justify-content: center;
}

// ✅ Correct: Use Density
@use '@angular/material' as mat;

mat-form-field {
  @include mat.form-field-density(-1);
}
```

---

## 8. Component :host Layout Properties Must Be Clearly Defined

**Rule**: All components should clearly define `:host` layout properties. Avoid directly setting width/height on child component tags in parent components.

```scss
// ✅ Correct: Component defines its own layout
:host {
  display: block;
  width: 100%;
  height: 100%;
}

// ❌ Wrong: Parent controls child size
// parent.component.html
<app-child style="width: 500px; height: 300px;"></app-child>
```

---

## 9. Embrace CSS Custom Properties (Variables)

**Rule**: Angular Material 3 is fully based on CSS variables. Never hardcode color values.

```scss
// ✅ Correct: Use Material theme tokens
.button {
  background-color: var(--mat-sys-primary);
  color: var(--mat-sys-on-primary);
  border-color: var(--mat-sys-outline);
}

// ❌ Wrong: Hardcoded colors
.button {
  background-color: #2196f3;
  color: #ffffff;
  border-color: #e0e0e0;
}
```

---

## 10. Style Logic Belongs in HTML, Style Definitions Belong in CSS

**Rule**: Prefer using `[class.is-active]="signal()"` to toggle class names. Never concatenate complex style strings in TypeScript logic.

```typescript
// ✅ Correct: Use signals to control class names
@Component({})
export class MyComponent {
  isActive = signal(false);

  toggle() {
    this.isActive.update(v => !v);
  }
}
```

```html
<!-- ✅ Correct: HTML controls style classes -->
<button [class.active]="isActive()">Click</button>
```

```typescript
// ❌ Wrong: Concatenating style strings in TS
this.renderer.setStyle(el, 'background-color', '#2196f3');
this.renderer.addClass(el, 'custom-style-' + this.variant);
```

```scss
// ✅ Correct: CSS defines style variants
.button.active {
  background-color: var(--mat-sys-primary);
}

.button.variant-primary {
  background-color: var(--mat-sys-primary-container);
}
```

---

## 11. Dialog Styles Must Be Centralized

**Rule**: All dialog styles must be centralized in `src/styles/_dialogs.scss` and imported into `styles.scss` using `@use`. Do not define dialog styles in component local scope.

**Important**: `ViewEncapsulation.None` and `::ng-deep` are strictly prohibited for styling dialogs.

### File Structure

```
src/styles/
├── _dialogs.scss                   # Centralized dialog styles
├── _theme-generator.scss           # Theme generator (MD3 Sass Mixin)
├── material3-theme-supplement.scss # Main entry point (imports _theme-generator)
└── styles.scss                    # Global styles + @use for dialogs
```

### How Theme System Works

1. **ThemeService** adds theme class to `<html>` element (e.g., `class="theme-pink-bluegrey"`)
2. **`material3-theme-supplement.scss`** calls `generate-all-themes()` mixin
3. **`_theme-generator.scss`** generates CSS variables via `mat.define-theme()` and `mat.all-component-themes()`
4. **Components** use CSS variables (e.g., `var(--mat-sys-primary)`)

### Implementation Steps

**Step 1**: Add `panelClass` when opening the dialog

```typescript
// ✅ Correct: Use panelClass
const dialogRef = this.dialog.open(MyDialogComponent, {
  panelClass: 'my-custom-dialog-panel',
  // ...
});
```

**Step 2**: Create centralized dialog styles in `src/styles/_dialogs.scss`

```scss
/* =============================================
// My Custom Dialog
// ============================================= */
.my-custom-dialog-panel {
  .mdc-dialog__surface,
  .mat-mdc-dialog-surface {
    background: var(--mat-sys-surface);
    color: var(--mat-sys-on-surface);
  }
}
```

**Step 3**: Import in `styles.scss` using `@use`

```scss
// styles.scss
@use 'styles/dialogs' as *;
```

### Why Not ViewEncapsulation.None?

```scss
// ❌ Wrong: Using ViewEncapsulation.None
// my-dialog.component.ts
@Component({
  encapsulation: ViewEncapsulation.None, // ❌ STRICTLY PROHIBITED
  // ...
})
```

Dialogs are rendered outside the component's host element in Angular's overlay system, so `ViewEncapsulation.None` does not apply to dialog content.

### Why Not ::ng-deep?

```scss
// ❌ Wrong: Using ::ng-deep
// my-dialog.component.scss
::ng-deep .mat-mdc-dialog-container {
  max-width: 800px; // ❌ DEPRECATED
}
```

`::ng-deep` is deprecated and should never be used.

---

## 12. Enforce BEM Naming

**Rule**: Even with view encapsulation, give the component root element a unique class name to prevent difficulties finding style sources during global searches or debugging.

```scss
// ✅ Correct: Use BEM naming
.gns3-card {
  &__header {
    padding: 16px;
  }

  &__content {
    margin-top: 8px;
  }

  &--disabled {
    opacity: 0.5;
  }
}
```

```html
<!-- Usage Example -->
<div class="gns3-card gns3-card--disabled">
  <div class="gns3-card__header">Title</div>
  <div class="gns3-card__content">Content</div>
</div>
```

---

## Appendix: Material Design 3 Theme Variable Reference

See [Material 3 CSS Variables Reference](./02-material3-css-variables.md) for the complete variable documentation.

### Quick Reference - Primary Colors

| Token | Purpose |
|-------|---------|
| `--mat-sys-primary` | Main theme color for FABs, buttons, links |
| `--mat-sys-on-primary` | Text/icons on primary color |
| `--mat-sys-primary-container` | Light/dark variant for containers |
| `--mat-sys-on-primary-container` | Text on primary container |

### Quick Reference - Surface Colors

| Token | Purpose |
|-------|---------|
| `--mat-sys-background` | Page background |
| `--mat-sys-surface` | Cards, sheets, dialogs |
| `--mat-sys-surface-container-*` | Elevation levels (lowest, low, medium, high, highest) |
| `--mat-sys-outline` | Borders, dividers |

---

## Checklist

Before committing code, ensure:

- [ ] No `!important` usage
- [ ] No `::ng-deep` usage
- [ ] No `ViewEncapsulation.None` usage
- [ ] No hardcoded color values
- [ ] Material theme variables used
- [ ] Dialog styles use `panelClass`
- [ ] Components use BEM naming
- [ ] Style logic controlled in HTML

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-20 | Initial release |
| 1.1 | 2026-03-23 | Added Material 3 color variable reference |
| 1.2 | 2026-03-24 | Added ViewEncapsulation.None prohibition |
| 1.3 | 2026-03-24 | Updated dialog section with centralized approach |
| 2.0 | 2026-03-24 | Complete rewrite for Angular Material 21 MD3 Sass Mixin system |

**Last Updated**: 2026-03-24
