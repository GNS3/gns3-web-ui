# Angular Material Modules Usage Documentation

> Angular Material modules usage in GNS3 Web UI project

**Version**: 1.0
**Last Updated**: 2026-03-18
**Status**: ✅ Active

---

## Table of Contents

1. [Quick Overview](#1-quick-overview)
2. [Available Modules](#2-available-modules)
3. [Module Usage Statistics](#3-module-usage-statistics)
4. [Component Usage Mapping](#4-component-usage-mapping)
5. [Module Reference](#5-module-reference)
6. [Best Practices](#6-best-practices)

---

## 1. Quick Overview

### Summary

- **Total Modules Available**: 24 modules
- **Total Modules Configured in Theme**: 25 modules (includes sidenav, button-toggle, etc.)
- **Most Used Module**: MatDialog (107 occurrences)
- **Color Scheme**:
  - Primary: Cyan 700 (`#0097a7`)
  - Accent: Blue Grey A200 (`#00bcd4`)
  - Dark Background: Blue Grey 900 (`#263238`)

---

## 2. Available Modules

### 2.1 Imported Modules (24)

All modules are imported in `src/app/material.imports.ts`:

| Module | File | Description |
|--------|------|-------------|
| MatButtonModule | @angular/material/button | Buttons & form buttons |
| MatBottomSheetModule | @angular/material/bottom-sheet | Bottom sheet panels |
| MatCardModule | @angular/material/card | Card containers |
| MatCheckboxModule | @angular/material/checkbox | Checkboxes |
| MatChipsModule | @angular/material/chips | Chip elements |
| MatDialogModule | @angular/material/dialog | Dialog windows |
| MatExpansionModule | @angular/material/expansion | Accordion panels |
| MatFormFieldModule | @angular/material/form-field | Form field wrappers |
| MatGridListModule | @angular/material/grid-list | Grid layouts |
| MatIconModule | @angular/material/icon | Material icons |
| MatInputModule | @angular/material/input | Input fields |
| MatListModule | @angular/material/list | Lists |
| MatMenuModule | @angular/material/menu | Context menus |
| MatPaginatorModule | @angular/material/paginator | Table pagination |
| MatProgressBarModule | @angular/material/progress-bar | Progress bars |
| MatProgressSpinnerModule | @angular/material/progress-spinner | Loading spinners |
| MatRadioModule | @angular/material/radio | Radio buttons |
| MatSelectModule | @angular/material/select | Dropdown selects |
| MatSnackBarModule | @angular/material/snack-bar | Toast notifications |
| MatSortModule | @angular/material/sort | Table sorting |
| MatStepperModule | @angular/material/stepper | Wizards/steppers |
| MatTableModule | @angular/material/table | Data tables |
| MatTabsModule | @angular/material/tabs | Tab navigation |
| MatToolbarModule | @angular/material/toolbar | Toolbars |
| MatTooltipModule | @angular/material/tooltip | Tooltips |
| MatTreeModule | @angular/material/tree | Tree structures |

---

## 3. Module Usage Statistics

### 3.1 Top Used Modules

| Rank | Module | Usage Count | Percentage |
|------|--------|-------------|------------|
| 1 | MatDialog | 107 | 23.8% |
| 2 | MatIcon | 71 | 15.8% |
| 3 | MatMenu | 63 | 14.0% |
| 4 | MatCheckbox | 56 | 12.5% |
| 5 | MatToolbar | 53 | 11.8% |
| 6 | MatChips | 21 | 4.7% |
| 7 | MatTable | 18 | 4.0% |
| 8 | MatSnackBar | 18 | 4.0% |
| 9 | MatInput | 16 | 3.6% |
| 10 | MatFormField | 16 | 3.6% |

### 3.2 Usage Distribution

```
Dialog (107)  ████████████████████████████████ 23.8%
Icon (71)     ███████████████████ 15.8%
Menu (63)     ██████████████████ 14.0%
Checkbox (56) ████████████████ 12.5%
Toolbar (53)  ███████████████ 11.8%
Chips (21)    ████ 4.7%
Table (18)    ███ 4.0%
SnackBar (18) ███ 4.0%
Input (16)    ███ 3.6%
FormField (16) ███ 3.6%
Others (107)  ████████████████████ 23.8%
```

---

## 4. Component Usage Mapping

### 4.1 Main Windows & Panels

| Component/Window | Path | Material Modules Used |
|------------------|------|----------------------|
| **Project Map** | `project-map/` | MatDialog, MatBottomSheet |
| **AI Chat** | `project-map/ai-chat/` | MatSnackBar, MatIconModule, MatInputModule, MatFormFieldModule, MatButtonModule |
| **Preferences** | `preferences/` | MatDialog, MatCheckbox, MatInput, MatFormField, MatSelect, MatTabs |
| **Projects List** | `projects/` | MatDialog, MatBottomSheet, MatSort, MatMenu |
| **Bundle Console** | `bundle-console/` | MatDialog, MatToolbar |
| **Web Console** | `project-map/web-console/` | MatIcon, MatDialog |
| **Symbol Selection** | `template/` | MatDialog, MatMenu, MatCheckbox |

### 4.2 Common Components

| Component | Path | Material Modules Used |
|-----------|------|----------------------|
| **Confirmation Dialog** | `dialogs/` | MatDialog |
| **Context Menu** | `project-map/context-menu/` | MatMenu, MatIcon, MatCheckbox |
| **Add Blank Project** | `projects/` | MatDialog, MatFormField, MatInput |
| **Edit Project** | `projects/` | MatDialog, MatFormField, MatInput, MatCheckbox |
| **Import Project** | `projects/` | MatDialog, MatFormField, MatInput, MatCheckbox |
| **Navigation Dialog** | `projects/` | MatDialog |
| **Save Project** | `projects/` | MatDialog |
| **Settings** | `settings/` | MatDialog, MatTabs, MatCheckbox, MatSelect, MatInput |

### 4.3 Preferences Components

| Component | Module Used |
|-----------|-------------|
| **Built-in Preferences** | MatTabs, MatCheckbox, MatInput |
| **Cloud Nodes** | MatDialog, MatFormField, MatInput |
| **Ethernet Hubs** | MatDialog, MatFormField, MatInput |
| **Ethernet Switches** | MatDialog, MatFormField, MatInput |
| **IOS Configuration** | MatDialog, MatTabs, MatInput |
| **Docker VM Templates** | MatDialog, MatFormField, MatInput |
| **Custom Adapters** | MatDialog, MatFormField, MatInput, MatTable |

### 4.4 AI Chat Components

| Component | Material Modules Used |
|-----------|----------------------|
| **ai-chat.component** | MatSnackBar |
| **chat-input-area** | MatFormField, MatInput, MatIcon, MatButtonModule |
| **chat-session-list** | MatIcon, MatMenu, MatDialog |
| **chat-message-list** | MatIconModule (for markdown content) |
| **tool-details-dialog** | MatDialog |

---

## 5. Module Reference

### 5.1 Dialog (MatDialog)

**Usage Count**: 107 (most used)

**Primary Uses**:
- Project settings dialogs
- Confirmation dialogs
- Template management
- Preferences panels
- Node configuration

**Example Locations**:
- `src/app/components/dialogs/`
- `src/app/components/preferences/`
- `src/app/components/projects/`

**Theme Configured**: ✅ Yes (`@include mat-dialog-theme`)

---

### 5.2 Icon (MatIcon)

**Usage Count**: 71

**Primary Uses**:
- Toolbar icons
- Button icons
- Status indicators
- Menu items
- Action buttons

**Icon Font**: Material Design Icons (Google)

**Theme Configured**: ✅ Yes (`@include mat-icon-theme`)

---

### 5.3 Menu (MatMenu)

**Usage Count**: 63

**Primary Uses**:
- Context menus (right-click)
- Dropdown menus
- Action menus
- Session list actions (AI Chat)

**Custom Styling**:
- Red hover effect (`#DC143C`)
- Custom height (32px)

**Theme Configured**: ✅ Yes (`@include mat-menu-theme`)

---

### 5.4 Checkbox (MatCheckbox)

**Usage Count**: 56

**Primary Uses**:
- Settings toggles
- Multi-select operations
- Preferences options
- Feature flags

**Theme Configured**: ✅ Yes (`@include mat-checkbox-theme`)

---

### 5.5 Toolbar (MatToolbar)

**Usage Count**: 53

**Primary Uses**:
- Main application toolbar
- Console toolbars
- Dialog headers
- Panel headers

**Theme Configured**: ✅ Yes (`@include mat-toolbar-theme`)

**Custom Colors**:
- Dark: Blue Grey 900 (`#263238`)
- Light: Blue 900 (`#0d47a1`)

---

### 5.6 Table (MatTable)

**Usage Count**: 18

**Primary Uses**:
- Custom adapters list
- Template lists
- Projects list
- Statistics display

**Related Modules**:
- MatSort (12)
- MatPaginator (3)

**Theme Configured**: ✅ Yes (`@include mat-table-theme`)

---

### 5.7 Snack Bar (MatSnackBar)

**Usage Count**: 18

**Primary Uses**:
- Error messages
- Success notifications
- Warning alerts
- Info messages

**Custom Styles**:
- `.snackabar-success` (Cyan)
- `.snackbar-error` (Red)
- `.snackbar-warning` (Yellow)
- `.uplaoding-file-snackabar` (Dark)

**Theme Configured**: ✅ Yes (`@include mat-snack-bar-theme`)

---

### 5.8 Input & Form Field

**Usage Count**: 16 each

**Primary Uses**:
- Text input fields
- Number inputs
- Password fields
- Search boxes
- Configuration forms

**Theme Configured**: ✅ Yes
- `@include mat-input-theme`
- `@include mat-form-field-theme`

---

### 5.9 Less Used Modules

| Module | Count | Primary Use Case |
|--------|-------|------------------|
| MatSelect | 8 | Dropdown selections |
| MatButtonModule | 7 | Standalone buttons |
| MatStepper | 5 | Multi-step wizards |
| MatAutocomplete | 5 | Search suggestions |
| MatDivider | 4 | Visual separators |
| MatTooltip | 3 | Hover help text |
| MatProgressSpinner | 3 | Loading indicators |
| MatPaginator | 3 | Table pagination |
| MatTabs | 2 | Tabbed interfaces |
| MatCard | 2 | Content containers |
| MatRadio | 1 | Single choice |
| MatExpansion | 1 | Accordion panels |

---

## 6. Best Practices

### 6.1 Importing Material Modules

**✅ Recommended**:
```typescript
// Import from central file
import { MATERIAL_IMPORTS } from '@app/material.imports';

@NgModule({
  imports: [
    MATERIAL_IMPORTS,  // Import all at once
    // ... other imports
  ]
})
export class AppModule { }
```

**❌ Avoid**:
```typescript
// Importing individually in each component
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';
// ... too many imports
```

---

### 6.2 Theme Configuration

**All modules are themed in** `src/theme.scss`:

```scss
.dark-theme {
  @include angular-material-theme($dark-theme);
  @include mat-all-component-themes($dark-theme);
}

.light-theme {
  @include angular-material-theme($light-theme);
  @include mat-all-component-themes($light-theme);
}
```

**Adding a new module?** Update both:
1. Add to `MATERIAL_IMPORTS` in `material.imports.ts`
2. Add `@include mat-xxx-theme()` in `theme.scss`

---

### 6.3 Common Patterns

### Dialog Pattern

```typescript
constructor(private dialog: MatDialog) {}

openDialog() {
  const dialogRef = this.dialog.open(MyDialogComponent, {
    width: '800px',
    data: { /* data */ },
    panelClass: ['my-dialog-class', 'dark-theme']  // Add theme class
  });

  dialogRef.afterClosed().subscribe(result => {
    // Handle result
  });
}
```

### Snack Bar Pattern

```typescript
constructor(private snackBar: MatSnackBar) {}

showMessage(message: string) {
  this.snackBar.open(message, 'Close', {
    duration: 3000,
    panelClass: ['snackbar-success']
  });
}
```

### Icon Pattern

```typescript
// In template
<mat-icon>home</mat-icon>
<mat-icon svgIcon="custom-icon"></mat-icon>

// Register custom icons
constructor(private matIconRegistry: MatIconRegistry,
            private domSanitizer: DomSanitizer) {
  this.matIconRegistry.addSvgIcon(
    'custom-icon',
    this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icon.svg')
  );
}
```

---

### 6.4 AI Chat Specific Notes

**CSS Variables Used** (16 variables):

AI Chat components use Material Design CSS variables:
- `--mat-app-on-surface` (text color)
- `--mat-app-background` (background)
- `--mat-app-primary` (primary color)
- `--mat-app-surface-container` (container background)
- etc.

**Theme Independence**:
AI Chat follows global theme setting, not map background theme.

---

## 7. Migration Notes

### Legacy Material (pre-v15)

This project uses **Angular Material v15+** with MDC (Material Design Components for Web).

**Old syntax** (deprecated):
```scss
@include mat-theme($theme);
```

**Current syntax**:
```scss
@include angular-material-theme($theme);
@include mat-core-theme($theme);
@include mat-all-component-themes($theme);
```

---

## 8. Maintenance

### Adding New Material Modules

1. **Add to imports** (`src/app/material.imports.ts`):
```typescript
import { MatNewModule } from '@angular/material/new';
```

2. **Add to exports**:
```typescript
export const MATERIAL_IMPORTS = [
  // ... existing modules
  MatNewModule,
];
```

3. **Add to theme** (`src/theme.scss`):
```scss
.dark-theme {
  @include mat-new-theme($dark-theme);
}

.light-theme {
  @include mat-new-theme($light-theme);
}
```

### Removing Unused Modules

1. Check usage count with:
```bash
grep -r "MatUnusedModule" src/app/components
```

2. If unused, remove from:
   - `material.imports.ts`
   - `theme.scss` (optional)

---

## 9. Troubleshooting

### Common Issues

**Issue**: Styles not applying to Material components

**Solution**: Ensure theme class is applied to parent element:
```typescript
panelClass: ['my-dialog', 'dark-theme']  // or 'light-theme'
```

**Issue**: Icons not displaying

**Solution**: Check font import in `theme.scss`:
```scss
@import '~material-design-icons/iconfont/material-icons.css';
```

**Issue**: Wrong colors in AI Chat

**Solution**: Verify AI Chat container has theme class:
```html
<div class="ai-chat-container dark-theme">
  <!-- or light-theme -->
</div>
```

---

## 10. Resources

### Official Documentation
- [Angular Material Documentation](https://material.angular.io/)
- [Material Design Guidelines](https://material.io/design)
- [Component API](https://material.angular.io/components)

### Project Specific
- **Theme File**: `src/theme.scss`
- **Imports File**: `src/app/material.imports.ts`
- **AI Chat Styles**: `src/app/components/project-map/ai-chat/`

---

**Document End**

For questions or updates, please contact the development team.
