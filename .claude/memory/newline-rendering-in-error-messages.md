---
name: newline-rendering-in-error-messages
description: Error message newline rendering in snackbars and bottom sheets
metadata:
  type: reference
---

# Error Message Newline Rendering

**Problem**: Backend error messages contain `\n` but don't render as line breaks in UI.

**Root Cause**: Material Snackbar renders text in `.mat-mdc-snack-bar-label`, bottom sheets in `.title`. These lack whitespace CSS.

**Solution**:
- Add `.mat-mdc-snack-bar-label { white-space: pre-line; }` to `.snackabar-error/warning/success` in `src/styles.scss`
- Add `white-space: pre-line` to `.title` in `confirmation-bottomsheet.component.scss`

**Key**: JSON `\n` escape sequences become actual newlines on parse. No string replacement needed - just CSS.

**Files**: `src/styles.scss`, `src/app/components/projects/confirmation-bottomsheet/confirmation-bottomsheet.component.scss`
