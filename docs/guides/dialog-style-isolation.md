# Dialog Style Isolation Best Practices

> Centralized Dialog Styling with Component-Specific Overrides

**Last Updated**: 2026-03-27

---

## Revision History

| Date       | Version | Author        | Changes                                                                                                                                                                                                                               |
| ---------- | ------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-27 | 3.0     | Claude Sonnet | - Add actual configurator styles (form-grid, disk-card, etc.)<br>- Add hybrid migration pattern (shared + specific)<br>- Add component-specific styles section (IOS Slots)<br>- Update examples with real implementation              |
| 2026-03-26 | 2.0     | Claude Sonnet | - Add `.base-dialog-panel` architecture<br>- Add inheritance-based styling approach<br>- Add complete base styles reference<br>- Update examples with base + specific pattern                                                         |
| 2026-03-18 | 1.1     | Claude Sonnet | - Add complete `.mat-dialog-container` styles (border, shadow)<br>- Add `.mat-dialog-surface` transparent styling<br>- Add complete ngx-json-viewer CSS variables (13 variables)<br>- Update Step 2 example with full style structure |
| 2026-03-13 | 1.0     | -             | Initial version with basic panelClass usage                                                                                                                                                                                           |

---

## Architecture Overview

GNS3 Web UI uses a **layered dialog styling architecture** to ensure consistency while allowing flexibility:

```
.base-dialog-panel (Base Styles)
    ↓ Inherited
.configurator-dialog-panel (Configurator Overrides)
    ↓ Applied
Dialog Component
    ↓ Component-Specific (if needed)
Local Styles (e.g., IOS Slots)
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
  mat-dialog-container,
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
          padding-top: 16px;
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

## Configurator Dialog Styles

The `.configurator-dialog-panel` class provides specific styles for node configuration dialogs. It's defined in `src/styles/_dialogs.scss`.

### Actual Implementation (from \_dialogs.scss)

```scss
.configurator-dialog-panel {
  --mat-dialog-container-max-width: 800px;

  mat-dialog-container,
  .mat-mdc-dialog-container {
    width: 800px;
    max-width: 800px;
    max-height: 80vh;

    .mat-mdc-dialog-surface {
      border-radius: 16px;
    }
  }

  /* Dialog content - with max-height for scroll */
  .mat-mdc-dialog-content {
    max-height: calc(80vh - 140px);
  }

  /* Tab content - add spacing below tab labels */
  mat-tab-group {
    .mat-mdc-tab-body-wrapper {
      .mat-mdc-tab-body {
        .mat-mdc-tab-body-content {
          padding-top: 16px;
        }
      }
    }
  }

  /* Modal form container padding */
  .modal-form-container {
    padding: 16px 24px;
  }

  /* Two-column form layout */
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 24px;
  }

  .form-grid__full {
    grid-column: 1 / -1;
  }

  /* Tags field */
  .tags-field {
    width: 100%;
  }

  /* File upload button */
  .file-button {
    width: 18%;
  }

  .file-name-form-field {
    padding-left: 2%;
    width: 80%;
  }

  /* Create button */
  .create-button {
    width: 100%;
  }

  /* Hidden file input */
  .nonvisible {
    display: none;
  }

  /* HDD create button section */
  .hdd-create-section {
    margin-bottom: 16px;
  }

  /* Custom adapters button section - centered */
  .custom-adapters-section {
    display: flex;
    justify-content: center;
    margin: 16px 0;
  }

  /* File upload section */
  .file-upload-section {
    .file-upload-hint {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      margin: 4px 0 0 0;
    }
  }

  /* Disk cards grid layout - two columns */
  .disk-cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  /* Card stack - single column layout */
  .card-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .disk-card {
    border: 1px solid var(--mat-sys-outline-variant);
    border-radius: 12px;
    padding: 16px;
    background: var(--mat-sys-surface-container-low);
    transition: background-color 0.2s ease;

    &:hover {
      background: var(--mat-sys-surface-container);
    }
  }

  .disk-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .disk-card__title {
    font-size: 16px;
    font-weight: 500;
    color: var(--mat-sys-on-surface);
    margin: 0;
  }

  .disk-card__badge {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    background: var(--mat-sys-primary-container);
    color: var(--mat-sys-on-primary-container);
    font-weight: 500;
  }

  .disk-card__content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
```

---

## Usage Patterns

### Pattern 1: Base Styles Only

For simple dialogs that only need standard styling:

```typescript
this.dialog.open(SimpleDialogComponent, {
  panelClass: ['base-dialog-panel'],
});
```

**Result**: Dialog gets all base styles without any customization.

---

### Pattern 2: Base Styles + Configurator Overrides

For configuration dialogs (QEMU, IOS, Docker, etc.):

```typescript
// QEMU - Fully migrated to centralized styles
this.dialogRef = this.dialog.open(ConfiguratorDialogQemuComponent, {
  panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
  autoFocus: false,
  disableClose: false,
});

// IOS - Uses shared configurator styles + component-specific styles
this.dialogRef = this.dialog.open(ConfiguratorDialogIosComponent, {
  panelClass: 'configurator-dialog-panel', // Note: no base-dialog-panel
  autoFocus: false,
  disableClose: false,
});
```

**Result**: Dialog inherits configurator-specific styles.

---

### Pattern 3: Hybrid Approach - Shared + Component-Specific

For dialogs with shared styles plus component-specific features:

**Example: IOS Configurator Dialog**

```typescript
// configurator-ios.component.ts
@Component({
  standalone: true,
  selector: 'app-configurator-ios',
  templateUrl: './configurator-ios.component.html',
  // Hybrid: shared configurator styles + component-specific Slots styles
  styleUrls: ['../configurator.component.scss', './configurator-ios.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguratorDialogIosComponent {}
```

**Shared Styles** (`configurator.component.scss`):

```scss
// Styles shared across all configurators (IOS, Docker, Ethernet switch, etc.)
table {
  width: 100%;
}
.form-field {
  width: 100%;
}
.tags-field {
  width: 100%;
}
.nonvisible {
  display: none;
}
// ... other shared styles
```

**Component-Specific Styles** (`configurator-ios.component.scss`):

```scss
/**
 * IOS-SPECIFIC FUNCTIONALITY:
 * These styles are specific to IOS router Slots (network adapters) and WICs modules.
 * Other node types do not have this functionality.
 */

.ios-configurator__slots-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.ios-configurator__slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
// ... other IOS-specific styles
```

**When to use hybrid approach**:

- ✅ Component has unique functionality (e.g., IOS Slots)
- ✅ Multiple components share common styles
- ✅ Component-specific styles are substantial

---

## Component Implementation

### Real-World Examples

#### Example 1: QEMU Configurator (Fully Migrated)

**Opening the dialog** (`config-action.component.ts`):

```typescript
if (node.node_type === 'qemu') {
  this.dialogRef = this.dialog.open(ConfiguratorDialogQemuComponent, {
    panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
    autoFocus: false,
    disableClose: false,
  });
}
```

**Component definition** (`configurator-qemu.component.ts`):

```typescript
@Component({
  standalone: true,
  selector: 'app-configurator-qemu',
  templateUrl: './configurator-qemu.component.html',
  // Styles centralized in src/styles/_dialogs.scss via panelClass
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    /* ... */
  ],
})
export class ConfiguratorDialogQemuComponent {}
```

**Template usage** (`configurator-qemu.component.html`):

```html
<!-- Uses centralized styles: form-grid, disk-card, etc. -->
<div class="form-grid">
  <mat-form-field class="form-field">
    <mat-label>Platform</mat-label>
    <mat-select formControlName="platform">...</mat-select>
  </mat-form-field>

  <mat-form-field class="form-field">
    <mat-label>RAM</mat-label>
    <input matInput type="number" formControlName="ram" />
  </mat-form-field>
</div>

<div class="disk-cards-grid">
  <div class="disk-card">
    <div class="disk-card__header">
      <h3 class="disk-card__title">HDA</h3>
    </div>
    <div class="disk-card__content">
      <!-- Card content -->
    </div>
  </div>
</div>
```

---

#### Example 2: IOS Configurator (Hybrid Approach)

**Opening the dialog** (`config-action.component.ts`):

```typescript
if (node.node_type === 'dynamips') {
  this.dialogRef = this.dialog.open(ConfiguratorDialogIosComponent, this.conf);
  // this.conf = { panelClass: 'configurator-dialog-panel', ... }
}
```

**Component definition** (`configurator-ios.component.ts`):

```typescript
@Component({
  standalone: true,
  selector: 'app-configurator-ios',
  templateUrl: './configurator-ios.component.html',
  // Hybrid: shared configurator + IOS-specific Slots styles
  styleUrls: ['../configurator.component.scss', './configurator-ios.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    /* ... */
  ],
})
export class ConfiguratorDialogIosComponent {}
```

**Template usage** (`configurator-ios.component.html`):

```html
<!-- Uses centralized styles: form-grid, disk-card, etc. -->
<div class="form-grid">
  <mat-form-field class="form-field">
    <mat-label>Console type</mat-label>
    <mat-select formControlName="console_type">...</mat-select>
  </mat-form-field>
</div>

<!-- Uses IOS-specific styles -->
<div class="ios-configurator__slots-section">
  <div class="ios-configurator__slots-group">
    <h6 class="ios-configurator__slots-title">Network Adapters</h6>
    <div class="ios-configurator__slots-grid">
      @for (index of [0, 1, 2, 3, 4, 5, 6]; track index) {
      <mat-form-field class="form-field">
        <mat-label>Slot {{ index }}</mat-label>
        <mat-select [formControlName]="'slot' + index">...</mat-select>
      </mat-form-field>
      }
    </div>
  </div>
</div>
```

---

## Migration Guide

### Migration Approaches

#### Approach 1: Full Migration (Recommended for New Components)

**Best for**: New dialogs or dialogs with minimal custom styles

**Steps**:

1. Remove all `styleUrls` from component decorator
2. Add `panelClass: ['base-dialog-panel', 'my-dialog-panel']` when opening dialog
3. Move all styles to `src/styles/_dialogs.scss` under `.my-dialog-panel`
4. Remove redundant styles that are already in `.base-dialog-panel` or `.configurator-dialog-panel`

**Before**:

```typescript
@Component({
  templateUrl: './my-dialog.component.html',
  styleUrls: ['./my-dialog.component.scss'],
})
```

**After**:

```typescript
@Component({
  templateUrl: './my-dialog.component.html',
  // Styles centralized in src/styles/_dialogs.scss via panelClass
})
```

---

#### Approach 2: Hybrid Migration (Best for Complex Components)

**Best for**: Components with substantial shared styles or unique functionality

**Steps**:

1. Identify shared styles across multiple components
2. Extract shared styles to a common file (e.g., `configurator.component.scss`)
3. Keep component-specific styles in local file
4. Use both shared and local styleUrls

**Example**:

```typescript
@Component({
  templateUrl: './my-dialog.component.html',
  // Hybrid: shared configurator + component-specific
  styleUrls: ['../configurator.component.scss', './my-dialog.component.scss'],
})
```

**When to use hybrid approach**:

- ✅ Component has unique functionality not shared with others
- ✅ Multiple components share common styles
- ✅ Full migration would require duplicating styles
- ✅ Component-specific styles are substantial and self-contained

---

### Migration Decision Tree

```
Does the dialog have unique functionality?
├─ No → Use Approach 1 (Full Migration)
└─ Yes → Does it share styles with other dialogs?
    ├─ No → Use Approach 1 (Full Migration)
    └─ Yes → Use Approach 2 (Hybrid Migration)
```

**Examples**:

- **QEMU Configurator** → Approach 1 (no unique functionality)
- **IOS Configurator** → Approach 2 (unique Slots functionality)
- **Docker Configurator** → Approach 2 (shares styles with IOS, etc.)

---

## Best Practices

### ✅ DO

- ✅ Always include `'base-dialog-panel'` in panelClass for standard dialogs
- ✅ Add specific overrides in `src/styles/_dialogs.scss`
- ✅ Use Material Design 3 theme variables (`--mat-sys-*`)
- ✅ Follow the 8px spacing system (8, 12, 16, 24)
- ✅ Use semantic class names (e.g., `.configurator-dialog-panel`)
- ✅ Document specific overrides with comments
- ✅ Keep styles DRY - don't repeat base styles
- ✅ Use hybrid approach when component has substantial unique functionality
- ✅ Document component-specific styles with clear comments

### ❌ DON'T

- ❌ Use `::ng-deep` in component styles (use panelClass scoping instead)
- ❌ Hardcode color values (use theme variables)
- ❌ Use `ViewEncapsulation.None` (causes style pollution)
- ❌ Duplicate base styles in specific dialog classes
- ❌ Use `!important` unless absolutely necessary
- ❌ Pass panelClass as string (must be array)
- ❌ Migrate to hybrid approach when full migration is sufficient
- ❌ Keep component-specific styles if they're only used once

---

## Style Naming Conventions

### Centralized Styles (\_dialogs.scss)

| Pattern                         | Usage                      | Example                       |
| ------------------------------- | -------------------------- | ----------------------------- |
| `.base-dialog-panel`            | All dialogs inherit this   | Base typography, spacing      |
| `.configurator-dialog-panel`    | Node configuration dialogs | form-grid, disk-card          |
| `.simple-dialog-panel`          | Simple sub-dialogs         | Image creator                 |
| `.custom-adapters-dialog-panel` | Specific feature dialog    | Custom adapters configuration |

### Component-Specific Styles

| Pattern                   | Usage                         | Example            |
| ------------------------- | ----------------------------- | ------------------ |
| `.ios-configurator__*`    | IOS-specific functionality    | Slots, WICs        |
| `.docker-configurator__*` | Docker-specific functionality | Container settings |

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

### Pattern: Two-Column Form Layout (from configurator)

```html
<div class="form-grid">
  <mat-form-field class="form-field">Field 1</mat-form-field>
  <mat-form-field class="form-field">Field 2</mat-form-field>
  <mat-checkbox class="form-grid__full">Full width checkbox</mat-checkbox>
</div>
```

```scss
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 24px;
}

.form-grid__full {
  grid-column: 1 / -1;
}
```

### Pattern: Card Layout (from configurator)

```html
<div class="disk-cards-grid">
  <div class="disk-card">
    <div class="disk-card__header">
      <h3 class="disk-card__title">Card Title</h3>
    </div>
    <div class="disk-card__content">
      <!-- Card content -->
    </div>
  </div>
</div>
```

```scss
.disk-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.disk-card {
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: 12px;
  padding: 16px;
  background: var(--mat-sys-surface-container-low);
}
```

---

## Troubleshooting

### Issue: Styles not applying

**Solution**:

1. Check that `panelClass` is an array, not a string
2. Verify class name matches the one in `_dialogs.scss`
3. Check for typos in class names
4. Ensure `_dialogs.scss` is imported in `styles.scss`

### Issue: Component-specific styles not working

**Solution**:

1. Verify `styleUrls` path is correct
2. Check that local styles use BEM naming to avoid conflicts
3. Ensure local styles don't use `::ng-deep` without proper scoping
4. Check browser DevTools for style conflicts

### Issue: Shared styles not applying

**Solution**:

1. Verify shared style file is included in `styleUrls`
2. Check that shared styles use generic class names
3. Ensure shared styles don't have component-specific prefixes

---

## Related Files

| File                                                                                           | Purpose                                       |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `src/styles/_dialogs.scss`                                                                     | Centralized dialog styles (base + specific)   |
| `docs/dialog-style-isolation-guide.md`                                                         | This document                                 |
| `src/app/components/project-map/context-menu/actions/config-action/config-action.component.ts` | Example: configurator dialog usage            |
| `src/app/components/project-map/node-editors/configurator/qemu/configurator-qemu.component.ts` | Example: fully migrated dialog                |
| `src/app/components/project-map/node-editors/configurator/ios/configurator-ios.component.ts`   | Example: hybrid migration (shared + specific) |
| `src/app/components/project-map/node-editors/configurator/configurator.component.scss`         | Shared configurator styles                    |
| `src/app/components/project-map/node-editors/configurator/ios/configurator-ios.component.scss` | IOS-specific Slots styles                     |

---

_Last Updated: 2026-03-27_
