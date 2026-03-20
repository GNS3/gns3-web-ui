# Dialog Style Isolation Best Practices

> Using panelClass to Prevent Dialog Style Pollution

**Last Updated**: 2026-03-18

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-18 | 1.1 | Claude Sonnet | - Add complete `.mat-dialog-container` styles (border, shadow)<br>- Add `.mat-dialog-surface` transparent styling<br>- Add complete ngx-json-viewer CSS variables (13 variables)<br>- Update Step 2 example with full style structure |
| 2026-03-13 | 1.0 | - | Initial version with basic panelClass usage |

---

## Problem Background

When using Angular Material Dialog, if you need to set global styles (like `.mat-dialog-container`) using `::ng-deep` in a component, these styles will **affect all dialogs opened through MatDialog**, causing style pollution.

### Affected Global Elements

- `.mat-dialog-container` - Dialog container
- `.mat-dialog-surface` - Dialog surface
- Third-party component variables (e.g., `ngx-json-viewer` CSS variables)

---

## Solution: Using panelClass

Angular Material Dialog provides a `panelClass` configuration option that allows adding custom class names to the dialog container. We can use this class name to scope the styles.

### Step 1: Pass panelClass When Opening Dialog

```typescript
// When calling dialog.open(), pass panelClass
const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';

this.dialog.open(YourDialogComponent, {
  data,
  width: '800px',
  panelClass: ['your-dialog-class', themeClass]  // Add custom class name
});
```

### Step 2: Scope Styles Using panelClass in Component

```scss
// ❌ Wrong: Pollutes global scope
::ng-deep .mat-dialog-container {
  border-radius: 16px;
}

// ✅ Correct: Scope using panelClass
::ng-deep .your-dialog-class .mat-dialog-container {
  border-radius: 16px;
  border: 1px solid var(--mat-app-outline-variant);
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
}

// Make dialog surface transparent (optional, for custom styling)
::ng-deep .your-dialog-class .mat-dialog-container .mat-dialog-surface {
  background-color: transparent !important;
}

// With theme class
::ng-deep .your-dialog-class.dark-theme .mat-dialog-container {
  background-color: rgba(32, 49, 59, 1) !important;
}

::ng-deep .your-dialog-class.light-theme .mat-dialog-container {
  background-color: rgba(250, 250, 250, 1) !important;
}

// Third-party component variable isolation
::ng-deep .your-dialog-class.dark-theme .json-container {
  --ngx-json-string: #a5d6ff;
  --ngx-json-number: #79c0ff;
  /* ... other variables ... */
}
```

---

## Complete Example

### Dialog Opener

```typescript
// chat-message-list.component.ts
import { ThemeService } from '@services/theme.service';

constructor(
  private dialog: MatDialog,
  private themeService: ThemeService
) {}

openToolDetailsDialog(): void {
  const theme = this.themeService.getActualTheme();
  const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';

  this.dialog.open(ToolDetailsDialogComponent, {
    data: { /* ... */ },
    width: '800px',
    panelClass: ['tool-details-dialog', themeClass]
  });
}
```

### Dialog Component Styles

```typescript
// tool-details-dialog.component.ts
@Component({
  selector: 'app-tool-details-dialog',
  template: `...`,
  styles: [`
    /* Dialog container styles - scoped using panelClass */
    ::ng-deep .tool-details-dialog .mat-dialog-container {
      border-radius: 16px !important;
      border: 1px solid var(--mat-app-outline-variant);
      /* Performance optimized: removed backdrop-filter */
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 151, 167, 0.15) !important;
    }

    /* Make dialog surface transparent - scoped using panelClass */
    ::ng-deep .tool-details-dialog .mat-dialog-container .mat-dialog-surface {
      background-color: transparent !important;
    }

    /* Dark theme styling - fully opaque backgrounds */
    ::ng-deep .tool-details-dialog.dark-theme .mat-dialog-container {
      background-color: rgba(32, 49, 59, 1) !important;
    }

    /* Light theme styling - fully opaque backgrounds */
    ::ng-deep .tool-details-dialog.light-theme .mat-dialog-container {
      background-color: rgba(250, 250, 250, 1) !important;
    }

    /* Dark theme ngx-json-viewer variables - scoped */
    ::ng-deep .tool-details-dialog.dark-theme .json-container {
      --ngx-json-string: #a5d6ff;
      --ngx-json-number: #79c0ff;
      --ngx-json-boolean: #ff7b72;
      --ngx-json-date: #d29922;
      --ngx-json-array: #ffa657;
      --ngx-json-object: #7ee787;
      --ngx-json-function: #fff;
      --ngx-json-null: #8b949e;
      --ngx-json-null-bg: rgba(235, 235, 235, 0.1);
      --ngx-json-undefined: #f28179;
      --ngx-json-key: #7ee787;
      --ngx-json-separator: #8b949e;
      --ngx-json-value: var(--mat-app-on-surface);
    }

    /* Light theme ngx-json-viewer variables - scoped */
    ::ng-deep .tool-details-dialog.light-theme .json-container {
      --ngx-json-string: #0451a5;
      --ngx-json-number: #098658;
      --ngx-json-boolean: #0000ff;
      --ngx-json-date: #795e26;
      --ngx-json-array: #a31515;
      --ngx-json-object: #098658;
      --ngx-json-function: #795e26;
      --ngx-json-null: #808080;
      --ngx-json-null-bg: rgba(0, 0, 0, 0.04);
      --ngx-json-undefined: #a31515;
      --ngx-json-key: #0451a5;
      --ngx-json-separator: #808080;
      --ngx-json-value: var(--mat-app-on-surface);
    }
  `]
})
export class ToolDetailsDialogComponent {}
```

---

## Important Notes

### 1. panelClass is an Array

```typescript
// ✅ Correct: Pass as array
panelClass: ['dialog-class', 'dark-theme']

// ❌ Wrong: Pass as string (only supports single class name)
panelClass: 'dialog-class dark-theme'
```

### 2. ::ng-deep is Still Required

Even with panelClass scoping, since `.mat-dialog-container` is an external element of Material Dialog (on `<mat-dialog-container>`), you still need to use `::ng-deep` to penetrate the styles.

### 3. Selector Order

```scss
// ❌ Wrong: Incorrect selector order
::ng-deep .dark-theme.tool-details-dialog .mat-dialog-container { }

// ✅ Correct: panelClass first, theme class second
::ng-deep .tool-details-dialog.dark-theme .mat-dialog-container { }
```

---

## Related Files

- `src/app/components/project-map/ai-chat/tool-details-dialog.component.ts`
- `src/app/components/project-map/ai-chat/chat-message-list.component.ts`

---

*Last Updated: 2026-03-18*
