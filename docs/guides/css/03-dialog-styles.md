# Dialog Styles Guide

> Dialog typography and styling standards for GNS3 Web UI

**Last Updated**: 2026-03-26

---

## Typography Standards

### Font Size Rules

| Element | Font Size | Weight | Usage |
|---------|-----------|--------|-------|
| **Dialog Title** | 18px | 500 (medium) | h1, h2 with `[mat-dialog-title]` |
| **Dialog Content** | 14px | normal | Body text, messages, hints |
| **Buttons** | 14px | 500 | Action buttons |

### Implementation

All dialog titles use global styles defined in `src/styles/_dialogs.scss`:

```scss
/* Generic Dialog Title Styles */
h1[mat-dialog-title],
h2[mat-dialog-title] {
  font-size: 18px;
  font-weight: 500;
}
```

---

## Dialog Components

### Complete Dialog List

#### Dialogs with Custom Styles

| Dialog | Path | Notes |
|--------|------|-------|
| Confirmation Dialog | `src/app/components/dialogs/confirmation-dialog/` | Custom container styling |
| AI Profile Dialog | `src/app/components/user-management/user-detail/ai-profile-tab/ai-profile-dialog/` | Complex form layout |
| Confirm Dialog | `src/app/components/user-management/.../confirm-dialog/` | Simple confirmation |
| Template List Dialog | `src/app/components/template/template-list-dialog/` | Table-based content |
| Nodes Menu Confirmation | `src/app/components/project-map/nodes-menu/nodes-menu-confirmation-dialog/` | Compact confirmation |
| Delete All Files Dialog | `src/app/components/image-manager/deleteallfiles-dialog/` | BEM naming |
| Add Image Dialog | `src/app/components/image-manager/add-image-dialog/` | BEM naming |
| Import Project Dialog | `src/app/components/projects/import-project-dialog/` | File upload |
| **Edit Project Dialog** | `src/app/components/projects/edit-project-dialog/` | **Tabbed form, modal-form-container** |
| New Template Dialog | `src/app/components/project-map/new-template-dialog/` | Multi-step wizard |
| Change Hostname Dialog | `src/app/components/project-map/change-hostname-dialog/` | Form input |
| Change Symbol Dialog | `src/app/components/project-map/change-symbol-dialog/` | Symbol selection |
| Info Dialog | `src/app/components/project-map/info-dialog/` | Tabbed content |
| Help Dialog | `src/app/components/project-map/help-dialog/` | Information display |
| Config Dialog | `src/app/components/project-map/context-menu/dialogs/config-dialog/` | File selection |
| Idle PC Dialog | `src/app/components/project-map/context-menu/dialogs/idle-pc-dialog/` | Value selection |
| Screenshot Dialog | `src/app/components/project-map/screenshot-dialog/` | Image capture |
| Appliance Info Dialog | `src/app/components/project-map/new-template-dialog/appliance-info-dialog/` | Appliance details |
| Template Name Dialog | `src/app/components/project-map/new-template-dialog/template-name-dialog/` | Simple input |
| Controller Dialogs | `src/app/components/controllers/` | Edit/Add variants |
| Project Dialogs | `src/app/components/projects/` | Various project operations |
| User Management Dialogs | `src/app/components/user-management/` | Add/Edit/Delete user |
| Role Management Dialogs | `src/app/components/role-management/` | Add/Delete role |
| Group Management Dialogs | `src/app/components/group-management/` | Add/Delete group |
| Resource Pool Dialogs | `src/app/components/resource-pools-management/` | Pool management |
| ACL Management Dialogs | `src/app/components/acl-management/` | ACE management |
| Snapshot Dialogs | `src/app/components/snapshots/` | Create snapshot |
| Progress Dialog | `src/app/components/common/progress-dialog/` | Operation progress |

---

## Styling Patterns

### 1. Global Dialog Styles

All centralized dialog styles are in `src/styles/_dialogs.scss`:

```scss
/* =============================================
// Confirmation Dialog
// ============================================= */
.confirmation-dialog-panel {
  mat-dialog-container,
  .mat-dialog-container {
    background: transparent;
    padding: 0;
    box-shadow: none;
  }
}

/* =============================================
// Edit Controller Dialog
// ============================================= */
.edit-controller-dialog-panel {
  .mat-mdc-dialog-container {
    .mat-mdc-dialog-surface {
      border-radius: 16px;
      box-shadow: 0 12px 40px color-mix(in srgb, var(--mat-sys-shadow) 25%, transparent),
        0 4px 12px color-mix(in srgb, var(--mat-sys-shadow) 12%, transparent);
    }
  }

  .mat-mdc-dialog-title {
    font-size: 18px;
    font-weight: 500;
    color: var(--mat-sys-on-surface);
    margin-bottom: 24px;
    padding: 24px 24px 0 24px;
  }

  .mat-mdc-dialog-content {
    padding: 0 24px;
    margin-bottom: 16px;
  }
}

/* =============================================
// Add Controller Dialog
// ============================================= */
.add-controller-dialog-panel {
  .mat-mdc-dialog-container {
    .mat-mdc-dialog-surface {
      border-radius: 16px;
      box-shadow: 0 12px 40px color-mix(in srgb, var(--mat-sys-shadow) 25%, transparent),
        0 4px 12px color-mix(in srgb, var(--mat-sys-shadow) 12%, transparent);
    }
  }

  .mat-mdc-dialog-title {
    font-size: 18px;
    font-weight: 500;
    color: var(--mat-sys-on-surface);
    margin-bottom: 24px;
    padding: 24px 24px 0 24px;
  }

  .mat-mdc-dialog-content {
    padding: 0 24px;
    margin-bottom: 16px;
  }
}

/* =============================================
// Edit Project Dialog
// ============================================= */
.edit-project-dialog-panel {
  --mat-dialog-container-max-width: 700px;

  mat-dialog-container,
  .mat-mdc-dialog-container {
    width: 700px;
    max-width: 700px;

    .mat-mdc-dialog-surface {
      border-radius: 16px;
      box-shadow: 0 12px 40px color-mix(in srgb, var(--mat-sys-shadow) 25%, transparent),
        0 4px 12px color-mix(in srgb, var(--mat-sys-shadow) 12%, transparent);
    }
  }

  .mat-mdc-dialog-title {
    font-size: 18px;
    font-weight: 500;
    color: var(--mat-sys-on-surface);
    margin-bottom: 24px;
    padding: 24px 24px 0 24px;
  }

  .mat-mdc-dialog-content {
    padding: 0;
    max-height: 600px;
    overflow-y: auto;
  }

  .mat-mdc-dialog-actions {
    padding: 16px 24px;
    justify-content: flex-end;
    gap: 8px;
  }

  /* Modal form container */
  .modal-form-container {
    padding: 16px 24px;
  }

  /* Form styling */
  form {
    margin-top: 16px;
  }

  /* Form fields */
  .form-field {
    width: 100%;
    margin-bottom: 16px;
  }

  /* Checkboxes spacing */
  mat-checkbox {
    display: block;
    margin-bottom: 12px;
  }

  /* Table styles for variables tab */
  table {
    width: 100%;
    margin-top: 16px;
  }

  th.mat-header-cell {
    padding-bottom: 16px;
    border: 0;
  }

  td.mat-cell {
    padding-top: 16px;
  }
}

/* =============================================
// Custom Adapters Dialog
// ============================================= */
.custom-adapters-dialog-panel {
  --mat-dialog-container-max-width: 1000px;

  mat-dialog-container,
  .mat-mdc-dialog-container {
    width: 1000px;
    max-width: 1000px;
  }

  .mat-mdc-dialog-content {
    max-height: 600px;
    overflow-y: auto;
  }
}

/* =============================================
// Generic Dialog Title Styles
// ============================================= */
h1[mat-dialog-title],
h2[mat-dialog-title] {
  font-size: 18px;
  font-weight: 500;
}
```

### 2. Component-Level Dialog Styles

For dialogs with unique requirements, use BEM naming:

```scss
.delete-files {
  &__title {
    font-size: 18px;
    font-weight: 500;
    color: var(--mat-sys-on-surface);
  }

  &__content {
    padding: 0 24px 16px;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px 24px;
    gap: 12px;
  }
}
```

### 3. Material Theme Variables for Dialogs

| Variable | Usage |
|----------|-------|
| `--mat-sys-surface` | Dialog background |
| `--mat-sys-on-surface` | Primary text |
| `--mat-sys-on-surface-variant` | Secondary text |
| `--mat-sys-outline` | Borders |
| `--mat-sys-outline-variant` | Subtle borders |
| `--mat-sys-error` | Error states |
| `--mat-sys-primary` | Primary actions |

---

## Common Patterns

### Dialog with Header and Actions

```html
<div class="dialog-container">
  <h1 mat-dialog-title>Dialog Title</h1>
  <mat-dialog-content>
    <!-- Content here -->
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button>Cancel</button>
    <button mat-raised-button color="primary">Confirm</button>
  </mat-dialog-actions>
</div>
```

### BEM-Structured Dialog

```scss
.my-dialog {
  display: flex;
  flex-direction: column;

  &__title {
    margin: 0;
    padding: 24px 24px 16px;
    font-size: 18px;
    font-weight: 500;
    color: var(--mat-sys-on-surface);
  }

  &__content {
    padding: 0 24px 16px;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px 24px;
    gap: 12px;
  }
}
```

---

## Padding Standards

| Element | Padding/Margin | Notes |
|---------|----------------|-------|
| Dialog container | 0 | Handled by content |
| Dialog title | 24px 24px 0 24px | Only bottom margin needed |
| Dialog content | 0 24px | Horizontal padding only |
| Dialog actions | 16px 24px | Top and horizontal padding |
| **modal-form-container** | **16px 24px** | **Form wrapper with vertical spacing** |
| **form elements** | **margin-top: 16px** | **First form field spacing** |
| **.form-field** | **margin-bottom: 16px** | **Spacing between form fields** |
| **mat-checkbox** | **margin-bottom: 12px** | **Spacing between checkboxes** |
| Form fields | 16px horizontal gap | For inline form layouts |

### Form Spacing Best Practices

When using `modal-form-container` in dialogs:

```scss
// Container with padding
.modal-form-container {
  padding: 16px 24px;  // Vertical 16px, horizontal 24px
}

// Form with top margin
form {
  margin-top: 16px;  // Space for first element
}

// Form fields with bottom margin
.form-field {
  margin-bottom: 16px;  // Space between fields
}

// Checkboxes as block elements
mat-checkbox {
  display: block;
  margin-bottom: 12px;  // Space between checkboxes
}
```

This ensures:
- First form field has 16px spacing from container top
- Consistent spacing between all form elements
- Proper visual hierarchy
- Consistent with Material Design guidelines

---

## Related Documentation

- [CSS Coding Standards](./01-css-coding-standards.md)
- [Material 3 CSS Variables](./02-material3-css-variables.md)
- [Dialog Style Isolation Guide](../dialog-style-isolation-guide.md)

---

*Last Updated: 2026-03-26*
