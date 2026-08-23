---
name: dialog-sds-pane-width-cap
description: SDS dialogs collapse to 560px unless the shell feeds the size-class width into Material's --mat-dialog-container-max-width pane token
metadata:
  type: project
---

# Dialog SDS Pane Width Cap (560px Collapse)

## Symptom

Every SDS dialog rendered at 560px regardless of its `dialog-{small,medium,large,extra-large}-panel`
size class (440/720/880/1040px). Affected all 131 call sites after the size-class migration.

## Root Cause

Material's dialog theme emits a default on the **overlay pane** itself:

- `.cdk-overlay-pane.mat-mdc-dialog-panel { max-width: var(--mat-dialog-container-max-width, 560px) }`
- The theme materializes the token as 560px (one block per theme variant, 16 blocks in styles.css)

The pane is the shrink-to-fit root of the whole dialog chain (popover-API wrapper → pane →
`mat-dialog-container` → inner container → surface), so the pane cap crushes everything below it.
The SDS sets its own `--gns3-dialog-width` on the *container* — one level below the pane — and the
legacy per-panel width groups always co-set the Material token, which is why widths worked before
the migration. The migration dropped the token feed, re-activating the 560px fallback.

Panels that still set the token directly kept working: node configurator
(`src/styles/_dialogs.scss`, `min(1080px, calc(100vw - 48px))`) and the compact-density rule.
That asymmetry is the tell for this failure.

## Fix

The SDS shell (`:is(.base-dialog-panel, ...)` block in `src/styles/_dialogs.scss`) bridges the
token: `--mat-dialog-container-max-width: min(var(--gns3-dialog-width, 440px), var(--gns3-dialog-viewport-cap))`.

**Contract**: any mechanism that changes dialog width must feed `--mat-dialog-container-max-width`
on the pane, not only the SDS property.

## Debugging Traps

- `getComputedStyle(mat-dialog-container).width` reports the **post-shrink used width**, not the
  declared width. During this incident the container's own width/max-width resolved correctly to
  the declared size while computed width read 560px — it looked like the declarations were dropped
  when they were fine. When a dialog is stuck at 560px, inspect the pane's token first.
- The viewport clamp lives in `--gns3-dialog-viewport-cap` so width declarations keep math-function
  arguments var()-only: the CSS pipeline strips `calc()` from `min()` arguments, and plain var()
  references are immune to transform surprises.
