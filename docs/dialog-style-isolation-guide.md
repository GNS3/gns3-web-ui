# Dialog Style Isolation Best Practices

> Using panelClass to Prevent Dialog Style Pollution

**Last Updated**: 2026-03-13

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
}

// With theme class
::ng-deep .your-dialog-class.dark-theme .mat-dialog-container {
  background-color: rgba(30, 41, 55, 0.75);
}

::ng-deep .your-dialog-class.light-theme .mat-dialog-container {
  background-color: rgba(255, 255, 255, 0.85);
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
      backdrop-filter: blur(16px) saturate(180%) !important;
    }

    /* Theme-specific styles */
    ::ng-deep .tool-details-dialog.dark-theme .mat-dialog-container {
      background-color: rgba(30, 41, 55, 0.75) !important;
    }

    ::ng-deep .tool-details-dialog.light-theme .mat-dialog-container {
      background-color: rgba(255, 255, 255, 0.85) !important;
    }

    /* Third-party component variable isolation */
    ::ng-deep .tool-details-dialog.dark-theme .json-container {
      --ngx-json-string: #a5d6ff;
      --ngx-json-number: #79c0ff;
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

*Last Updated: 2026-03-13*
