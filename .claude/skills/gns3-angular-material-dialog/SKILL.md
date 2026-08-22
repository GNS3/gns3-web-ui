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
one for confirmation dialogs. Both are sized by the Standard Dialog System
(SDS): a `dialog-*-panel` size class sets `--gns3-dialog-width`, and every
dialog call site carries exactly one.

### Branch 1 — General Dialogs

```
.base-dialog-panel          ← all dialogs inherit this
    └── one size class (required):
        ├── .dialog-small-panel         (440px — confirmations, short forms)
        ├── .dialog-medium-panel        (720px — editors, sub-dialogs)
        ├── .dialog-large-panel         (880px — tabs, grids, wide editors)
        └── .dialog-extra-large-panel   (1040px — dense management tables)
```

Legacy role classes (`configurator-dialog-panel`, `simple-dialog-panel`) may
appear as extra array elements but no longer control sizing.

Optional height tiers: `dialog-height-60-panel` / `dialog-height-80-panel`
set a fixed viewport-ratio height (60vh / 80vh). Opt-in modifiers — dialogs
are content-sized unless they declare one. Example:
`['base-dialog-panel', 'dialog-medium-panel', 'my-editor-panel', 'dialog-height-60-panel']`

| Mode | panelClass array | When to use |
|---|---|---|
| Small | `['base-dialog-panel', 'dialog-small-panel']` | Generic informational or short form dialogs |
| Medium | `['base-dialog-panel', 'dialog-medium-panel']` | Editors, sub-dialogs launched from within another dialog |
| Large | `['base-dialog-panel', 'dialog-large-panel', 'configurator-dialog-panel']` | Node / resource setup with tabs, grids |
| Extra large | `['base-dialog-panel', 'dialog-extra-large-panel']` | Dense tables / management workflows |
| Custom width | `['base-dialog-panel', 'dialog-small-panel', 'my-custom-panel']` | One-off width: set `--gns3-dialog-width` in `_dialogs.scss` deviations section |

### Branch 2 — Confirmation Dialogs

```
.base-confirmation-dialog-panel     ← all confirmation dialogs inherit this
    ├── .confirmation-danger-panel   (delete / remove)
    ├── .confirmation-warning-panel  (unlock / risky action)
    └── .confirmation-neutral-panel  (acknowledge / neutral confirm)
```

> **Rule**: confirmation dialogs always use the base class, a size class
> (almost always `dialog-small-panel`), AND one variant class. Example:
> `['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel']`

---

## Decision Tree

Before writing any code, answer these questions:

1. **Is this a destructive / risky / informational confirmation?**
   → Yes → Confirmation branch. Pick danger / warning / neutral variant.
   → No → General branch. Continue.

2. **Pick a size class** — small (440) / medium (720) / large (880) /
   extra-large (1040). Non-standard width → nearest size class + a
   `--gns3-dialog-width` override in the `_dialogs.scss` deviations section
   (which sits after the size classes so the override wins).

3. **Legacy role hint still useful?** Configurator-style tabs/forms may also
   carry `configurator-dialog-panel`; nested sub-dialogs may carry
   `simple-dialog-panel`. These are styling aliases only — they never size.

4. **Is it a specialized node configurator or Docker network editor?**
   → Yes → `node-configurator-dialog-panel` / `docker-network-config-dialog-panel`
   purpose-built shells (excluded from the SDS).

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

---

## Avoiding Double Scrollbars

Two scrollbars appear when `mat-dialog-content` is nested inside a scrollable container (e.g., each `mat-step` in a `mat-horizontal-stepper`). Each scrollable element creates its own scrollbar.

### Pattern A — Configurator (tabs/forms, no stepper)
Use **one** `mat-dialog-content` wrapping all content. Buttons live in a single `mat-dialog-actions` at the bottom. The dialog panel CSS handles scrolling via `max-height: calc(80vh - 140px)` on `.mat-mdc-dialog-content`.

### Pattern B — Stepper Dialog (multi-step with `mat-horizontal-stepper`)
Keep `mat-dialog-content` **outside** the stepper — only one content wrapper for the entire dialog. Place navigation buttons in the `mat-dialog-title` header area instead of inside each step. This keeps scrolling to a single container.

```html
<!-- ✅ Correct: single content wrapper, buttons in header -->
<h1 mat-dialog-title>
  Title
  <span class="dialog-header-actions">
    <button mat-button (click)="stepper()?.next()">Next</button>
    <button mat-button (click)="onClose()">Cancel</button>
  </span>
</h1>

<div mat-dialog-content>
  <mat-horizontal-stepper #stepper>
    <mat-step><!-- no mat-dialog-content here --></mat-step>
  </mat-horizontal-stepper>
</div>
```

```html
<!-- ❌ Wrong: mat-dialog-content inside each step creates double scrollbars -->
<mat-step>
  <mat-dialog-content>...</mat-dialog-content>  <!-- creates second scrollbar -->
  <mat-dialog-actions>...</mat-dialog-actions>
</mat-step>
```