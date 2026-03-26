# Dialog Style Isolation Best Practices

> Centralized Dialog Styling with Base Styles and Component-Specific Overrides

**Last Updated**: 2026-03-26

---

## Revision History

| Date       | Version | Author        | Changes                                                                                                                                                                                                                               |
| ---------- | ------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-26 | 2.0     | Claude Sonnet | - Add `.base-dialog-panel` architecture<br>- Add inheritance-based styling approach<br>- Add complete base styles reference<br>- Update examples with base + specific pattern                                                         |
| 2026-03-18 | 1.1     | Claude Sonnet | - Add complete `.mat-dialog-container` styles (border, shadow)<br>- Add `.mat-dialog-surface` transparent styling<br>- Add complete ngx-json-viewer CSS variables (13 variables)<br>- Update Step 2 example with full style structure |
| 2026-03-13 | 1.0     | -             | Initial version with basic panelClass usage                                                                                                                                                                                           |

---

## Architecture Overview

GNS3 Web UI uses a **layered dialog styling architecture** to ensure consistency while allowing flexibility:

```
.base-dialog-panel (Base Styles)
    ↓ Inherited
.specific-dialog-panel (Component Overrides)
    ↓ Applied
Dialog Component
```

### Benefits

| Benefit             | Description                                            |
| ------------------- | ------------------------------------------------------ |
| **Consistency**     | All dialogs share unified visual appearance            |
| **Maintainability** | Base styles defined once, changes propagate everywhere |
| **Flexibility**     | Components can add specific overrides when needed      |
| **DRY Principle**   | No repetition of common styles across components       |
| **Theme Support**   | Full Material Design 3 theme variable support          |

---

## Base Dialog Styles

The `.base-dialog-panel` class provides common styling for all dialogs. It's defined in `src/styles/_dialogs.scss`.

### Complete Base Styles Reference

```scss
.base-dialog-panel {
  /* Dialog Surface */
  .mat-mdc-dialog-container {
    .mat-mdc-dialog-surface {
      border-radius: 16px;
      box-shadow: 0 12px 40px color-mix(in srgb, var(--mat-sys-shadow) 25%, transparent), 0 4px 12px color-mix(in srgb, var(
                --mat-sys-shadow
              ) 12%, transparent);
    }
  }

  /* Dialog Title */
  h1[mat-dialog-title],
  h2[mat-dialog-title] {
    font-size: 18px;
    font-weight: 500;
    color: var(--mat-sys-on-surface);
    margin-bottom: 24px;
    padding: 24px 24px 0 24px;
  }

  /* Dialog Content */
  .mat-mdc-dialog-content {
    padding: 16px 24px 0 24px;
  }

  /* Dialog Actions */
  .mat-mdc-dialog-actions {
    padding: 16px 24px;
    justify-content: flex-end;
    gap: 8px;
  }

  /* Form Fields */
  .form-field {
    width: 100%;
    margin-bottom: 16px;
  }

  /* Checkboxes */
  mat-checkbox {
    display: block;
    margin-bottom: 12px;
  }

  /* Cards */
  mat-card {
    margin-bottom: 16px;
  }

  mat-card-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--mat-sys-on-surface);
  }

  mat-card-subtitle {
    font-size: 14px;
    font-weight: 400;
    color: var(--mat-sys-on-surface-variant);
  }

  /* Tab Content */
  mat-tab-group {
    .mat-mdc-tab-body-wrapper {
      .mat-mdc-tab-body {
        .mat-mdc-tab-body-content {
          padding-top: 16px; // Spacing below tab labels
        }
      }
    }
  }
}
```

### Spacing System

| Element                | Spacing              |
| ---------------------- | -------------------- |
| Title to content       | 24px (margin-bottom) |
| Content to tab content | 16px (padding-top)   |
| Form fields            | 16px (margin-bottom) |
| Checkboxes             | 12px (margin-bottom) |
| Cards                  | 16px (margin-bottom) |
| Buttons                | 8px (gap)            |

---

## Usage Patterns

### Pattern 1: Using Base Styles Only

For simple dialogs that only need standard styling:

```typescript
this.dialog.open(SimpleDialogComponent, {
  panelClass: ['base-dialog-panel'],
});
```

**Result**: Dialog gets all base styles without any customization.

---

### Pattern 2: Base Styles + Specific Overrides

For dialogs that need standard styling plus specific customizations:

```typescript
this.dialog.open(ConfiguratorDialogComponent, {
  panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
});
```

**Result**: Dialog inherits base styles, then applies `.configurator-dialog-panel` overrides.

**Example Override** (`src/styles/_dialogs.scss`):

```scss
.configurator-dialog-panel {
  /* Specific: Max height for configurator dialogs */
  .mat-mdc-dialog-container {
    max-height: 80vh;
  }

  /* Specific: Scrollable content */
  .mat-mdc-dialog-content {
    overflow-y: auto;
    max-height: calc(80vh - 140px);
    padding: 16px 24px 0 24px;
  }

  /* Specific: Custom layout */
  .modal-form-container {
    padding: 16px 24px 0 24px;
  }

  /* Specific: File upload buttons */
  .file-button {
    width: 18%;
  }

  .file-name-form-field {
    padding-left: 2%;
    width: 80%;
  }
}
```

---

### Pattern 3: Base Styles + Theme Support

For dialogs that need theme-aware styling:

```typescript
const theme = this.themeService.getActualTheme();
const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';

this.dialog.open(ThemedDialogComponent, {
  panelClass: ['base-dialog-panel', 'my-dialog', themeClass],
});
```

**Result**: Dialog gets base styles, custom styles, and theme-specific overrides.

---

## Component Implementation

### Step 1: Open Dialog with panelClass

```typescript
// config-action.component.ts
configureNode() {
  const node = this.node();

  if (node.node_type === 'qemu') {
    // Use base styles + configurator-specific overrides
    this.dialogRef = this.dialog.open(ConfiguratorDialogQemuComponent, {
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
      autoFocus: false,
      width: '950px',
      disableClose: false,
    });
  }

  // Set component properties
  let instance = this.dialogRef.componentInstance;
  instance.controller = this.controller();
  instance.node = node;
}
```

### Step 2: Remove Component styleUrls

Since styles are centralized, components don't need their own style files:

```typescript
// configurator-qemu.component.ts
@Component({
  standalone: true,
  selector: 'app-configurator-qemu',
  templateUrl: './configurator-qemu.component.html',
  // Styles centralized in src/styles/_dialogs.scss via panelClass: 'configurator-dialog-panel'
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    /* ... */
  ],
})
export class ConfiguratorDialogQemuComponent {}
```

### Step 3: Add Specific Overrides (if needed)

If your dialog needs custom styles beyond the base, add them to `src/styles/_dialogs.scss`:

```scss
// src/styles/_dialogs.scss
.my-custom-dialog-panel {
  /* Override specific base styles if needed */
  .mat-mdc-dialog-container {
    max-height: 90vh; // Different from base
  }

  /* Add dialog-specific styles */
  .custom-element {
    display: flex;
    gap: 12px;
  }
}
```

---

## Advanced Scenarios

### Scenario 1: Third-Party Component Variables

When using third-party components that need CSS variables (like `ngx-json-viewer`):

```typescript
// dialog opener
const theme = this.themeService.getActualTheme();
const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';

this.dialog.open(JsonViewerDialogComponent, {
  panelClass: ['base-dialog-panel', 'json-viewer-dialog', themeClass],
});
```

```scss
// src/styles/_dialogs.scss
.json-viewer-dialog {
  .json-container {
    /* Base Material theme variables */
    --ngx-json-string: var(--mat-sys-primary);
    --ngx-json-number: var(--mat-sys-secondary);
    --ngx-json-boolean: var(--mat-sys-tertiary);
    --ngx-json-date: var(--mat-sys-on-surface-variant);
    --ngx-json-array: var(--mat-sys-error);
    --ngx-json-object: var(--mat-sys-inverse-surface);
    --ngx-json-function: var(--mat-sys-on-surface);
    --ngx-json-null: var(--mat-sys-outline);
    --ngx-json-key: var(--mat-sys-on-surface);
    --ngx-json-separator: var(--mat-sys-outline);
    --ngx-json-value: var(--mat-sys-on-surface);
  }
}

/* Dark theme overrides */
.json-viewer-dialog.dark-theme .json-container {
  --ngx-json-string: #a5d6ff;
  --ngx-json-number: #79c0ff;
  --ngx-json-boolean: #ff7b72;
  /* ... other dark theme colors ... */
}

/* Light theme overrides */
.json-viewer-dialog.light-theme .json-container {
  --ngx-json-string: #0451a5;
  --ngx-json-number: #098658;
  --ngx-json-boolean: #0000ff;
  /* ... other light theme colors ... */
}
```

### Scenario 2: Transparent Dialog Surface

For dialogs that need custom container styling:

```scss
.custom-dialog-panel {
  /* Make dialog surface transparent */
  .mat-mdc-dialog-container .mat-mdc-dialog-surface {
    background-color: transparent;
  }

  /* Custom container styling */
  .custom-container {
    background: var(--mat-sys-surface);
    border-radius: 16px;
    padding: 24px;
  }
}
```

---

## Migration Guide

### Migrating Existing Dialogs

If you have an existing dialog with component-scoped styles:

**Before**:

```typescript
@Component({
  // ...
  styleUrls: ['./my-dialog.component.scss'],
})
```

**After**:

```typescript
@Component({
  // ...
  // Styles centralized in src/styles/_dialogs.scss via panelClass
})
```

**Steps**:

1. Remove `styleUrls` from component decorator
2. Add `panelClass: ['base-dialog-panel', 'my-dialog-panel']` when opening dialog
3. Move component-specific styles to `src/styles/_dialogs.scss` under `.my-dialog-panel`
4. Remove redundant styles that are already in `.base-dialog-panel`
5. Test the dialog to ensure visual consistency

---

## Best Practices

### ✅ DO

- ✅ Always include `'base-dialog-panel'` in panelClass array for standard dialogs
- ✅ Add specific overrides in `src/styles/_dialogs.scss`
- ✅ Use Material Design 3 theme variables (`--mat-sys-*`)
- ✅ Follow the 8px spacing system (8, 12, 16, 24)
- ✅ Use semantic class names (e.g., `.configurator-dialog-panel`)
- ✅ Document specific overrides with comments
- ✅ Keep styles DRY - don't repeat base styles

### ❌ DON'T

- ❌ Use `::ng-deep` in component styles (use panelClass scoping instead)
- ❌ Hardcode color values (use theme variables)
- ❌ Use `ViewEncapsulation.None` (causes style pollution)
- ❌ Duplicate base styles in specific dialog classes
- ❌ Add component-specific `styleUrls` when base styles suffice
- ❌ Use `!important` unless absolutely necessary
- ❌ Pass panelClass as string (must be array)

---

## Common Patterns Reference

### Pattern: Form-Based Dialog

```typescript
panelClass: ['base-dialog-panel', 'form-dialog-panel'];
```

```scss
.form-dialog-panel {
  /* Inherits all base styles */

  /* Specific: Form layout */
  .form-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
```

### Pattern: Wide Content Dialog

```typescript
panelClass: ['base-dialog-panel', 'wide-dialog-panel'];
```

```scss
.wide-dialog-panel {
  .mat-mdc-dialog-container {
    max-width: 1200px;
  }
}
```

### Pattern: Scrollable Content Dialog

```typescript
panelClass: ['base-dialog-panel', 'scrollable-dialog-panel'];
```

```scss
.scrollable-dialog-panel {
  .mat-mdc-dialog-container {
    max-height: 80vh;
  }

  .mat-mdc-dialog-content {
    overflow-y: auto;
    max-height: calc(80vh - 140px);
  }
}
```

---

## Important Notes

### 1. panelClass Array Order

The order of classes in the array doesn't matter for CSS specificity, but we recommend:

```typescript
panelClass: ['base-dialog-panel', 'specific-dialog-panel', 'theme-class'];
```

### 2. Style Precedence

When multiple classes define the same property, the last defined wins:

```scss
// base-dialog-panel
.form-field {
  margin-bottom: 16px;
}

// specific-dialog-panel (defined later in file)
.form-field {
  margin-bottom: 24px; // This wins
}
```

### 3. Legacy ::ng-deep Usage

For global elements like `.mat-dialog-container`, you still need `::ng-deep`:

```scss
.specific-dialog-panel {
  ::ng-deep .mat-dialog-container {
    max-height: 80vh;
  }
}
```

However, most styling can now be done without `::ng-deep` thanks to better scoping.

---

## Related Files

| File                                                                                           | Purpose                                     |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `src/styles/_dialogs.scss`                                                                     | Centralized dialog styles (base + specific) |
| `docs/dialog-style-isolation-guide.md`                                                         | This document                               |
| `src/app/components/project-map/context-menu/actions/config-action/config-action.component.ts` | Example: configurator dialog usage          |
| `src/app/components/project-map/node-editors/configurator/qemu/configurator-qemu.component.ts` | Example: migrated dialog component          |

---

## Troubleshooting

### Issue: Styles not applying

**Solution**:

1. Check that `panelClass` is an array, not a string
2. Verify class name matches the one in `_dialogs.scss`
3. Check for typos in class names
4. Ensure `_dialogs.scss` is imported in `styles.scss`

### Issue: Specific overrides not working

**Solution**:

1. Ensure specific class is defined **after** base class in `_dialogs.scss`
2. Check CSS specificity - use more specific selectors if needed
3. Verify there are no conflicting styles in component files

### Issue: Inconsistent spacing

**Solution**:

1. Check that base styles are being applied (`base-dialog-panel` in array)
2. Remove component-specific `styleUrls` if they conflict
3. Use browser DevTools to inspect computed styles

---

_Last Updated: 2026-03-26_
