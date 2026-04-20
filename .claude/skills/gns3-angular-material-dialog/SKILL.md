---
name: angular-material-dialog
description: >
  Generate Angular Material Dialog components that conform to the project's
  established dialog style system. Use this skill whenever the user asks to
  create, scaffold, or modify any Angular dialog, modal, confirmation prompt,
  or mat-dialog component — including node configurators, sub-dialogs, and
  confirmation dialogs. Also trigger when the user says things like "add a
  dialog for X", "make a confirmation popup", "create a config panel", or
  "build a modal" in an Angular context. Always use this skill — do not
  freestyle dialog code without consulting it first.
---

# Angular Material Dialog Skill

Generate Angular Material Dialog components that match the project's
established `panelClass` style hierarchy. Read this file fully before
writing any code.

---

## Style System Overview

The project has **two parallel class hierarchies** — one for general dialogs,
one for confirmation dialogs. Always pick the right branch.

### Branch 1 — General Dialogs

```
.base-dialog-panel          ← all dialogs inherit this
    ├── .configurator-dialog-panel   (800px × 80vh — node config)
    ├── .simple-dialog-panel         (500px × 80vh — sub-dialogs)
    └── .custom-dialog-panel         (special / one-off sizing)
```

| Mode | panelClass array | When to use |
|---|---|---|
| Standard | `['base-dialog-panel']` | Generic informational or form dialogs |
| Configurator | `['base-dialog-panel', 'configurator-dialog-panel']` | Node / resource setup with tabs, grids |
| Simple | `['simple-dialog-panel']` | Sub-dialogs launched from within another dialog |
| Custom | `['base-dialog-panel', 'my-custom-panel']` | One-off sizing needs |

### Branch 2 — Confirmation Dialogs

```
.base-confirmation-dialog-panel     ← all confirmation dialogs inherit this
    ├── .confirmation-danger-panel   (delete / remove)
    ├── .confirmation-warning-panel  (unlock / risky action)
    └── .confirmation-info-panel     (acknowledge / confirm)
```

> **Rule**: confirmation dialogs always use BOTH the base class AND one
> variant class. Example: `['base-confirmation-dialog-panel', 'confirmation-danger-panel']`

---

## Decision Tree

Before writing any code, answer these questions:

1. **Is this a destructive / risky / informational confirmation?**
   → Yes → Confirmation branch. Pick danger / warning / info variant.
   → No → General branch. Continue.

2. **Does it configure a node or resource with tabs / form grids?**
   → Yes → `configurator-dialog-panel`

3. **Is it launched from inside another dialog?**
   → Yes → `simple-dialog-panel`

4. **Does it need a custom size?**
   → Yes → `custom-dialog-panel` (add your own width/height in the panel CSS)

5. **Otherwise** → `base-dialog-panel` alone.

---

## Code Templates

See `references/templates.md` for copy-paste-ready component scaffolds:
- Standard dialog
- Configurator dialog (with tabs)
- Simple sub-dialog
- Confirmation dialog (all three variants)

Read that file before generating code so you use the exact class names,
injection tokens, and structural patterns the project expects.

---

## Key Rules

- **Never** set `width` or `height` directly in `MatDialog.open()` config —
  sizing is controlled entirely by the panel CSS classes.
- **Always** inject `MAT_DIALOG_DATA` with a typed interface, never `any`.
- Dialog title must use `mat-dialog-title` directive on an `h1` or `h2`.
- Content must be wrapped in `mat-dialog-content`.
- Actions must be wrapped in `mat-dialog-actions` with `align="end"`.
- The cancel / close button always comes **before** the confirm button in
  the DOM (visual order is handled by CSS `flex-direction`).
- For configurator dialogs, wrap the form in `<form [formGroup]="form">` and
  emit the typed result via `dialogRef.close(result)` — never navigate away.
- For confirmation dialogs, the component should be minimal: title, one
  short paragraph of context, two buttons (cancel + confirm). No forms, no
  tabs.

---

## Naming Conventions

| Artifact | Pattern | Example |
|---|---|---|
| Component class | `*DialogComponent` | `EditProjectDialogComponent` |
| Component file | `*-dialog.component.ts` | `edit-project-dialog.component.ts` |
| Panel CSS class | `*-dialog-panel` | `edit-project-dialog-panel` |
| Data interface | `*DialogData` | `EditProjectDialogData` |
| Result interface | `*DialogResult` | `EditProjectDialogResult` |

---

## Checklist Before Handing Off Code

- [ ] Correct `panelClass` array chosen from the decision tree
- [ ] `MAT_DIALOG_DATA` typed with a named interface
- [ ] `mat-dialog-title`, `mat-dialog-content`, `mat-dialog-actions` present
- [ ] No inline `width`/`height` in the `MatDialog.open()` call
- [ ] Cancel button before confirm button in DOM order
- [ ] Component class name ends in `DialogComponent`
- [ ] Panel CSS class ends in `-dialog-panel`